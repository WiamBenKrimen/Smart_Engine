import { createContext, useContext, useState } from 'react';
import { PROCESSES } from '../mockData';
const ProcessContext = createContext(null);
export function ProcessProvider({ children }) {
    const [processes, setProcesses] = useState(PROCESSES.map(p => ({ ...p })));
    return (<ProcessContext.Provider value={{
            processes,
            addProcess: (p) => setProcesses(prev => [...prev, p]),
            updateProcess: (id, patch) => setProcesses(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p)),
        }}>
      {children}
    </ProcessContext.Provider>);
}
export function useProcesses() {
    const ctx = useContext(ProcessContext);
    if (!ctx)
        throw new Error('useProcesses must be used inside ProcessProvider');
    return ctx;
}
