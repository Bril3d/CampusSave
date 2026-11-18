import { useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { SafeUser } from '../types';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onAuthenticated: (user: SafeUser) => void;
}

export function AuthModal({ open, onClose, onAuthenticated }: AuthModalProps) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [role, setRole] = useState<'student' | 'merchant'>('student');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const user =
        mode === 'login'
          ? await login(email, password)
          : await register({ fullName, email, phone, password, role });
      onAuthenticated(user);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur d\'authentification.');
    } finally {
      setSubmitting(false);
    }
  };

  const quickLogin = async (demoEmail: string, demoPassword: string) => {
    setError(null);
    setSubmitting(true);
    try {
      const user = await login(demoEmail, demoPassword);
      onAuthenticated(user);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de connexion.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-stone-200 rounded-xl w-full max-w-md p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl font-bold text-slate-900">
            {mode === 'login' ? 'Connexion à CampusSave' : 'Créer un compte'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-1 p-1 bg-stone-100 rounded-lg mb-6">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`py-2 text-sm font-medium rounded-md transition-colors cursor-pointer ${
              mode === 'login' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Se connecter
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`py-2 text-sm font-medium rounded-md transition-colors cursor-pointer ${
              mode === 'register' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            S&apos;inscrire
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Type de compte</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('student')}
                    className={`py-2 px-3 text-sm font-medium rounded-lg border transition-colors cursor-pointer ${
                      role === 'student'
                        ? 'border-teal-700 bg-teal-50 text-teal-900'
                        : 'border-stone-200 text-slate-700 hover:bg-stone-50'
                    }`}
                  >
                    Étudiant ESSECT
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('merchant')}
                    className={`py-2 px-3 text-sm font-medium rounded-lg border transition-colors cursor-pointer ${
                      role === 'merchant'
                        ? 'border-teal-700 bg-teal-50 text-teal-900'
                        : 'border-stone-200 text-slate-700 hover:bg-stone-50'
                    }`}
                  >
                    Commerçant
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="auth-fullname" className="block text-sm font-medium text-slate-700 mb-1">
                  Nom complet
                </label>
                <input
                  id="auth-fullname"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ex : Aicha Menif"
                  className="w-full px-3.5 py-2.5 text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700"
                />
              </div>

              <div>
                <label htmlFor="auth-phone" className="block text-sm font-medium text-slate-700 mb-1">
                  Téléphone
                </label>
                <input
                  id="auth-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+216 22 000 000"
                  className="w-full px-3.5 py-2.5 text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700"
                />
              </div>
            </>
          )}

          <div>
            <label htmlFor="auth-email" className="block text-sm font-medium text-slate-700 mb-1">
              Adresse e-mail
            </label>
            <input
              id="auth-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="etudiant@essect.tn"
              className="w-full px-3.5 py-2.5 text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700"
            />
          </div>

          <div>
            <label htmlFor="auth-password" className="block text-sm font-medium text-slate-700 mb-1">
              Mot de passe
            </label>
            <input
              id="auth-password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 caractères"
              className="w-full px-3.5 py-2.5 text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700"
            />
          </div>

          {error && (
            <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 disabled:opacity-60 rounded-lg transition-colors cursor-pointer"
          >
            {submitting
              ? 'Traitement...'
              : mode === 'login'
                ? 'Se connecter'
                : 'Créer mon compte'}
          </button>
        </form>

        {mode === 'login' && (
          <div className="mt-6 pt-5 border-t border-stone-200">
            <p className="text-xs font-medium text-slate-500 mb-3">
              Accès rapide de démonstration par rôle :
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                disabled={submitting}
                onClick={() => quickLogin('etudiant@essect.tn', 'Student123!')}
                className="py-2 px-2 text-xs font-medium text-slate-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
              >
                Étudiant
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => quickLogin('boulangerie@montfleury.tn', 'Merchant123!')}
                className="py-2 px-2 text-xs font-medium text-slate-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
              >
                Commerçant
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => quickLogin('admin@campussave.tn', 'Admin123!')}
                className="py-2 px-2 text-xs font-medium text-slate-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
              >
                Admin
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
