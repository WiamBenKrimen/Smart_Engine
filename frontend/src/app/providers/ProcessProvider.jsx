import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { processApi } from '../../api/processApi';

const ProcessContext = createContext(null);

export function ProcessProvider({ children }) {
    const [processes, setProcesses] = useState([]);
    const [loading, setLoading] = useState(true);

    const reloadProcesses = useCallback(async () => {
        try {
            setLoading(true);
            const rows = await processApi.list();
            if (Array.isArray(rows)) {
                setProcesses(rows.map(r => ({
                    id: r.id.toString(),
                    name: r.name,
                    description: r.description,
                    icon: r.icon || '📋',
                    status: r.status === 'PUBLIE' ? 'PUBLISHED' : r.status === 'ARCHIVE' ? 'ARCHIVED' : 'DRAFT',
                    formId: r.formId ? r.formId.toString() : null,
                    workflowId: r.workflowId ? r.workflowId.toString() : null,
                    formName: r.formName,
                    workflowName: r.workflowName,
                    createdAt: r.dateCreation ? r.dateCreation.slice(0, 10) : new Date().toISOString().slice(0, 10),
                })));
            } else {
                setProcesses([]);
            }
        } catch (err) {
            console.warn('Failed to load processes from API:', err);
            setProcesses([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        reloadProcesses();
    }, [reloadProcesses]);

    return (
        <ProcessContext.Provider value={{
            processes,
            loading,
            reloadProcesses,
            setProcesses,
            addProcess: (p) => setProcesses(prev => [p, ...prev.filter(x => x.id !== p.id)]),
            updateProcess: (id, patch) => setProcesses(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p)),
        }}>
            {children}
        </ProcessContext.Provider>
    );
}

export function useProcesses() {
    const ctx = useContext(ProcessContext);
    if (!ctx)
        throw new Error('useProcesses must be used inside ProcessProvider');
    return ctx;
}
