import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Database,
  FormInput,
  LayoutDashboard,
  Lock,
  ShieldCheck,
  Users,
  Workflow,
  Zap,
} from 'lucide-react';
import heroImage from '../../assets/home-hero.png';

const projectModules = [
  { icon: FormInput, title: 'Form Builder', text: 'Construire les formulaires metier sans creer une nouvelle page React.' },
  { icon: Workflow, title: 'Workflow Designer', text: 'Dessiner START, APPROVAL, CONDITION et END dans un canvas visuel.' },
  { icon: Users, title: 'Workspaces', text: 'Affecter les validations a des equipes dynamiques comme Finance, RH ou Direction.' },
  { icon: ClipboardList, title: 'Demandes', text: 'Creer et suivre les dossiers reels envoyes par les employes.' },
  { icon: Clock3, title: 'SLA & taches', text: 'Suivre les taches en attente, en cours, en retard et terminees.' },
  { icon: BarChart3, title: 'Audit & dashboards', text: 'Tracer les decisions et afficher les indicateurs de pilotage.' },
];

const actorFlows = [
  { title: 'Administrateur', text: 'Configure les Workspaces, formulaires, workflows et processus publies.' },
  { title: 'Employe', text: 'Remplit un formulaire, envoie une demande et suit son avancement.' },
  { title: 'Membre Workspace', text: 'Prend en charge les taches de son equipe, approuve ou refuse.' },
];

function ModuleCard({ icon: Icon, title, text }) {
  return (
    <article className="module-card">
      <div className="module-icon"><Icon size={22} /></div>
      <h3>{title}</h3>
      <p>{text}</p>
    </article>
  );
}

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      <header className="site-header">
        <div className="container site-nav">
          <a className="brand" href="/">
            <div className="brand-mark"><Zap size={18} /></div>
            <span>Smart Engine</span>
          </a>

          <nav>
            <a href="#modules">Modules</a>
            <a href="#workflow">Fonctionnement</a>
            <a href="#security">Securite</a>
          </nav>

          <button type="button" className="primary-button small" onClick={() => navigate('/login')}>
            Se connecter <ArrowRight size={16} />
          </button>
        </div>
      </header>

      <main>
        <section className="hero-section">
          <div className="container hero-layout">
            <div className="hero-text">
              <div className="hero-pill">Plateforme Low-Code BPM</div>
              <h1>Concevoir, executer et suivre vos processus metier.</h1>
              <p>
                Smart Engine transforme les procedures internes en formulaires, workflows,
                demandes, taches, SLA et historiques exploitables depuis une seule application.
              </p>

              <div className="hero-actions">
                <button type="button" className="primary-button large" onClick={() => navigate('/login')}>
                  Acceder a la plateforme <ArrowRight size={17} />
                </button>
                <a className="text-link" href="#workflow">Voir le fonctionnement</a>
              </div>

              <div className="hero-proof">
                <span><CheckCircle2 size={16} /> React + Spring Boot</span>
                <span><CheckCircle2 size={16} /> MySQL</span>
                <span><CheckCircle2 size={16} /> Workspaces dynamiques</span>
              </div>
            </div>

            <div className="hero-image-frame">
              <img src={heroImage} alt="Interface Smart Engine" />
            </div>
          </div>
        </section>

        <section className="status-strip">
          <div className="container strip-grid">
            <div><strong>Configuration</strong><span>Formulaires, workflows et processus</span></div>
            <div><strong>Execution</strong><span>Demandes, instances et taches</span></div>
            <div><strong>Controle</strong><span>SLA, audit et notifications</span></div>
            <div><strong>Integration</strong><span>API REST, MySQL et n8n</span></div>
          </div>
        </section>

        <section id="modules" className="content-section">
          <div className="container">
            <div className="section-heading split">
              <div>
                <span>Modules du projet</span>
                <h2>Une structure claire pour le MVP Smart Engine</h2>
              </div>
              <p>
                Ces blocs correspondent directement au cahier des charges : configuration par
                l administrateur, execution par le moteur, traitement par les Workspaces.
              </p>
            </div>

            <div className="modules-grid">
              {projectModules.map((module) => <ModuleCard key={module.title} {...module} />)}
            </div>
          </div>
        </section>

        <section id="workflow" className="content-section soft-section">
          <div className="container workflow-layout">
            <div className="section-heading">
              <span>Fonctionnement</span>
              <h2>Un processus est configure une fois, puis execute pour chaque demande.</h2>
              <p>
                Le Workflow est le modele. La WorkflowInstance est l execution reelle pour une
                demande precise. Les taches sont creees uniquement lorsqu une validation humaine
                est necessaire.
              </p>
            </div>

            <div className="actor-list">
              {actorFlows.map((item, index) => (
                <article key={item.title} className="actor-row">
                  <div className="actor-index">{String(index + 1).padStart(2, '0')}</div>
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.text}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="security" className="content-section">
          <div className="container security-grid">
            <div className="security-copy">
              <span>Securite et donnees</span>
              <h2>Des acces adaptes aux acteurs et aux Workspaces.</h2>
              <p>
                ADMIN est un privilege systeme. Finance, RH ou Direction sont des Workspaces
                crees en base de donnees et reutilisables dans plusieurs workflows.
              </p>
              <button type="button" className="primary-button" onClick={() => navigate('/login')}>
                Continuer vers la connexion <ArrowRight size={16} />
              </button>
            </div>

            <div className="security-cards">
              <article>
                <ShieldCheck size={24} />
                <h3>Spring Security + JWT</h3>
                <p>Authentification et protection des endpoints API.</p>
              </article>
              <article>
                <Database size={24} />
                <h3>MySQL</h3>
                <p>Stockage des configurations et donnees d execution.</p>
              </article>
              <article>
                <Lock size={24} />
                <h3>Audit</h3>
                <p>Historique des creations, validations, refus et depassements SLA.</p>
              </article>
              <article>
                <LayoutDashboard size={24} />
                <h3>Dashboards</h3>
                <p>Vue admin, employe et Workspace pour piloter les demandes.</p>
              </article>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container footer-inner">
          <div className="brand footer-brand">
            <div className="brand-mark"><Zap size={16} /></div>
            <span>Smart Engine</span>
          </div>
          <p>Plateforme Low-Code de gestion des processus metier.</p>
        </div>
      </footer>
    </div>
  );
}
