export default function RequestProgress({ request }) {
    const active = request.status === 'EN_COURS'
        ? (request.validationSteps ?? []).filter(s => ['EN_ATTENTE', 'EN_COURS'].includes(s.status)) : [];
    const names = [...new Set(active.map(s => s.workspaceName).filter(Boolean))];
    const text = names.length ? 'Workspace actuel : ' + names.join(', ')
        : ({ EN_COURS: 'En cours : aucune affectation disponible', TERMINEE: 'Validation terminée', REFUSEE: 'Demande refusée', ANNULEE: 'Demande annulée', BROUILLON: 'Non soumise' }[request.status] ?? '');
    return <p className="text-xs text-[#1F4E79] mt-1">{text}</p>;
}
