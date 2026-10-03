import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, LockKeyhole } from 'lucide-react';
import { authApi } from '../../../api/authApi';
import SmartEngineLogo from '../../../components/SmartEngineLogo';

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const initialToken = useMemo(() => params.get('token') || '', [params]);
  const [token, setToken] = useState(initialToken);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async event => {
    event.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Les deux mots de passe ne sont pas identiques.');
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword({ token, newPassword });
      navigate('/login', { replace: true });
    } catch (err) {
      setError(err.message || 'Impossible de modifier le mot de passe.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F6F8] px-6">
      <div className="w-full max-w-md bg-white border border-[#EAEEF2] rounded-2xl p-8 shadow-sm">
        <div className="flex items-center gap-2.5 mb-8">
          <SmartEngineLogo className="h-10 w-10" />
          <div>
            <span className="font-bold text-[#172033] text-base">Smart Engine</span>
            <span className="block text-[10px] text-[#8898AA] font-medium uppercase tracking-widest">BPM Platform</span>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-[#172033] mb-2">Nouveau mot de passe</h1>
        <p className="text-sm text-[#8898AA] mb-6">Choisissez un mot de passe de 8 caracteres minimum.</p>

        {error && <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-xl p-3 mb-4 text-sm text-[#DC2626]">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-[#4A5568] uppercase tracking-wider mb-2">Token</label>
            <input
              value={token}
              onChange={event => setToken(event.target.value)}
              required
              className="w-full px-4 py-3.5 bg-[#F4F6F8] border border-transparent rounded-xl text-sm text-[#172033] focus:outline-none focus:bg-white focus:border-[#1F4E79] focus:ring-2 focus:ring-[#1F4E79]/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#4A5568] uppercase tracking-wider mb-2">Nouveau mot de passe</label>
            <div className="relative">
              <LockKeyhole className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#8898AA]" />
              <input
                type="password"
                value={newPassword}
                onChange={event => setNewPassword(event.target.value)}
                minLength={8}
                required
                className="w-full pl-11 pr-4 py-3.5 bg-[#F4F6F8] border border-transparent rounded-xl text-sm text-[#172033] focus:outline-none focus:bg-white focus:border-[#1F4E79] focus:ring-2 focus:ring-[#1F4E79]/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#4A5568] uppercase tracking-wider mb-2">Confirmation</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={event => setConfirmPassword(event.target.value)}
              minLength={8}
              required
              className="w-full px-4 py-3.5 bg-[#F4F6F8] border border-transparent rounded-xl text-sm text-[#172033] focus:outline-none focus:bg-white focus:border-[#1F4E79] focus:ring-2 focus:ring-[#1F4E79]/20"
            />
          </div>

          <button type="submit" disabled={loading} className="w-full bg-[#1F4E79] hover:bg-[#172033] text-white font-semibold py-3.5 rounded-xl disabled:opacity-60">
            {loading ? 'Modification...' : 'Modifier le mot de passe'}
          </button>
        </form>

        <Link to="/login" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#1F4E79] hover:text-[#172033]">
          <ArrowLeft className="w-4 h-4" /> Retour connexion
        </Link>
      </div>
    </div>
  );
}
