// ─── MOCK USERS ────────────────────────────────────────────────────────────
export const USERS = [
    { id: 'u1', name: 'Marie Dupont', email: 'admin@smart-engine.io', role: 'ADMIN', workspaceIds: [], active: true, avatar: 'MD', createdAt: '2024-01-10' },
    { id: 'u2', name: 'Thomas Bernard', email: 'thomas@acme.com', role: 'EMPLOYEE', workspaceIds: ['ws1', 'ws2'], active: true, avatar: 'TB', createdAt: '2024-02-15' },
    { id: 'u3', name: 'Sophie Martin', email: 'sophie@acme.com', role: 'EMPLOYEE', workspaceIds: ['ws1'], active: true, avatar: 'SM', createdAt: '2024-02-20' },
    { id: 'u4', name: 'Lucas Petit', email: 'lucas@acme.com', role: 'EMPLOYEE', workspaceIds: ['ws2', 'ws3'], active: true, avatar: 'LP', createdAt: '2024-03-01' },
    { id: 'u5', name: 'Emma Leroy', email: 'emma@acme.com', role: 'EMPLOYEE', workspaceIds: ['ws3'], active: false, avatar: 'EL', createdAt: '2024-03-10' },
    { id: 'u6', name: 'Antoine Rousseau', email: 'antoine@acme.com', role: 'EMPLOYEE', workspaceIds: ['ws1', 'ws3'], active: true, avatar: 'AR', createdAt: '2024-03-15' },
];
// ─── MOCK WORKSPACES ────────────────────────────────────────────────────────
export const WORKSPACES = [
    { id: 'ws1', name: 'Finance', code: 'FINANCE', description: 'Validation des dépenses et budgets', active: true, memberIds: ['u2', 'u3', 'u6'], color: '#1F4E79' },
    { id: 'ws2', name: 'Ressources Humaines', code: 'RH', description: 'Gestion des congés, recrutement, onboarding', active: true, memberIds: ['u2', 'u4'], color: '#7C3AED' },
    { id: 'ws3', name: 'Direction', code: 'DIR', description: 'Approbations stratégiques et investissements', active: true, memberIds: ['u4', 'u5', 'u6'], color: '#EA580C' },
    { id: 'ws4', name: 'Juridique', code: 'LEGAL', description: 'Validation des contrats et engagements', active: false, memberIds: [], color: '#0EA5E9' },
];
// ─── MOCK FORMS ─────────────────────────────────────────────────────────────
export const FORMS = [
    {
        id: 'f1',
        name: 'Demande d\'achat',
        createdAt: '2024-02-01',
        updatedAt: '2024-03-01',
        fields: [
            { id: 'ff1', type: 'TEXT', key: 'objet', label: 'Objet de la demande', required: true, placeholder: 'Ex: Achat de matériel informatique', order: 1 },
            { id: 'ff2', type: 'AMOUNT', key: 'montant', label: 'Montant estimé (€)', required: true, placeholder: '0.00', order: 2 },
            { id: 'ff3', type: 'SELECT', key: 'categorie', label: 'Catégorie', required: true, options: ['Matériel', 'Logiciel', 'Service', 'Formation', 'Autre'], order: 3 },
            { id: 'ff4', type: 'TEXTAREA', key: 'justification', label: 'Justification', required: true, placeholder: 'Décrivez pourquoi cet achat est nécessaire...', order: 4 },
            { id: 'ff5', type: 'DATE', key: 'dateNeeded', label: 'Date souhaitée', required: false, order: 5 },
            { id: 'ff6', type: 'FILE', key: 'devis', label: 'Devis / Justificatif', required: false, order: 6 },
        ],
    },
    {
        id: 'f2',
        name: 'Demande de congé',
        createdAt: '2024-02-10',
        updatedAt: '2024-02-10',
        fields: [
            { id: 'ff7', type: 'DATE', key: 'dateDebut', label: 'Date de début', required: true, order: 1 },
            { id: 'ff8', type: 'DATE', key: 'dateFin', label: 'Date de fin', required: true, order: 2 },
            { id: 'ff9', type: 'SELECT', key: 'typeConge', label: 'Type de congé', required: true, options: ['Congés payés', 'RTT', 'Congé sans solde', 'Maladie', 'Événement familial'], order: 3 },
            { id: 'ff10', type: 'TEXTAREA', key: 'commentaire', label: 'Commentaire', required: false, placeholder: 'Informations complémentaires...', order: 4 },
        ],
    },
    {
        id: 'f3',
        name: 'Note de frais',
        createdAt: '2024-03-01',
        updatedAt: '2024-03-01',
        fields: [
            { id: 'ff11', type: 'DATE', key: 'date', label: 'Date de la dépense', required: true, order: 1 },
            { id: 'ff12', type: 'TEXT', key: 'objet', label: 'Objet', required: true, placeholder: 'Ex: Repas client', order: 2 },
            { id: 'ff13', type: 'AMOUNT', key: 'montant', label: 'Montant TTC (€)', required: true, placeholder: '0.00', order: 3 },
            { id: 'ff14', type: 'SELECT', key: 'nature', label: 'Nature', required: true, options: ['Transport', 'Hébergement', 'Repas', 'Fournitures', 'Autre'], order: 4 },
            { id: 'ff15', type: 'FILE', key: 'justificatif', label: 'Justificatif', required: true, order: 5 },
        ],
    },
];
// ─── MOCK WORKFLOWS ──────────────────────────────────────────────────────────
export const WORKFLOWS = [
    {
        id: 'wf1',
        name: 'Workflow Achat Standard',
        status: 'PUBLISHED',
        createdAt: '2024-02-01',
        nodes: [
            { id: 'n1', type: 'START', label: 'Début', x: 80, y: 200 },
            { id: 'n2', type: 'CONDITION', label: 'Montant > 1000€?', x: 240, y: 200, conditionField: 'montant', conditionOperator: '>', conditionValue: '1000' },
            { id: 'n3', type: 'APPROVAL', label: 'Validation Responsable', x: 420, y: 100, workspaceId: 'ws1', slaHours: 24 },
            { id: 'n4', type: 'APPROVAL', label: 'Validation Direction', x: 600, y: 100, workspaceId: 'ws3', slaHours: 48 },
            { id: 'n5', type: 'APPROVAL', label: 'Validation Finance', x: 420, y: 300, workspaceId: 'ws1', slaHours: 8 },
            { id: 'n6', type: 'END', label: 'Fin', x: 780, y: 200 },
        ],
        edges: [
            { id: 'e1', from: 'n1', to: 'n2', label: 'NEXT' },
            { id: 'e2', from: 'n2', to: 'n3', label: 'TRUE' },
            { id: 'e3', from: 'n2', to: 'n5', label: 'FALSE' },
            { id: 'e4', from: 'n3', to: 'n4', label: 'APPROVED' },
            { id: 'e5', from: 'n4', to: 'n6', label: 'APPROVED' },
            { id: 'e6', from: 'n5', to: 'n6', label: 'APPROVED' },
        ],
    },
    {
        id: 'wf2',
        name: 'Workflow Congés RH',
        status: 'PUBLISHED',
        createdAt: '2024-02-10',
        nodes: [
            { id: 'n1', type: 'START', label: 'Début', x: 80, y: 180 },
            { id: 'n2', type: 'APPROVAL', label: 'Validation Manager', x: 280, y: 180, workspaceId: 'ws2', slaHours: 48 },
            { id: 'n3', type: 'END', label: 'Fin', x: 480, y: 180 },
        ],
        edges: [
            { id: 'e1', from: 'n1', to: 'n2', label: 'NEXT' },
            { id: 'e2', from: 'n2', to: 'n3', label: 'APPROVED' },
        ],
    },
];
// ─── MOCK PROCESSES ───────────────────────────────────────────────────────────
export const PROCESSES = [
    { id: 'p1', name: 'Demande d\'Achat', description: 'Soumettez une demande d\'achat de matériel ou de services', formId: 'f1', workflowId: 'wf1', status: 'PUBLISHED', icon: '🛒', createdAt: '2024-02-05' },
    { id: 'p2', name: 'Demande de Congé', description: 'Soumettez votre demande de congé ou RTT', formId: 'f2', workflowId: 'wf2', status: 'PUBLISHED', icon: '🏖️', createdAt: '2024-02-12' },
    { id: 'p3', name: 'Note de Frais', description: 'Déposez vos justificatifs de dépenses professionnelles', formId: 'f3', workflowId: 'wf1', status: 'PUBLISHED', icon: '💳', createdAt: '2024-03-05' },
    { id: 'p4', name: 'Recrutement', description: 'Demande d\'ouverture de poste et processus de recrutement', formId: 'f1', workflowId: 'wf1', status: 'DRAFT', icon: '👥', createdAt: '2024-03-10' },
];
// ─── MOCK REQUESTS ─────────────────────────────────────────────────────────
export const REQUESTS = [
    {
        id: 'r1', reference: 'REQ-2024-0042', processId: 'p1', processName: 'Demande d\'Achat',
        requesterId: 'u2', requesterName: 'Thomas Bernard', status: 'EN_COURS',
        formData: { objet: 'MacBook Pro M3 14"', montant: 2800, categorie: 'Matériel', justification: 'Remplacement ordinateur obsolète', dateNeeded: '2024-04-01' },
        steps: [
            { id: 's1', nodeLabel: 'Début', workspaceName: '', status: 'APPROVED', completedAt: '2024-03-15T09:00:00', slaHours: 0 },
            { id: 's2', nodeLabel: 'Montant > 1000€?', workspaceName: '', status: 'APPROVED', completedAt: '2024-03-15T09:00:00', slaHours: 0 },
            { id: 's3', nodeLabel: 'Validation Responsable', workspaceName: 'Finance', status: 'APPROVED', completedAt: '2024-03-15T14:30:00', assignedTo: 'Sophie Martin', comment: 'Approuvé, matériel justifié', slaHours: 24 },
            { id: 's4', nodeLabel: 'Validation Direction', workspaceName: 'Direction', status: 'IN_PROGRESS', startedAt: '2024-03-15T14:30:00', slaHours: 48 },
        ],
        currentStepId: 's4', createdAt: '2024-03-15T09:00:00', updatedAt: '2024-03-15T14:30:00',
    },
    {
        id: 'r2', reference: 'REQ-2024-0041', processId: 'p2', processName: 'Demande de Congé',
        requesterId: 'u2', requesterName: 'Thomas Bernard', status: 'TERMINE',
        formData: { dateDebut: '2024-04-15', dateFin: '2024-04-19', typeConge: 'Congés payés', commentaire: 'Vacances de Pâques' },
        steps: [
            { id: 's1', nodeLabel: 'Début', workspaceName: '', status: 'APPROVED', completedAt: '2024-03-10T10:00:00', slaHours: 0 },
            { id: 's2', nodeLabel: 'Validation Manager', workspaceName: 'RH', status: 'APPROVED', completedAt: '2024-03-11T09:00:00', assignedTo: 'Lucas Petit', comment: 'Bon congé !', slaHours: 48 },
            { id: 's3', nodeLabel: 'Fin', workspaceName: '', status: 'APPROVED', completedAt: '2024-03-11T09:01:00', slaHours: 0 },
        ],
        createdAt: '2024-03-10T10:00:00', updatedAt: '2024-03-11T09:01:00',
    },
    {
        id: 'r3', reference: 'REQ-2024-0039', processId: 'p3', processName: 'Note de Frais',
        requesterId: 'u3', requesterName: 'Sophie Martin', status: 'EN_RETARD',
        formData: { date: '2024-03-05', objet: 'Repas client EDF', montant: 87.50, nature: 'Repas' },
        steps: [
            { id: 's1', nodeLabel: 'Début', workspaceName: '', status: 'APPROVED', completedAt: '2024-03-08T11:00:00', slaHours: 0 },
            { id: 's2', nodeLabel: 'Validation Finance', workspaceName: 'Finance', status: 'IN_PROGRESS', startedAt: '2024-03-08T11:00:00', slaHours: 8 },
        ],
        currentStepId: 's2', createdAt: '2024-03-08T11:00:00', updatedAt: '2024-03-08T11:00:00',
    },
    {
        id: 'r4', reference: 'REQ-2024-0038', processId: 'p1', processName: 'Demande d\'Achat',
        requesterId: 'u4', requesterName: 'Lucas Petit', status: 'REJETE',
        formData: { objet: 'Licence Adobe Creative Cloud', montant: 600, categorie: 'Logiciel', justification: 'Pour les présentations marketing' },
        steps: [
            { id: 's1', nodeLabel: 'Début', workspaceName: '', status: 'APPROVED', completedAt: '2024-03-05T08:00:00', slaHours: 0 },
            { id: 's2', nodeLabel: 'Validation Finance', workspaceName: 'Finance', status: 'REJECTED', completedAt: '2024-03-06T10:00:00', assignedTo: 'Antoine Rousseau', comment: 'Budget insuffisant ce trimestre, à reporter Q2', slaHours: 8 },
        ],
        createdAt: '2024-03-05T08:00:00', updatedAt: '2024-03-06T10:00:00',
    },
];
// ─── MOCK TASKS ─────────────────────────────────────────────────────────────
export const TASKS = [
    { id: 't1', requestId: 'r1', requestRef: 'REQ-2024-0042', processName: 'Demande d\'Achat', requesterName: 'Thomas Bernard', workspaceId: 'ws3', status: 'IN_PROGRESS', slaDeadline: '2024-03-17T14:30:00', createdAt: '2024-03-15T14:30:00', formData: { objet: 'MacBook Pro M3 14"', montant: 2800, categorie: 'Matériel' } },
    { id: 't2', requestId: 'r3', requestRef: 'REQ-2024-0039', processName: 'Note de Frais', requesterName: 'Sophie Martin', workspaceId: 'ws1', status: 'LATE', slaDeadline: '2024-03-08T19:00:00', createdAt: '2024-03-08T11:00:00', formData: { objet: 'Repas client EDF', montant: 87.50, nature: 'Repas' } },
    { id: 't3', requestId: 'r5', requestRef: 'REQ-2024-0044', processName: 'Demande d\'Achat', requesterName: 'Emma Leroy', workspaceId: 'ws1', status: 'AVAILABLE', slaDeadline: '2024-03-20T09:00:00', createdAt: '2024-03-18T09:00:00', formData: { objet: 'Imprimante laser couleur', montant: 450, categorie: 'Matériel' } },
    { id: 't4', requestId: 'r6', requestRef: 'REQ-2024-0045', processName: 'Note de Frais', requesterName: 'Antoine Rousseau', workspaceId: 'ws1', status: 'AVAILABLE', slaDeadline: '2024-03-22T17:00:00', createdAt: '2024-03-19T14:00:00', formData: { objet: 'Train Paris-Lyon', montant: 124.00, nature: 'Transport' } },
    { id: 't5', requestId: 'r7', requestRef: 'REQ-2024-0046', processName: 'Demande de Congé', requesterName: 'Lucas Petit', workspaceId: 'ws2', status: 'AVAILABLE', slaDeadline: '2024-03-23T12:00:00', createdAt: '2024-03-19T15:00:00', formData: { dateDebut: '2024-04-22', dateFin: '2024-04-26', typeConge: 'RTT' } },
];
// ─── MOCK AUDIT LOGS ─────────────────────────────────────────────────────────
export const AUDIT_LOGS = [
    { id: 'a1', userId: 'u2', userName: 'Thomas Bernard', action: 'CREATE', resource: 'REQUEST', resourceId: 'r1', details: 'Nouvelle demande d\'achat REQ-2024-0042', timestamp: '2024-03-15T09:00:00' },
    { id: 'a2', userId: 'u3', userName: 'Sophie Martin', action: 'APPROVE', resource: 'TASK', resourceId: 't1', details: 'Approbation étape "Validation Responsable" pour REQ-2024-0042', timestamp: '2024-03-15T14:30:00' },
    { id: 'a3', userId: 'u1', userName: 'Marie Dupont', action: 'PUBLISH', resource: 'PROCESS', resourceId: 'p3', details: 'Publication du processus "Note de Frais"', timestamp: '2024-03-14T10:00:00' },
    { id: 'a4', userId: 'u1', userName: 'Marie Dupont', action: 'CREATE', resource: 'USER', resourceId: 'u6', details: 'Création de l\'utilisateur Antoine Rousseau', timestamp: '2024-03-13T09:00:00' },
    { id: 'a5', userId: 'u6', userName: 'Antoine Rousseau', action: 'REJECT', resource: 'TASK', resourceId: 'r4', details: 'Refus demande REQ-2024-0038 — Budget insuffisant', timestamp: '2024-03-06T10:00:00' },
    { id: 'a6', userId: 'u1', userName: 'Marie Dupont', action: 'UPDATE', resource: 'WORKFLOW', resourceId: 'wf1', details: 'Mise à jour workflow "Achat Standard" — SLA ajusté', timestamp: '2024-03-04T16:00:00' },
];
// ─── MOCK NOTIFICATIONS ───────────────────────────────────────────────────────
export const NOTIFICATIONS = [
    { id: 'notif1', userId: 'u2', message: 'Votre demande REQ-2024-0042 est en cours de validation Direction', type: 'INFO', read: false, createdAt: '2024-03-15T14:30:00', link: '/demandes/r1' },
    { id: 'notif2', userId: 'u2', message: 'Demande de congé REQ-2024-0041 approuvée', type: 'SUCCESS', read: false, createdAt: '2024-03-11T09:01:00', link: '/demandes/r2' },
    { id: 'notif3', userId: 'u2', message: 'Rappel : REQ-2024-0039 en attente de traitement — SLA dépassé', type: 'WARNING', read: true, createdAt: '2024-03-09T08:00:00', link: '/demandes/r3' },
    { id: 'notif4', userId: 'u3', message: 'Nouvelle tâche disponible dans l\'espace Finance', type: 'INFO', read: false, createdAt: '2024-03-18T09:05:00' },
];
