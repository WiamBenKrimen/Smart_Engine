import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../../../app/providers/AuthProvider';
import loginBg from '../../../assets/images/login-bg.jpg';
import SmartEngineLogo from '../../../components/SmartEngineLogo';

const DEMO_ACCOUNTS = [
  { email: 'admin@smartengine.com', password: 'Admin123!', role: 'Admin', name: 'Admin Smart Engine', initials: 'AS' },
  { email: 'mohamed@smartengine.com', password: 'User123!', role: 'Employe', name: 'Mohamed Alaoui', initials: 'MA' },
  { email: 'sara@smartengine.com', password: 'User123!', role: 'Employe', name: 'Sara El Mansouri', initials: 'SE' },
];

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async event => {
    event.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);
    setLoading(false);

    if (!result.success) {
      setError(result.error ?? 'Identifiants incorrects');
      return;
    }

    const user = result.user;
    if (user.role === 'ADMIN') navigate('/admin');
    else if (user.workspaceIds?.length > 1) navigate('/workspace-select');
    else if (user.workspaceIds?.length === 1) navigate(`/workspaces/${user.workspaceIds[0]}`);
    else navigate('/employee');
  };

  return (
    <div className="min-h-screen flex bg-white">
      <div className="flex-1 flex flex-col justify-center px-8 md:px-16 xl:px-24 py-12 max-w-xl xl:max-w-2xl">
        <div className="flex items-center gap-2.5 mb-12">
          <SmartEngineLogo className="h-10 w-10" />
          <div>
            <span className="font-bold text-[#172033] text-base tracking-tight">Smart Engine</span>
            <span className="block text-[10px] text-[#8898AA] font-medium uppercase tracking-widest">BPM Platform</span>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-[#172033] tracking-tight mb-2">Bienvenue</h1>
        <p className="text-[#8898AA] text-sm mb-8">Connectez-vous pour acceder a votre espace de travail.</p>

        {error && (
          <div className="flex items-center gap-2.5 bg-[#FEF2F2] border border-[#FECACA] rounded-xl p-3.5 mb-6 text-sm text-[#DC2626]">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-[#4A5568] uppercase tracking-wider mb-2">Adresse email</label>
            <input
              type="email"
              value={email}
              onChange={event => setEmail(event.target.value)}
              placeholder="vous@example.com"
              required
              className="w-full px-4 py-3.5 bg-[#F4F6F8] border border-transparent rounded-xl text-sm text-[#172033] placeholder-[#B0BEC9] focus:outline-none focus:bg-white focus:border-[#1F4E79] focus:ring-2 focus:ring-[#1F4E79]/20 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#4A5568] uppercase tracking-wider mb-2">Mot de passe</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={event => setPassword(event.target.value)}
                placeholder="********"
                required
                className="w-full px-4 py-3.5 pr-12 bg-[#F4F6F8] border border-transparent rounded-xl text-sm text-[#172033] placeholder-[#B0BEC9] focus:outline-none focus:bg-white focus:border-[#1F4E79] focus:ring-2 focus:ring-[#1F4E79]/20 transition-all"
              />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8898AA] hover:text-[#4A5568]">
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 bg-[#1F4E79] hover:bg-[#172033] text-white font-semibold py-3.5 rounded-xl transition-colors disabled:opacity-60 shadow-sm mt-2">
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Connexion...
              </>
            ) : (
              <>
                Se connecter <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="text-xs text-[#8898AA] mt-6 text-center">
          <Link to="/forgot-password" className="font-semibold text-[#1F4E79] hover:text-[#172033]">
            Mot de passe oublie ?
          </Link>
        </p>

        <div className="mt-10 pt-8 border-t border-[#EAEEF2]">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#B0BEC9] mb-4">Comptes de demonstration</p>
          <div className="space-y-2">
            {DEMO_ACCOUNTS.map(account => (
              <button
                key={account.email}
                onClick={() => {
                  setEmail(account.email);
                  setPassword(account.password);
                  setError('');
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-[#EAEEF2] hover:border-[#1F4E79]/40 hover:bg-[#EBF2F9] transition-colors text-left group"
              >
                <div className="w-8 h-8 bg-[#EBF2F9] group-hover:bg-[#C5D9EE] rounded-full flex items-center justify-center text-xs font-bold text-[#1F4E79] flex-shrink-0 transition-colors">{account.initials}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-[#172033] truncate">{account.name}</p>
                  <p className="text-[10px] text-[#8898AA] truncate">{account.email}</p>
                </div>
                <span className="text-[10px] bg-[#EBF2F9] text-[#1F4E79] px-2 py-0.5 rounded-full font-medium flex-shrink-0">{account.role}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="relative hidden flex-1 overflow-hidden bg-[#172033] lg:flex">
        <div className="absolute inset-0 z-10 bg-gradient-to-br from-[#0F1520] via-[#1F4E79] to-[#2D73BE] opacity-80" />
        <img src={loginBg} alt="Smart Engine Platform" className="absolute inset-0 w-full h-full object-cover object-center" />
        <div className="relative z-20 flex flex-col justify-end p-12 w-full">
          <div className="backdrop-blur-sm bg-white/10 border border-white/20 rounded-2xl p-6 max-w-sm">
            <h2 className="text-xl font-bold text-white mb-2 leading-tight">
              Gere vos processus
              <br />
              en toute simplicite
            </h2>
            <p className="text-white/70 text-sm leading-relaxed">
              Formulaires dynamiques, workflows d'approbation, suivi en temps reel dans une seule plateforme.
            </p>
            <div className="flex gap-4 mt-4 pt-4 border-t border-white/20">
              {[
                ['Processus', '12'],
                ['Demandes', '347'],
                ['Equipes', '5'],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-xl font-bold text-white">{value}</p>
                  <p className="text-[11px] text-white/50 font-medium">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
