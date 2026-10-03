import { useNavigate } from 'react-router-dom';
import { ArrowRight, BarChart3, CheckCircle2, ClipboardList, Clock3, BellRing, FormInput, LayoutDashboard, Lock, ShieldCheck, Users, Workflow, } from 'lucide-react';
import heroImage from '../../../assets/images/home-hero.png';
import SmartEngineLogo from '../../../components/SmartEngineLogo';
const projectModules = [
    { icon: FormInput, title: 'Des formulaires à votre image', text: 'Créez rapidement les champs dont vos équipes ont besoin, sans développement ni outil externe.' },
    { icon: Workflow, title: 'Des validations automatiques', text: 'Définissez qui intervient, dans quel ordre et selon quelles conditions. Smart Engine orchestre la suite.' },
    { icon: Users, title: 'Chaque demande au bon endroit', text: 'Finance, RH ou Direction reçoivent uniquement les tâches qui concernent leur Workspace.' },
    { icon: ClipboardList, title: 'Un suivi clair pour chacun', text: 'Les employés retrouvent leurs demandes, leur statut et chaque étape franchie depuis un seul espace.' },
    { icon: Clock3, title: 'Les priorités sous contrôle', text: 'Repérez immédiatement les tâches en attente ou en retard et respectez plus facilement vos délais.' },
    { icon: BarChart3, title: 'Une activité mesurable', text: 'Suivez les volumes, les délais et les décisions grâce à des dashboards et un historique complet.' },
];
const actorFlows = [
    { title: 'Configurez votre processus', text: 'Créez le formulaire, choisissez les équipes responsables et dessinez le circuit de validation.' },
    { title: 'Publiez-le auprès des équipes', text: 'Le nouveau processus rejoint immédiatement le catalogue de demandes des employés.' },
    { title: 'Laissez Smart Engine l’exécuter', text: 'Chaque soumission génère les bonnes tâches, alerte les bons acteurs et avance automatiquement.' },
];
const statusItems = [
    { title: 'Créez', text: 'Des formulaires et circuits adaptés à vos besoins' },
    { title: 'Automatisez', text: 'Les affectations, conditions et validations' },
    { title: 'Collaborez', text: 'Avec des espaces dédiés à chaque équipe' },
    { title: 'Pilotez', text: 'Les délais, décisions et résultats en temps réel' },
];
function ModuleCard({ icon: Icon, title, text }) {
    return (<article className="module-card">
      <div className="module-icon"><Icon size={22}/></div>
      <h3>{title}</h3>
      <p>{text}</p>
    </article>);
}
export default function Landing() {
    const navigate = useNavigate();
    return (<div className="landing-page">
      <header className="site-header">
        <div className="landing-container site-nav">
          <a className="brand" href="/">
            <SmartEngineLogo className="brand-logo"/>
            <span>Smart Engine</span>
          </a>

          <nav>
            <a href="#modules">Modules</a>
            <a href="#workflow">Fonctionnement</a>
            <a href="#security">Sécurité</a>
          </nav>

          <button type="button" className="primary-button small" onClick={() => navigate('/login')}>
            Se connecter <ArrowRight size={16}/>
          </button>
        </div>
      </header>

      <main>
        <section className="hero-section">
          <div className="landing-container hero-layout">
            <div className="hero-text">
              <div className="hero-pill">Vos processus, enfin simples</div>
              <h1>Transformez chaque demande en un parcours fluide.</h1>
              <p>
                Centralisez les demandes de vos équipes, automatisez les validations et gardez
                une vision claire de chaque dossier — sans multiplier les emails et les fichiers.
              </p>

              <div className="hero-actions">
                <button type="button" className="primary-button large" onClick={() => navigate('/login')}>
                  Découvrir Smart Engine <ArrowRight size={17}/>
                </button>
                <a className="text-link" href="#workflow">Voir le fonctionnement</a>
              </div>

              <div className="hero-proof">
                <span><CheckCircle2 size={16}/> Sans code complexe</span>
                <span><CheckCircle2 size={16}/> Suivi en temps réel</span>
                <span><CheckCircle2 size={16}/> Équipes bien coordonnées</span>
              </div>
            </div>

            <div className="hero-image-frame">
              <img src={heroImage} alt="Interface Smart Engine"/>
            </div>
          </div>
        </section>

        <section className="status-strip" aria-label="Les bénéfices Smart Engine">
          <div className="strip-track">
            {[0, 1].map(group => (<div className="strip-group" aria-hidden={group === 1} key={group}>
                {statusItems.map(item => (<div className="strip-item" key={`${group}-${item.title}`}>
                    <strong>{item.title}</strong>
                    <span>{item.text}</span>
                  </div>))}
              </div>))}
          </div>
        </section>

        <section id="modules" className="content-section">
          <div className="landing-container">
            <div className="section-heading split">
              <div>
                <span>Tout ce qu’il vous faut</span>
                <h2>Moins de tâches manuelles. Plus de visibilité.</h2>
              </div>
              <p>
                De la création d’un processus jusqu’à sa dernière validation, chaque fonctionnalité
                aide vos équipes à travailler plus vite et avec moins d’erreurs.
              </p>
            </div>

            <div className="modules-grid">
              {projectModules.map(module => <ModuleCard key={module.title} {...module}/>)}
            </div>
          </div>
        </section>

        <section id="workflow" className="content-section soft-section">
          <div className="landing-container workflow-layout">
            <div className="section-heading">
              <span>Simple à mettre en place</span>
              <h2>Créez une fois. Smart Engine s’occupe de chaque nouvelle demande.</h2>
              <p>
                Construisez votre parcours visuellement, publiez-le puis laissez le moteur guider
                chaque dossier. Les équipes interviennent seulement lorsqu’une décision humaine
                est réellement nécessaire.
              </p>
            </div>

            <div className="actor-list">
              {actorFlows.map((item, index) => (<article key={item.title} className="actor-row">
                  <div className="actor-index">{String(index + 1).padStart(2, '0')}</div>
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.text}</p>
                  </div>
                </article>))}
            </div>
          </div>
        </section>

        <section id="security" className="content-section">
          <div className="landing-container security-grid">
            <div className="security-copy">
              <span>Confiance et maîtrise</span>
              <h2>La bonne information, accessible à la bonne personne.</h2>
              <p>
                Chaque utilisateur dispose d’un espace adapté à son rôle. Les administrateurs
                configurent, les employés suivent leurs demandes et les équipes valident les
                dossiers qui leur sont confiés.
              </p>
              <button type="button" className="primary-button" onClick={() => navigate('/login')}>
                Commencer maintenant <ArrowRight size={16}/>
              </button>
            </div>

            <div className="security-cards">
              <article>
                <ShieldCheck size={24}/>
                <h3>Accès selon les rôles</h3>
                <p>Chaque profil accède uniquement aux actions et espaces qui le concernent.</p>
              </article>
              <article>
                <BellRing size={24}/>
                <h3>Notifications utiles</h3>
                <p>Les utilisateurs sont informés lorsqu’une demande nécessite leur attention.</p>
              </article>
              <article>
                <Lock size={24}/>
                <h3>Historique transparent</h3>
                <p>Chaque création, validation et refus reste consultable dans le journal d’audit.</p>
              </article>
              <article>
                <LayoutDashboard size={24}/>
                <h3>Une vue pour chacun</h3>
                <p>Des dashboards dédiés aux administrateurs, employés et membres des Workspaces.</p>
              </article>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="landing-container footer-inner">
          <div className="brand footer-brand">
            <SmartEngineLogo className="brand-logo" inverse/>
            <span>Smart Engine</span>
          </div>
          <p>Plateforme Low-Code de gestion des processus métier.</p>
        </div>
      </footer>
    </div>);
}
