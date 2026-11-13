import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { requestApi } from '../../api/requestApi';
import { useAuth } from './AuthProvider';

const RequestContext = createContext(null);

export function RequestProvider({ children }) {
    const { currentUser } = useAuth();
    const reloadVersion = useRef(0);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading]   = useState(false);
    const [error, setError]       = useState(null);

    // Normalise un objet demande venant de l'API vers le format attendu par les composants
    function normalize(d) {
        return {
            id:          String(d.id),
            reference:   d.referenceDemande,
            processId:   String(d.processusId),
            processName: d.processusNom,
            processIcon: d.processusIcon,
            status:      d.statut,
            priority:    d.priorite,
            dataJson:    d.dataJson,
            createdAt:   d.dateCreation,
            dateFin:     d.dateFin,
            validationSteps: d.validationSteps ?? [],
        };
    }

    const reloadRequests = useCallback(async (background = false) => {
        if (!currentUser) return;          // pas connecté → rien à charger
        const version = ++reloadVersion.current;
        try {
            if (!background) setLoading(true);
            const rows = await requestApi.listMine();
            if (version !== reloadVersion.current) return;
            setRequests(Array.isArray(rows) ? rows.map(normalize) : []);
            setError(null);
        } catch (err) {
            if (version !== reloadVersion.current) return;
            console.warn('Impossible de charger les demandes :', err);
            setError(err.message);
            if (!background) setRequests([]);
        } finally {
            if (version === reloadVersion.current) setLoading(false);
        }
    }, [currentUser]);   // ← se recalcule à chaque changement d'utilisateur

    useEffect(() => {
        if (!currentUser) {
            // Utilisateur déconnecté → vider immédiatement les données
            setRequests([]);
            setError(null);
            return;
        }
        reloadRequests();
        const refresh = () => { if (document.visibilityState !== 'hidden') reloadRequests(true); };
        const timer = setInterval(refresh, 10000);
        window.addEventListener('focus', refresh);
        window.addEventListener('smart-engine-task-decision', refresh);
        return () => {
            ++reloadVersion.current;
            clearInterval(timer);
            window.removeEventListener('focus', refresh);
            window.removeEventListener('smart-engine-task-decision', refresh);
        };
    }, [currentUser, reloadRequests]);   // ← se relance quand l'utilisateur change

    /** Soumet une nouvelle demande. Renvoie la référence ou '' en cas d'échec. */
    async function submitRequest(processId, formData) {
        try {
            const payload = {
                processusId: Number(processId),
                dataJson:    JSON.stringify(formData),
            };
            const created = await requestApi.create(payload);
            const normalized = normalize(created);
            setRequests(prev => [normalized, ...prev]);
            return normalized.reference;
        } catch (err) {
            console.error('Erreur lors de la soumission :', err);
            return '';
        }
    }

    /** Retourne les demandes chargées (déjà filtrées par l'API /mine). */
    function getMyRequests() {
        return requests;
    }

    // ── Fonctions tâches (non encore branchées sur l'API — retournent vide) ──
    function getWorkspaceTasks() { return []; }
    function approveTask() {}
    function rejectTask()  {}
    function claimTask()   {}

    return (
        <RequestContext.Provider value={{
            requests, tasks: [], loading, error,
            submitRequest,
            getMyRequests,
            reloadRequests,
            getWorkspaceTasks,
            approveTask,
            rejectTask,
            claimTask,
        }}>
            {children}
        </RequestContext.Provider>
    );
}

export function useRequests() {
    const ctx = useContext(RequestContext);
    if (!ctx) throw new Error('useRequests must be used within RequestProvider');
    return ctx;
}
