import { useAuth } from '../context/AuthContext';
import type { AppView } from '../services/api';

interface NavbarProps {
  activeView: AppView;
  onNavigate: (view: AppView) => void;
  onOpenAuth: () => void;
}

export function Navbar({ activeView, onNavigate, onOpenAuth }: NavbarProps) {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    onNavigate('marketplace');
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-stone-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        <button
          type="button"
          onClick={() => onNavigate('marketplace')}
          className="font-display text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 cursor-pointer"
        >
          CampusSave
        </button>

        <nav className="flex items-center gap-6 text-sm font-medium text-slate-600 overflow-x-auto">
          <button
            type="button"
            onClick={() => onNavigate('marketplace')}
            className={`whitespace-nowrap shrink-0 py-1 transition-colors cursor-pointer ${
              activeView === 'marketplace'
                ? 'text-teal-800 border-b-2 border-teal-700 font-semibold'
                : 'hover:text-slate-900'
            }`}
          >
            Offres ESSECT
          </button>

          {user?.role === 'student' && (
            <button
              type="button"
              onClick={() => onNavigate('student_orders')}
              className={`whitespace-nowrap shrink-0 py-1 transition-colors cursor-pointer ${
                activeView === 'student_orders'
                  ? 'text-teal-800 border-b-2 border-teal-700 font-semibold'
                  : 'hover:text-slate-900'
              }`}
            >
              Mes commandes
            </button>
          )}

          {user?.role === 'merchant' && (
            <button
              type="button"
              onClick={() => onNavigate('merchant_dashboard')}
              className={`whitespace-nowrap shrink-0 py-1 transition-colors cursor-pointer ${
                activeView === 'merchant_dashboard'
                  ? 'text-teal-800 border-b-2 border-teal-700 font-semibold'
                  : 'hover:text-slate-900'
              }`}
            >
              Espace commerçant
            </button>
          )}

          {user?.role === 'admin' && (
            <button
              type="button"
              onClick={() => onNavigate('admin_dashboard')}
              className={`whitespace-nowrap shrink-0 py-1 transition-colors cursor-pointer ${
                activeView === 'admin_dashboard'
                  ? 'text-teal-800 border-b-2 border-teal-700 font-semibold'
                  : 'hover:text-slate-900'
              }`}
            >
              Administration
            </button>
          )}
        </nav>

        <div className="flex items-center gap-4 shrink-0">
          {user ? (
            <div className="flex items-center gap-4">
              <span className="hidden sm:inline text-sm text-slate-600 whitespace-nowrap truncate max-w-[180px]">
                {user.fullName}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Déconnexion
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="px-4 py-2 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Connexion
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
