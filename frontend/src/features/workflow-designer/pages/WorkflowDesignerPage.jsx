import { useState, useRef, useEffect } from 'react';
import { Plus, Save, CheckCircle, ZoomIn, ZoomOut, Trash2, ArrowLeft, X, Check, ChevronRight, GitBranch, FileText, Info, AlertTriangle, Undo2, Redo2 } from 'lucide-react';
import { WORKSPACES, FORMS, USERS } from '../../../app/mockData';
import { useProcesses } from '../../../app/providers/ProcessProvider';
/* ─── CONSTANTS ───────────────────────────────────────────────────────────── */
const NW = 160, NH = 60, CDW = 164, CDH = 104;
const NODE_C = {
    START: { fill: '#F0FDF4', stroke: '#16A34A', text: '#15803D' },
    APPROVAL: { fill: '#EBF2F9', stroke: '#1F4E79', text: '#1F4E79' },
    CONDITION: { fill: '#F5F3FF', stroke: '#7C3AED', text: '#6D28D9' },
    END: { fill: '#FEF2F2', stroke: '#DC2626', text: '#DC2626' },
};
const EDGE_C = {
    NEXT: '#8898AA', APPROVED: '#16A34A', REJECTED: '#DC2626', TRUE: '#16A34A', FALSE: '#EA580C',
};
const NODE_LABEL = {
    START: 'Déclencheur', APPROVAL: 'Approbation', CONDITION: 'Condition', END: 'Fin',
};
/* ─── PORT HELPERS ────────────────────────────────────────────────────────── */
function getInputPort(n) {
    if (n.type === 'START')
        return null;
    if (n.type === 'CONDITION')
        return { x: n.x + CDW / 2, y: n.y };
    return { x: n.x + NW / 2, y: n.y };
}
function getOutputPorts(n) {
    switch (n.type) {
        case 'START': return [{ id: 'next', label: 'NEXT', x: n.x + NW / 2, y: n.y + NH, color: '#8898AA', dir: 'bottom' }];
        case 'APPROVAL': return [
            { id: 'approved', label: 'APPROVED', x: n.x + NW * 0.33, y: n.y + NH, color: '#16A34A', dir: 'bottom' },
            { id: 'rejected', label: 'REJECTED', x: n.x + NW * 0.67, y: n.y + NH, color: '#DC2626', dir: 'bottom' },
        ];
        case 'CONDITION': return [
            { id: 'true', label: 'TRUE', x: n.x + CDW, y: n.y + CDH / 2, color: '#16A34A', dir: 'right' },
            { id: 'false', label: 'FALSE', x: n.x + CDW / 2, y: n.y + CDH, color: '#EA580C', dir: 'bottom' },
        ];
        default: return [];
    }
}
function isInNode(n, p) {
    if (n.type === 'CONDITION') {
        const cx = n.x + CDW / 2, cy = n.y + CDH / 2;
        return Math.abs(p.x - cx) / (CDW / 2) + Math.abs(p.y - cy) / (CDH / 2) <= 1;
    }
    return p.x >= n.x && p.x <= n.x + NW && p.y >= n.y && p.y <= n.y + NH;
}
/* ─── PATH ────────────────────────────────────────────────────────────────── */
function makePath(x1, y1, x2, y2, dir = 'bottom') {
    const dist = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    const t = Math.max(dist * 0.42, 48);
    if (dir === 'right')
        return `M${x1},${y1} C${x1 + t},${y1} ${x2},${y2 - t} ${x2},${y2}`;
    return `M${x1},${y1} C${x1},${y1 + t} ${x2},${y2 - t} ${x2},${y2}`;
}
/* ─── VALIDATION ──────────────────────────────────────────────────────────── */
function hasCycle(edges, from, to) {
    const vis = new Set();
    const q = [to];
    while (q.length) {
        const c = q.pop();
        if (c === from)
            return true;
        if (vis.has(c))
            continue;
        vis.add(c);
        edges.filter(e => e.from === c).forEach(e => q.push(e.to));
    }
    return false;
}
function validateConn(nodes, edges, fromId, label, toId) {
    if (fromId === toId)
        return { ok: false, reason: 'Un nœud ne peut pas se connecter à lui-même' };
    const from = nodes.find(n => n.id === fromId), to = nodes.find(n => n.id === toId);
    if (!from || !to)
        return { ok: false, reason: 'Nœud introuvable' };
    if (to.type === 'START')
        return { ok: false, reason: 'START ne peut pas recevoir de connexion' };
    if (from.type === 'END')
        return { ok: false, reason: 'FIN ne peut pas avoir de sortie' };
    if (edges.some(e => e.from === fromId && e.label === label))
        return { ok: false, reason: `La sortie "${label}" est déjà utilisée` };
    if (hasCycle(edges, fromId, toId))
        return { ok: false, reason: 'Cette liaison crée une boucle infinie' };
    return { ok: true, reason: '' };
}
/* ─── NODE STATUS & HELP ─────────────────────────────────────────────────── */
function nodeStatus(n, edges) {
    if (n.type === 'START')
        return edges.some(e => e.from === n.id) ? 'complete' : 'unconnected';
    if (n.type === 'END')
        return 'complete';
    if (n.type === 'APPROVAL') {
        if (!n.workspaceId)
            return 'incomplete';
        return edges.some(e => e.from === n.id && e.label === 'APPROVED') && edges.some(e => e.from === n.id && e.label === 'REJECTED') ? 'complete' : 'unconnected';
    }
    if (n.type === 'CONDITION') {
        if (!n.conditionField || !n.conditionValue)
            return 'incomplete';
        return edges.some(e => e.from === n.id && e.label === 'TRUE') && edges.some(e => e.from === n.id && e.label === 'FALSE') ? 'complete' : 'unconnected';
    }
    return 'complete';
}
function contextHelp(nodes, edges) {
    if (!nodes.some(n => n.type !== 'START'))
        return { msg: "Ajoutez votre première étape depuis la palette ou glissez depuis le port vert de START", color: '#1F4E79' };
    if (nodes.some(n => nodeStatus(n, edges) === 'incomplete'))
        return { msg: "Des nœuds manquent de configuration — sélectionnez-les pour les compléter ⚠", color: '#EA580C' };
    if (nodes.some(n => nodeStatus(n, edges) === 'unconnected'))
        return { msg: "Certaines sorties ne sont pas connectées — glissez depuis les ports colorés en bas des nœuds", color: '#1F4E79' };
    if (!nodes.some(n => n.type === 'END'))
        return { msg: "Ajoutez au moins un nœud FIN pour clore le workflow", color: '#DC2626' };
    return { msg: "Workflow complet ✓ — vous pouvez passer à la vérification", color: '#16A34A' };
}
/* ─── WORKFLOW VALIDATION (Step 4) ───────────────────────────────────────── */
function validateWorkflow(wf) {
    const items = [];
    const starts = wf.nodes.filter(n => n.type === 'START'), ends = wf.nodes.filter(n => n.type === 'END');
    items.push({ ok: starts.length === 1, msg: starts.length === 1 ? 'Un seul nœud START' : `${starts.length} nœuds START (1 requis)` });
    items.push({ ok: ends.length > 0, msg: ends.length > 0 ? `${ends.length} nœud(s) FIN` : 'Aucun nœud FIN' });
    const incomplete = wf.nodes.filter(n => nodeStatus(n, wf.edges) === 'incomplete');
    const unconn = wf.nodes.filter(n => nodeStatus(n, wf.edges) === 'unconnected');
    items.push({ ok: incomplete.length === 0, msg: incomplete.length === 0 ? 'Tous les nœuds sont configurés' : `Incomplets : ${incomplete.map(n => n.label).join(', ')}`, nodeId: incomplete[0]?.id });
    items.push({ ok: unconn.length === 0, msg: unconn.length === 0 ? 'Toutes les sorties sont connectées' : `Non connectés : ${unconn.map(n => n.label).join(', ')}`, nodeId: unconn[0]?.id });
    const start = wf.nodes.find(n => n.type === 'START');
    if (start) {
        const reach = new Set([start.id]);
        const q = [start.id];
        while (q.length) {
            const c = q.pop();
            wf.edges.filter(e => e.from === c).forEach(e => { if (!reach.has(e.to)) {
                reach.add(e.to);
                q.push(e.to);
            } });
        }
        const unreach = wf.nodes.filter(n => !reach.has(n.id));
        items.push({ ok: unreach.length === 0, msg: unreach.length === 0 ? 'Tous les nœuds sont accessibles depuis START' : `Inaccessibles : ${unreach.map(n => n.label).join(', ')}`, nodeId: unreach[0]?.id });
    }
    return items;
}
/* ─── INITIAL DATA ────────────────────────────────────────────────────────── */
const INITIAL_WORKFLOWS = [
    {
        id: 'wf-demo', name: 'Remboursement de frais',
        description: 'Validation avec condition sur le montant (> 5 000 €)',
        status: 'DRAFT', updatedAt: '2024-03-15T10:00:00',
        nodes: [
            { id: 'n1', type: 'START', label: 'Début', x: 185, y: 20 },
            { id: 'n2', type: 'APPROVAL', label: 'Validation Manager', x: 95, y: 150, workspaceId: 'ws1', slaHours: 48, slaUnit: 'h' },
            { id: 'n3', type: 'CONDITION', label: 'Montant > 5 000 ?', x: 265, y: 295, conditionField: 'montant', conditionOperator: '>', conditionValue: '5000' },
            { id: 'n4', type: 'APPROVAL', label: 'Validation Finance', x: 395, y: 460, workspaceId: 'ws1', slaHours: 72, slaUnit: 'h' },
            { id: 'n5', type: 'END', label: 'Terminée', x: 375, y: 600, endResult: 'TERMINÉE' },
            { id: 'n6', type: 'END', label: 'Refusée', x: 20, y: 600, endResult: 'REFUSÉE' },
        ],
        edges: [
            { id: 'e1', from: 'n1', to: 'n2', label: 'NEXT' },
            { id: 'e2', from: 'n2', to: 'n3', label: 'APPROVED' },
            { id: 'e3', from: 'n2', to: 'n6', label: 'REJECTED' },
            { id: 'e4', from: 'n3', to: 'n4', label: 'TRUE' },
            { id: 'e5', from: 'n3', to: 'n5', label: 'FALSE' },
            { id: 'e6', from: 'n4', to: 'n5', label: 'APPROVED' },
            { id: 'e7', from: 'n4', to: 'n6', label: 'REJECTED' },
        ],
    },
    {
        id: 'wf2', name: 'Congés RH',
        description: 'Approbation simple des demandes de congés',
        status: 'PUBLISHED', updatedAt: '2024-02-10T09:00:00',
        nodes: [
            { id: 'n1', type: 'START', label: 'Début', x: 185, y: 20 },
            { id: 'n2', type: 'APPROVAL', label: 'Validation Manager', x: 95, y: 150, workspaceId: 'ws2', slaHours: 48, slaUnit: 'h' },
            { id: 'n3', type: 'END', label: 'Approuvée', x: 30, y: 300, endResult: 'TERMINÉE' },
            { id: 'n4', type: 'END', label: 'Refusée', x: 190, y: 300, endResult: 'REFUSÉE' },
        ],
        edges: [
            { id: 'e1', from: 'n1', to: 'n2', label: 'NEXT' },
            { id: 'e2', from: 'n2', to: 'n3', label: 'APPROVED' },
            { id: 'e3', from: 'n2', to: 'n4', label: 'REJECTED' },
        ],
    },
];
/* ─── SMALL COMPONENTS ────────────────────────────────────────────────────── */
function Toast({ msg, type = 'success', onClose }) {
    useEffect(() => { const t = setTimeout(onClose, 3200); return () => clearTimeout(t); }, [onClose]);
    return (<div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${type === 'success' ? 'bg-[#16A34A]' : 'bg-[#DC2626]'} text-white`}>
      {type === 'success' ? <Check className="w-4 h-4"/> : <X className="w-4 h-4"/>} {msg}
    </div>);
}
const STEPS_DEF = [{ n: 1, label: 'Informations' }, { n: 2, label: 'Étapes' }, { n: 3, label: 'Connexions' }, { n: 4, label: 'Vérification' }, { n: 5, label: 'Publication' }];
function WizardBar({ step }) {
    return (<div className="flex items-center bg-white border border-[#D1D9E0] rounded-xl px-4 py-3 mb-4 flex-shrink-0">
      {STEPS_DEF.map((s, i) => {
            const done = s.n < step, active = s.n === step;
            return (<div key={s.n} className="flex items-center flex-1 min-w-0">
            <div className={`flex items-center gap-2 ${done || active ? '' : 'opacity-40'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${done ? 'bg-[#16A34A] text-white' : active ? 'bg-[#1F4E79] text-white' : 'bg-[#F4F6F8] text-[#8898AA] border border-[#D1D9E0]'}`}>
                {done ? <Check className="w-3.5 h-3.5"/> : s.n}
              </div>
              <p className={`text-xs font-semibold hidden sm:block ${done ? 'text-[#16A34A]' : active ? 'text-[#1F4E79]' : 'text-[#8898AA]'}`}>{s.label}</p>
            </div>
            {i < STEPS_DEF.length - 1 && <div className={`flex-1 h-px mx-3 ${done ? 'bg-[#16A34A]' : 'bg-[#D1D9E0]'}`}/>}
          </div>);
        })}
    </div>);
}
function Globe2Ico({ className }) {
    return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>;
}
/* ─── NODE SVG ELEMENT ────────────────────────────────────────────────────── */
function NodeEl({ node, selected, drag, edges, hovered, readonly, onMouseDown, onClick, onPortMouseDown, onMouseEnter, onMouseLeave, }) {
    const c = NODE_C[node.type];
    const isCond = node.type === 'CONDITION';
    const w = isCond ? CDW : NW, h = isCond ? CDH : NH;
    const cx = node.x + w / 2, cy = node.y + h / 2;
    const status = nodeStatus(node, edges);
    const isDragTarget = drag?.hoverTargetId === node.id;
    const dragOk = drag?.validity?.ok ?? false;
    const isDimmed = !!drag && !isDragTarget && drag.fromNodeId !== node.id;
    const strokeColor = isDragTarget ? (dragOk ? '#16A34A' : '#DC2626') : selected ? '#172033' : status === 'incomplete' ? '#EA580C' : c.stroke;
    const strokeW = (isDragTarget || selected) ? 2.5 : status === 'incomplete' ? 2 : 1.5;
    const outPorts = getOutputPorts(node);
    const inputPt = getInputPort(node);
    return (<g opacity={isDimmed ? 0.35 : 1} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      {/* Shape */}
      {isCond ? (<polygon points={`${cx},${node.y} ${node.x + w},${cy} ${cx},${node.y + h} ${node.x},${cy}`} fill={c.fill} stroke={strokeColor} strokeWidth={strokeW} style={{ cursor: readonly ? 'default' : selected ? 'grabbing' : 'grab' }} onMouseDown={onMouseDown} onClick={onClick}/>) : (<rect x={node.x} y={node.y} width={w} height={h} rx={10} fill={c.fill} stroke={strokeColor} strokeWidth={strokeW} style={{ cursor: readonly ? 'default' : selected ? 'grabbing' : 'grab', filter: selected ? 'drop-shadow(0 2px 8px rgba(0,0,0,0.12))' : undefined }} onMouseDown={onMouseDown} onClick={onClick}/>)}

      {/* Drag target ring */}
      {isDragTarget && (isCond ? (<polygon points={`${cx},${node.y - 6} ${node.x + w + 6},${cy} ${cx},${node.y + h + 6} ${node.x - 6},${cy}`} fill="none" stroke={dragOk ? '#16A34A' : '#DC2626'} strokeWidth={2.5} strokeDasharray="5,3" opacity={0.8}/>) : (<rect x={node.x - 5} y={node.y - 5} width={w + 10} height={h + 10} rx={14} fill="none" stroke={dragOk ? '#16A34A' : '#DC2626'} strokeWidth={2.5} strokeDasharray="5,3" opacity={0.8}/>))}

      {/* Labels */}
      <text x={cx} y={cy - 7} textAnchor="middle" fill={c.text} fontSize={11} fontWeight={700} fontFamily="Inter,sans-serif" style={{ pointerEvents: 'none', userSelect: 'none' }}>
        {node.label.length > 20 ? node.label.slice(0, 19) + '…' : node.label}
      </text>
      <text x={cx} y={cy + 8} textAnchor="middle" fill="#8898AA" fontSize={9} fontFamily="Inter,sans-serif" style={{ pointerEvents: 'none', userSelect: 'none' }}>
        {NODE_LABEL[node.type]}{node.type === 'END' && node.endResult ? ` · ${node.endResult}` : ''}
      </text>

      {/* Status badge */}
      {status === 'incomplete' && (<g>
          <circle cx={node.x + w - 10} cy={node.y + 10} r={8} fill="#EA580C" stroke="white" strokeWidth={1.5}/>
          <text x={node.x + w - 10} y={node.y + 14} textAnchor="middle" fill="white" fontSize={10} fontWeight={900} style={{ pointerEvents: 'none', userSelect: 'none' }}>!</text>
        </g>)}
      {status === 'complete' && node.type !== 'START' && node.type !== 'END' && (<g>
          <circle cx={node.x + w - 10} cy={node.y + 10} r={8} fill="#16A34A" stroke="white" strokeWidth={1.5}/>
          <text x={node.x + w - 10} y={node.y + 14} textAnchor="middle" fill="white" fontSize={10} fontWeight={700} style={{ pointerEvents: 'none', userSelect: 'none' }}>✓</text>
        </g>)}

      {/* Input port (top) – shown during drag or hover */}
      {inputPt && (drag || hovered) && (<circle cx={inputPt.x} cy={inputPt.y} r={isDragTarget ? 9 : 5} fill={isDragTarget ? (dragOk ? '#16A34A' : '#DC2626') : '#8898AA'} stroke="white" strokeWidth={2} style={{ pointerEvents: 'none' }}/>)}

      {/* Output ports (bottom/right) */}
      {!readonly && outPorts.map(p => {
            const connected = edges.some(e => e.from === node.id && e.label === p.label);
            const isActive = drag?.fromNodeId === node.id && drag?.portLabel === p.label;
            return (<g key={p.id}>
            {/* Pulse ring for unconnected port */}
            {!connected && !isActive && (<circle cx={p.x} cy={p.y} r={8} fill={p.color} style={{ opacity: 0.18 }}>
                <animate attributeName="r" values="7;12;7" dur="2.2s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="0.18;0.04;0.18" dur="2.2s" repeatCount="indefinite"/>
              </circle>)}
            <circle cx={p.x} cy={p.y} r={isActive ? 9 : hovered ? 7 : 5} fill={isActive ? '#172033' : p.color} stroke="white" strokeWidth={2} style={{ cursor: 'crosshair', transition: 'r 0.12s' }} onMouseDown={e => { e.stopPropagation(); e.preventDefault(); if (!readonly)
                onPortMouseDown(p.label, p.x, p.y, p.dir, e); }}/>
            {/* Label on hover or active */}
            {(hovered || isActive) && (<text x={p.dir === 'right' ? p.x + 13 : p.x} y={p.dir === 'right' ? p.y + 4 : p.y + 17} textAnchor={p.dir === 'right' ? 'start' : 'middle'} fill={p.color} fontSize={9} fontWeight={700} fontFamily="Inter,sans-serif" style={{ pointerEvents: 'none', userSelect: 'none' }}>
                {p.label}
              </text>)}
          </g>);
        })}
    </g>);
}
/* ─── PROPERTIES PANEL ────────────────────────────────────────────────────── */
function PropsPanel({ node, wf, workspaces, readonly, onUpdate, onDelete, onCreateWs }) {
    if (!node)
        return (<div className="flex-1 flex flex-col items-center justify-center text-center p-6">
      <GitBranch className="w-7 h-7 text-[#D1D9E0] mx-auto mb-3"/>
      <p className="text-sm font-medium text-[#8898AA]">Sélectionnez un nœud</p>
      <p className="text-xs text-[#8898AA] mt-1">pour éditer ses propriétés</p>
    </div>);
    const c = NODE_C[node.type];
    const w = node.type === 'CONDITION' ? CDW : NW;
    const status = nodeStatus(node, wf.edges);
    const outPorts = getOutputPorts(node);
    return (<div className="flex-1 overflow-y-auto p-4 space-y-4">
      <div className="flex items-center gap-2">
        <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: c.stroke }}/>
        <span className="text-xs font-bold text-[#172033] uppercase tracking-wide">{NODE_LABEL[node.type]}</span>
        {status === 'incomplete' && <span className="ml-auto text-[10px] bg-[#FFEDD5] text-[#EA580C] px-2 py-0.5 rounded-full font-semibold">Incomplet ⚠</span>}
        {status === 'complete' && node.type !== 'START' && <span className="ml-auto text-[10px] bg-[#DCFCE7] text-[#16A34A] px-2 py-0.5 rounded-full font-semibold">Complet ✓</span>}
      </div>

      <div>
        <label className="text-xs font-semibold text-[#4A5568] uppercase tracking-wide block mb-1">Libellé</label>
        <input value={node.label} onChange={e => onUpdate({ label: e.target.value })} disabled={readonly} className="w-full px-3 py-2 border border-[#D1D9E0] rounded-lg text-sm focus:outline-none focus:border-[#1F4E79] disabled:bg-[#F8FAFC]"/>
      </div>

      {node.type === 'APPROVAL' && (<>
        <div>
          <label className="text-xs font-semibold text-[#4A5568] uppercase tracking-wide block mb-1">Workspace responsable <span className="text-[#DC2626]">*</span></label>
          <select value={node.workspaceId ?? ''} onChange={e => onUpdate({ workspaceId: e.target.value || undefined })} disabled={readonly} className={`w-full px-3 py-2 border rounded-lg text-sm disabled:bg-[#F8FAFC] focus:outline-none focus:border-[#1F4E79] ${!node.workspaceId ? 'border-[#EA580C] bg-[#FFFBEB]' : 'border-[#D1D9E0]'}`}>
            <option value="">— Sélectionner —</option>
            {workspaces.filter(ws => ws.active).map(ws => <option key={ws.id} value={ws.id}>{ws.name}</option>)}
          </select>
          {!node.workspaceId && !readonly && (<button onClick={onCreateWs} className="mt-1 text-xs text-[#1F4E79] hover:underline flex items-center gap-1">
              <Plus className="w-3 h-3"/> Créer un espace
            </button>)}
        </div>
        {node.workspaceId && (<div>
            <label className="text-xs font-semibold text-[#4A5568] uppercase tracking-wide block mb-1">Assigné à (optionnel)</label>
            <select value={node.assignedUserId ?? ''} onChange={e => onUpdate({ assignedUserId: e.target.value || undefined })} disabled={readonly} className="w-full px-3 py-2 border border-[#D1D9E0] rounded-lg text-sm disabled:bg-[#F8FAFC] focus:outline-none focus:border-[#1F4E79]">
              <option value="">Tous les membres</option>
              {USERS.filter(u => WORKSPACES.find(w => w.id === node.workspaceId)?.memberIds.includes(u.id)).map(u => (<option key={u.id} value={u.id}>{u.name}</option>))}
            </select>
            <p className="text-[10px] text-[#8898AA] mt-1">Si vide, tous les membres du workspace peuvent traiter cette étape.</p>
          </div>)}
        <div>
          <label className="text-xs font-semibold text-[#4A5568] uppercase tracking-wide block mb-1">SLA (optionnel)</label>
          <div className="flex gap-2">
            <input type="number" min={1} value={node.slaHours ?? ''} onChange={e => onUpdate({ slaHours: e.target.value ? Number(e.target.value) : undefined })} disabled={readonly} placeholder="ex: 48" className="flex-1 px-3 py-2 border border-[#D1D9E0] rounded-lg text-sm focus:outline-none focus:border-[#1F4E79] disabled:bg-[#F8FAFC]"/>
            <select value={node.slaUnit ?? 'h'} onChange={e => onUpdate({ slaUnit: e.target.value })} disabled={readonly} className="w-16 px-2 py-2 border border-[#D1D9E0] rounded-lg text-sm disabled:bg-[#F8FAFC]">
              <option value="h">h</option><option value="d">j</option>
            </select>
          </div>
        </div>
      </>)}

      {node.type === 'CONDITION' && (<>
        <div>
          <label className="text-xs font-semibold text-[#4A5568] uppercase tracking-wide block mb-1">Champ <span className="text-[#DC2626]">*</span></label>
          <input value={node.conditionField ?? ''} onChange={e => onUpdate({ conditionField: e.target.value })} disabled={readonly} placeholder="ex: montant, durée…" className="w-full px-3 py-2 border border-[#D1D9E0] rounded-lg text-sm focus:outline-none focus:border-[#1F4E79] disabled:bg-[#F8FAFC]"/>
        </div>
        <div className="flex gap-2">
          <div className="w-20">
            <label className="text-xs font-semibold text-[#4A5568] uppercase tracking-wide block mb-1">Op.</label>
            <select value={node.conditionOperator ?? '>'} onChange={e => onUpdate({ conditionOperator: e.target.value })} disabled={readonly} className="w-full px-2 py-2 border border-[#D1D9E0] rounded-lg text-sm disabled:bg-[#F8FAFC]">
              {['>', '<', '>=', '<=', '=', '!='].map(op => <option key={op}>{op}</option>)}
            </select>
          </div>
          <div className="flex-1">
            <label className="text-xs font-semibold text-[#4A5568] uppercase tracking-wide block mb-1">Valeur <span className="text-[#DC2626]">*</span></label>
            <input value={node.conditionValue ?? ''} onChange={e => onUpdate({ conditionValue: e.target.value })} disabled={readonly} placeholder="ex: 5000" className="w-full px-3 py-2 border border-[#D1D9E0] rounded-lg text-sm focus:outline-none focus:border-[#1F4E79] disabled:bg-[#F8FAFC]"/>
          </div>
        </div>
      </>)}

      {node.type === 'END' && (<div>
          <label className="text-xs font-semibold text-[#4A5568] uppercase tracking-wide block mb-1">Résultat final</label>
          <div className="flex gap-2">
            {['TERMINÉE', 'REFUSÉE'].map(r => (<button key={r} onClick={() => !readonly && onUpdate({ endResult: r })} disabled={readonly} className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-colors ${node.endResult === r
                    ? r === 'TERMINÉE' ? 'bg-[#DCFCE7] border-[#16A34A] text-[#16A34A]' : 'bg-[#FEE2E2] border-[#DC2626] text-[#DC2626]'
                    : 'bg-[#F8FAFC] border-[#D1D9E0] text-[#8898AA] hover:bg-[#F4F6F8]'}`}>
                {r}
              </button>))}
          </div>
        </div>)}

      {node.type === 'START' && (<div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-lg p-3 text-xs text-[#16A34A]">
          Nœud de départ automatique — non supprimable
        </div>)}

      {/* Outputs section */}
      {outPorts.length > 0 && (<div>
          <label className="text-xs font-semibold text-[#4A5568] uppercase tracking-wide block mb-2">Sorties</label>
          <div className="space-y-1.5">
            {outPorts.map(p => {
                const edge = wf.edges.find(e => e.from === node.id && e.label === p.label);
                const target = edge ? wf.nodes.find(n => n.id === edge.to) : null;
                return (<div key={p.id} className="flex items-center gap-2 text-xs bg-[#F8FAFC] border border-[#D1D9E0] rounded-lg px-2.5 py-2">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }}/>
                  <span style={{ color: p.color }} className="font-bold w-20 flex-shrink-0">{p.label}</span>
                  <span className="text-[#8898AA]">→</span>
                  {target ? <span className="font-medium text-[#172033] truncate">{target.label}</span>
                        : <span className="text-[#EA580C] font-medium">Non connecté ⚠</span>}
                </div>);
            })}
          </div>
        </div>)}

      {!readonly && node.type !== 'START' && (<button onClick={onDelete} className="w-full flex items-center justify-center gap-2 border border-[#FECACA] text-[#DC2626] hover:bg-[#FEF2F2] px-3 py-2 rounded-lg text-xs font-medium transition-colors">
          <Trash2 className="w-3.5 h-3.5"/> Supprimer ce nœud
        </button>)}
    </div>);
}
/* ─── CANVAS EDITOR (Step 2) ──────────────────────────────────────────────── */
function CanvasEditor({ wf, selectedNodeId, onSelectNode, readonly, workspaces, onCreateWs, onCommit, onSave, onUndo, onRedo, canUndo, canRedo, }) {
    const svgRef = useRef(null);
    const [zoom, setZoom] = useState(0.82);
    const [pan, setPan] = useState({ x: 30, y: 10 });
    const panRef = useRef(pan);
    const zoomRef = useRef(zoom);
    useEffect(() => { panRef.current = pan; }, [pan]);
    useEffect(() => { zoomRef.current = zoom; }, [zoom]);
    const [localWf, setLocalWf] = useState(wf);
    const localWfRef = useRef(localWf);
    useEffect(() => { setLocalWf(wf); }, [wf]);
    useEffect(() => { localWfRef.current = localWf; }, [localWf]);
    const [drag, setDrag] = useState(null);
    const dragRef = useRef(drag);
    useEffect(() => { dragRef.current = drag; }, [drag]);
    const [hoveredId, setHoveredId] = useState(null);
    const [selectedEdgeId, setSelectedEdgeId] = useState(null);
    const [connError, setConnError] = useState(null);
    const [voidMenu, setVoidMenu] = useState(null);
    const isDraggingNodeRef = useRef(false);
    /* ── Keyboard shortcuts ── */
    useEffect(() => {
        const h = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                onUndo();
            }
            if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
                e.preventDefault();
                onRedo();
            }
        };
        window.addEventListener('keydown', h);
        return () => window.removeEventListener('keydown', h);
    }, [onUndo, onRedo]);
    /* ── Connection drag effect ── */
    useEffect(() => {
        if (!drag || readonly)
            return;
        const onMove = (ev) => {
            const rect = svgRef.current?.getBoundingClientRect();
            if (!rect)
                return;
            const cx = (ev.clientX - rect.left - panRef.current.x) / zoomRef.current;
            const cy = (ev.clientY - rect.top - panRef.current.y) / zoomRef.current;
            const wfNow = localWfRef.current;
            const hover = wfNow.nodes.find(n => isInNode(n, { x: cx, y: cy }) && n.id !== dragRef.current?.fromNodeId) ?? null;
            const validity = hover ? validateConn(wfNow.nodes, wfNow.edges, dragRef.current.fromNodeId, dragRef.current.portLabel, hover.id) : null;
            setDrag(d => d ? { ...d, curX: cx, curY: cy, hoverTargetId: hover?.id ?? null, validity } : null);
        };
        const onUp = (ev) => {
            const rect = svgRef.current?.getBoundingClientRect();
            if (!rect)
                return;
            const d = dragRef.current;
            if (!d)
                return;
            const cx = (ev.clientX - rect.left - panRef.current.x) / zoomRef.current;
            const cy = (ev.clientY - rect.top - panRef.current.y) / zoomRef.current;
            const wfNow = localWfRef.current;
            const hover = wfNow.nodes.find(n => isInNode(n, { x: cx, y: cy }) && n.id !== d.fromNodeId) ?? null;
            if (hover) {
                const v = validateConn(wfNow.nodes, wfNow.edges, d.fromNodeId, d.portLabel, hover.id);
                if (v.ok) {
                    onCommit({ ...wfNow, edges: [...wfNow.edges, { id: `e_${Date.now()}`, from: d.fromNodeId, to: hover.id, label: d.portLabel }] });
                }
                else {
                    setConnError(v.reason);
                    setTimeout(() => setConnError(null), 3000);
                }
            }
            else if (ev.clientX >= rect.left && ev.clientX <= rect.right && ev.clientY >= rect.top && ev.clientY <= rect.bottom) {
                setVoidMenu({ screenX: ev.clientX, screenY: ev.clientY, canvasX: cx, canvasY: cy, fromNodeId: d.fromNodeId, portLabel: d.portLabel });
            }
            setDrag(null);
        };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
        return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    }, [drag, readonly, onCommit]);
    /* ── Node move ── */
    const startNodeMove = (e, nodeId) => {
        if (readonly || e.button !== 0)
            return;
        e.stopPropagation();
        const rect = svgRef.current?.getBoundingClientRect();
        if (!rect)
            return;
        const node = localWf.nodes.find(n => n.id === nodeId);
        const ox = node.x - (e.clientX - rect.left - pan.x) / zoom;
        const oy = node.y - (e.clientY - rect.top - pan.y) / zoom;
        const startX = e.clientX, startY = e.clientY;
        let moved = false;
        const onMove = (ev) => {
            const dist = Math.sqrt((ev.clientX - startX) ** 2 + (ev.clientY - startY) ** 2);
            if (dist < 3)
                return;
            moved = true;
            isDraggingNodeRef.current = true;
            const nx = Math.max(0, (ev.clientX - rect.left - panRef.current.x) / zoomRef.current + ox);
            const ny = Math.max(0, (ev.clientY - rect.top - panRef.current.y) / zoomRef.current + oy);
            setLocalWf(prev => ({ ...prev, nodes: prev.nodes.map(n => n.id === nodeId ? { ...n, x: nx, y: ny } : n) }));
        };
        const onUp = () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
            if (moved) {
                isDraggingNodeRef.current = false;
                onCommit(localWfRef.current);
            }
        };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
    };
    /* ── Canvas pan ── */
    const [panStart, setPanStart] = useState(null);
    useEffect(() => {
        if (!panStart)
            return;
        const onMove = (e) => setPan({ x: panStart.px + e.clientX - panStart.mx, y: panStart.py + e.clientY - panStart.my });
        const onUp = () => setPanStart(null);
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
        return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    }, [panStart]);
    /* ── Add node (palette or void menu) ── */
    const addNode = (type, cx, cy, autoConnect) => {
        if (readonly)
            return;
        const wfNow = localWfRef.current;
        const id = `n_${Date.now()}`;
        const countSame = wfNow.nodes.filter(n => n.type === type).length;
        const label = type === 'APPROVAL' ? `Approbation${countSame > 0 ? ' ' + (countSame + 1) : ''}`
            : type === 'CONDITION' ? 'Condition'
                : `Fin${countSame > 0 ? ' ' + (countSame + 1) : ''}`;
        let x = cx ?? 120 + Math.random() * 300, y = cy ?? 80 + Math.random() * 220;
        // if auto-connecting from a selected node, place below it
        if (autoConnect && !cx) {
            const src = wfNow.nodes.find(n => n.id === autoConnect.nodeId);
            if (src) {
                x = src.x + (type === 'CONDITION' ? 0 : 0);
                y = src.y + (src.type === 'CONDITION' ? CDH : NH) + 90;
            }
        }
        const newNode = { id, type, label, x, y, ...(type === 'END' ? { endResult: 'TERMINÉE' } : {}) };
        const newEdges = [...wfNow.edges];
        if (autoConnect) {
            const alreadyUsed = wfNow.edges.some(e => e.from === autoConnect.nodeId && e.label === autoConnect.portLabel);
            if (!alreadyUsed)
                newEdges.push({ id: `e_${Date.now()}`, from: autoConnect.nodeId, to: id, label: autoConnect.portLabel });
        }
        const newWf = { ...wfNow, nodes: [...wfNow.nodes, newNode], edges: newEdges };
        onCommit(newWf);
        onSelectNode(id);
    };
    /* ── Add from palette (auto-connect to selected node's first free port) ── */
    const addFromPalette = (type) => {
        if (readonly)
            return;
        const wfNow = localWfRef.current;
        if (selectedNodeId) {
            const selNode = wfNow.nodes.find(n => n.id === selectedNodeId);
            if (selNode && selNode.type !== 'END') {
                const freePort = getOutputPorts(selNode).find(p => !wfNow.edges.some(e => e.from === selectedNodeId && e.label === p.label));
                if (freePort) {
                    addNode(type, undefined, undefined, { nodeId: selectedNodeId, portLabel: freePort.label });
                    return;
                }
            }
        }
        addNode(type);
    };
    /* ── Delete node ── */
    const deleteNode = (nodeId) => {
        const wfNow = localWfRef.current;
        if (wfNow.nodes.find(n => n.id === nodeId)?.type === 'START')
            return;
        onCommit({ ...wfNow, nodes: wfNow.nodes.filter(n => n.id !== nodeId), edges: wfNow.edges.filter(e => e.from !== nodeId && e.to !== nodeId) });
        onSelectNode(null);
    };
    /* ── Update node property ── */
    const updateNode = (nodeId, patch) => {
        const wfNow = localWfRef.current;
        onCommit({ ...wfNow, nodes: wfNow.nodes.map(n => n.id === nodeId ? { ...n, ...patch } : n) });
    };
    /* ── Delete edge ── */
    const deleteEdge = (edgeId) => {
        const wfNow = localWfRef.current;
        onCommit({ ...wfNow, edges: wfNow.edges.filter(e => e.id !== edgeId) });
        setSelectedEdgeId(null);
    };
    /* ── Fit to view ── */
    const fitToView = () => {
        const rect = svgRef.current?.getBoundingClientRect();
        if (!rect)
            return;
        const wfNow = localWfRef.current;
        if (!wfNow.nodes.length)
            return;
        const minX = Math.min(...wfNow.nodes.map(n => n.x)) - 20;
        const minY = Math.min(...wfNow.nodes.map(n => n.y)) - 20;
        const maxX = Math.max(...wfNow.nodes.map(n => n.x + (n.type === 'CONDITION' ? CDW : NW))) + 20;
        const maxY = Math.max(...wfNow.nodes.map(n => n.y + (n.type === 'CONDITION' ? CDH : NH))) + 20;
        const z = Math.min(rect.width / (maxX - minX), rect.height / (maxY - minY), 1.2) * 0.9;
        setZoom(z);
        setPan({ x: -minX * z + 20, y: -minY * z + 20 });
    };
    const help = contextHelp(localWf.nodes, localWf.edges);
    const selectedNode = localWf.nodes.find(n => n.id === selectedNodeId) ?? null;
    /* ── Render ── */
    return (<div className="flex flex-col flex-1 min-h-0" style={{ height: 'calc(100vh - 13rem)' }}>
      {/* Contextual help bar */}
      <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl mb-3 flex-shrink-0 text-sm font-medium" style={{ backgroundColor: `${help.color}14`, border: `1px solid ${help.color}40`, color: help.color }}>
        <Info className="w-4 h-4 flex-shrink-0"/>
        {help.msg}
      </div>

      <div className="flex gap-3 flex-1 min-h-0">
        {/* LEFT PALETTE */}
        <div className="w-44 flex-shrink-0 bg-white border border-[#D1D9E0] rounded-xl flex flex-col overflow-hidden">
          <div className="px-3 py-3 border-b border-[#D1D9E0]">
            <p className="text-[10px] font-bold text-[#8898AA] uppercase tracking-wider">Ajouter une étape</p>
            {selectedNodeId && <p className="text-[10px] text-[#16A34A] mt-0.5">Auto-connexion activée ✓</p>}
          </div>
          <div className="p-2 space-y-1.5 flex-1">
            {!readonly && ['APPROVAL', 'CONDITION', 'END'].map(type => {
            const c = NODE_C[type];
            return (<button key={type} onClick={() => addFromPalette(type)} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border text-xs font-semibold transition-colors hover:opacity-80 active:scale-[0.97]" style={{ borderColor: c.stroke, backgroundColor: c.fill, color: c.text }}>
                  <Plus className="w-3.5 h-3.5 flex-shrink-0"/>
                  {NODE_LABEL[type]}
                </button>);
        })}
            {readonly && <p className="text-xs text-[#8898AA] text-center py-4">Workflow publié — lecture seule</p>}
          </div>

          <div className="border-t border-[#D1D9E0] p-2 space-y-1">
            <div className="flex gap-1">
              <button onClick={onUndo} disabled={!canUndo} className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs border border-[#D1D9E0] rounded-lg hover:bg-[#F4F6F8] disabled:opacity-30 disabled:cursor-not-allowed">
                <Undo2 className="w-3.5 h-3.5"/> Annuler
              </button>
              <button onClick={onRedo} disabled={!canRedo} className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs border border-[#D1D9E0] rounded-lg hover:bg-[#F4F6F8] disabled:opacity-30 disabled:cursor-not-allowed">
                <Redo2 className="w-3.5 h-3.5"/> Rétablir
              </button>
            </div>
            <button onClick={fitToView} className="w-full flex items-center justify-center gap-1 px-2 py-1.5 text-xs border border-[#D1D9E0] rounded-lg hover:bg-[#F4F6F8] text-[#4A5568]">
              <CheckCircle className="w-3.5 h-3.5"/> Centrer
            </button>
            {!readonly && (<button onClick={onSave} className="w-full flex items-center justify-center gap-1 px-2 py-1.5 text-xs bg-[#F4F6F8] border border-[#D1D9E0] rounded-lg hover:bg-[#E8EEF4] text-[#4A5568]">
                <Save className="w-3.5 h-3.5"/> Sauvegarder
              </button>)}
          </div>
        </div>

        {/* CENTER CANVAS */}
        <div className="flex-1 min-w-0 relative rounded-xl overflow-hidden border border-[#D1D9E0]" style={{ background: 'radial-gradient(circle,#C8D4DE 1px,transparent 1px)', backgroundSize: '24px 24px', backgroundColor: '#F8FAFC' }}>

          {/* Empty state hint */}
          {localWf.nodes.length <= 1 && !readonly && (<div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div className="bg-white/90 backdrop-blur border border-[#D1D9E0] rounded-xl px-6 py-5 text-center shadow-sm max-w-xs">
                <GitBranch className="w-7 h-7 text-[#8898AA] mx-auto mb-2"/>
                <p className="text-sm font-semibold text-[#4A5568]">Canvas vide</p>
                <p className="text-xs text-[#8898AA] mt-1">Glissez depuis le port vert de START ou utilisez la palette de gauche</p>
              </div>
            </div>)}

          <svg ref={svgRef} width="100%" height="100%" onMouseDown={e => {
            if (drag) {
                setDrag(null);
                return;
            }
            setSelectedEdgeId(null);
            setVoidMenu(null);
            onSelectNode(null);
            setPanStart({ mx: e.clientX, my: e.clientY, px: pan.x, py: pan.y });
        }} onWheel={e => { e.preventDefault(); setZoom(z => Math.max(0.25, Math.min(2, z - e.deltaY * 0.0008))); }} style={{ cursor: drag ? 'crosshair' : panStart ? 'grabbing' : 'grab', display: 'block' }}>
            <defs>
              {[['arrowGray', '#8898AA'], ['arrowGreen', '#16A34A'], ['arrowRed', '#DC2626'], ['arrowOrange', '#EA580C']].map(([id, col]) => (<marker key={id} id={id} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L8,3z" fill={col}/>
                </marker>))}
            </defs>
            <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
              {/* Edges */}
              {localWf.edges.map(edge => {
            const from = localWf.nodes.find(n => n.id === edge.from);
            const to = localWf.nodes.find(n => n.id === edge.to);
            if (!from || !to)
                return null;
            const port = getOutputPorts(from).find(p => p.label === edge.label);
            if (!port)
                return null;
            const inp = getInputPort(to);
            if (!inp)
                return null;
            const path = makePath(port.x, port.y, inp.x, inp.y, port.dir);
            const col = EDGE_C[edge.label];
            const mx = (port.x + inp.x) / 2, my = (port.y + inp.y) / 2;
            const markerEnd = col === '#16A34A' ? 'url(#arrowGreen)' : col === '#DC2626' ? 'url(#arrowRed)' : col === '#EA580C' ? 'url(#arrowOrange)' : 'url(#arrowGray)';
            const isSelected = selectedEdgeId === edge.id;
            return (<g key={edge.id} style={{ cursor: 'pointer' }} onClick={e => { e.stopPropagation(); setSelectedEdgeId(isSelected ? null : edge.id); onSelectNode(null); }}>
                    {/* Wide invisible hit area */}
                    <path d={path} fill="none" stroke="transparent" strokeWidth={12}/>
                    <path d={path} fill="none" stroke={col} strokeWidth={isSelected ? 2.5 : 1.8} strokeDasharray={edge.label === 'REJECTED' || edge.label === 'FALSE' ? '6,3' : undefined} markerEnd={markerEnd}/>
                    {/* Label badge */}
                    {edge.label !== 'NEXT' && (<>
                      <rect x={mx - 20} y={my - 9} width={40} height={17} rx={8} fill={col} opacity={0.95}/>
                      <text x={mx} y={my + 4} textAnchor="middle" fill="white" fontSize={8} fontWeight={700} fontFamily="Inter,sans-serif" style={{ pointerEvents: 'none', userSelect: 'none' }}>
                        {edge.label}
                      </text>
                    </>)}
                    {/* Delete button when selected */}
                    {isSelected && (<g onClick={e => { e.stopPropagation(); deleteEdge(edge.id); }}>
                        <circle cx={mx} cy={my + 20} r={10} fill="white" stroke="#DC2626" strokeWidth={1.5}/>
                        <text x={mx} y={my + 24.5} textAnchor="middle" fill="#DC2626" fontSize={14} fontWeight={900} style={{ pointerEvents: 'none', userSelect: 'none' }}>×</text>
                      </g>)}
                  </g>);
        })}

              {/* Elastic drag line */}
              {drag && (<>
                  <path d={makePath(drag.startX, drag.startY, drag.curX, drag.curY, drag.portDir)} fill="none" stroke={drag.validity?.ok === false ? '#DC2626' : '#1F4E79'} strokeWidth={2} strokeDasharray="8,4" opacity={0.85}/>
                  {drag.validity?.ok === false && (<g>
                      <rect x={drag.curX - 80} y={drag.curY - 32} width={160} height={24} rx={8} fill="#DC2626"/>
                      <text x={drag.curX} y={drag.curY - 16} textAnchor="middle" fill="white" fontSize={9} fontFamily="Inter,sans-serif" style={{ pointerEvents: 'none', userSelect: 'none' }}>
                        {drag.validity.reason.slice(0, 35)}
                      </text>
                    </g>)}
                </>)}

              {/* Nodes */}
              {localWf.nodes.map(node => (<NodeEl key={node.id} node={node} selected={selectedNodeId === node.id} drag={drag} edges={localWf.edges} hovered={hoveredId === node.id} readonly={readonly} onMouseDown={e => { if (!drag)
            startNodeMove(e, node.id); }} onClick={e => { e.stopPropagation(); if (!isDraggingNodeRef.current)
            onSelectNode(node.id); }} onPortMouseDown={(label, x, y, dir, e) => {
                e.stopPropagation();
                e.preventDefault();
                setDrag({ fromNodeId: node.id, portLabel: label, portDir: dir, startX: x, startY: y, curX: x, curY: y, hoverTargetId: null, validity: null });
            }} onMouseEnter={() => setHoveredId(node.id)} onMouseLeave={() => setHoveredId(n => n === node.id ? null : n)}/>))}
            </g>
          </svg>

          {/* Zoom controls */}
          <div className="absolute bottom-3 left-3 flex flex-col gap-1">
            <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="w-7 h-7 bg-white border border-[#D1D9E0] rounded-lg flex items-center justify-center hover:bg-[#F4F6F8] shadow-sm">
              <ZoomIn className="w-3.5 h-3.5 text-[#4A5568]"/>
            </button>
            <button onClick={() => setZoom(z => Math.max(0.25, z - 0.1))} className="w-7 h-7 bg-white border border-[#D1D9E0] rounded-lg flex items-center justify-center hover:bg-[#F4F6F8] shadow-sm">
              <ZoomOut className="w-3.5 h-3.5 text-[#4A5568]"/>
            </button>
            <div className="text-[10px] text-[#8898AA] text-center">{Math.round(zoom * 100)}%</div>
          </div>

          {/* Mini-map */}
          <div className="absolute bottom-3 right-3 w-32 h-20 bg-white/95 border border-[#D1D9E0] rounded-lg overflow-hidden shadow-sm pointer-events-none">
            <svg width="100%" height="100%" viewBox="0 0 680 740">
              {localWf.edges.map(e => {
            const fn = localWf.nodes.find(n => n.id === e.from), tn = localWf.nodes.find(n => n.id === e.to);
            if (!fn || !tn)
                return null;
            return <line key={e.id} x1={fn.x + NW / 2} y1={fn.y + NH / 2} x2={tn.x + NW / 2} y2={tn.y + NH / 2} stroke={EDGE_C[e.label]} strokeWidth={3} opacity={0.5}/>;
        })}
              {localWf.nodes.map(n => (<rect key={n.id} x={n.x} y={n.y} width={n.type === 'CONDITION' ? CDW : NW} height={n.type === 'CONDITION' ? CDH : NH} rx={4} fill={NODE_C[n.type].fill} stroke={selectedNodeId === n.id ? '#172033' : NODE_C[n.type].stroke} strokeWidth={selectedNodeId === n.id ? 4 : 2}/>))}
            </svg>
            <p className="absolute bottom-0 inset-x-0 text-[9px] text-center text-[#8898AA] pb-0.5">MiniMap</p>
          </div>

          {/* Connection error toast */}
          {connError && (<div className="absolute top-3 left-1/2 -translate-x-1/2 bg-[#DC2626] text-white text-xs px-4 py-2 rounded-full shadow-lg z-20 font-medium">
              {connError}
            </div>)}
        </div>

        {/* RIGHT PROPERTIES */}
        <div className="w-60 flex-shrink-0 bg-white border border-[#D1D9E0] rounded-xl overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-[#D1D9E0] flex-shrink-0">
            <p className="text-[10px] font-bold text-[#8898AA] uppercase tracking-wider">Propriétés</p>
          </div>
          <PropsPanel node={selectedNode} wf={localWf} workspaces={workspaces} readonly={readonly} onUpdate={patch => selectedNodeId && updateNode(selectedNodeId, patch)} onDelete={() => selectedNodeId && deleteNode(selectedNodeId)} onCreateWs={onCreateWs}/>
        </div>
      </div>

      {/* Void menu (fixed, outside SVG) */}
      {voidMenu && !readonly && (<div className="fixed z-50 bg-white border border-[#D1D9E0] rounded-xl shadow-2xl p-2 w-44" style={{ left: Math.min(voidMenu.screenX + 8, window.innerWidth - 180), top: Math.min(voidMenu.screenY - 10, window.innerHeight - 200) }} onMouseLeave={() => setVoidMenu(null)}>
          <p className="text-[10px] text-[#8898AA] px-2 py-1 font-bold uppercase tracking-widest">Ajouter une étape ici</p>
          {['APPROVAL', 'CONDITION', 'END'].map(type => {
                const c = NODE_C[type];
                return (<button key={type} onClick={() => {
                        addNode(type, voidMenu.canvasX, voidMenu.canvasY, { nodeId: voidMenu.fromNodeId, portLabel: voidMenu.portLabel });
                        setVoidMenu(null);
                    }} className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-[#F4F6F8] transition-colors" style={{ color: c.text }}>
                <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: c.stroke }}/>
                {NODE_LABEL[type]}
              </button>);
            })}
          <hr className="my-1 border-[#F4F6F8]"/>
          <button onClick={() => setVoidMenu(null)} className="w-full text-xs text-[#8898AA] px-3 py-1.5 hover:bg-[#F4F6F8] rounded-lg">Annuler</button>
        </div>)}
    </div>);
}
/* ─── CONNECTIONS TABLE (Step 3 – editable) ──────────────────────────────── */
function ConnectionsView({ wf, onUpdate, onGoToCanvas }) {
    const otherNodes = (fromId) => wf.nodes.filter(n => n.id !== fromId && n.type !== 'START');
    const changeTarget = (edgeId, newToId) => {
        onUpdate({ edges: wf.edges.map(e => e.id === edgeId ? { ...e, to: newToId } : e) });
    };
    return (<div className="max-w-3xl mx-auto">
      <div className="bg-white border border-[#D1D9E0] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#D1D9E0] flex items-center justify-between">
          <div>
            <h2 className="font-bold text-[#172033]">Connexions &amp; branches</h2>
            <p className="text-xs text-[#8898AA] mt-0.5">Vérifiez et ajustez les cibles via les listes déroulantes</p>
          </div>
          <button onClick={onGoToCanvas} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-[#D1D9E0] text-[#4A5568] hover:bg-[#F4F6F8] rounded-lg transition-colors">
            <FileText className="w-3.5 h-3.5"/> Retour à l'éditeur
          </button>
        </div>

        {wf.edges.length === 0 ? (<div className="py-14 text-center">
            <AlertTriangle className="w-8 h-8 text-[#EA580C] mx-auto mb-2"/>
            <p className="text-sm font-medium text-[#4A5568]">Aucune connexion</p>
            <p className="text-xs text-[#8898AA] mt-1">Retournez à l'éditeur pour créer des liaisons entre les nœuds.</p>
          </div>) : (<>
            <div className="grid grid-cols-[1fr_auto_1fr_auto] gap-0 text-xs font-semibold text-[#8898AA] uppercase tracking-wide bg-[#F8FAFC] border-b border-[#D1D9E0] px-5 py-2.5">
              <span>Source</span>
              <span className="px-6">Branche</span>
              <span>Cible</span>
              <span className="pl-3">Statut</span>
            </div>
            <div className="divide-y divide-[#F4F6F8]">
              {wf.edges.map(edge => {
                const from = wf.nodes.find(n => n.id === edge.from);
                const to = wf.nodes.find(n => n.id === edge.to);
                const col = EDGE_C[edge.label];
                const ok = !!to;
                const targets = otherNodes(edge.from);
                return (<div key={edge.id} className="grid grid-cols-[1fr_auto_1fr_auto] items-center gap-0 px-5 py-3 hover:bg-[#F8FAFC]">
                    {/* Source */}
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: from ? NODE_C[from.type].stroke : '#ccc' }}/>
                      <span className="text-sm font-medium text-[#172033] truncate">{from?.label ?? '?'}</span>
                    </div>
                    {/* Branch */}
                    <div className="px-6">
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full text-white" style={{ backgroundColor: col }}>{edge.label}</span>
                    </div>
                    {/* Target (editable) */}
                    <div>
                      {wf.status === 'PUBLISHED' ? (<span className="flex items-center gap-2 text-sm">
                          <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: to ? NODE_C[to.type].stroke : '#ccc' }}/>
                          {to?.label ?? <span className="text-[#DC2626]">Manquant</span>}
                        </span>) : (<select value={edge.to} onChange={e => changeTarget(edge.id, e.target.value)} className="w-full px-2 py-1.5 border border-[#D1D9E0] rounded-lg text-sm focus:outline-none focus:border-[#1F4E79] bg-white">
                          {!ok && <option value="">— Choisir —</option>}
                          {targets.map(n => (<option key={n.id} value={n.id}>{n.label} ({NODE_LABEL[n.type]})</option>))}
                        </select>)}
                    </div>
                    {/* Status */}
                    <div className="pl-3">
                      {ok ? (<span className="w-5 h-5 rounded-full bg-[#DCFCE7] flex items-center justify-center">
                          <Check className="w-3 h-3 text-[#16A34A]"/>
                        </span>) : (<span className="w-5 h-5 rounded-full bg-[#FEE2E2] flex items-center justify-center">
                          <X className="w-3 h-3 text-[#DC2626]"/>
                        </span>)}
                    </div>
                  </div>);
            })}
            </div>
            <div className="px-5 py-3 bg-[#F8FAFC] border-t border-[#D1D9E0]">
              <p className="text-xs text-[#8898AA]">{wf.nodes.length} nœuds · {wf.edges.length} connexions</p>
            </div>
          </>)}
      </div>
    </div>);
}
/* ─── MAIN COMPONENT ──────────────────────────────────────────────────────── */
export default function WorkflowDesigner() {
    const { addProcess } = useProcesses();
    const [mainView, setMainView] = useState('list');
    const [wizardStep, setWizardStep] = useState(1);
    const [workflows, setWorkflows] = useState(INITIAL_WORKFLOWS);
    const [activeWf, setActiveWf] = useState(null);
    const [savedWs, setSavedWs] = useState([...WORKSPACES]);
    const [selectedNodeId, setSelectedNodeId] = useState(null);
    /* Undo / redo */
    const [undoStack, setUndoStack] = useState([]);
    const [redoStack, setRedoStack] = useState([]);
    const commit = (newWf) => {
        if (activeWf)
            setUndoStack(s => [...s.slice(-24), activeWf]);
        setRedoStack([]);
        setActiveWf(newWf);
        setWorkflows(prev => prev.some(w => w.id === newWf.id) ? prev.map(w => w.id === newWf.id ? newWf : w) : [...prev, newWf]);
    };
    const undo = () => {
        if (!undoStack.length || !activeWf)
            return;
        const prev = undoStack[undoStack.length - 1];
        setRedoStack(s => [activeWf, ...s]);
        setUndoStack(s => s.slice(0, -1));
        setActiveWf(prev);
        setWorkflows(wfs => wfs.map(w => w.id === prev.id ? prev : w));
    };
    const redo = () => {
        if (!redoStack.length || !activeWf)
            return;
        const next = redoStack[0];
        setUndoStack(s => [...s, activeWf]);
        setRedoStack(s => s.slice(1));
        setActiveWf(next);
        setWorkflows(wfs => wfs.map(w => w.id === next.id ? next : w));
    };
    /* Wizard step 1 */
    const [wizName, setWizName] = useState('');
    const [wizDesc, setWizDesc] = useState('');
    /* Validation */
    const [validItems, setValidItems] = useState([]);
    const [isValid, setIsValid] = useState(false);
    /* Modals */
    const [newWsModal, setNewWsModal] = useState(false);
    const [wsName, setWsName] = useState('');
    const [wsCode, setWsCode] = useState('');
    const [wsDesc2, setWsDesc2] = useState('');
    const [publishModal, setPublishModal] = useState(false);
    /* Process create */
    const [procName, setProcName] = useState('');
    const [procFormId, setProcFormId] = useState(FORMS[0]?.id ?? '');
    const [procCreated, setProcCreated] = useState(false);
    /* Toast */
    const [toast, setToast] = useState(null);
    const showToast = (msg, type = 'success') => setToast({ msg, type });
    const isPublished = activeWf?.status === 'PUBLISHED';
    const openWizard = (wf, step = 1) => {
        if (wf) {
            setActiveWf({ ...wf, nodes: wf.nodes.map(n => ({ ...n })), edges: wf.edges.map(e => ({ ...e })) });
            setWizName(wf.name);
            setWizDesc(wf.description);
        }
        else {
            setWizName('');
            setWizDesc('');
        }
        setUndoStack([]);
        setRedoStack([]);
        setWizardStep(step);
        setSelectedNodeId(null);
        setIsValid(false);
        setValidItems([]);
        setMainView('wizard');
    };
    const handleSave = () => {
        if (!activeWf)
            return;
        const updated = { ...activeWf, updatedAt: new Date().toISOString() };
        setActiveWf(updated);
        setWorkflows(prev => prev.map(w => w.id === updated.id ? updated : w));
        showToast('Workflow sauvegardé');
    };
    const goNext = () => setWizardStep(s => Math.min(5, s + 1));
    const goPrev = () => { if (wizardStep === 1) {
        setMainView('list');
        return;
    } setWizardStep(s => Math.max(1, s - 1)); };
    const runValidation = () => {
        if (!activeWf)
            return false;
        const items = validateWorkflow(activeWf);
        setValidItems(items);
        const valid = items.every(i => i.ok);
        setIsValid(valid);
        return valid;
    };
    const handlePublish = () => {
        if (!activeWf)
            return;
        setPublishModal(false);
        const updated = { ...activeWf, status: 'PUBLISHED', updatedAt: new Date().toISOString() };
        setActiveWf(updated);
        setWorkflows(prev => prev.map(w => w.id === updated.id ? updated : w));
        showToast('Workflow publié !');
        setTimeout(() => setMainView('process-create'), 600);
    };
    const handleCreateWs = () => {
        if (!wsName.trim() || !wsCode.trim())
            return;
        const id = `ws_${Date.now()}`;
        const nws = { id, name: wsName.trim(), code: wsCode.trim().toUpperCase(), description: wsDesc2, active: true, memberIds: [], color: '#1F4E79' };
        setSavedWs(prev => [...prev, nws]);
        setWsName('');
        setWsCode('');
        setWsDesc2('');
        setNewWsModal(false);
        if (selectedNodeId && activeWf) {
            const updated = { ...activeWf, nodes: activeWf.nodes.map(n => n.id === selectedNodeId ? { ...n, workspaceId: id } : n) };
            commit(updated);
        }
        showToast(`Espace "${nws.name}" créé`);
    };
    const handleCreateProcess = () => {
        if (!procName.trim() || !activeWf)
            return;
        const newProc = { id: `p_${Date.now()}`, name: procName.trim(), description: `Processus lié au workflow "${activeWf.name}"`, formId: procFormId, workflowId: activeWf.id, status: 'PUBLISHED', icon: '📋', createdAt: new Date().toISOString().slice(0, 10) };
        addProcess(newProc);
        setProcCreated(true);
        showToast(`Processus "${procName}" publié !`);
    };
    const renderStepFooter = (label, disabled, onNext) => (<div className="flex items-center justify-between pt-4 border-t border-[#D1D9E0] mt-4">
      <button onClick={goPrev} className="flex items-center gap-2 px-4 py-2 border border-[#D1D9E0] text-[#4A5568] rounded-lg text-sm hover:bg-[#F4F6F8]">
        <ArrowLeft className="w-4 h-4"/> {wizardStep === 1 ? 'Annuler' : 'Retour'}
      </button>
      <button onClick={onNext ?? goNext} disabled={disabled} className="flex items-center gap-2 px-5 py-2 bg-[#1F4E79] text-white rounded-lg text-sm font-semibold hover:bg-[#172033] disabled:opacity-40 disabled:cursor-not-allowed">
        {label} <ChevronRight className="w-4 h-4"/>
      </button>
    </div>);
    /* ── LIST VIEW ── */
    if (mainView === 'list') {
        const SB = { DRAFT: 'bg-[#F1F5F9] text-[#4A5568]', PUBLISHED: 'bg-[#DCFCE7] text-[#16A34A]', ARCHIVED: 'bg-[#F1F5F9] text-[#94A3B8]' };
        const SL = { DRAFT: 'Brouillon', PUBLISHED: 'Publié', ARCHIVED: 'Archivé' };
        return (<div className="space-y-5">
        <div className="flex items-center justify-between">
          <div><h1 className="text-xl font-bold text-[#172033]">Workflows</h1><p className="text-sm text-[#8898AA] mt-0.5">Concevez vos flux d'approbation guidés</p></div>
          <button onClick={() => openWizard(null)} className="flex items-center gap-2 bg-[#1F4E79] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#172033]">
            <Plus className="w-4 h-4"/> Nouveau Workflow
          </button>
        </div>
        <div className="bg-white border border-[#D1D9E0] rounded-xl overflow-hidden">
          {workflows.length === 0 ? (<div className="py-20 text-center">
              <GitBranch className="w-10 h-10 text-[#D1D9E0] mx-auto mb-3"/>
              <p className="font-semibold text-[#172033]">Aucun workflow</p>
              <button onClick={() => openWizard(null)} className="mt-4 inline-flex items-center gap-2 bg-[#1F4E79] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#172033]">
                <Plus className="w-4 h-4"/> Créer un Workflow
              </button>
            </div>) : (<table className="w-full text-sm">
              <thead><tr className="border-b border-[#D1D9E0] text-xs text-[#8898AA] uppercase tracking-wide bg-[#F8FAFC]">
                <th className="px-5 py-3 text-left font-medium">Nom</th>
                <th className="px-5 py-3 text-left font-medium">Statut</th>
                <th className="px-5 py-3 text-left font-medium">Nœuds</th>
                <th className="px-5 py-3 text-left font-medium">Modifié</th>
                <th className="px-5 py-3 text-left font-medium">Actions</th>
              </tr></thead>
              <tbody className="divide-y divide-[#F4F6F8]">
                {workflows.map(wf => (<tr key={wf.id} className="hover:bg-[#F8FAFC]">
                    <td className="px-5 py-3"><p className="font-semibold text-[#172033]">{wf.name}</p>{wf.description && <p className="text-xs text-[#8898AA]">{wf.description}</p>}</td>
                    <td className="px-5 py-3"><span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${SB[wf.status]}`}>{SL[wf.status]}</span></td>
                    <td className="px-5 py-3 text-[#4A5568]">{wf.nodes.length}</td>
                    <td className="px-5 py-3 text-xs text-[#8898AA]">{new Date(wf.updatedAt).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openWizard(wf, wf.status === 'PUBLISHED' ? 5 : 2)} className="px-3 py-1.5 text-xs font-medium text-[#1F4E79] bg-[#EBF2F9] hover:bg-[#1F4E79] hover:text-white rounded-lg transition-colors">
                          {wf.status === 'PUBLISHED' ? 'Consulter' : 'Éditer'}
                        </button>
                        <button onClick={() => { const id = `wf_${Date.now()}`; setWorkflows(prev => [...prev, { ...wf, id, name: `${wf.name} (copie)`, status: 'DRAFT', updatedAt: new Date().toISOString() }]); showToast('Dupliqué'); }} className="px-3 py-1.5 text-xs font-medium text-[#4A5568] border border-[#D1D9E0] hover:bg-[#F4F6F8] rounded-lg">Dupliquer</button>
                        {wf.status !== 'ARCHIVED' && <button onClick={() => { setWorkflows(prev => prev.map(w => w.id === wf.id ? { ...w, status: 'ARCHIVED' } : w)); showToast('Archivé'); }} className="px-3 py-1.5 text-xs font-medium text-[#8898AA] border border-[#D1D9E0] hover:bg-[#F4F6F8] rounded-lg">Archiver</button>}
                      </div>
                    </td>
                  </tr>))}
              </tbody>
            </table>)}
        </div>
        {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)}/>}
      </div>);
    }
    /* ── PROCESS CREATE ── */
    if (mainView === 'process-create') {
        return (<div className="max-w-xl mx-auto space-y-5">
        <div className="flex items-center gap-3">
          <button onClick={() => setMainView('list')} className="p-1.5 rounded-lg hover:bg-[#F4F6F8] text-[#8898AA]"><ArrowLeft className="w-5 h-5"/></button>
          <div><h1 className="text-xl font-bold text-[#172033]">Créer un Processus</h1><p className="text-sm text-[#8898AA]">Associez ce workflow à un formulaire</p></div>
        </div>
        {procCreated ? (<div className="bg-white border border-[#D1D9E0] rounded-xl p-8 text-center">
            <div className="w-14 h-14 bg-[#DCFCE7] rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle className="w-7 h-7 text-[#16A34A]"/></div>
            <h2 className="text-lg font-bold text-[#172033] mb-1">Processus publié !</h2>
            <p className="text-sm text-[#4A5568]">Le processus <strong>"{procName}"</strong> est disponible dans le catalogue.</p>
            <button onClick={() => { setMainView('list'); setProcCreated(false); setProcName(''); }} className="mt-6 flex items-center gap-2 bg-[#1F4E79] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#172033] mx-auto">
              <ArrowLeft className="w-4 h-4"/> Retour aux workflows
            </button>
          </div>) : (<div className="bg-white border border-[#D1D9E0] rounded-xl p-6 space-y-5">
            <div className="flex items-center gap-3 bg-[#EBF2F9] rounded-xl p-4">
              <div className="w-8 h-8 bg-[#1F4E79] rounded-lg flex items-center justify-center flex-shrink-0"><GitBranch className="w-4 h-4 text-white"/></div>
              <div className="flex-1"><p className="text-sm font-semibold text-[#1F4E79]">{activeWf?.name}</p><p className="text-xs text-[#4A5568]">{activeWf?.nodes.length} nœuds</p></div>
              <span className="text-xs font-semibold bg-[#DCFCE7] text-[#16A34A] px-2 py-0.5 rounded-full">Publié ✓</span>
            </div>
            <div><label className="text-xs font-semibold text-[#4A5568] uppercase tracking-wide block mb-1.5">Nom du processus <span className="text-[#DC2626]">*</span></label>
              <input autoFocus value={procName} onChange={e => setProcName(e.target.value)} placeholder="ex: Demande de remboursement" className="w-full px-4 py-2.5 border border-[#D1D9E0] rounded-lg text-sm focus:outline-none focus:border-[#1F4E79]"/>
            </div>
            <div><label className="text-xs font-semibold text-[#4A5568] uppercase tracking-wide block mb-1.5">Formulaire associé <span className="text-[#DC2626]">*</span></label>
              <select value={procFormId} onChange={e => setProcFormId(e.target.value)} className="w-full px-4 py-2.5 border border-[#D1D9E0] rounded-lg text-sm focus:outline-none focus:border-[#1F4E79]">
                {FORMS.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
            <button onClick={handleCreateProcess} disabled={!procName.trim()} className="w-full flex items-center justify-center gap-2 bg-[#16A34A] hover:bg-[#15803D] text-white py-3 rounded-lg font-semibold text-sm disabled:opacity-50">
              <Globe2Ico className="w-4 h-4"/> Publier le Processus
            </button>
          </div>)}
        {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)}/>}
      </div>);
    }
    /* ── WIZARD ── */
    const goToStep2 = () => {
        if (!wizName.trim())
            return;
        if (!activeWf) {
            const id = `wf_${Date.now()}`;
            const newWf = { id, name: wizName.trim(), description: wizDesc, status: 'DRAFT', updatedAt: new Date().toISOString(),
                nodes: [{ id: 'n_start', type: 'START', label: 'Début', x: 220, y: 30 }], edges: [] };
            setWorkflows(prev => [...prev, newWf]);
            setActiveWf(newWf);
        }
        else {
            const updated = { ...activeWf, name: wizName.trim(), description: wizDesc };
            setActiveWf(updated);
            setWorkflows(prev => prev.map(w => w.id === updated.id ? updated : w));
        }
        goNext();
    };
    /* Step 1 */
    const renderStep1 = () => (<div className="max-w-xl mx-auto">
      <div className="bg-white border border-[#D1D9E0] rounded-xl p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#EBF2F9] rounded-xl flex items-center justify-center"><FileText className="w-4.5 h-4.5 text-[#1F4E79]"/></div>
          <div className="flex-1"><h2 className="font-bold text-[#172033]">Informations générales</h2><p className="text-xs text-[#8898AA]">Nommez et décrivez votre workflow</p></div>
          <span className="text-xs font-semibold bg-[#F1F5F9] text-[#4A5568] px-2.5 py-1 rounded-full">Brouillon</span>
        </div>
        <div><label className="text-xs font-semibold text-[#4A5568] uppercase tracking-wide block mb-1.5">Nom du Workflow <span className="text-[#DC2626]">*</span></label>
          <input autoFocus value={wizName} onChange={e => setWizName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && wizName.trim())
        goToStep2(); }} placeholder="ex: Validation des achats" className="w-full px-4 py-2.5 border border-[#D1D9E0] rounded-lg text-sm focus:outline-none focus:border-[#1F4E79] focus:ring-2 focus:ring-[#1F4E79]/10"/>
        </div>
        <div><label className="text-xs font-semibold text-[#4A5568] uppercase tracking-wide block mb-1.5">Description (optionnel)</label>
          <textarea value={wizDesc} onChange={e => setWizDesc(e.target.value)} placeholder="Décrivez l'objectif…" className="w-full px-4 py-2.5 border border-[#D1D9E0] rounded-lg text-sm focus:outline-none focus:border-[#1F4E79] h-20 resize-none"/>
        </div>
        <div className="bg-[#EBF2F9] rounded-lg p-3 text-xs text-[#1F4E79] flex gap-2">
          <Info className="w-4 h-4 flex-shrink-0 mt-0.5"/>
          Un nœud START sera placé automatiquement. Vous ajouterez ensuite les étapes d'approbation et les conditions dans l'éditeur visuel.
        </div>
        {renderStepFooter('Continuer — Concevoir les étapes', !wizName.trim(), goToStep2)}
      </div>
    </div>);
    /* Step 2 */
    const renderStep2 = () => (<CanvasEditor wf={activeWf} selectedNodeId={selectedNodeId} onSelectNode={setSelectedNodeId} readonly={!!isPublished} workspaces={savedWs} onCreateWs={() => setNewWsModal(true)} onCommit={commit} onSave={handleSave} onUndo={undo} onRedo={redo} canUndo={undoStack.length > 0} canRedo={redoStack.length > 0}/>);
    /* Step 3 */
    const renderStep3 = () => (<div className="space-y-4">
      <ConnectionsView wf={activeWf} onUpdate={patch => commit({ ...activeWf, ...patch })} onGoToCanvas={() => setWizardStep(2)}/>
      {renderStepFooter('Continuer — Vérification', false, () => { runValidation(); goNext(); })}
    </div>);
    /* Step 4 */
    const renderStep4 = () => {
        const allOk = validItems.length > 0 && validItems.every(i => i.ok);
        const hasErr = validItems.some(i => !i.ok);
        return (<div className="max-w-2xl mx-auto space-y-4">
        <div className="bg-white border border-[#D1D9E0] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#D1D9E0] flex items-center justify-between">
            <div><h2 className="font-bold text-[#172033]">Vérification du Workflow</h2><p className="text-xs text-[#8898AA] mt-0.5">Tous les critères doivent être valides</p></div>
            <button onClick={runValidation} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-[#D1D9E0] text-[#4A5568] hover:bg-[#F4F6F8] rounded-lg">
              <CheckCircle className="w-3.5 h-3.5"/> Vérifier
            </button>
          </div>
          {validItems.length === 0 ? (<div className="py-12 text-center"><CheckCircle className="w-8 h-8 text-[#D1D9E0] mx-auto mb-2"/><p className="text-sm text-[#8898AA]">Cliquez sur "Vérifier" pour lancer la validation</p></div>) : (<div className="p-5 space-y-2">
              {validItems.map((item, i) => (<div key={i} className={`flex items-start gap-3 p-3 rounded-xl border ${item.ok ? 'bg-[#F0FDF4] border-[#BBF7D0]' : 'bg-[#FEF2F2] border-[#FECACA]'}`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${item.ok ? 'bg-[#16A34A]' : 'bg-[#DC2626]'}`}>
                    {item.ok ? <Check className="w-3 h-3 text-white"/> : <X className="w-3 h-3 text-white"/>}
                  </div>
                  <p className={`text-sm flex-1 ${item.ok ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>{item.msg}</p>
                  {!item.ok && item.nodeId && (<button onClick={() => { setWizardStep(2); setSelectedNodeId(item.nodeId); }} className="text-xs text-[#DC2626] underline flex-shrink-0">Voir le nœud</button>)}
                </div>))}
              {allOk && <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl p-4 text-center"><CheckCircle className="w-6 h-6 text-[#16A34A] mx-auto mb-1"/><p className="text-sm font-semibold text-[#16A34A]">Workflow valide — prêt pour la publication</p></div>}
              {hasErr && <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-xl p-4 text-center"><AlertTriangle className="w-6 h-6 text-[#DC2626] mx-auto mb-1"/><p className="text-sm font-semibold text-[#DC2626]">Corrigez les erreurs ci-dessus</p><button onClick={() => setWizardStep(2)} className="mt-1 text-xs text-[#DC2626] underline">Retourner à l'éditeur</button></div>}
            </div>)}
        </div>
        {renderStepFooter('Continuer — Publication', !allOk)}
      </div>);
    };
    /* Step 5 */
    const renderStep5 = () => {
        const wf = activeWf;
        const approvals = wf.nodes.filter(n => n.type === 'APPROVAL');
        const conditions = wf.nodes.filter(n => n.type === 'CONDITION');
        const ends = wf.nodes.filter(n => n.type === 'END');
        const wsUsed = [...new Set(approvals.map(n => n.workspaceId).filter(Boolean))];
        return (<div className="max-w-2xl mx-auto space-y-4">
        <div className="bg-white border border-[#D1D9E0] rounded-xl p-6">
          <div className="flex items-start gap-4 mb-5">
            <div className="w-10 h-10 bg-[#EBF2F9] rounded-xl flex items-center justify-center flex-shrink-0"><GitBranch className="w-5 h-5 text-[#1F4E79]"/></div>
            <div className="flex-1"><h2 className="font-bold text-[#172033] text-lg">{wf.name}</h2>{wf.description && <p className="text-sm text-[#4A5568] mt-0.5">{wf.description}</p>}</div>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${wf.status === 'PUBLISHED' ? 'bg-[#DCFCE7] text-[#16A34A]' : 'bg-[#F1F5F9] text-[#4A5568]'}`}>
              {wf.status === 'PUBLISHED' ? 'Publié' : 'Brouillon'}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-5">
            {[{ l: "Étapes d'approbation", v: approvals.length, c: NODE_C.APPROVAL.stroke }, { l: "Conditions", v: conditions.length, c: NODE_C.CONDITION.stroke }, { l: "Points de fin", v: ends.length, c: NODE_C.END.stroke }, { l: "Connexions", v: wf.edges.length, c: '#8898AA' }].map(s => (<div key={s.l} className="bg-[#F8FAFC] border border-[#D1D9E0] rounded-lg p-3"><p className="text-xl font-extrabold" style={{ color: s.c }}>{s.v}</p><p className="text-xs text-[#8898AA] mt-0.5">{s.l}</p></div>))}
          </div>
          {wsUsed.length > 0 && (<div className="mb-5"><p className="text-xs font-semibold text-[#4A5568] uppercase tracking-wide mb-2">Workspaces impliqués</p>
            <div className="flex flex-wrap gap-2">{wsUsed.map(id => { const ws = savedWs.find(w => w.id === id); return ws ? (<span key={id} className="text-xs font-medium px-2.5 py-1 rounded-full text-white" style={{ backgroundColor: ws.color }}>{ws.name}</span>) : null; })}</div>
          </div>)}
          {conditions.length > 0 && (<div><p className="text-xs font-semibold text-[#4A5568] uppercase tracking-wide mb-2">Conditions</p>
            <div className="space-y-1.5">{conditions.map(n => (<div key={n.id} className="flex items-center gap-2 text-xs bg-[#F5F3FF] border border-[#EDE9FE] rounded-lg px-3 py-2">
                <span className="w-2 h-2 bg-[#7C3AED] rounded-sm"/><span className="font-medium text-[#6D28D9]">{n.label}</span>
                {n.conditionField && <span className="text-[#8898AA]">: {n.conditionField} {n.conditionOperator} {n.conditionValue}</span>}
              </div>))}</div>
          </div>)}
        </div>

        {wf.status !== 'PUBLISHED' && (<div className="bg-[#EBF2F9] border border-[#1F4E79]/20 rounded-xl p-4 flex gap-3">
            <Info className="w-4 h-4 text-[#1F4E79] flex-shrink-0 mt-0.5"/>
            <p className="text-xs text-[#1F4E79]">Une fois publié, ce workflow sera <strong>en lecture seule</strong>. Dupliquez-le pour créer une nouvelle version.</p>
          </div>)}
        {wf.status === 'PUBLISHED' && (<div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl p-4 text-center">
            <CheckCircle className="w-5 h-5 text-[#16A34A] mx-auto mb-1"/>
            <p className="text-sm font-semibold text-[#16A34A]">Ce Workflow est publié et prêt à être associé à un Processus</p>
          </div>)}

        <div className="flex items-center justify-between pt-1">
          <button onClick={goPrev} className="flex items-center gap-2 px-4 py-2 border border-[#D1D9E0] text-[#4A5568] rounded-lg text-sm hover:bg-[#F4F6F8]">
            <ArrowLeft className="w-4 h-4"/> Retour
          </button>
          <div className="flex gap-3">
            {wf.status !== 'PUBLISHED' && (<>
              <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 border border-[#D1D9E0] text-[#4A5568] rounded-lg text-sm hover:bg-[#F4F6F8]">
                <Save className="w-4 h-4"/> Enregistrer brouillon
              </button>
              <button onClick={() => setPublishModal(true)} disabled={!isValid} className="flex items-center gap-2 px-5 py-2 bg-[#16A34A] text-white rounded-lg text-sm font-semibold hover:bg-[#15803D] disabled:opacity-40 disabled:cursor-not-allowed">
                <Globe2Ico className="w-4 h-4"/> Publier le Workflow
              </button>
            </>)}
            {wf.status === 'PUBLISHED' && (<button onClick={() => { setMainView('process-create'); setProcCreated(false); setProcName(''); }} className="flex items-center gap-2 px-5 py-2 bg-[#1F4E79] text-white rounded-lg text-sm font-semibold hover:bg-[#172033]">
                <ChevronRight className="w-4 h-4"/> Créer un Processus
              </button>)}
          </div>
        </div>
      </div>);
    };
    return (<div className="flex flex-col h-full">
      {/* Back + progress bar */}
      <div className="flex items-center gap-3 mb-1 flex-shrink-0">
        <button onClick={() => setMainView('list')} className="p-1.5 rounded-lg hover:bg-[#F4F6F8] text-[#8898AA] hover:text-[#172033] flex-shrink-0">
          <ArrowLeft className="w-4 h-4"/>
        </button>
        <WizardBar step={wizardStep}/>
      </div>

      <div className={`flex-1 min-h-0 ${wizardStep === 2 ? 'flex flex-col' : 'overflow-y-auto'}`}>
        {wizardStep === 1 && renderStep1()}
        {wizardStep === 2 && activeWf && renderStep2()}
        {wizardStep === 3 && activeWf && renderStep3()}
        {wizardStep === 4 && activeWf && renderStep4()}
        {wizardStep === 5 && activeWf && renderStep5()}
      </div>

      {/* New workspace modal */}
      {newWsModal && (<div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="px-6 py-5 border-b border-[#D1D9E0] flex items-center justify-between">
              <h3 className="font-bold text-[#172033]">Créer un espace</h3>
              <button onClick={() => setNewWsModal(false)}><X className="w-5 h-5 text-[#8898AA]"/></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {[{ label: 'Nom', value: wsName, setter: setWsName, ph: 'ex: Finance', req: true }, { label: 'Code', value: wsCode, setter: setWsCode, ph: 'ex: FIN', req: true }, { label: 'Description', value: wsDesc2, setter: setWsDesc2, ph: 'Description…', req: false }].map(({ label, value, setter, ph, req }) => (<div key={label}>
                  <label className="text-xs font-semibold text-[#4A5568] uppercase tracking-wide block mb-1">{label}{req && <span className="text-[#DC2626] ml-0.5">*</span>}</label>
                  <input value={value} onChange={e => setter(e.target.value)} placeholder={ph} className="w-full px-3 py-2.5 border border-[#D1D9E0] rounded-lg text-sm focus:outline-none focus:border-[#1F4E79]"/>
                </div>))}
            </div>
            <div className="px-6 py-4 border-t border-[#D1D9E0] flex justify-end gap-3">
              <button onClick={() => setNewWsModal(false)} className="px-4 py-2 text-sm border border-[#D1D9E0] text-[#4A5568] rounded-lg hover:bg-[#F4F6F8]">Annuler</button>
              <button onClick={handleCreateWs} disabled={!wsName.trim() || !wsCode.trim()} className="px-4 py-2 text-sm font-semibold bg-[#1F4E79] text-white rounded-lg hover:bg-[#172033] disabled:opacity-50">Créer</button>
            </div>
          </div>
        </div>)}

      {/* Publish confirmation */}
      {publishModal && (<div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="px-6 py-5 border-b border-[#D1D9E0]"><h3 className="font-bold text-[#172033]">Publier ce Workflow ?</h3></div>
            <div className="px-6 py-5">
              <div className="bg-[#FFFBEB] border border-[#FEF3C7] rounded-xl p-3 text-xs text-[#92400E] flex gap-2 mb-4">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5"/>
                Une fois publié, ce workflow sera <strong>en lecture seule</strong>.
              </div>
              <p className="text-sm text-[#4A5568]">Le workflow <strong>"{activeWf?.name}"</strong> deviendra disponible pour association à un Processus.</p>
            </div>
            <div className="px-6 py-4 border-t border-[#D1D9E0] flex justify-end gap-3">
              <button onClick={() => setPublishModal(false)} className="px-4 py-2 text-sm border border-[#D1D9E0] text-[#4A5568] rounded-lg hover:bg-[#F4F6F8]">Annuler</button>
              <button onClick={handlePublish} className="px-5 py-2 text-sm font-semibold bg-[#16A34A] text-white rounded-lg hover:bg-[#15803D]">Confirmer</button>
            </div>
          </div>
        </div>)}

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)}/>}
    </div>);
}
