import { BarChart3, BriefcaseBusiness, CalendarDays, FileText, GraduationCap, HeartPulse, KeyRound, Package, ReceiptText, ShoppingCart, ToolCase, UserRoundSearch, Building2, ClipboardList } from 'lucide-react';
const ICONS = [
    { match: ['🛒', 'achat'], icon: ShoppingCart },
    { match: ['🏖️', 'congé', 'absence'], icon: CalendarDays },
    { match: ['💳', 'frais', 'dépense'], icon: ReceiptText },
    { match: ['👥', 'recrutement'], icon: UserRoundSearch },
    { match: ['🏥', 'santé'], icon: HeartPulse },
    { match: ['🏢', 'bureau'], icon: Building2 },
    { match: ['💼', 'mission'], icon: BriefcaseBusiness },
    { match: ['🎓', 'formation'], icon: GraduationCap },
    { match: ['🔧', 'maintenance'], icon: ToolCase },
    { match: ['💸', 'remboursement'], icon: ReceiptText },
    { match: ['📄', 'document'], icon: FileText },
    { match: ['📊', 'rapport'], icon: BarChart3 },
    { match: ['🔑', 'accès'], icon: KeyRound },
    { match: ['📦', 'commande'], icon: Package },
];
export default function ProcessIcon({ icon = '', name = '', className = 'h-5 w-5' }) {
    const value = `${icon} ${name}`.toLocaleLowerCase('fr');
    const Icon = ICONS.find(item => item.match.some(keyword => value.includes(keyword)))?.icon ?? ClipboardList;
    return <Icon className={className} strokeWidth={1.8} aria-hidden="true"/>;
}
