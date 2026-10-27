import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Clock, User, FileText, Loader2 } from 'lucide-react';
import { useRequests } from '../../../app/providers/RequestProvider';
import { requestApi } from '../../../api/requestApi';
import StatusBadge from '../../../components/StatusBadge';
import ProcessIcon from '../../processes/components/ProcessIcon';

const STATUT_LABELS = {
    EN_COURS:  { label: 'En cours',   color: 'text-[#1F4E79] bg-[#EBF2F9]' },
    TERMINEE:  { label: 'Terminée',   color: 'text-[#14532D] bg-[#DCFCE7]' },
    REFUSEE:   { label: 'Refusée',    color: 'text-[#7F1D1D] bg-[#FEE2E2]' },
    ANNULEE:   { label: 'Annulée',    color: 'text-[#4A5568] bg-[#F4F6F8]' },
    BROUILLON: { label: 'Brouillon',  color: 'text-[#8898AA] bg-[#F4F6F8]' },
};

export default function RequestDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { requests, loading: listLoading } = useRequests();

    // Cherche d'abord dans la liste déjà chargée, sinon appelle l'API directement
    const fromList = requests.find(r => r.id === id);
    const [request, setRequest]   = useState(fromList ?? null);
    const [fetching, setFetching] = useState(!fromList);
    const [fetchError, setFetchError] = useState('');

    useEffect(() => {
        if (fromList) {
            setRequest(fromList);
            setFetching(false);
            return;
        }
        // Si l'ID n'est pas dans la liste (navigation directe), on charge via l'API
        setFetching(true);
        requestApi.getById(id)
            .then(d => {
                setRequest({
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
                });
            })
            .catch(() => setFetchError('Demande introuvable ou accès refusé.'))
            .finally(() => setFetching(false));
    }, [id, fromList]);

    // ── États de chargement / erreur ─────────────────────────────────────
    if (fetching || listLoading) {
        return (
            <div className="flex items-center justify-center gap-2 py-24 text-[#8898AA] text-sm">
                <Loader2 className="w-5 h-5 animate-spin"/> Chargement…
            </div>
        );
    }

    if (fetchError || !request) {
        return (
            <div className="text-center py-16">
                <p className="text-[#8898AA]">{fetchError || 'Demande introuvable'}</p>
                <button onClick={() => navigate('/employee/requests')} className="mt-3 text-[#1F4E79] hover:underline text-sm">
                    ← Retour à mes demandes
                </button>
            </div>
        );
    }

    // Parse le dataJson pour afficher les champs du formulaire
    let formEntries = [];
    try {
        const parsed = JSON.parse(request.dataJson ?? '{}');
        formEntries = Object.entries(parsed);
    } catch {
        formEntries = [];
    }

    const statutInfo = STATUT_LABELS[request.status] ?? { label: request.status, color: 'text-[#8898AA] bg-[#F4F6F8]' };

    return (
        <div className="max-w-3xl mx-auto space-y-5">

            {/* Header */}
            <div className="flex items-center gap-3">
                <button
                    onClick={() => navigate('/employee/requests')}
                    className="p-1.5 rounded-lg hover:bg-[#F4F6F8] text-[#8898AA] hover:text-[#172033] transition-colors">
                    <ArrowLeft className="w-5 h-5"/>
                </button>
                <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                        <h1 className="text-lg font-bold text-[#172033]">{request.processName}</h1>
                        <StatusBadge status={request.status}/>
                    </div>
                    <p className="text-xs text-[#8898AA] font-mono mt-0.5">{request.reference}</p>
                </div>
            </div>

            {/* Carte récapitulatif */}
            <div className="bg-white border border-[#D1D9E0] rounded-xl p-5">
                <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[#EBF2F9] text-[#1F4E79]">
                        <ProcessIcon icon={request.processIcon} name={request.processName}/>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[#172033]">{request.processName}</p>
                        <p className="text-xs text-[#8898AA] font-mono mt-0.5">{request.reference}</p>
                    </div>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${statutInfo.color}`}>
                        {statutInfo.label}
                    </span>
                </div>

                <div className="mt-4 pt-4 border-t border-[#F4F6F8] grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-[#8898AA]">
                    <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5"/>
                        Soumis le {request.createdAt
                            ? new Date(request.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
                            : '—'}
                    </span>
                    {request.dateFin && (
                        <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5"/>
                            Clôturé le {new Date(request.dateFin).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </span>
                    )}
                    {request.priority && (
                        <span className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5"/>
                            Priorité : {request.priority}
                        </span>
                    )}
                </div>
            </div>

            {/* Données du formulaire */}
            <div className="bg-white border border-[#D1D9E0] rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                    <FileText className="w-4 h-4 text-[#1F4E79]"/>
                    <h2 className="font-semibold text-[#172033] text-sm">Données du formulaire</h2>
                </div>

                {formEntries.length === 0 ? (
                    <p className="text-sm text-[#8898AA] text-center py-4">Aucune donnée de formulaire disponible.</p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {formEntries.map(([key, value]) => (
                            <div key={key} className="bg-[#F4F6F8] rounded-lg px-3 py-2.5">
                                <span className="block text-[10px] font-semibold text-[#8898AA] uppercase tracking-wide mb-1">
                                    {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                                </span>
                                <span className="text-sm text-[#172033] font-medium">
                                    {typeof value === 'boolean'
                                        ? (value ? 'Oui' : 'Non')
                                        : value === null || value === undefined || value === ''
                                            ? <span className="text-[#8898AA] italic">—</span>
                                            : String(value)}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
