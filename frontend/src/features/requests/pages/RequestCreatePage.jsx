import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Upload, Send, CheckCircle, Loader2 } from 'lucide-react';
import { useProcesses } from '../../../app/providers/ProcessProvider';
import { useRequests } from '../../../app/providers/RequestProvider';
import { formApi } from '../../../api/formApi';
import ProcessIcon from '../../processes/components/ProcessIcon';

function DynamicField({ field, value, onChange }) {
    const base = "w-full px-3 py-2.5 border border-[#D1D9E0] rounded-lg text-sm focus:outline-none focus:border-[#1F4E79] focus:ring-2 focus:ring-[#1F4E79]/10 transition-colors";
    switch (field.type) {
        case 'TEXTAREA':
            return <textarea className={`${base} h-24 resize-none`} placeholder={field.placeholder} value={String(value ?? '')} onChange={e => onChange(e.target.value)}/>;
        case 'SELECT':
            return (
                <select className={base} value={String(value ?? '')} onChange={e => onChange(e.target.value)}>
                    <option value="">Sélectionner…</option>
                    {field.options?.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
            );
        case 'CHECKBOX':
            return (
                <label className="flex items-center gap-2 text-sm text-[#172033] cursor-pointer">
                    <input type="checkbox" checked={Boolean(value)} onChange={e => onChange(e.target.checked)} className="accent-[#1F4E79]"/>
                    {field.label}
                </label>
            );
        case 'FILE':
            return (
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-[#D1D9E0] rounded-lg p-6 cursor-pointer hover:border-[#1F4E79] hover:bg-[#EBF2F9]/20 transition-colors">
                    <Upload className="w-6 h-6 text-[#8898AA] mb-2"/>
                    <span className="text-sm text-[#4A5568]">Glissez-déposez ou</span>
                    <span className="text-sm text-[#1F4E79] font-medium">parcourir les fichiers</span>
                    <input type="file" className="hidden" onChange={e => onChange(e.target.files?.[0]?.name ?? '')}/>
                    {value ? <span className="mt-2 text-xs text-[#16A34A]">✓ {String(value)}</span> : null}
                </label>
            );
        case 'NUMBER':
        case 'AMOUNT':
            return <input type="number" className={base} placeholder={field.placeholder ?? '0'} value={String(value ?? '')} onChange={e => onChange(e.target.value)}/>;
        case 'DATE':
            return <input type="date" className={base} value={String(value ?? '')} onChange={e => onChange(e.target.value)}/>;
        default:
            return <input type="text" className={base} placeholder={field.placeholder} value={String(value ?? '')} onChange={e => onChange(e.target.value)}/>;
    }
}

export default function NewRequest() {
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const { processes } = useProcesses();
    const { submitRequest } = useRequests();

    const [selectedProcessId, setSelectedProcessId] = useState(params.get('process') ?? '');
    const [formFields, setFormFields]   = useState([]);
    const [formName, setFormName]       = useState('');
    const [formLoading, setFormLoading] = useState(false);
    const [formData, setFormData]       = useState({});
    const [submitting, setSubmitting]   = useState(false);
    const [submitted, setSubmitted]     = useState(false);
    const [submittedRef, setSubmittedRef] = useState('');
    const [submitError, setSubmitError]   = useState('');

    const published = processes.filter(p => p.status === 'PUBLISHED');
    const selectedProcess = processes.find(p => p.id === selectedProcessId);

    // Chargement dynamique des champs du formulaire depuis l'API
    useEffect(() => {
        if (!selectedProcess?.formId) {
            setFormFields([]);
            setFormName('');
            return;
        }
        setFormLoading(true);
        formApi.getById(selectedProcess.formId)
            .then(form => {
                setFormName(form.nom ?? form.name ?? '');
                // Les champs peuvent être dans form.champs ou form.fields selon l'API
                const rawFields = form.champs ?? form.fields ?? [];
                setFormFields(rawFields.map(f => ({
                    id:          f.id,
                    key:         f.cleChamp ?? f.key,
                    type:        f.typeChamp ?? f.type,
                    label:       f.label,
                    required:    f.requis ?? f.required ?? false,
                    placeholder: f.placeholder ?? '',
                    helpText:    f.helpText ?? '',
                    options:     f.options ?? [],
                })));
                setFormData({});
            })
            .catch(err => {
                console.warn('Impossible de charger le formulaire :', err);
                setFormFields([]);
            })
            .finally(() => setFormLoading(false));
    }, [selectedProcess?.formId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setSubmitError('');
        try {
            const ref = await submitRequest(selectedProcessId, formData);
            setSubmittedRef(ref || `DEM-${new Date().getFullYear()}-????`);
            setSubmitted(true);
        } catch {
            setSubmitError('Une erreur est survenue. Veuillez réessayer.');
        } finally {
            setSubmitting(false);
        }
    };

    // ── Écran succès ───────────────────────────────────────────────────────
    if (submitted) {
        return (
            <div className="max-w-lg mx-auto text-center py-16">
                <div className="w-16 h-16 bg-[#DCFCE7] rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-[#16A34A]"/>
                </div>
                <h2 className="text-xl font-bold text-[#172033] mb-2">Demande soumise !</h2>
                <p className="text-[#4A5568] text-sm mb-2">Votre demande a été envoyée et est en cours de traitement.</p>
                <p className="text-xs text-[#8898AA] font-mono bg-[#F4F6F8] px-3 py-1.5 rounded-lg inline-block mb-6">{submittedRef}</p>
                <div className="flex flex-col gap-3">
                    <button onClick={() => navigate('/employee/requests')} className="flex items-center justify-center gap-2 bg-[#1F4E79] text-white px-6 py-2.5 rounded-lg font-medium text-sm hover:bg-[#172033] transition-colors">
                        Suivre mes demandes <ArrowRight className="w-4 h-4"/>
                    </button>
                    <button onClick={() => { setSubmitted(false); setFormData({}); setSelectedProcessId(''); }} className="text-sm text-[#4A5568] hover:text-[#172033]">
                        Nouvelle demande
                    </button>
                </div>
            </div>
        );
    }

    // ── Formulaire principal ───────────────────────────────────────────────
    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-3">
                <button onClick={() => navigate('/employee')} className="p-1.5 rounded-lg hover:bg-[#F4F6F8] text-[#8898AA] hover:text-[#172033] transition-colors">
                    <ArrowLeft className="w-5 h-5"/>
                </button>
                <div>
                    <h1 className="text-xl font-bold text-[#172033]">Nouvelle demande</h1>
                    <p className="text-sm text-[#8898AA]">Sélectionnez un processus et remplissez le formulaire</p>
                </div>
            </div>

            {/* Sélection du processus */}
            {!selectedProcessId ? (
                <div>
                    <h2 className="text-sm font-semibold text-[#4A5568] uppercase tracking-wide mb-4">Choisissez un processus</h2>
                    {published.length === 0 && (
                        <p className="text-sm text-[#8898AA] text-center py-8">Aucun processus publié disponible.</p>
                    )}
                    <div className="grid md:grid-cols-2 gap-3">
                        {published.map(p => (
                            <button key={p.id} onClick={() => setSelectedProcessId(p.id)} className="bg-white border border-[#D1D9E0] hover:border-[#1F4E79]/50 hover:shadow-md rounded-xl p-5 text-left transition-all group">
                                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#EBF2F9] text-[#1F4E79]">
                                    <ProcessIcon icon={p.icon} name={p.name}/>
                                </div>
                                <h3 className="font-semibold text-[#172033] text-sm group-hover:text-[#1F4E79] transition-colors">{p.name}</h3>
                                <p className="text-xs text-[#8898AA] mt-1 leading-relaxed">{p.description}</p>
                                <div className="mt-3 flex items-center text-xs text-[#1F4E79] font-medium gap-1">
                                    Choisir ce processus <ArrowRight className="w-3 h-3"/>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
                <div>
                    {/* Bandeau processus sélectionné */}
                    <div className="flex items-center gap-3 mb-6 bg-white border border-[#D1D9E0] rounded-xl px-4 py-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EBF2F9] text-[#1F4E79]">
                            <ProcessIcon icon={selectedProcess?.icon} name={selectedProcess?.name}/>
                        </span>
                        <div className="flex-1">
                            <p className="font-semibold text-[#172033] text-sm">{selectedProcess?.name}</p>
                            <p className="text-xs text-[#8898AA]">{selectedProcess?.description}</p>
                        </div>
                        <button onClick={() => { setSelectedProcessId(''); setFormData({}); }} className="text-xs text-[#8898AA] hover:text-[#172033] underline">Changer</button>
                    </div>

                    {/* Formulaire dynamique */}
                    {formLoading ? (
                        <div className="flex items-center justify-center py-16 gap-2 text-[#8898AA]">
                            <Loader2 className="w-5 h-5 animate-spin"/> Chargement du formulaire…
                        </div>
                    ) : formFields.length === 0 ? (
                        <div className="py-10 text-center text-sm text-[#8898AA]">
                            Aucun champ de formulaire trouvé pour ce processus.
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="bg-white border border-[#D1D9E0] rounded-xl p-6 space-y-5">
                            <h2 className="font-semibold text-[#172033]">{formName}</h2>

                            {formFields.map(field => (
                                <div key={field.id}>
                                    {field.type !== 'CHECKBOX' && (
                                        <label className="block text-sm font-medium text-[#172033] mb-1.5">
                                            {field.label}
                                            {field.required && <span className="text-[#DC2626] ml-1">*</span>}
                                        </label>
                                    )}
                                    <DynamicField
                                        field={field}
                                        value={formData[field.key]}
                                        onChange={v => setFormData(prev => ({ ...prev, [field.key]: v }))}
                                    />
                                    {field.helpText && <p className="text-xs text-[#8898AA] mt-1">{field.helpText}</p>}
                                </div>
                            ))}

                            {submitError && (
                                <p className="text-sm text-[#DC2626] bg-[#FEF2F2] rounded-lg px-3 py-2">{submitError}</p>
                            )}

                            <div className="pt-2">
                                <button type="submit" disabled={submitting} className="w-full flex items-center justify-center gap-2 bg-[#1F4E79] hover:bg-[#172033] disabled:opacity-60 text-white py-3 rounded-lg font-semibold transition-colors">
                                    {submitting
                                        ? <><Loader2 className="w-4 h-4 animate-spin"/> Envoi en cours…</>
                                        : <><Send className="w-4 h-4"/> Soumettre la demande</>
                                    }
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            )}
        </div>
    );
}
