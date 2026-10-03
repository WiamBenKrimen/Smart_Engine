import { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Copy, GripVertical, Save, ChevronDown, ChevronUp, Type, AlignLeft, Hash, DollarSign, Calendar, ChevronDownSquare, CheckSquare, Upload, Eye, Check } from 'lucide-react';
import { FORMS } from '../../../app/mockData';
function Toast({ msg, onClose }) {
    useEffect(() => { const t = setTimeout(onClose, 2500); return () => clearTimeout(t); }, [onClose]);
    return (<div className="fixed bottom-6 right-6 flex items-center gap-2 bg-[#16A34A] text-white px-4 py-3 rounded-xl shadow-lg text-sm font-medium z-50">
      <Check className="w-4 h-4"/> {msg}
    </div>);
}
const FIELD_TYPES = [
    { type: 'TEXT', label: 'Texte court', icon: Type },
    { type: 'TEXTAREA', label: 'Texte long', icon: AlignLeft },
    { type: 'NUMBER', label: 'Nombre', icon: Hash },
    { type: 'AMOUNT', label: 'Montant', icon: DollarSign },
    { type: 'DATE', label: 'Date', icon: Calendar },
    { type: 'SELECT', label: 'Liste déroulante', icon: ChevronDownSquare },
    { type: 'CHECKBOX', label: 'Case à cocher', icon: CheckSquare },
    { type: 'FILE', label: 'Fichier', icon: Upload },
];
function FieldPreview({ field }) {
    switch (field.type) {
        case 'TEXTAREA': return <textarea className="w-full border border-[#D1D9E0] rounded-lg px-3 py-2 text-sm resize-none h-20" placeholder={field.placeholder} disabled/>;
        case 'SELECT': return (<select className="w-full border border-[#D1D9E0] rounded-lg px-3 py-2 text-sm" disabled>
        <option>Sélectionner...</option>
        {field.options?.map(o => <option key={o}>{o}</option>)}
      </select>);
        case 'CHECKBOX': return (<label className="flex items-center gap-2 text-sm text-[#4A5568]">
        <input type="checkbox" disabled/> {field.label}
      </label>);
        case 'FILE': return (<div className="border-2 border-dashed border-[#D1D9E0] rounded-lg p-4 text-center text-sm text-[#8898AA]">
        <Upload className="w-5 h-5 mx-auto mb-1 opacity-50"/>
        Glissez-déposez un fichier ou cliquez
      </div>);
        default: return <input type={field.type === 'NUMBER' || field.type === 'AMOUNT' ? 'number' : field.type === 'DATE' ? 'date' : 'text'} className="w-full border border-[#D1D9E0] rounded-lg px-3 py-2 text-sm" placeholder={field.placeholder} disabled/>;
    }
}
export default function FormBuilderPage() {
    const [forms, setForms] = useState(FORMS.map(f => ({ ...f, fields: f.fields.map(ff => ({ ...ff })) })));
    const [activeForm, setActiveForm] = useState({ ...FORMS[0], fields: [...FORMS[0].fields] });
    const [selectedFieldId, setSelectedFieldId] = useState(null);
    const [preview, setPreview] = useState(false);
    const [toast, setToast] = useState('');
    const dragField = useRef(null);
    const selectedField = activeForm.fields.find(f => f.id === selectedFieldId);
    const addField = (type) => {
        const id = `ff_${Date.now()}`;
        const newField = {
            id,
            type,
            key: `champ_${activeForm.fields.length + 1}`,
            label: `Nouveau champ (${type.toLowerCase()})`,
            required: false,
            order: activeForm.fields.length + 1,
        };
        setActiveForm(prev => ({ ...prev, fields: [...prev.fields, newField] }));
        setSelectedFieldId(id);
    };
    const deleteField = (id) => {
        setActiveForm(prev => ({ ...prev, fields: prev.fields.filter(f => f.id !== id) }));
        if (selectedFieldId === id)
            setSelectedFieldId(null);
    };
    const duplicateField = (field) => {
        const newField = { ...field, id: `ff_${Date.now()}`, key: `${field.key}_copy` };
        const idx = activeForm.fields.findIndex(f => f.id === field.id);
        const newFields = [...activeForm.fields];
        newFields.splice(idx + 1, 0, newField);
        setActiveForm(prev => ({ ...prev, fields: newFields }));
    };
    const moveField = (id, dir) => {
        const idx = activeForm.fields.findIndex(f => f.id === id);
        const newFields = [...activeForm.fields];
        if (dir === 'up' && idx > 0)
            [newFields[idx - 1], newFields[idx]] = [newFields[idx], newFields[idx - 1]];
        if (dir === 'down' && idx < newFields.length - 1)
            [newFields[idx], newFields[idx + 1]] = [newFields[idx + 1], newFields[idx]];
        setActiveForm(prev => ({ ...prev, fields: newFields }));
    };
    const updateField = (id, patch) => {
        setActiveForm(prev => ({ ...prev, fields: prev.fields.map(f => f.id === id ? { ...f, ...patch } : f) }));
    };
    const Icon = (type) => {
        const t = FIELD_TYPES.find(ft => ft.type === type);
        const I = t?.icon;
        return I ? <I className="w-3.5 h-3.5"/> : null;
    };
    return (<div className="space-y-4 h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#172033]">Form Builder</h1>
          <p className="text-sm text-[#8898AA] mt-0.5">Construisez vos formulaires par glisser-déposer</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={activeForm.id} onChange={e => {
            const f = FORMS.find(f => f.id === e.target.value);
            if (f)
                setActiveForm({ ...f, fields: [...f.fields] });
            setSelectedFieldId(null);
        }} className="text-sm border border-[#D1D9E0] rounded-lg px-3 py-2 focus:outline-none focus:border-[#1F4E79]">
            {forms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
          <button onClick={() => setPreview(!preview)} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${preview ? 'bg-[#EBF2F9] border-[#1F4E79] text-[#1F4E79]' : 'border-[#D1D9E0] text-[#4A5568] hover:border-[#B0BEC9]'}`}>
            <Eye className="w-4 h-4"/> Aperçu
          </button>
          <button onClick={() => {
            setForms(prev => prev.map(f => f.id === activeForm.id ? { ...activeForm, updatedAt: new Date().toISOString() } : f));
            setToast('Formulaire sauvegardé !');
        }} className="flex items-center gap-2 bg-[#16A34A] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#15803D] transition-colors">
            <Save className="w-4 h-4"/> Sauvegarder
          </button>
        </div>
      </div>

      {preview ? (<div className="bg-white border border-[#D1D9E0] rounded-xl p-8 max-w-xl mx-auto">
          <h2 className="text-lg font-semibold text-[#172033] mb-1">{activeForm.name}</h2>
          <p className="text-sm text-[#8898AA] mb-6">Aperçu du formulaire tel qu'il sera affiché</p>
          <div className="space-y-5">
            {activeForm.fields.map(field => (<div key={field.id}>
                <label className="block text-sm font-medium text-[#172033] mb-1.5">
                  {field.label}
                  {field.required && <span className="text-[#DC2626] ml-1">*</span>}
                </label>
                <FieldPreview field={field}/>
                {field.helpText && <p className="text-xs text-[#8898AA] mt-1">{field.helpText}</p>}
              </div>))}
          </div>
        </div>) : (<div className="grid grid-cols-[220px_1fr_260px] gap-4" style={{ height: 'calc(100vh - 200px)' }}>
          {/* Palette */}
          <div className="bg-white border border-[#D1D9E0] rounded-xl overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-[#D1D9E0]">
              <p className="text-xs font-semibold text-[#8898AA] uppercase tracking-wide">Types de champs</p>
            </div>
            <div className="p-3 space-y-1 overflow-y-auto flex-1">
              {FIELD_TYPES.map(({ type, label, icon: Icon }) => (<button key={type} onClick={() => addField(type)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#172033] hover:bg-[#EBF2F9] hover:text-[#1F4E79] transition-colors text-left border border-transparent hover:border-[#1F4E79]/20">
                  <Icon className="w-4 h-4 text-[#8898AA]"/>
                  {label}
                </button>))}
            </div>
          </div>

          {/* Canvas */}
          <div className="bg-white border border-[#D1D9E0] rounded-xl overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-[#D1D9E0] flex items-center justify-between">
              <p className="text-xs font-semibold text-[#8898AA] uppercase tracking-wide">Canvas — {activeForm.fields.length} champ{activeForm.fields.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {activeForm.fields.length === 0 && (<div className="h-full flex items-center justify-center text-center text-[#8898AA] text-sm py-16">
                  <div>
                    <Plus className="w-8 h-8 mx-auto mb-2 opacity-30"/>
                    Cliquez sur un type de champ à gauche pour l'ajouter
                  </div>
                </div>)}
              {activeForm.fields.map((field, idx) => (<div key={field.id} onClick={() => setSelectedFieldId(field.id)} className={`group flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${selectedFieldId === field.id
                    ? 'border-[#1F4E79] bg-[#EBF2F9]'
                    : 'border-[#D1D9E0] hover:border-[#B0BEC9] bg-white'}`}>
                  <GripVertical className="w-4 h-4 text-[#D1D9E0] flex-shrink-0"/>
                  <div className={`w-7 h-7 rounded flex items-center justify-center flex-shrink-0 ${selectedFieldId === field.id ? 'bg-[#1F4E79] text-white' : 'bg-[#F4F6F8] text-[#8898AA]'}`}>
                    {Icon(field.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#172033] truncate">
                      {field.label}
                      {field.required && <span className="text-[#DC2626] ml-1">*</span>}
                    </p>
                    <p className="text-xs text-[#8898AA] truncate font-mono">{field.key}</p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={e => { e.stopPropagation(); moveField(field.id, 'up'); }} disabled={idx === 0} className="p-1 rounded hover:bg-white disabled:opacity-30">
                      <ChevronUp className="w-3.5 h-3.5 text-[#8898AA]"/>
                    </button>
                    <button onClick={e => { e.stopPropagation(); moveField(field.id, 'down'); }} disabled={idx === activeForm.fields.length - 1} className="p-1 rounded hover:bg-white disabled:opacity-30">
                      <ChevronDown className="w-3.5 h-3.5 text-[#8898AA]"/>
                    </button>
                    <button onClick={e => { e.stopPropagation(); duplicateField(field); }} className="p-1 rounded hover:bg-white">
                      <Copy className="w-3.5 h-3.5 text-[#8898AA]"/>
                    </button>
                    <button onClick={e => { e.stopPropagation(); deleteField(field.id); }} className="p-1 rounded hover:bg-[#FEE2E2]">
                      <Trash2 className="w-3.5 h-3.5 text-[#DC2626]"/>
                    </button>
                  </div>
                </div>))}
            </div>
          </div>

          {/* Properties panel */}
          <div className="bg-white border border-[#D1D9E0] rounded-xl overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-[#D1D9E0]">
              <p className="text-xs font-semibold text-[#8898AA] uppercase tracking-wide">Propriétés du champ</p>
            </div>
            {!selectedField ? (<div className="flex-1 flex items-center justify-center text-center text-sm text-[#8898AA] p-6">
                Sélectionnez un champ pour modifier ses propriétés
              </div>) : (<div className="flex-1 overflow-y-auto p-4 space-y-4">
                {[
                    { label: 'Libellé', key: 'label', type: 'text' },
                    { label: 'Clé technique', key: 'key', type: 'text' },
                    { label: 'Placeholder', key: 'placeholder', type: 'text' },
                    { label: 'Aide contextuelle', key: 'helpText', type: 'text' },
                ].map(({ label, key, type }) => (<div key={key}>
                    <label className="block text-xs font-semibold text-[#4A5568] uppercase tracking-wide mb-1">{label}</label>
                    <input type={type} value={selectedField[key] ?? ''} onChange={e => updateField(selectedField.id, { [key]: e.target.value })} className="w-full px-3 py-2 border border-[#D1D9E0] rounded-lg text-sm focus:outline-none focus:border-[#1F4E79]"/>
                  </div>))}

                <div className="flex items-center justify-between py-1">
                  <label className="text-xs font-semibold text-[#4A5568] uppercase tracking-wide">Obligatoire</label>
                  <button onClick={() => updateField(selectedField.id, { required: !selectedField.required })} className={`w-10 h-5 rounded-full transition-colors relative ${selectedField.required ? 'bg-[#1F4E79]' : 'bg-[#D1D9E0]'}`}>
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${selectedField.required ? 'left-5' : 'left-0.5'}`}/>
                  </button>
                </div>

                {selectedField.type === 'SELECT' && (<div>
                    <label className="block text-xs font-semibold text-[#4A5568] uppercase tracking-wide mb-1">Options (une par ligne)</label>
                    <textarea value={selectedField.options?.join('\n') ?? ''} onChange={e => updateField(selectedField.id, { options: e.target.value.split('\n').filter(Boolean) })} className="w-full px-3 py-2 border border-[#D1D9E0] rounded-lg text-sm focus:outline-none focus:border-[#1F4E79] h-24 resize-none"/>
                  </div>)}
              </div>)}
          </div>
        </div>)}
      {toast && <Toast msg={toast} onClose={() => setToast('')}/>}
    </div>);
}
