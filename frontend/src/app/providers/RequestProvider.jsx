import { createContext, useContext, useState } from 'react';
import { REQUESTS, TASKS, WORKSPACES, WORKFLOWS } from '../mockData';
import { useProcesses } from './ProcessProvider';
import { useAuth } from './AuthProvider';
const RequestContext = createContext(null);
function evaluateCondition(node, formData) {
    if (!node.conditionField || !node.conditionOperator)
        return false;
    const raw = formData[node.conditionField];
    const numVal = typeof raw === 'number' ? raw : parseFloat(String(raw ?? '0'));
    const threshold = parseFloat(node.conditionValue ?? '0');
    switch (node.conditionOperator) {
        case '>': return numVal > threshold;
        case '<': return numVal < threshold;
        case '>=': return numVal >= threshold;
        case '<=': return numVal <= threshold;
        case '=':
        case '==': return String(raw) === node.conditionValue;
        case '!=': return String(raw) !== node.conditionValue;
        default: return false;
    }
}
export function RequestProvider({ children }) {
    const [requests, setRequests] = useState(REQUESTS);
    const [tasks, setTasks] = useState(TASKS);
    const { processes } = useProcesses();
    const { currentUser } = useAuth();
    function submitRequest(processId, formData) {
        const allProcesses = processes;
        const process = allProcesses.find(p => p.id === processId);
        const workflow = WORKFLOWS.find(w => w.id === process?.workflowId);
        if (!process || !workflow || !currentUser)
            return '';
        const now = new Date().toISOString();
        const refNum = String(Date.now()).slice(-4);
        const reference = `REQ-${new Date().getFullYear()}-${refNum}`;
        const requestId = `r-${Date.now()}`;
        const steps = [];
        let currentNodeId = workflow.nodes.find(n => n.type === 'START')?.id ?? null;
        const visited = new Set();
        let stepCounter = 0;
        let firstApprovalStep = null;
        let firstApprovalNode = null;
        while (currentNodeId && !visited.has(currentNodeId)) {
            visited.add(currentNodeId);
            const node = workflow.nodes.find(n => n.id === currentNodeId);
            if (!node)
                break;
            stepCounter++;
            if (node.type === 'START') {
                steps.push({ id: `s${stepCounter}`, nodeLabel: node.label, workspaceName: '', status: 'APPROVED', completedAt: now, slaHours: 0 });
                const edge = workflow.edges.find(e => e.from === currentNodeId && e.label === 'NEXT');
                currentNodeId = edge?.to ?? null;
            }
            else if (node.type === 'CONDITION') {
                const condResult = evaluateCondition(node, formData);
                const edgeLabel = condResult ? 'TRUE' : 'FALSE';
                steps.push({ id: `s${stepCounter}`, nodeLabel: node.label, workspaceName: '', status: 'APPROVED', completedAt: now, slaHours: 0 });
                const edge = workflow.edges.find(e => e.from === currentNodeId && e.label === edgeLabel);
                currentNodeId = edge?.to ?? null;
            }
            else if (node.type === 'APPROVAL') {
                const ws = WORKSPACES.find(w => w.id === node.workspaceId);
                const isFirst = !firstApprovalStep;
                const step = {
                    id: `s${stepCounter}`,
                    nodeLabel: node.label,
                    workspaceName: ws?.name ?? '',
                    status: isFirst ? 'IN_PROGRESS' : 'PENDING',
                    startedAt: isFirst ? now : undefined,
                    slaHours: node.slaHours,
                };
                steps.push(step);
                if (isFirst) {
                    firstApprovalStep = step;
                    firstApprovalNode = node;
                }
                const edge = workflow.edges.find(e => e.from === currentNodeId && e.label === 'APPROVED');
                currentNodeId = edge?.to ?? null;
            }
            else if (node.type === 'END') {
                steps.push({ id: `s${stepCounter}`, nodeLabel: node.label, workspaceName: '', status: 'PENDING', slaHours: 0 });
                currentNodeId = null;
            }
        }
        const newRequest = {
            id: requestId, reference, processId, processName: process.name,
            requesterId: currentUser.id, requesterName: currentUser.name,
            status: 'EN_COURS', formData, steps,
            createdAt: now, updatedAt: now,
            currentStepId: firstApprovalStep?.id,
        };
        const newTasks = [];
        if (firstApprovalNode?.workspaceId) {
            const nodeAny = firstApprovalNode;
            const slaMs = (firstApprovalNode.slaHours ?? 24) * 3_600_000;
            newTasks.push({
                id: `t-${Date.now()}`,
                requestId, requestRef: reference,
                processName: process.name, requesterName: currentUser.name,
                workspaceId: firstApprovalNode.workspaceId,
                assignedTo: nodeAny.assignedUserId,
                status: nodeAny.assignedUserId ? 'IN_PROGRESS' : 'AVAILABLE',
                slaDeadline: new Date(Date.now() + slaMs).toISOString(),
                createdAt: now,
                formData,
            });
        }
        setRequests(prev => [...prev, newRequest]);
        setTasks(prev => [...prev, ...newTasks]);
        return requestId;
    }
    function advanceRequest(requestId, taskId, decision, comment) {
        const task = tasks.find(t => t.id === taskId);
        const request = requests.find(r => r.id === requestId);
        if (!task || !request)
            return;
        const process = processes.find(p => p.id === request.processId);
        const workflow = WORKFLOWS.find(w => w.id === process?.workflowId);
        if (!workflow)
            return;
        const currentStep = request.steps.find(s => s.id === request.currentStepId);
        if (!currentStep)
            return;
        const currentNode = workflow.nodes.find(n => n.label === currentStep.nodeLabel);
        if (!currentNode)
            return;
        const edge = workflow.edges.find(e => e.from === currentNode.id && e.label === decision);
        if (!edge)
            return;
        const now = new Date().toISOString();
        let updatedSteps = request.steps.map(s => s.id === currentStep.id
            ? { ...s, status: decision, completedAt: now, comment, assignedTo: currentUser?.name }
            : s);
        // Traverse CONDITION nodes automatically
        let nextNode = workflow.nodes.find(n => n.id === edge.to);
        while (nextNode?.type === 'CONDITION') {
            const condResult = evaluateCondition(nextNode, request.formData);
            const condLabel = condResult ? 'TRUE' : 'FALSE';
            const condEdge = workflow.edges.find(e => e.from === nextNode.id && e.label === condLabel);
            // Add auto-resolved condition step
            updatedSteps = [...updatedSteps, {
                    id: `s-${Date.now()}-cond-${nextNode.id}`,
                    nodeLabel: nextNode.label,
                    workspaceName: '',
                    status: 'APPROVED',
                    completedAt: now,
                    slaHours: 0,
                }];
            nextNode = workflow.nodes.find(n => n.id === condEdge?.to);
        }
        const updatedTasks = tasks.map(t => t.id === taskId ? { ...t, status: 'DONE' } : t);
        if (!nextNode) {
            setRequests(prev => prev.map(r => r.id === requestId ? { ...r, steps: updatedSteps, updatedAt: now } : r));
            setTasks(updatedTasks);
            return;
        }
        if (nextNode.type === 'APPROVAL') {
            const ws = WORKSPACES.find(w => w.id === nextNode.workspaceId);
            const nodeAny = nextNode;
            const nextStepId = `s-${Date.now()}-ap`;
            const nextStep = {
                id: nextStepId,
                nodeLabel: nextNode.label,
                workspaceName: ws?.name ?? '',
                status: 'IN_PROGRESS',
                startedAt: now,
                slaHours: nextNode.slaHours,
            };
            const slaMs = (nextNode.slaHours ?? 24) * 3_600_000;
            const newTask = {
                id: `t-${Date.now()}`,
                requestId,
                requestRef: request.reference,
                processName: request.processName,
                requesterName: request.requesterName,
                workspaceId: nextNode.workspaceId ?? '',
                assignedTo: nodeAny.assignedUserId,
                status: nodeAny.assignedUserId ? 'IN_PROGRESS' : 'AVAILABLE',
                slaDeadline: new Date(Date.now() + slaMs).toISOString(),
                createdAt: now,
                formData: request.formData,
            };
            setRequests(prev => prev.map(r => r.id === requestId
                ? { ...r, steps: [...updatedSteps, nextStep], status: 'EN_COURS', currentStepId: nextStepId, updatedAt: now }
                : r));
            setTasks([...updatedTasks, newTask]);
        }
        else if (nextNode.type === 'END') {
            const finalStatus = decision === 'REJECTED' ? 'REJETE' : 'TERMINE';
            const endStep = {
                id: `s-${Date.now()}-end`,
                nodeLabel: nextNode.label,
                workspaceName: '',
                status: 'APPROVED',
                completedAt: now,
                slaHours: 0,
            };
            setRequests(prev => prev.map(r => r.id === requestId
                ? { ...r, steps: [...updatedSteps, endStep], status: finalStatus, currentStepId: undefined, updatedAt: now }
                : r));
            setTasks(updatedTasks);
        }
    }
    function approveTask(taskId, comment) {
        const task = tasks.find(t => t.id === taskId);
        if (!task)
            return;
        advanceRequest(task.requestId, taskId, 'APPROVED', comment);
    }
    function rejectTask(taskId, comment) {
        const task = tasks.find(t => t.id === taskId);
        if (!task)
            return;
        advanceRequest(task.requestId, taskId, 'REJECTED', comment);
    }
    function claimTask(taskId) {
        if (!currentUser)
            return;
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'IN_PROGRESS', assignedTo: currentUser.id } : t));
    }
    function getMyRequests(userId) {
        return requests.filter(r => r.requesterId === userId);
    }
    function getWorkspaceTasks(workspaceId) {
        return tasks.filter(t => t.workspaceId === workspaceId && t.status !== 'DONE');
    }
    return (<RequestContext.Provider value={{ requests, tasks, submitRequest, approveTask, rejectTask, claimTask, getMyRequests, getWorkspaceTasks }}>
      {children}
    </RequestContext.Provider>);
}
export function useRequests() {
    const ctx = useContext(RequestContext);
    if (!ctx)
        throw new Error('useRequests must be used within RequestProvider');
    return ctx;
}
