import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Check, X, ChevronRight, ArrowLeft, Eye, FileText, Building2, Users, Save, AlertTriangle, Info, CheckCircle, ZoomIn, ZoomOut, Undo2, Redo2, Copy, GripVertical, Type, Hash, DollarSign, Calendar, List, Paperclip, CheckSquare, AlignLeft, ChevronDown, Settings, GitBranch } from 'lucide-react';
import { WORKSPACES, FORMS, USERS, WORKFLOWS } from '../../../app/mockData';
import { useProcesses } from '../../../app/providers/ProcessProvider';
import ProcessIcon from '../components/ProcessIcon';
// ─── CANVAS CONSTANTS ─────────────────────────────────────────────────────────
const NW = 160, NH = 56;
const CDW = 176, CDH = 112;
const NODE_COLORS = {
    START: { bg: '#DCFCE7', border: '#16A34A', text: '#14532D' },
    APPROVAL: { bg: '#EBF2F9', border: '#1F4E79', text: '#172033' },
    CONDITION: { bg: '#FFEDD5', border: '#EA580C', text: '#7C2D12' },
    END: { bg: '#FEE2E2', border: '#DC2626', text: '#7F1D1D' },
};
// ─── FIELD TYPE CONFIG ────────────────────────────────────────────────────────
const FIELD_TYPES = [
    { type: 'TEXT', label: 'Texte court', color: '#1F4E79', bg: '#EBF2F9' },
    { type: 'TEXTAREA', label: 'Texte long', color: '#7C3AED', bg: '#F3E8FF' },
    { type: 'NUMBER', label: 'Nombre', color: '#0EA5E9', bg: '#E0F2FE' },
    { type: 'AMOUNT', label: 'Montant', color: '#16A34A', bg: '#DCFCE7' },
    { type: 'DATE', label: 'Date', color: '#EA580C', bg: '#FFEDD5' },
    { type: 'SELECT', label: 'Liste', color: '#8B5CF6', bg: '#EDE9FE' },
    { type: 'CHECKBOX', label: 'Checkbox', color: '#6B7280', bg: '#F3F4F6' },
    { type: 'FILE', label: 'Fichier', color: '#DC2626', bg: '#FEE2E2' },
];
// ─── HELPERS ──────────────────────────────────────────────────────────────────
function uid() { return Math.random().toString(36).slice(2, 10); }
function toKey(s) {
    return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'champ';
}
function getInputPort(n) {
    if (n.type === 'START')
        return null;
    if (n.type === 'CONDITION')
        return { x: n.x + CDW / 2, y: n.y };
    return { x: n.x + NW / 2, y: n.y };
}
function getOutputPorts(n) {
    if (n.type === 'END')
        return [];
    if (n.type === 'START')
        return [{ x: n.x + NW / 2, y: n.y + NH, label: 'NEXT', dir: 'bottom' }];
    if (n.type === 'APPROVAL')
        return [
            { x: n.x + NW * 0.3, y: n.y + NH, label: 'APPROVED', dir: 'bottom' },
            { x: n.x + NW * 0.7, y: n.y + NH, label: 'REJECTED', dir: 'bottom' },
        ];
    if (n.type === 'CONDITION')
        return [
            { x: n.x + CDW, y: n.y + CDH / 2, label: 'TRUE', dir: 'right' },
            { x: n.x + CDW / 2, y: n.y + CDH, label: 'FALSE', dir: 'bottom' },
        ];
    return [];
}
function isInNode(n, p) {
    if (n.type === 'CONDITION') {
        const cx = n.x + CDW / 2, cy = n.y + CDH / 2;
        return Math.abs(p.x - cx) / (CDW / 2) + Math.abs(p.y - cy) / (CDH / 2) <= 1;
    }
    return p.x >= n.x && p.x <= n.x + NW && p.y >= n.y && p.y <= n.y + NH;
}
function makePath(x1, y1, x2, y2, dir = 'bottom') {
    const d = Math.hypot(x2 - x1, y2 - y1);
    const t = Math.max(d * 0.42, 48);
    if (dir === 'right')
        return `M${x1},${y1} C${x1 + t},${y1} ${x2},${y2 - t} ${x2},${y2}`;
    return `M${x1},${y1} C${x1},${y1 + t} ${x2},${y2 - t} ${x2},${y2}`;
}
function hasCycle(edges, from, to) {
    const adj = {};
    edges.forEach(e => { adj[e.from] = [...(adj[e.from] || []), e.to]; });
    const visited = new Set();
    const stack = [to];
    while (stack.length) {
        const cur = stack.pop();
        if (cur === from)
            return true;
        if (visited.has(cur))
            continue;
        visited.add(cur);
        (adj[cur] || []).forEach(n => stack.push(n));
    }
    return false;
}
function validateConn(nodes, edges, fromId, label, toId) {
    if (fromId === toId)
        return { ok: false, reason: 'Impossible de connecter un nœud à lui-même' };
    const target = nodes.find(n => n.id === toId);
    const source = nodes.find(n => n.id === fromId);
    if (!target || !source)
        return { ok: false, reason: 'Nœud introuvable' };
    if (target.type === 'START')
        return { ok: false, reason: 'START ne peut pas avoir d\'entrée' };
    if (source.type === 'END')
        return { ok: false, reason: 'END ne peut pas avoir de sortie' };
    if (edges.some(e => e.from === fromId && e.label === label))
        return { ok: false, reason: `Port ${label} déjà utilisé` };
    if (edges.some(e => e.from === fromId && e.to === toId))
        return { ok: false, reason: 'Connexion déjà existante' };
    if (hasCycle(edges, fromId, toId))
        return { ok: false, reason: 'Crée un cycle' };
    return { ok: true, reason: '' };
}
function nodeStatus(n, edges) {
    const outgoing = edges.filter(e => e.from === n.id);
    const incoming = edges.filter(e => e.to === n.id);
    if (n.type === 'START')
        return outgoing.length === 0 ? 'unconnected' : 'complete';
    if (n.type === 'END')
        return incoming.length === 0 ? 'unconnected' : 'complete';
    if (n.type === 'APPROVAL') {
        if (!n.workspaceId)
            return 'incomplete';
        const hasApproved = outgoing.some(e => e.label === 'APPROVED');
        const hasRejected = outgoing.some(e => e.label === 'REJECTED');
        if (!hasApproved || !hasRejected)
            return 'unconnected';
        return 'complete';
    }
    if (n.type === 'CONDITION') {
        if (!n.conditionField || !n.conditionValue)
            return 'incomplete';
        const hasTrue = outgoing.some(e => e.label === 'TRUE');
        const hasFalse = outgoing.some(e => e.label === 'FALSE');
        if (!hasTrue || !hasFalse)
            return 'unconnected';
        return 'complete';
    }
    return 'complete';
}
function computeChecks(draft) {
    const { formFields, wfNodes, wfEdges } = draft;
    const checks = [];
    checks.push({ id: 'fields', label: 'Formulaire contient au moins un champ', ok: formFields.length > 0, error: formFields.length === 0 ? 'Ajoutez au moins un champ au formulaire' : undefined, goTo: 3 });
    const startNodes = wfNodes.filter(n => n.type === 'START');
    checks.push({ id: 'start', label: 'Nœud de départ (START) présent', ok: startNodes.length === 1, error: startNodes.length === 0 ? 'Aucun nœud START' : startNodes.length > 1 ? 'Un seul START autorisé' : undefined, goTo: 4 });
    const endNodes = wfNodes.filter(n => n.type === 'END');
    checks.push({ id: 'end', label: 'Au moins un nœud de fin (END) présent', ok: endNodes.length > 0, error: endNodes.length === 0 ? 'Aucun nœud END' : undefined, goTo: 4 });
    const isolated = wfNodes.filter(n => wfEdges.every(e => e.from !== n.id) && wfEdges.every(e => e.to !== n.id));
    checks.push({ id: 'isolated', label: 'Aucune étape isolée', ok: isolated.length === 0, error: isolated.length > 0 ? `${isolated.map(n => n.label).join(', ')} sans connexion` : undefined, goTo: 4 });
    const noWs = wfNodes.filter(n => n.type === 'APPROVAL' && !n.workspaceId);
    checks.push({ id: 'ws', label: 'Chaque approbation a un Workspace', ok: noWs.length === 0, error: noWs.length > 0 ? `${noWs.map(n => n.label).join(', ')} sans workspace` : undefined, goTo: 4 });
    const missingApprBranches = wfNodes.filter(n => n.type === 'APPROVAL' && (!wfEdges.some(e => e.from === n.id && e.label === 'APPROVED') || !wfEdges.some(e => e.from === n.id && e.label === 'REJECTED')));
    checks.push({ id: 'appr-branches', label: 'Branches APPROUVÉ et REFUSÉ reliées', ok: missingApprBranches.length === 0, error: missingApprBranches.length > 0 ? `${missingApprBranches.map(n => n.label).join(', ')} incomplet` : undefined, goTo: 4 });
    const missingCondBranches = wfNodes.filter(n => n.type === 'CONDITION' && (!wfEdges.some(e => e.from === n.id && e.label === 'TRUE') || !wfEdges.some(e => e.from === n.id && e.label === 'FALSE')));
    checks.push({ id: 'cond-branches', label: 'Branches VRAI et FAUX des conditions reliées', ok: missingCondBranches.length === 0, error: missingCondBranches.length > 0 ? `${missingCondBranches.map(n => n.label).join(', ')} incomplet` : undefined, goTo: 4 });
    const fieldKeys = formFields.map(f => f.key);
    const badCond = wfNodes.filter(n => n.type === 'CONDITION' && n.conditionField && !fieldKeys.includes(n.conditionField));
    checks.push({ id: 'cond-field', label: 'Conditions référencent des champs du formulaire', ok: badCond.length === 0, error: badCond.length > 0 ? `${badCond.map(n => n.label).join(', ')} référence un champ introuvable` : undefined, goTo: 3 });
    return checks;
}
// ─── DEMO DATA ────────────────────────────────────────────────────────────────
const DEMO_DRAFT = {
    name: 'Demande de remboursement',
    description: 'Soumettez vos notes de frais pour remboursement par le service Finance.',
    icon: '💸',
    formMode: 'new', formRefId: null,
    formFields: [
        { id: 'ff1', type: 'AMOUNT', key: 'montant', label: 'Montant', required: true, placeholder: 'ex: 1 500,00', helpText: 'Montant total TTC du remboursement', options: [], order: 0 },
        { id: 'ff2', type: 'DATE', key: 'date_depense', label: 'Date de la dépense', required: true, placeholder: '', helpText: '', options: [], order: 1 },
        { id: 'ff3', type: 'TEXTAREA', key: 'justification', label: 'Justification', required: true, placeholder: 'Décrivez la nature et l\'objet de la dépense…', helpText: '', options: [], order: 2 },
        { id: 'ff4', type: 'FILE', key: 'piece_jointe', label: 'Pièce jointe', required: false, placeholder: '', helpText: 'Joignez un justificatif (reçu, facture, ticket)', options: [], order: 3 },
    ],
    wfMode: 'new', wfRefId: null,
    wfNodes: [
        { id: 'n1', type: 'START', label: 'Début', x: 185, y: 20 },
        { id: 'n2', type: 'APPROVAL', label: 'Validation Manager', x: 95, y: 140, workspaceId: 'ws1' },
        { id: 'n3', type: 'CONDITION', label: 'Montant > 5 000 ?', x: 250, y: 280, conditionField: 'montant', conditionOperator: '>', conditionValue: '5000' },
        { id: 'n4', type: 'APPROVAL', label: 'Validation Finance', x: 380, y: 440, workspaceId: 'ws1' },
        { id: 'n5', type: 'END', label: 'Terminée', x: 355, y: 580, endResult: 'TERMINÉE' },
        { id: 'n6', type: 'END', label: 'Refusée', x: 20, y: 580, endResult: 'REFUSÉE' },
    ],
    wfEdges: [
        { id: 'e1', from: 'n1', to: 'n2', label: 'NEXT' },
        { id: 'e2', from: 'n2', to: 'n3', label: 'APPROVED' },
        { id: 'e3', from: 'n2', to: 'n6', label: 'REJECTED' },
        { id: 'e4', from: 'n3', to: 'n4', label: 'TRUE' },
        { id: 'e5', from: 'n3', to: 'n5', label: 'FALSE' },
        { id: 'e6', from: 'n4', to: 'n5', label: 'APPROVED' },
        { id: 'e7', from: 'n4', to: 'n6', label: 'REJECTED' },
    ],
};
// ─── FIELD TYPE ICON ─────────────────────────────────────────────────────────
function FieldTypeIcon({ type, size = 14 }) {
    const s = size;
    if (type === 'TEXT')
        return <Type size={s}/>;
    if (type === 'TEXTAREA')
        return <AlignLeft size={s}/>;
    if (type === 'NUMBER')
        return <Hash size={s}/>;
    if (type === 'AMOUNT')
        return <DollarSign size={s}/>;
    if (type === 'DATE')
        return <Calendar size={s}/>;
    if (type === 'SELECT')
        return <List size={s}/>;
    if (type === 'CHECKBOX')
        return <CheckSquare size={s}/>;
    if (type === 'FILE')
        return <Paperclip size={s}/>;
    return null;
}
// ─── FORM PREVIEW MODAL ───────────────────────────────────────────────────────
function FormPreviewModal({ fields, onClose }) {
    return (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-[#D1D9E0]">
          <div>
            <h3 className="text-sm font-semibold text-[#172033]">Aperçu du formulaire</h3>
            <p className="text-xs text-[#8898AA] mt-0.5">Vue utilisateur</p>
          </div>
          <button onClick={onClose} className="text-[#8898AA] hover:text-[#172033]"><X size={16}/></button>
        </div>
        <div className="p-6 space-y-5">
          {fields.length === 0 && <p className="text-sm text-[#8898AA] text-center py-8">Aucun champ défini</p>}
          {fields.map(f => (<div key={f.id}>
              <label className="block text-sm font-medium text-[#172033] mb-1.5">
                {f.label} {f.required && <span className="text-[#DC2626]">*</span>}
              </label>
              {f.helpText && <p className="text-xs text-[#8898AA] mb-1.5">{f.helpText}</p>}
              {f.type === 'TEXT' && <input className="w-full px-3 py-2 text-sm border border-[#D1D9E0] rounded-lg bg-[#F4F6F8] text-[#8898AA]" placeholder={f.placeholder || f.label} disabled/>}
              {f.type === 'TEXTAREA' && <textarea className="w-full px-3 py-2 text-sm border border-[#D1D9E0] rounded-lg bg-[#F4F6F8] text-[#8898AA] resize-none h-20" placeholder={f.placeholder || f.label} disabled/>}
              {f.type === 'NUMBER' && <input type="number" className="w-full px-3 py-2 text-sm border border-[#D1D9E0] rounded-lg bg-[#F4F6F8] text-[#8898AA]" placeholder={f.placeholder || '0'} disabled/>}
              {f.type === 'AMOUNT' && (<div className="flex">
                  <span className="flex items-center px-3 py-2 text-sm bg-[#EAEEF2] border border-r-0 border-[#D1D9E0] rounded-l-lg text-[#8898AA]">MAD</span>
                  <input className="flex-1 px-3 py-2 text-sm border border-[#D1D9E0] rounded-r-lg bg-[#F4F6F8] text-[#8898AA]" placeholder={f.placeholder || '0.00'} disabled/>
                </div>)}
              {f.type === 'DATE' && <input type="date" className="w-full px-3 py-2 text-sm border border-[#D1D9E0] rounded-lg bg-[#F4F6F8] text-[#8898AA]" disabled/>}
              {f.type === 'SELECT' && (<div className="relative">
                  <select className="w-full px-3 py-2 text-sm border border-[#D1D9E0] rounded-lg bg-[#F4F6F8] text-[#8898AA] appearance-none" disabled>
                    <option>Sélectionner…</option>
                    {(f.options || []).map(o => <option key={o}>{o}</option>)}
                  </select>
                  <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8898AA]"/>
                </div>)}
              {f.type === 'CHECKBOX' && (<label className="flex items-center gap-2 cursor-not-allowed">
                  <input type="checkbox" className="w-4 h-4" disabled/>
                  <span className="text-sm text-[#4A5568]">{f.placeholder || f.label}</span>
                </label>)}
              {f.type === 'FILE' && (<div className="border-2 border-dashed border-[#D1D9E0] rounded-lg p-4 text-center bg-[#F4F6F8]">
                  <Paperclip size={20} className="mx-auto text-[#8898AA] mb-1"/>
                  <p className="text-xs text-[#8898AA]">Cliquer pour joindre un fichier</p>
                </div>)}
            </div>))}
        </div>
      </div>
    </div>);
}
// ─── FIELD PROPS PANEL ────────────────────────────────────────────────────────
function FieldPropsPanel({ field, onChange, onDelete }) {
    const [newOption, setNewOption] = useState('');
    return (<div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#D1D9E0]">
        <div className="flex items-center gap-2">
          <span className="text-[#1F4E79]"><FieldTypeIcon type={field.type}/></span>
          <span className="text-xs font-semibold text-[#172033]">{FIELD_TYPES.find(t => t.type === field.type)?.label}</span>
        </div>
        <button onClick={onDelete} className="p-1 text-[#8898AA] hover:text-[#DC2626] rounded" title="Supprimer"><Trash2 size={13}/></button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
          <label className="block text-xs font-medium text-[#4A5568] mb-1">Libellé <span className="text-[#DC2626]">*</span></label>
          <input className="w-full px-3 py-2 text-sm border border-[#D1D9E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F4E79]/30" value={field.label} onChange={e => {
            const newLabel = e.target.value;
            const autoKey = toKey(newLabel);
            onChange({ ...field, label: newLabel, key: autoKey });
        }}/>
        </div>
        <div>
          <label className="block text-xs font-medium text-[#4A5568] mb-1">Clé technique</label>
          <input className="w-full px-3 py-2 text-sm border border-[#D1D9E0] rounded-lg font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#1F4E79]/30" value={field.key} onChange={e => onChange({ ...field, key: e.target.value })}/>
        </div>
        <div>
          <label className="block text-xs font-medium text-[#4A5568] mb-1">Placeholder</label>
          <input className="w-full px-3 py-2 text-sm border border-[#D1D9E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F4E79]/30" value={field.placeholder || ''} onChange={e => onChange({ ...field, placeholder: e.target.value })}/>
        </div>
        <div>
          <label className="block text-xs font-medium text-[#4A5568] mb-1">Texte d'aide</label>
          <input className="w-full px-3 py-2 text-sm border border-[#D1D9E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F4E79]/30" value={field.helpText || ''} onChange={e => onChange({ ...field, helpText: e.target.value })}/>
        </div>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <div className={`w-9 h-5 rounded-full transition-colors flex items-center px-0.5 ${field.required ? 'bg-[#1F4E79]' : 'bg-[#D1D9E0]'}`} onClick={() => onChange({ ...field, required: !field.required })}>
            <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${field.required ? 'translate-x-4' : 'translate-x-0'}`}/>
          </div>
          <span className="text-xs text-[#4A5568]">Obligatoire</span>
        </label>
        {field.type === 'SELECT' && (<div>
            <label className="block text-xs font-medium text-[#4A5568] mb-2">Options</label>
            <div className="space-y-1 mb-2">
              {(field.options || []).map((o, i) => (<div key={i} className="flex items-center gap-1">
                  <span className="flex-1 px-2 py-1 text-xs border border-[#D1D9E0] rounded bg-[#F4F6F8]">{o}</span>
                  <button onClick={() => onChange({ ...field, options: field.options?.filter((_, j) => j !== i) })} className="p-1 text-[#8898AA] hover:text-[#DC2626]"><X size={11}/></button>
                </div>))}
            </div>
            <div className="flex gap-1">
              <input className="flex-1 px-2 py-1 text-xs border border-[#D1D9E0] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1F4E79]/30" placeholder="Ajouter une option" value={newOption} onChange={e => setNewOption(e.target.value)} onKeyDown={e => {
                if (e.key === 'Enter' && newOption.trim()) {
                    onChange({ ...field, options: [...(field.options || []), newOption.trim()] });
                    setNewOption('');
                }
            }}/>
              <button onClick={() => { if (newOption.trim()) {
            onChange({ ...field, options: [...(field.options || []), newOption.trim()] });
            setNewOption('');
        } }} className="px-2 py-1 bg-[#1F4E79] text-white rounded-lg text-xs hover:bg-[#172033]"><Plus size={11}/></button>
            </div>
          </div>)}
      </div>
    </div>);
}
// ─── WF NODE SVG ELEMENT ──────────────────────────────────────────────────────
function WfNodeEl({ node, edges, selected, zoom, onMouseDown, onPortMouseDown, onPortMouseEnter, onPortMouseLeave, dragState, workspaces, }) {
    const status = nodeStatus(node, edges);
    const colors = NODE_COLORS[node.type];
    const ports = getOutputPorts(node);
    const inPort = getInputPort(node);
    const isHoverTarget = dragState?.hoverTargetId === node.id;
    const PORT_R = 6 / zoom;
    const ws = workspaces.find(w => w.id === node.workspaceId);
    const statusColor = status === 'complete' ? '#16A34A' : status === 'incomplete' ? '#EA580C' : '#DC2626';
    if (node.type === 'CONDITION') {
        const cx = node.x + CDW / 2, cy = node.y + CDH / 2;
        const pts = `${node.x + CDW / 2},${node.y} ${node.x + CDW},${cy} ${cx},${node.y + CDH} ${node.x},${cy}`;
        return (<g onMouseEnter={() => onPortMouseEnter(node.id)} onMouseLeave={onPortMouseLeave}>
        <polygon points={pts} fill={isHoverTarget ? '#FED7AA' : colors.bg} stroke={selected ? '#1F4E79' : isHoverTarget ? '#F97316' : colors.border} strokeWidth={selected ? 2.5 / zoom : 1.5 / zoom} style={{ cursor: 'move', filter: selected ? `drop-shadow(0 0 ${4 / zoom}px #1F4E79aa)` : undefined }} onMouseDown={onMouseDown}/>
        <text x={cx} y={cy - 6} textAnchor="middle" dominantBaseline="middle" fontSize={11 / zoom} fontWeight="600" fill={colors.text} style={{ pointerEvents: 'none', userSelect: 'none' }}>{node.label}</text>
        {node.conditionField && <text x={cx} y={cy + 8} textAnchor="middle" fontSize={9 / zoom} fill={colors.text} style={{ pointerEvents: 'none', opacity: 0.7 }}>{node.conditionOperator} {node.conditionValue}</text>}
        <circle cx={cx} cy={node.y} r={PORT_R} fill="white" stroke="#1F4E79" strokeWidth={1.2 / zoom} style={{ cursor: 'default' }}/>
        {ports.map(p => (<g key={p.label}>
            <circle cx={p.x} cy={p.y} r={PORT_R + 2 / zoom} fill="transparent" onMouseDown={e => onPortMouseDown(e, p)} style={{ cursor: 'crosshair' }}/>
            <circle cx={p.x} cy={p.y} r={PORT_R} fill={p.label === 'TRUE' ? '#16A34A' : '#DC2626'} stroke="white" strokeWidth={1.2 / zoom} style={{ pointerEvents: 'none' }}/>
            <text x={p.label === 'TRUE' ? p.x + PORT_R + 3 / zoom : p.x} y={p.label === 'TRUE' ? p.y : p.y + PORT_R + 8 / zoom} fontSize={8 / zoom} fill={p.label === 'TRUE' ? '#16A34A' : '#DC2626'} fontWeight="700" textAnchor={p.label === 'TRUE' ? 'start' : 'middle'} style={{ pointerEvents: 'none' }}>{p.label}</text>
          </g>))}
        <circle cx={node.x + CDW - 5 / zoom} cy={node.y + 5 / zoom} r={4 / zoom} fill={statusColor} stroke="white" strokeWidth={1 / zoom} style={{ pointerEvents: 'none' }}/>
      </g>);
    }
    return (<g onMouseEnter={() => onPortMouseEnter(node.id)} onMouseLeave={onPortMouseLeave}>
      <rect x={node.x} y={node.y} width={NW} height={NH} rx={node.type === 'START' ? NH / 2 : 8 / zoom} ry={node.type === 'START' ? NH / 2 : 8 / zoom} fill={isHoverTarget ? '#DBEAFE' : colors.bg} stroke={selected ? '#1F4E79' : isHoverTarget ? '#2563EB' : colors.border} strokeWidth={selected ? 2.5 / zoom : 1.5 / zoom} style={{ cursor: 'move', filter: selected ? `drop-shadow(0 0 ${4 / zoom}px #1F4E79aa)` : undefined }} onMouseDown={onMouseDown}/>
      <text x={node.x + NW / 2} y={node.y + NH / 2 - (ws ? 7 / zoom : 0)} textAnchor="middle" dominantBaseline="middle" fontSize={11 / zoom} fontWeight="600" fill={colors.text} style={{ pointerEvents: 'none', userSelect: 'none' }}>{node.label}</text>
      {ws && <text x={node.x + NW / 2} y={node.y + NH / 2 + 9 / zoom} textAnchor="middle" fontSize={8.5 / zoom} fill={colors.text} opacity={0.65} style={{ pointerEvents: 'none' }}>{ws.name}</text>}
      {node.type === 'END' && node.endResult && (<text x={node.x + NW / 2} y={node.y + NH / 2 + 9 / zoom} textAnchor="middle" fontSize={8.5 / zoom} fill={colors.text} opacity={0.65} style={{ pointerEvents: 'none' }}>{node.endResult}</text>)}
      {inPort && <circle cx={inPort.x} cy={inPort.y} r={PORT_R} fill="white" stroke="#1F4E79" strokeWidth={1.2 / zoom} style={{ cursor: 'default', pointerEvents: 'none' }}/>}
      {ports.map(p => (<g key={p.label}>
          <circle cx={p.x} cy={p.y} r={PORT_R + 2 / zoom} fill="transparent" onMouseDown={e => onPortMouseDown(e, p)} style={{ cursor: 'crosshair' }}/>
          <circle cx={p.x} cy={p.y} r={PORT_R} fill={p.label === 'APPROVED' || p.label === 'NEXT' ? '#16A34A' : '#DC2626'} stroke="white" strokeWidth={1.2 / zoom} style={{ pointerEvents: 'none' }}/>
        </g>))}
      <circle cx={node.x + NW - 5 / zoom} cy={node.y + 5 / zoom} r={4 / zoom} fill={statusColor} stroke="white" strokeWidth={1 / zoom} style={{ pointerEvents: 'none' }}/>
    </g>);
}
// ─── WF PROPERTIES PANEL ─────────────────────────────────────────────────────
function WfPropsPanel({ node, nodes, edges, workspaces, formFields, onUpdate, onDelete, }) {
    if (!node)
        return (<div className="h-full flex flex-col items-center justify-center text-center px-4">
      <Settings size={28} className="text-[#D1D9E0] mb-3"/>
      <p className="text-xs text-[#8898AA]">Sélectionnez un nœud<br />pour modifier ses propriétés</p>
    </div>);
    const status = nodeStatus(node, edges);
    return (<div className="flex flex-col h-full overflow-y-auto">
      <div className="px-4 py-3 border-b border-[#D1D9E0] flex items-center justify-between flex-shrink-0">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-[#8898AA] font-medium">{node.type}</p>
          <p className="text-sm font-semibold text-[#172033] truncate max-w-[140px]">{node.label}</p>
        </div>
        {node.type !== 'START' && (<button onClick={() => onDelete(node.id)} className="p-1.5 text-[#8898AA] hover:text-[#DC2626] rounded hover:bg-[#FEE2E2] transition-colors">
            <Trash2 size={13}/>
          </button>)}
      </div>
      {status !== 'complete' && (<div className={`mx-3 mt-3 px-3 py-2 rounded-lg text-xs flex items-start gap-2 ${status === 'incomplete' ? 'bg-[#FFEDD5] text-[#7C2D12]' : 'bg-[#FEE2E2] text-[#7F1D1D]'}`}>
          <AlertTriangle size={12} className="mt-0.5 flex-shrink-0"/>
          <span>{status === 'incomplete' ? 'Propriétés manquantes' : 'Connexions manquantes'}</span>
        </div>)}
      <div className="flex-1 p-4 space-y-4">
        <div>
          <label className="block text-xs font-medium text-[#4A5568] mb-1">Libellé</label>
          <input className="w-full px-3 py-2 text-sm border border-[#D1D9E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F4E79]/30" value={node.label} onChange={e => onUpdate({ ...node, label: e.target.value })}/>
        </div>

        {node.type === 'APPROVAL' && (<>
            <div>
              <label className="block text-xs font-medium text-[#4A5568] mb-1">Workspace responsable <span className="text-[#DC2626]">*</span></label>
              <select className="w-full px-3 py-2 text-sm border border-[#D1D9E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F4E79]/30 bg-white" value={node.workspaceId || ''} onChange={e => onUpdate({ ...node, workspaceId: e.target.value || undefined })}>
                <option value="">Sélectionner…</option>
                {workspaces.filter(w => w.active).map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
            {node.workspaceId && (<div>
                <label className="block text-xs font-medium text-[#4A5568] mb-1">Assigné à (optionnel)</label>
                <select className="w-full px-3 py-2 text-sm border border-[#D1D9E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F4E79]/30 bg-white" value={node.assignedUserId || ''} onChange={e => onUpdate({ ...node, assignedUserId: e.target.value || undefined })}>
                  <option value="">Tous les membres</option>
                  {USERS.filter(u => workspaces.find(w => w.id === node.workspaceId)?.memberIds.includes(u.id)).map(u => (<option key={u.id} value={u.id}>{u.name}</option>))}
                </select>
                <p className="text-[10px] text-[#8898AA] mt-1">Si vide, n'importe quel membre peut traiter cette étape.</p>
              </div>)}
            <div>
              <label className="block text-xs font-medium text-[#4A5568] mb-1">SLA (heures)</label>
              <input type="number" min={0} className="w-full px-3 py-2 text-sm border border-[#D1D9E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F4E79]/30" value={node.slaHours || ''} onChange={e => onUpdate({ ...node, slaHours: parseInt(e.target.value) || undefined })}/>
            </div>
          </>)}

        {node.type === 'CONDITION' && (<>
            <div>
              <label className="block text-xs font-medium text-[#4A5568] mb-1">Champ du formulaire <span className="text-[#DC2626]">*</span></label>
              <select className="w-full px-3 py-2 text-sm border border-[#D1D9E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F4E79]/30 bg-white" value={node.conditionField || ''} onChange={e => onUpdate({ ...node, conditionField: e.target.value || undefined })}>
                <option value="">Sélectionner un champ…</option>
                {formFields.map(f => <option key={f.key} value={f.key}>{f.label} ({f.key})</option>)}
              </select>
              {formFields.length === 0 && <p className="text-[10px] text-[#EA580C] mt-1">Aucun champ — définissez le formulaire en étape 3</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-[#4A5568] mb-1">Opérateur <span className="text-[#DC2626]">*</span></label>
              <select className="w-full px-3 py-2 text-sm border border-[#D1D9E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F4E79]/30 bg-white" value={node.conditionOperator || ''} onChange={e => onUpdate({ ...node, conditionOperator: e.target.value || undefined })}>
                <option value="">Sélectionner…</option>
                {['>', '>=', '<', '<=', '=', '!='].map(op => <option key={op} value={op}>{op}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#4A5568] mb-1">Valeur seuil <span className="text-[#DC2626]">*</span></label>
              <input className="w-full px-3 py-2 text-sm border border-[#D1D9E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F4E79]/30" value={node.conditionValue || ''} onChange={e => onUpdate({ ...node, conditionValue: e.target.value || undefined })}/>
            </div>
          </>)}

        {node.type === 'END' && (<div>
            <label className="block text-xs font-medium text-[#4A5568] mb-1">Résultat final</label>
            <div className="flex gap-2">
              {['TERMINÉE', 'REFUSÉE'].map(r => (<button key={r} onClick={() => onUpdate({ ...node, endResult: r })} className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-colors ${node.endResult === r ? (r === 'TERMINÉE' ? 'bg-[#DCFCE7] border-[#16A34A] text-[#14532D]' : 'bg-[#FEE2E2] border-[#DC2626] text-[#7F1D1D]') : 'border-[#D1D9E0] text-[#4A5568] hover:bg-[#F4F6F8]'}`}>{r}</button>))}
            </div>
          </div>)}

        {node.type !== 'START' && node.type !== 'END' && (<div className="pt-2 border-t border-[#D1D9E0]">
            <p className="text-[10px] uppercase tracking-wider text-[#8898AA] font-medium mb-2">Sorties</p>
            <div className="space-y-1">
              {getOutputPorts(node).map(p => {
                const connected = edges.find(e => e.from === node.id && e.label === p.label);
                const target = connected ? nodes.find(n => n.id === connected.to) : null;
                return (<div key={p.label} className="flex items-center gap-2 text-xs">
                    <span className={`w-14 text-center py-0.5 rounded font-medium text-[10px] ${p.label === 'APPROVED' || p.label === 'NEXT' || p.label === 'TRUE' ? 'bg-[#DCFCE7] text-[#14532D]' : 'bg-[#FEE2E2] text-[#7F1D1D]'}`}>{p.label}</span>
                    <span className="text-[#8898AA]">{target ? target.label : '—'}</span>
                  </div>);
            })}
            </div>
          </div>)}
      </div>
    </div>);
}
// ─── WF CANVAS EDITOR ────────────────────────────────────────────────────────
function WfCanvasEditor({ nodes, edges, workspaces, formFields, onCommit, onUndo, onRedo, canUndo, canRedo, }) {
    const svgRef = useRef(null);
    const [zoom, setZoom] = useState(0.82);
    const [pan, setPan] = useState({ x: 30, y: 10 });
    const panRef = useRef(pan);
    const zoomRef = useRef(zoom);
    const [localNodes, setLocalNodes] = useState(nodes);
    const localNodesRef = useRef(localNodes);
    const [drag, setDrag] = useState(null);
    const dragRef = useRef(drag);
    const [voidMenu, setVoidMenu] = useState(null);
    const [selected, setSelected] = useState(null);
    const [tab, setTab] = useState('diagram');
    const isDraggingNode = useRef(false);
    useEffect(() => { setLocalNodes(nodes); localNodesRef.current = nodes; }, [nodes]);
    useEffect(() => { panRef.current = pan; }, [pan]);
    useEffect(() => { zoomRef.current = zoom; }, [zoom]);
    useEffect(() => { dragRef.current = drag; }, [drag]);
    // Keyboard shortcuts
    useEffect(() => {
        const handler = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                e.preventDefault();
                onUndo();
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
                e.preventDefault();
                onRedo();
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onUndo, onRedo]);
    // Screen → canvas coords
    function screenToCanvas(sx, sy) {
        const svg = svgRef.current;
        if (!svg)
            return { x: 0, y: 0 };
        const rect = svg.getBoundingClientRect();
        const p = panRef.current;
        const z = zoomRef.current;
        return { x: (sx - rect.left - p.x) / z, y: (sy - rect.top - p.y) / z };
    }
    // Connection drag
    useEffect(() => {
        if (!drag)
            return;
        const onMove = (e) => {
            const { x, y } = screenToCanvas(e.clientX, e.clientY);
            const hover = localNodesRef.current.find(n => isInNode(n, { x, y }));
            const validity = hover ? validateConn(localNodesRef.current, edges, dragRef.current.fromNodeId, dragRef.current.portLabel, hover.id) : null;
            setDrag(d => d ? { ...d, curX: e.clientX, curY: e.clientY, hoverTargetId: hover?.id ?? null, validity } : null);
        };
        const onUp = (e) => {
            const d = dragRef.current;
            if (!d)
                return;
            const { x, y } = screenToCanvas(e.clientX, e.clientY);
            const hover = localNodesRef.current.find(n => isInNode(n, { x, y }));
            if (hover && validateConn(localNodesRef.current, edges, d.fromNodeId, d.portLabel, hover.id).ok) {
                const newEdge = { id: 'e-' + uid(), from: d.fromNodeId, to: hover.id, label: d.portLabel };
                onCommit({ nodes: localNodesRef.current, edges: [...edges, newEdge] });
            }
            else if (!hover) {
                const svg = svgRef.current;
                if (svg) {
                    const rect = svg.getBoundingClientRect();
                    setVoidMenu({ sx: e.clientX, sy: e.clientY, cx: x, cy: y, fromNodeId: d.fromNodeId, portLabel: d.portLabel });
                }
            }
            setDrag(null);
        };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
        return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    }, [drag, edges, onCommit]);
    function startPortDrag(e, node, port) {
        e.stopPropagation();
        const svg = svgRef.current;
        const rect = svg.getBoundingClientRect();
        const p = panRef.current;
        const z = zoomRef.current;
        const sx = port.x * z + p.x + rect.left;
        const sy = port.y * z + p.y + rect.top;
        setDrag({ fromNodeId: node.id, portLabel: port.label, portDir: port.dir, startX: sx, startY: sy, curX: sx, curY: sy, hoverTargetId: null, validity: null });
    }
    function startNodeDrag(e, nodeId) {
        e.stopPropagation();
        isDraggingNode.current = true;
        const startX = e.clientX, startY = e.clientY;
        const origNode = localNodesRef.current.find(n => n.id === nodeId);
        const { x: ox, y: oy } = origNode;
        const onMove = (ev) => {
            const dx = (ev.clientX - startX) / zoomRef.current;
            const dy = (ev.clientY - startY) / zoomRef.current;
            const updated = localNodesRef.current.map(n => n.id === nodeId ? { ...n, x: Math.max(0, ox + dx), y: Math.max(0, oy + dy) } : n);
            setLocalNodes(updated);
            localNodesRef.current = updated;
        };
        const onUp = () => {
            isDraggingNode.current = false;
            onCommit({ nodes: localNodesRef.current, edges: edges });
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
        };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
    }
    // Canvas pan
    const [panning, setPanning] = useState(false);
    const panStart = useRef({ mx: 0, my: 0, px: 0, py: 0 });
    function handleCanvasMouseDown(e) {
        if (e.button !== 0)
            return;
        setVoidMenu(null);
        setSelected(null);
        setPanning(true);
        panStart.current = { mx: e.clientX, my: e.clientY, px: panRef.current.x, py: panRef.current.y };
    }
    useEffect(() => {
        if (!panning)
            return;
        const onMove = (e) => { setPan({ x: panStart.current.px + e.clientX - panStart.current.mx, y: panStart.current.py + e.clientY - panStart.current.my }); };
        const onUp = () => setPanning(false);
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
        return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    }, [panning]);
    function handleWheel(e) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        setZoom(z => Math.min(2, Math.max(0.3, z * delta)));
    }
    function addNode(type, cx, cy, fromNodeId, portLabel) {
        const label = type === 'APPROVAL' ? 'Approbation' : type === 'CONDITION' ? 'Condition' : type === 'END' ? 'Fin' : 'Début';
        const newNode = { id: 'n-' + uid(), type, label, x: cx - (type === 'CONDITION' ? CDW / 2 : NW / 2), y: cy - (type === 'CONDITION' ? CDH / 2 : NH / 2) };
        const newNodes = [...localNodesRef.current, newNode];
        let newEdges = [...edges];
        if (fromNodeId && portLabel) {
            const valid = validateConn(newNodes, newEdges, fromNodeId, portLabel, newNode.id);
            if (valid.ok)
                newEdges = [...newEdges, { id: 'e-' + uid(), from: fromNodeId, to: newNode.id, label: portLabel }];
        }
        onCommit({ nodes: newNodes, edges: newEdges });
        setSelected(newNode.id);
    }
    function deleteEdge(edgeId) { onCommit({ nodes: localNodes, edges: edges.filter(e => e.id !== edgeId) }); }
    function deleteNode(nodeId) { onCommit({ nodes: localNodes.filter(n => n.id !== nodeId), edges: edges.filter(e => e.from !== nodeId && e.to !== nodeId) }); setSelected(null); }
    function updateNode(n) { const updated = localNodes.map(x => x.id === n.id ? n : x); setLocalNodes(updated); onCommit({ nodes: updated, edges }); }
    // Drag line in SVG coords
    let dragLineEl = null;
    if (drag && svgRef.current) {
        const rect = svgRef.current.getBoundingClientRect();
        const x2 = (drag.curX - rect.left - pan.x) / zoom;
        const y2 = (drag.curY - rect.top - pan.y) / zoom;
        const srcNode = localNodes.find(n => n.id === drag.fromNodeId);
        const srcPort = srcNode ? getOutputPorts(srcNode).find(p => p.label === drag.portLabel) : null;
        if (srcPort) {
            const valid = drag.validity;
            dragLineEl = (<path d={makePath(srcPort.x, srcPort.y, x2, y2, drag.portDir)} fill="none" stroke={valid ? (valid.ok ? '#16A34A' : '#DC2626') : '#1F4E79'} strokeWidth={1.5 / zoom} strokeDasharray={`${4 / zoom},${3 / zoom}`} style={{ pointerEvents: 'none' }}/>);
        }
    }
    const selectedNode = localNodes.find(n => n.id === selected) ?? null;
    // Palette node types
    const PALETTE_NODES = [
        { type: 'APPROVAL', label: 'Approbation', color: '#1F4E79' },
        { type: 'CONDITION', label: 'Condition', color: '#EA580C' },
        { type: 'END', label: 'Fin', color: '#DC2626' },
    ];
    return (<div className="flex h-full">
      {/* Left palette */}
      <div className="w-44 flex-shrink-0 bg-white border-r border-[#D1D9E0] flex flex-col">
        <div className="px-3 py-3 border-b border-[#D1D9E0]">
          <p className="text-[10px] uppercase tracking-wider text-[#8898AA] font-semibold">Nœuds</p>
        </div>
        <div className="p-3 space-y-2 flex-1">
          {PALETTE_NODES.map(p => (<button key={p.type} onClick={() => {
                const cx = (300 - pan.x) / zoom;
                const cy = (200 - pan.y) / zoom + localNodes.length * 80;
                addNode(p.type, cx, cy);
            }} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-[#172033] border border-[#D1D9E0] rounded-lg hover:border-[#1F4E79] hover:bg-[#EBF2F9] transition-colors text-left">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: p.color }}/>
              {p.label}
            </button>))}
        </div>
        {/* Toolbar */}
        <div className="p-3 border-t border-[#D1D9E0] flex flex-col gap-2">
          <div className="flex gap-1">
            <button onClick={onUndo} disabled={!canUndo} className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs border border-[#D1D9E0] rounded-lg hover:bg-[#F4F6F8] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"><Undo2 size={11}/></button>
            <button onClick={onRedo} disabled={!canRedo} className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs border border-[#D1D9E0] rounded-lg hover:bg-[#F4F6F8] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"><Redo2 size={11}/></button>
          </div>
          <div className="flex gap-1">
            <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="flex-1 flex items-center justify-center py-1.5 text-xs border border-[#D1D9E0] rounded-lg hover:bg-[#F4F6F8]"><ZoomIn size={11}/></button>
            <button onClick={() => setZoom(z => Math.max(0.3, z - 0.1))} className="flex-1 flex items-center justify-center py-1.5 text-xs border border-[#D1D9E0] rounded-lg hover:bg-[#F4F6F8]"><ZoomOut size={11}/></button>
          </div>
          <p className="text-center text-[10px] text-[#8898AA]">{Math.round(zoom * 100)}%</p>
        </div>
      </div>

      {/* Center canvas + tabs */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center border-b border-[#D1D9E0] bg-white px-4 flex-shrink-0">
          {['diagram', 'connections'].map(t => (<button key={t} onClick={() => setTab(t)} className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${tab === t ? 'border-[#1F4E79] text-[#1F4E79]' : 'border-transparent text-[#8898AA] hover:text-[#4A5568]'}`}>
              {t === 'diagram' ? 'Diagramme' : 'Connexions'}
            </button>))}
          <div className="ml-auto flex items-center gap-2 py-1.5">
            {localNodes.length > 0 && (<span className="text-[10px] text-[#8898AA]">{localNodes.length} nœuds · {edges.length} connexions</span>)}
          </div>
        </div>

        {tab === 'diagram' ? (<div className="flex-1 relative overflow-hidden" style={{ cursor: panning ? 'grabbing' : 'grab' }}>
            <svg ref={svgRef} className="w-full h-full workflow-canvas" onMouseDown={handleCanvasMouseDown} onWheel={handleWheel}>
              <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
                {/* Edges */}
                {edges.map(edge => {
                const src = localNodes.find(n => n.id === edge.from);
                const tgt = localNodes.find(n => n.id === edge.to);
                if (!src || !tgt)
                    return null;
                const srcPort = getOutputPorts(src).find(p => p.label === edge.label);
                const tgtPort = getInputPort(tgt);
                if (!srcPort || !tgtPort)
                    return null;
                const isGreen = edge.label === 'APPROVED' || edge.label === 'NEXT' || edge.label === 'TRUE';
                return (<g key={edge.id}>
                      <path d={makePath(srcPort.x, srcPort.y, tgtPort.x, tgtPort.y, srcPort.dir)} fill="none" stroke={isGreen ? '#16A34A' : '#DC2626'} strokeWidth={1.5 / zoom} markerEnd={`url(#arrow-${isGreen ? 'g' : 'r'})`} style={{ cursor: 'pointer' }} onClick={() => deleteEdge(edge.id)}/>
                      <text fontSize={8 / zoom} fill={isGreen ? '#16A34A' : '#DC2626'} fontWeight="700" dy={-2 / zoom}>
                        <textPath href={`#path-${edge.id}`} startOffset="50%" textAnchor="middle">{edge.label}</textPath>
                      </text>
                      <path id={`path-${edge.id}`} d={makePath(srcPort.x, srcPort.y, tgtPort.x, tgtPort.y, srcPort.dir)} fill="none" stroke="transparent"/>
                    </g>);
            })}
                {/* Drag line */}
                {dragLineEl}
                {/* Nodes */}
                {localNodes.map(node => (<WfNodeEl key={node.id} node={node} edges={edges} selected={selected === node.id} zoom={zoom} workspaces={workspaces} dragState={drag} onMouseDown={e => { setSelected(node.id); startNodeDrag(e, node.id); }} onPortMouseDown={(e, port) => startPortDrag(e, node, port)} onPortMouseEnter={id => { if (drag)
                setDrag(d => d ? { ...d, hoverTargetId: id } : null); }} onPortMouseLeave={() => { if (drag)
                setDrag(d => d ? { ...d, hoverTargetId: null } : null); }}/>))}
                <defs>
                  <marker id="arrow-g" markerWidth={6} markerHeight={6} refX={3} refY={3} orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#16A34A"/></marker>
                  <marker id="arrow-r" markerWidth={6} markerHeight={6} refX={3} refY={3} orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#DC2626"/></marker>
                </defs>
              </g>
            </svg>
            {localNodes.length === 0 && (<div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <GitBranch size={36} className="text-[#D1D9E0] mb-3"/>
                <p className="text-sm text-[#8898AA] font-medium">Cliquez sur un nœud dans la palette pour commencer</p>
              </div>)}
            {/* Void menu */}
            {voidMenu && (<div className="fixed bg-white border border-[#D1D9E0] rounded-xl shadow-lg py-1 z-50" style={{ left: Math.min(voidMenu.sx, window.innerWidth - 180), top: voidMenu.sy }}>
                <p className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-[#8898AA] font-semibold border-b border-[#D1D9E0]">Ajouter un nœud</p>
                {PALETTE_NODES.map(p => (<button key={p.type} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#172033] hover:bg-[#F4F6F8]" onClick={() => { addNode(p.type, voidMenu.cx, voidMenu.cy, voidMenu.fromNodeId, voidMenu.portLabel); setVoidMenu(null); }}>
                    <span className="w-2 h-2 rounded-full" style={{ background: p.color }}/>
                    {p.label}
                  </button>))}
                <button className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#8898AA] hover:bg-[#F4F6F8]" onClick={() => setVoidMenu(null)}>
                  <X size={10}/> Annuler
                </button>
              </div>)}
          </div>) : (<div className="flex-1 overflow-y-auto p-4">
            {edges.length === 0 ? (<p className="text-sm text-[#8898AA] text-center py-12">Aucune connexion définie</p>) : (<table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[#D1D9E0]">
                    <th className="text-left py-2 px-3 text-[#8898AA] font-medium">De</th>
                    <th className="text-left py-2 px-3 text-[#8898AA] font-medium">Connexion</th>
                    <th className="text-left py-2 px-3 text-[#8898AA] font-medium">Vers</th>
                    <th className="py-2 px-2"/>
                  </tr>
                </thead>
                <tbody>
                  {edges.map(edge => {
                    const src = localNodes.find(n => n.id === edge.from);
                    const tgt = localNodes.find(n => n.id === edge.to);
                    const isGreen = ['APPROVED', 'NEXT', 'TRUE'].includes(edge.label);
                    return (<tr key={edge.id} className="border-b border-[#F4F6F8] hover:bg-[#F4F6F8]">
                        <td className="py-2 px-3 text-[#172033]">{src?.label}</td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isGreen ? 'bg-[#DCFCE7] text-[#14532D]' : 'bg-[#FEE2E2] text-[#7F1D1D]'}`}>{edge.label}</span>
                        </td>
                        <td className="py-2 px-3 text-[#172033]">{tgt?.label}</td>
                        <td className="py-2 px-2"><button onClick={() => deleteEdge(edge.id)} className="p-1 text-[#8898AA] hover:text-[#DC2626]"><Trash2 size={11}/></button></td>
                      </tr>);
                })}
                </tbody>
              </table>)}
          </div>)}
      </div>

      {/* Right properties panel */}
      <div className="w-56 flex-shrink-0 border-l border-[#D1D9E0] bg-white">
        <WfPropsPanel node={selectedNode} nodes={localNodes} edges={edges} workspaces={workspaces} formFields={formFields} onUpdate={updateNode} onDelete={deleteNode}/>
      </div>
    </div>);
}
// ─── STEP ICONS ───────────────────────────────────────────────────────────────
const STEP_META = [
    { n: 1, label: 'Informations', icon: <FileText size={14}/> },
    { n: 2, label: 'Workspaces', icon: <Building2 size={14}/> },
    { n: 3, label: 'Formulaire', icon: <List size={14}/> },
    { n: 4, label: 'Workflow', icon: <GitBranch size={14}/> },
    { n: 5, label: 'Vérification', icon: <CheckCircle size={14}/> },
    { n: 6, label: 'Publication', icon: <Save size={14}/> },
];
// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function ProcessCreator() {
    const navigate = useNavigate();
    const { addProcess } = useProcesses();
    const [step, setStep] = useState(1);
    const [maxStep, setMaxStep] = useState(1);
    const [draft, setDraft] = useState({ ...DEMO_DRAFT });
    const [workspaces, setWorkspaces] = useState([...WORKSPACES]);
    // Form builder state
    const [selectedFieldId, setSelectedFieldId] = useState(draft.formFields[0]?.id ?? null);
    const [draggedFieldId, setDraggedFieldId] = useState(null);
    const [dragOverFieldId, setDragOverFieldId] = useState(null);
    const [showPreview, setShowPreview] = useState(false);
    // Workflow undo/redo
    const [undoStack, setUndoStack] = useState([]);
    const [redoStack, setRedoStack] = useState([]);
    // Workspace modals
    const [createWsModal, setCreateWsModal] = useState(false);
    const [manageMembersWsId, setManageMembersWsId] = useState(null);
    const [newWsForm, setNewWsForm] = useState({ name: '', code: '', description: '', color: '#1F4E79' });
    // Publication state
    const [publishModal, setPublishModal] = useState(false);
    const [published, setPublished] = useState(false);
    const [toast, setToast] = useState(null);
    function showToast(msg) { setToast(msg); setTimeout(() => setToast(null), 2500); }
    function goTo(s) {
        setStep(s);
        setMaxStep(m => Math.max(m, s));
    }
    function nextStep() {
        if (step < 6)
            goTo((step + 1));
    }
    function prevStep() {
        if (step > 1)
            setStep((step - 1));
    }
    // Can continue logic
    function canContinue() {
        if (step === 1)
            return draft.name.trim().length > 0;
        if (step === 2)
            return workspaces.some(w => w.active);
        if (step === 3)
            return draft.formFields.length > 0;
        if (step === 4)
            return draft.wfNodes.length > 0;
        if (step === 5)
            return computeChecks(draft).every(c => c.ok);
        return false;
    }
    // Workflow commit
    function wfCommit(snapshot) {
        setUndoStack(s => [...s.slice(-24), { nodes: draft.wfNodes, edges: draft.wfEdges }]);
        setRedoStack([]);
        setDraft(d => ({ ...d, wfNodes: snapshot.nodes, wfEdges: snapshot.edges }));
    }
    function wfUndo() {
        if (!undoStack.length)
            return;
        const prev = undoStack[undoStack.length - 1];
        setRedoStack(r => [...r, { nodes: draft.wfNodes, edges: draft.wfEdges }]);
        setDraft(d => ({ ...d, wfNodes: prev.nodes, wfEdges: prev.edges }));
        setUndoStack(s => s.slice(0, -1));
    }
    function wfRedo() {
        if (!redoStack.length)
            return;
        const next = redoStack[redoStack.length - 1];
        setUndoStack(u => [...u, { nodes: draft.wfNodes, edges: draft.wfEdges }]);
        setDraft(d => ({ ...d, wfNodes: next.nodes, wfEdges: next.edges }));
        setRedoStack(r => r.slice(0, -1));
    }
    // Form field helpers
    function addField(type) {
        const label = FIELD_TYPES.find(t => t.type === type).label;
        const newField = {
            id: 'ff-' + uid(), type, label, key: toKey(label), required: false, placeholder: '', helpText: '', options: [], order: draft.formFields.length,
        };
        const updated = [...draft.formFields, newField];
        setDraft(d => ({ ...d, formFields: updated }));
        setSelectedFieldId(newField.id);
    }
    function updateField(updated) { setDraft(d => ({ ...d, formFields: d.formFields.map(f => f.id === updated.id ? updated : f) })); }
    function deleteField(id) { setDraft(d => ({ ...d, formFields: d.formFields.filter(f => f.id !== id) })); if (selectedFieldId === id)
        setSelectedFieldId(null); }
    function duplicateField(field) {
        const copy = { ...field, id: 'ff-' + uid(), label: field.label + ' (copie)', key: field.key + '_copie', order: draft.formFields.length };
        setDraft(d => ({ ...d, formFields: [...d.formFields, copy] }));
        setSelectedFieldId(copy.id);
    }
    function reorderFields(fromId, toId) {
        if (fromId === toId)
            return;
        const arr = [...draft.formFields];
        const fromIdx = arr.findIndex(f => f.id === fromId);
        const toIdx = arr.findIndex(f => f.id === toId);
        const [moved] = arr.splice(fromIdx, 1);
        arr.splice(toIdx, 0, moved);
        setDraft(d => ({ ...d, formFields: arr.map((f, i) => ({ ...f, order: i })) }));
    }
    // Workspace helpers
    function createWorkspace() {
        if (!newWsForm.name.trim())
            return;
        const ws = { id: 'ws-' + uid(), name: newWsForm.name.trim(), code: newWsForm.code.trim().toUpperCase() || newWsForm.name.slice(0, 4).toUpperCase(), description: newWsForm.description.trim(), active: true, memberIds: [], color: newWsForm.color };
        setWorkspaces(w => [...w, ws]);
        setCreateWsModal(false);
        setNewWsForm({ name: '', code: '', description: '', color: '#1F4E79' });
        showToast('Workspace créé');
    }
    // Publish
    function doPublish(status) {
        addProcess({
            id: 'p-' + uid(),
            name: draft.name,
            description: draft.description,
            formId: 'f-' + uid(),
            workflowId: 'wf-' + uid(),
            status,
            icon: draft.icon,
            createdAt: new Date().toISOString().split('T')[0],
        });
        setPublishModal(false);
        setPublished(true);
    }
    const checks = computeChecks(draft);
    const allChecksOk = checks.every(c => c.ok);
    const selectedField = draft.formFields.find(f => f.id === selectedFieldId) ?? null;
    const managedWs = workspaces.find(w => w.id === manageMembersWsId);
    // ── PROGRESS BAR ──────────────────────────────────────────────────────────
    function renderProgress() {
        return (<div className="sticky top-0 z-20 bg-white border-b border-[#D1D9E0] -mx-6 -mt-6 px-6 py-4">
        <div className="flex items-center gap-1 mb-3">
          <button onClick={() => navigate('/admin/processes')} className="flex items-center gap-1.5 text-xs text-[#8898AA] hover:text-[#172033] transition-colors mr-2">
            <ArrowLeft size={13}/> Processus
          </button>
          <span className="text-[#D1D9E0]">/</span>
          <span className="text-xs text-[#172033] font-medium ml-2">{draft.name || 'Nouveau Processus'}</span>
          <span className="ml-2 px-2 py-0.5 bg-[#F4F6F8] border border-[#D1D9E0] text-[10px] text-[#8898AA] rounded-full font-medium">BROUILLON</span>
        </div>
        <div className="flex items-center gap-1">
          {STEP_META.map((s, i) => {
                const done = maxStep > s.n;
                const active = step === s.n;
                const reachable = done || s.n <= maxStep;
                return (<div key={s.n} className="flex items-center">
                {i > 0 && <div className={`w-8 h-0.5 mx-1 ${done ? 'bg-[#1F4E79]' : 'bg-[#D1D9E0]'}`}/>}
                <button onClick={() => reachable ? goTo(s.n) : undefined} disabled={!reachable} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${active ? 'bg-[#1F4E79] text-white shadow-sm' :
                        done ? 'bg-[#EBF2F9] text-[#1F4E79] hover:bg-[#C5D9EE] cursor-pointer' :
                            'text-[#8898AA] cursor-not-allowed'}`}>
                  {done ? <Check size={11}/> : <span className="text-[10px]">{s.n}</span>}
                  <span className="hidden sm:inline">{s.label}</span>
                </button>
              </div>);
            })}
        </div>
      </div>);
    }
    // ── STEP 1: INFORMATIONS ──────────────────────────────────────────────────
    const ICONS = ['💸', '📋', '🛒', '🏖️', '📄', '💼', '🔧', '🏢', '📊', '🔑', '💳', '📦'];
    function renderStep1() {
        return (<div className="max-w-xl mx-auto space-y-6">
        <div>
          <h2 className="text-lg font-bold text-[#172033] mb-1">Informations générales</h2>
          <p className="text-sm text-[#8898AA]">Un Processus associe un <strong>Formulaire</strong> de saisie et un <strong>Workflow</strong> de validation.</p>
        </div>
        <div className="bg-[#EBF2F9] border border-[#C5D9EE] rounded-xl p-4 flex items-start gap-3">
          <Info size={15} className="text-[#1F4E79] mt-0.5 flex-shrink-0"/>
          <p className="text-xs text-[#1F4E79]">Cet assistant vous guidera étape par étape : définir les champs du formulaire, concevoir le workflow d'approbation, puis publier le processus.</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-[#172033] mb-1.5">Nom du processus <span className="text-[#DC2626]">*</span></label>
          <input className="w-full px-4 py-3 text-sm border border-[#D1D9E0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1F4E79]/30" placeholder="ex: Demande de remboursement" value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}/>
        </div>
        <div>
          <label className="block text-sm font-medium text-[#172033] mb-1.5">Description</label>
          <textarea className="w-full px-4 py-3 text-sm border border-[#D1D9E0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1F4E79]/30 resize-none h-24" placeholder="Décrivez le processus et son utilisation…" value={draft.description} onChange={e => setDraft(d => ({ ...d, description: e.target.value }))}/>
        </div>
        <div>
          <label className="block text-sm font-medium text-[#172033] mb-2">Icône</label>
          <div className="flex flex-wrap gap-2">
            {ICONS.map(ic => (<button key={ic} onClick={() => setDraft(d => ({ ...d, icon: ic }))} className={`flex h-10 w-10 items-center justify-center rounded-xl border-2 transition-colors ${draft.icon === ic ? 'border-[#1F4E79] bg-[#EBF2F9] text-[#1F4E79]' : 'border-[#D1D9E0] text-[#4A5568] hover:border-[#9FBFE2]'}`}><ProcessIcon icon={ic}/></button>))}
          </div>
        </div>
      </div>);
    }
    // ── STEP 2: WORKSPACES ───────────────────────────────────────────────────
    function renderStep2() {
        return (<div className="space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#172033] mb-1">Workspaces</h2>
            <p className="text-sm text-[#8898AA]">Les Workspaces regroupent les validateurs selon leur rôle dans l'organisation.</p>
          </div>
          <button onClick={() => setCreateWsModal(true)} className="flex items-center gap-1.5 px-3 py-2 bg-[#1F4E79] text-white text-xs font-medium rounded-lg hover:bg-[#172033] transition-colors">
            <Plus size={13}/> Créer un Workspace
          </button>
        </div>

        {!workspaces.some(w => w.active) && (<div className="bg-[#FFEDD5] border border-[#EA580C]/30 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle size={15} className="text-[#EA580C] mt-0.5 flex-shrink-0"/>
            <p className="text-xs text-[#7C2D12]">Aucun workspace actif. Créez-en un ou activez un workspace existant pour continuer.</p>
          </div>)}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {workspaces.map(ws => (<div key={ws.id} className={`bg-white border rounded-xl p-5 ${ws.active ? 'border-[#D1D9E0]' : 'border-[#D1D9E0] opacity-60'}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: ws.color }}>{ws.code.slice(0, 2)}</div>
                  <div>
                    <p className="text-sm font-semibold text-[#172033]">{ws.name}</p>
                    <p className="text-[11px] text-[#8898AA]">{ws.code}</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${ws.active ? 'bg-[#DCFCE7] text-[#14532D]' : 'bg-[#F3F4F6] text-[#6B7280]'}`}>{ws.active ? 'Actif' : 'Inactif'}</span>
              </div>
              <p className="text-xs text-[#4A5568] mb-3 line-clamp-2">{ws.description}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-[#8898AA]">
                  <Users size={12}/>
                  <span>{ws.memberIds.length} membre{ws.memberIds.length !== 1 ? 's' : ''}</span>
                </div>
                <button onClick={() => setManageMembersWsId(ws.id)} className="text-xs text-[#1F4E79] hover:underline font-medium">Gérer les membres</button>
              </div>
            </div>))}
        </div>
      </div>);
    }
    // ── STEP 3: FORMULAIRE ───────────────────────────────────────────────────
    function renderStep3() {
        const sortedFields = [...draft.formFields].sort((a, b) => a.order - b.order);
        return (<div className="flex flex-col h-full gap-0">
        {/* Mode toggle + preview */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-[#172033] mb-0.5">Formulaire</h2>
            <p className="text-sm text-[#8898AA]">Définissez les champs que l'employé devra remplir.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-[#D1D9E0] overflow-hidden">
              {['new', 'reuse'].map(m => (<button key={m} onClick={() => setDraft(d => ({ ...d, formMode: m }))} className={`px-3 py-1.5 text-xs font-medium transition-colors ${draft.formMode === m ? 'bg-[#1F4E79] text-white' : 'text-[#4A5568] hover:bg-[#F4F6F8]'}`}>
                  {m === 'new' ? 'Créer nouveau' : 'Réutiliser existant'}
                </button>))}
            </div>
            <button onClick={() => setShowPreview(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-[#D1D9E0] rounded-lg hover:bg-[#F4F6F8] text-[#4A5568] transition-colors">
              <Eye size={12}/> Aperçu
            </button>
          </div>
        </div>

        {draft.formMode === 'reuse' ? (<div>
            <select className="w-full max-w-sm px-3 py-2 text-sm border border-[#D1D9E0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1F4E79]/30 bg-white" value={draft.formRefId || ''} onChange={e => {
                    const form = FORMS.find(f => f.id === e.target.value);
                    if (form)
                        setDraft(d => ({ ...d, formRefId: form.id, formFields: form.fields.map(f => ({ ...f, options: f.options || [] })) }));
                }}>
              <option value="">Sélectionner un formulaire…</option>
              {FORMS.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>) : (<div className="flex flex-1 border border-[#D1D9E0] rounded-xl overflow-hidden bg-white" style={{ minHeight: 480 }}>
            {/* Left: palette */}
            <div className="w-44 flex-shrink-0 border-r border-[#D1D9E0] bg-[#F4F6F8] flex flex-col">
              <div className="px-3 py-3 border-b border-[#D1D9E0]">
                <p className="text-[10px] uppercase tracking-wider text-[#8898AA] font-semibold">Types de champs</p>
              </div>
              <div className="p-3 space-y-1.5 flex-1 overflow-y-auto">
                {FIELD_TYPES.map(ft => (<button key={ft.type} onClick={() => addField(ft.type)} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-[#172033] border border-[#D1D9E0] rounded-lg bg-white hover:border-[#1F4E79] hover:bg-[#EBF2F9] transition-colors text-left">
                    <span style={{ color: ft.color }}><FieldTypeIcon type={ft.type} size={13}/></span>
                    {ft.label}
                  </button>))}
              </div>
            </div>

            {/* Center: field list */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#D1D9E0]">
                <p className="text-xs font-medium text-[#172033]">{sortedFields.length} champ{sortedFields.length !== 1 ? 's' : ''}</p>
                {draft.formFields.length === 0 && <p className="text-xs text-[#8898AA]">Cliquez sur un type pour ajouter</p>}
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
                {sortedFields.length === 0 && (<div className="flex flex-col items-center justify-center h-40 text-center">
                    <List size={28} className="text-[#D1D9E0] mb-2"/>
                    <p className="text-xs text-[#8898AA]">Choisissez un type de champ dans la palette</p>
                  </div>)}
                {sortedFields.map(f => {
                    const ft = FIELD_TYPES.find(t => t.type === f.type);
                    return (<div key={f.id} draggable onDragStart={() => setDraggedFieldId(f.id)} onDragOver={e => { e.preventDefault(); setDragOverFieldId(f.id); }} onDrop={() => { if (draggedFieldId)
                        reorderFields(draggedFieldId, f.id); setDraggedFieldId(null); setDragOverFieldId(null); }} onDragEnd={() => { setDraggedFieldId(null); setDragOverFieldId(null); }} onClick={() => setSelectedFieldId(f.id)} className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border cursor-pointer transition-all ${selectedFieldId === f.id ? 'border-[#1F4E79] bg-[#EBF2F9]' : 'border-[#D1D9E0] bg-white hover:border-[#1F4E79]/50'} ${dragOverFieldId === f.id && draggedFieldId !== f.id ? 'border-[#1F4E79] border-dashed' : ''}`}>
                      <GripVertical size={12} className="text-[#C5D9EE] flex-shrink-0 cursor-grab"/>
                      <span style={{ color: ft.color }} className="flex-shrink-0"><FieldTypeIcon type={f.type} size={13}/></span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-[#172033] truncate">{f.label}</p>
                        <p className="text-[10px] text-[#8898AA] font-mono truncate">{f.key}</p>
                      </div>
                      {f.required && <span className="text-[10px] text-[#DC2626] font-bold flex-shrink-0">*</span>}
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 flex-shrink-0">
                        <button onClick={e => { e.stopPropagation(); duplicateField(f); }} className="p-1 text-[#8898AA] hover:text-[#1F4E79] rounded" title="Dupliquer"><Copy size={11}/></button>
                        <button onClick={e => { e.stopPropagation(); deleteField(f.id); }} className="p-1 text-[#8898AA] hover:text-[#DC2626] rounded" title="Supprimer"><Trash2 size={11}/></button>
                      </div>
                    </div>);
                })}
              </div>
            </div>

            {/* Right: properties panel */}
            <div className="w-64 flex-shrink-0 border-l border-[#D1D9E0]">
              {selectedField ? (<FieldPropsPanel field={selectedField} onChange={updateField} onDelete={() => deleteField(selectedField.id)}/>) : (<div className="h-full flex flex-col items-center justify-center text-center px-4">
                  <Settings size={28} className="text-[#D1D9E0] mb-3"/>
                  <p className="text-xs text-[#8898AA]">Sélectionnez un champ<br />pour modifier ses propriétés</p>
                </div>)}
            </div>
          </div>)}

        {showPreview && <FormPreviewModal fields={draft.formFields} onClose={() => setShowPreview(false)}/>}
      </div>);
    }
    // ── STEP 4: WORKFLOW ──────────────────────────────────────────────────────
    function renderStep4() {
        return (<div className="flex flex-col h-full gap-0">
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-[#172033] mb-0.5">Workflow</h2>
            <p className="text-sm text-[#8898AA]">Concevez le circuit d'approbation. Les conditions peuvent référencer les champs du formulaire.</p>
          </div>
          <div className="flex rounded-lg border border-[#D1D9E0] overflow-hidden">
            {['new', 'reuse'].map(m => (<button key={m} onClick={() => setDraft(d => ({ ...d, wfMode: m }))} className={`px-3 py-1.5 text-xs font-medium transition-colors ${draft.wfMode === m ? 'bg-[#1F4E79] text-white' : 'text-[#4A5568] hover:bg-[#F4F6F8]'}`}>
                {m === 'new' ? 'Créer nouveau' : 'Réutiliser existant'}
              </button>))}
          </div>
        </div>

        {draft.wfMode === 'reuse' ? (<div className="mb-4">
            {/* import from WORKFLOWS const (imported from mockData) */}
            <select className="w-full max-w-sm px-3 py-2 text-sm border border-[#D1D9E0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1F4E79]/30 bg-white" onChange={e => {
                    const wf = WORKFLOWS.find(w => w.id === e.target.value);
                    if (wf) {
                        const nodes = wf.nodes.map(n => ({ id: n.id, type: n.type, label: n.label, x: n.x, y: n.y, workspaceId: n.workspaceId, slaHours: n.slaHours, conditionField: n.conditionField, conditionOperator: n.conditionOperator, conditionValue: n.conditionValue }));
                        const edges = wf.edges.map(edge => ({ id: edge.id, from: edge.from, to: edge.to, label: edge.label }));
                        setDraft(d => ({ ...d, wfRefId: wf.id, wfNodes: nodes, wfEdges: edges }));
                    }
                }}>
              <option value="">Sélectionner un workflow…</option>
              {WORKFLOWS.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>) : null}

        <div className="flex-1 border border-[#D1D9E0] rounded-xl overflow-hidden bg-white" style={{ minHeight: 520 }}>
          <WfCanvasEditor nodes={draft.wfNodes} edges={draft.wfEdges} workspaces={workspaces} formFields={draft.formFields} onCommit={wfCommit} onUndo={wfUndo} onRedo={wfRedo} canUndo={undoStack.length > 0} canRedo={redoStack.length > 0}/>
        </div>
      </div>);
    }
    // ── STEP 5: VÉRIFICATION ──────────────────────────────────────────────────
    function renderStep5() {
        return (<div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h2 className="text-lg font-bold text-[#172033] mb-1">Vérification</h2>
          <p className="text-sm text-[#8898AA]">Tous les points doivent être validés avant de pouvoir publier.</p>
        </div>
        <div className={`rounded-xl border px-5 py-4 flex items-center gap-3 ${allChecksOk ? 'bg-[#DCFCE7] border-[#16A34A]/40' : 'bg-[#FFEDD5] border-[#EA580C]/40'}`}>
          {allChecksOk ? <CheckCircle size={20} className="text-[#16A34A] flex-shrink-0"/> : <AlertTriangle size={20} className="text-[#EA580C] flex-shrink-0"/>}
          <div>
            <p className={`text-sm font-semibold ${allChecksOk ? 'text-[#14532D]' : 'text-[#7C2D12]'}`}>{allChecksOk ? 'Le processus est prêt à être publié !' : `${checks.filter(c => !c.ok).length} point(s) à corriger`}</p>
            <p className={`text-xs mt-0.5 ${allChecksOk ? 'text-[#166534]' : 'text-[#9A3412]'}`}>{allChecksOk ? 'Toutes les vérifications sont passées.' : 'Cliquez sur un point pour y accéder et le corriger.'}</p>
          </div>
        </div>
        <div className="space-y-2">
          {checks.map(c => (<div key={c.id} onClick={() => { if (!c.ok && c.goTo)
                goTo(c.goTo); }} className={`flex items-start gap-3 px-4 py-3.5 rounded-xl border transition-colors ${c.ok ? 'bg-white border-[#D1D9E0]' : 'bg-white border-[#DC2626]/30 cursor-pointer hover:bg-[#FEF2F2]'}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${c.ok ? 'bg-[#DCFCE7]' : 'bg-[#FEE2E2]'}`}>
                {c.ok ? <Check size={11} className="text-[#16A34A]"/> : <X size={11} className="text-[#DC2626]"/>}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${c.ok ? 'text-[#172033]' : 'text-[#DC2626]'}`}>{c.label}</p>
                {c.error && <p className="text-xs text-[#DC2626] mt-0.5">{c.error}</p>}
              </div>
              {!c.ok && c.goTo && (<span className="text-[10px] text-[#1F4E79] font-medium flex items-center gap-1 flex-shrink-0">
                  Étape {c.goTo} <ChevronRight size={11}/>
                </span>)}
            </div>))}
        </div>
      </div>);
    }
    // ── STEP 6: PUBLICATION ───────────────────────────────────────────────────
    function renderStep6() {
        if (published) {
            return (<div className="flex flex-col items-center justify-center py-16 text-center space-y-6">
          <div className="w-20 h-20 bg-[#DCFCE7] rounded-full flex items-center justify-center">
            <CheckCircle size={40} className="text-[#16A34A]"/>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[#172033] mb-2">Processus publié !</h2>
            <p className="text-sm text-[#8898AA] max-w-sm mx-auto">"{draft.name}" est maintenant disponible pour les employés dans le catalogue.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => navigate('/admin/processes')} className="px-5 py-2.5 bg-[#1F4E79] text-white text-sm font-medium rounded-xl hover:bg-[#172033] transition-colors">
              Voir dans le catalogue
            </button>
            <button onClick={() => { setDraft({ name: '', description: '', icon: '📋', formMode: 'new', formRefId: null, formFields: [], wfMode: 'new', wfRefId: null, wfNodes: [], wfEdges: [] }); setStep(1); setMaxStep(1); setPublished(false); }} className="px-5 py-2.5 border border-[#D1D9E0] text-sm font-medium text-[#4A5568] rounded-xl hover:bg-[#F4F6F8] transition-colors">
              Créer un autre processus
            </button>
          </div>
        </div>);
        }
        const formFieldCount = draft.formFields.length;
        const wfNodeCount = draft.wfNodes.length;
        const approvalCount = draft.wfNodes.filter(n => n.type === 'APPROVAL').length;
        const conditionCount = draft.wfNodes.filter(n => n.type === 'CONDITION').length;
        return (<div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h2 className="text-lg font-bold text-[#172033] mb-1">Publication</h2>
          <p className="text-sm text-[#8898AA]">Vérifiez le récapitulatif avant de publier.</p>
        </div>

        {/* Summary card */}
        <div className="bg-white border border-[#D1D9E0] rounded-xl overflow-hidden">
          <div className="p-5 border-b border-[#D1D9E0]">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#EBF2F9] text-[#1F4E79]">
                <ProcessIcon icon={draft.icon} name={draft.name} className="h-6 w-6"/>
              </div>
              <div>
                <h3 className="text-base font-bold text-[#172033]">{draft.name}</h3>
                <p className="text-xs text-[#8898AA] mt-0.5">{draft.description}</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 divide-x divide-[#D1D9E0]">
            {[
                { label: 'Champs', value: formFieldCount, icon: <List size={14} className="text-[#1F4E79]"/> },
                { label: 'Étapes workflow', value: wfNodeCount, icon: <GitBranch size={14} className="text-[#1F4E79]"/> },
                { label: 'Workspaces', value: workspaces.filter(w => w.active).length, icon: <Building2 size={14} className="text-[#1F4E79]"/> },
            ].map(s => (<div key={s.label} className="p-4 text-center">
                <div className="flex justify-center mb-1">{s.icon}</div>
                <p className="text-xl font-bold text-[#172033]">{s.value}</p>
                <p className="text-[11px] text-[#8898AA]">{s.label}</p>
              </div>))}
          </div>
        </div>

        {/* Form summary */}
        <div className="bg-white border border-[#D1D9E0] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <List size={14} className="text-[#1F4E79]"/>
            <h4 className="text-sm font-semibold text-[#172033]">Formulaire</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {draft.formFields.map(f => {
                const ft = FIELD_TYPES.find(t => t.type === f.type);
                return (<span key={f.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: ft.bg, color: ft.color }}>
                  <FieldTypeIcon type={f.type} size={11}/>
                  {f.label} {f.required && '●'}
                </span>);
            })}
          </div>
        </div>

        {/* Workflow summary */}
        <div className="bg-white border border-[#D1D9E0] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <GitBranch size={14} className="text-[#1F4E79]"/>
            <h4 className="text-sm font-semibold text-[#172033]">Workflow</h4>
          </div>
          <div className="flex gap-4 text-xs">
            <span className="text-[#4A5568]"><strong className="text-[#1F4E79]">{approvalCount}</strong> approbation{approvalCount !== 1 ? 's' : ''}</span>
            <span className="text-[#4A5568]"><strong className="text-[#EA580C]">{conditionCount}</strong> condition{conditionCount !== 1 ? 's' : ''}</span>
            <span className="text-[#4A5568]"><strong className="text-[#172033]">{draft.wfEdges.length}</strong> connexions</span>
          </div>
          <div className="mt-3 space-y-1">
            {draft.wfNodes.map(n => {
                const c = NODE_COLORS[n.type];
                return (<div key={n.id} className="flex items-center gap-2 text-xs">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c.border }}/>
                  <span className="text-[#172033]">{n.label}</span>
                  <span className="text-[#8898AA]">{n.type}</span>
                </div>);
            })}
          </div>
        </div>

        {!allChecksOk && (<div className="bg-[#FEF2F2] border border-[#DC2626]/30 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle size={14} className="text-[#DC2626] mt-0.5 flex-shrink-0"/>
            <p className="text-xs text-[#7F1D1D]">Des erreurs ont été détectées lors de la vérification. Retournez à l'étape 5 pour les corriger avant de publier.</p>
          </div>)}

        <div className="flex gap-3">
          <button onClick={() => doPublish('DRAFT')} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-[#D1D9E0] text-sm font-medium text-[#4A5568] rounded-xl hover:bg-[#F4F6F8] transition-colors">
            <Save size={14}/> Enregistrer en brouillon
          </button>
          <button onClick={() => setPublishModal(true)} disabled={!allChecksOk} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#1F4E79] text-white text-sm font-medium rounded-xl hover:bg-[#172033] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            <CheckCircle size={14}/> Publier le processus
          </button>
        </div>
      </div>);
    }
    // ── MAIN RENDER ───────────────────────────────────────────────────────────
    const isFullCanvas = step === 3 || step === 4;
    return (<div className="flex flex-col min-h-full -m-6">
      {/* Progress bar */}
      {renderProgress()}

      {/* Step content */}
      <div className={`flex-1 overflow-y-auto px-6 py-6 pb-24 ${isFullCanvas ? 'flex flex-col' : ''}`}>
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && <div className="flex flex-col flex-1">{renderStep3()}</div>}
        {step === 4 && <div className="flex flex-col flex-1">{renderStep4()}</div>}
        {step === 5 && renderStep5()}
        {step === 6 && renderStep6()}
      </div>

      {/* Fixed bottom action bar */}
      {!published && (<div className="fixed bottom-0 right-0 bg-white border-t border-[#D1D9E0] px-6 py-4 z-30 flex items-center gap-3" style={{ left: 240 }}>
          <button onClick={prevStep} disabled={step === 1} className="flex items-center gap-1.5 px-4 py-2 text-sm text-[#4A5568] border border-[#D1D9E0] rounded-xl hover:bg-[#F4F6F8] disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            <ArrowLeft size={14}/> Retour
          </button>
          <button onClick={() => { doPublish('DRAFT'); showToast('Brouillon enregistré'); }} className="flex items-center gap-1.5 px-4 py-2 text-sm text-[#4A5568] border border-[#D1D9E0] rounded-xl hover:bg-[#F4F6F8] transition-colors">
            <Save size={14}/> Brouillon
          </button>
          <div className="flex-1"/>
          <div className="flex items-center gap-1.5 text-xs text-[#8898AA]">
            <span>Étape {step} sur 6</span>
            <span className="w-24 h-1.5 bg-[#EAEEF2] rounded-full overflow-hidden"><span className="block h-full bg-[#1F4E79] rounded-full transition-all" style={{ width: `${(step / 6) * 100}%` }}/></span>
          </div>
          {step < 6 ? (<button onClick={nextStep} disabled={!canContinue()} className="flex items-center gap-1.5 px-5 py-2 bg-[#1F4E79] text-white text-sm font-medium rounded-xl hover:bg-[#172033] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              Continuer <ChevronRight size={14}/>
            </button>) : (<button onClick={() => setPublishModal(true)} disabled={!allChecksOk} className="flex items-center gap-1.5 px-5 py-2 bg-[#16A34A] text-white text-sm font-medium rounded-xl hover:bg-[#15803D] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              <CheckCircle size={14}/> Publier
            </button>)}
        </div>)}

      {/* Create Workspace Modal */}
      {createWsModal && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setCreateWsModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-semibold text-[#172033]">Créer un Workspace</h3>
              <button onClick={() => setCreateWsModal(false)} className="text-[#8898AA] hover:text-[#172033]"><X size={16}/></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#4A5568] mb-1">Nom <span className="text-[#DC2626]">*</span></label>
                <input className="w-full px-3 py-2 text-sm border border-[#D1D9E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F4E79]/30" placeholder="ex: Finance" value={newWsForm.name} onChange={e => setNewWsForm(f => ({ ...f, name: e.target.value }))}/>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#4A5568] mb-1">Code</label>
                <input className="w-full px-3 py-2 text-sm border border-[#D1D9E0] rounded-lg font-mono uppercase focus:outline-none focus:ring-2 focus:ring-[#1F4E79]/30" placeholder="ex: FIN" value={newWsForm.code} onChange={e => setNewWsForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}/>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#4A5568] mb-1">Description</label>
                <textarea className="w-full px-3 py-2 text-sm border border-[#D1D9E0] rounded-lg resize-none h-16 focus:outline-none focus:ring-2 focus:ring-[#1F4E79]/30" placeholder="Rôle de ce workspace…" value={newWsForm.description} onChange={e => setNewWsForm(f => ({ ...f, description: e.target.value }))}/>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#4A5568] mb-2">Couleur</label>
                <div className="flex gap-2">
                  {['#1F4E79', '#7C3AED', '#16A34A', '#EA580C', '#0EA5E9', '#DC2626'].map(c => (<button key={c} onClick={() => setNewWsForm(f => ({ ...f, color: c }))} className={`w-7 h-7 rounded-lg border-2 transition-all ${newWsForm.color === c ? 'border-[#172033] scale-110' : 'border-transparent'}`} style={{ background: c }}/>))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setCreateWsModal(false)} className="flex-1 px-4 py-2 text-sm text-[#4A5568] border border-[#D1D9E0] rounded-lg hover:bg-[#F4F6F8]">Annuler</button>
              <button onClick={createWorkspace} disabled={!newWsForm.name.trim()} className="flex-1 px-4 py-2 bg-[#1F4E79] text-white text-sm font-medium rounded-lg hover:bg-[#172033] disabled:opacity-40">Créer</button>
            </div>
          </div>
        </div>)}

      {/* Manage members modal */}
      {manageMembersWsId && managedWs && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setManageMembersWsId(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 max-h-[70vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-[#D1D9E0]">
              <div>
                <h3 className="text-sm font-semibold text-[#172033]">Membres — {managedWs.name}</h3>
                <p className="text-xs text-[#8898AA] mt-0.5">{managedWs.memberIds.length} membre(s)</p>
              </div>
              <button onClick={() => setManageMembersWsId(null)} className="text-[#8898AA] hover:text-[#172033]"><X size={16}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {USERS.map(u => {
                const inWs = managedWs.memberIds.includes(u.id);
                return (<label key={u.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-[#F4F6F8] cursor-pointer">
                    <input type="checkbox" checked={inWs} onChange={() => {
                        setWorkspaces(wsList => wsList.map(w => w.id === managedWs.id ? {
                            ...w, memberIds: inWs ? w.memberIds.filter(id => id !== u.id) : [...w.memberIds, u.id]
                        } : w));
                    }} className="w-4 h-4 accent-[#1F4E79] flex-shrink-0"/>
                    <div className="w-8 h-8 bg-[#EBF2F9] rounded-full flex items-center justify-center text-xs font-bold text-[#1F4E79] flex-shrink-0">
                      {u.name.split(' ').map(p => p[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[#172033]">{u.name}</p>
                      <p className="text-[10px] text-[#8898AA]">{u.email}</p>
                    </div>
                  </label>);
            })}
            </div>
            <div className="p-4 border-t border-[#D1D9E0]">
              <button onClick={() => setManageMembersWsId(null)} className="w-full px-4 py-2 bg-[#1F4E79] text-white text-sm font-medium rounded-lg hover:bg-[#172033]">Enregistrer</button>
            </div>
          </div>
        </div>)}

      {/* Publish confirmation modal */}
      {publishModal && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <div className="text-center mb-5">
              <div className="w-12 h-12 bg-[#DCFCE7] rounded-full flex items-center justify-center mx-auto mb-3"><CheckCircle size={24} className="text-[#16A34A]"/></div>
              <h3 className="text-sm font-semibold text-[#172033]">Publier "{draft.name}" ?</h3>
              <p className="text-xs text-[#8898AA] mt-1">Le processus sera immédiatement disponible pour les employés dans le catalogue.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setPublishModal(false)} className="flex-1 px-4 py-2 text-sm text-[#4A5568] border border-[#D1D9E0] rounded-lg hover:bg-[#F4F6F8]">Annuler</button>
              <button onClick={() => doPublish('PUBLISHED')} className="flex-1 px-4 py-2 bg-[#16A34A] text-white text-sm font-medium rounded-lg hover:bg-[#15803D]">Publier</button>
            </div>
          </div>
        </div>)}

      {/* Toast */}
      {toast && (<div className="fixed top-4 right-4 z-[100] bg-[#172033] text-white text-xs font-medium px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2">
          <Check size={13} className="text-[#16A34A]"/> {toast}
        </div>)}
    </div>);
}
