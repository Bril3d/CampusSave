import { useState } from 'react';
import { AuthModal } from './components/AuthModal';
import { Navbar } from './components/Navbar';
import { OfferDetailModal } from './components/OfferDetailModal';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { MarketplacePage } from './pages/MarketplacePage';
import { MerchantDashboardPage } from './pages/MerchantDashboardPage';
import { StudentOrdersPage } from './pages/StudentOrdersPage';
import { defaultViewForRole, type AppView } from './services/api';
import type { Offer, SafeUser } from './types';

function CampusSaveShell() {
  const { user, loading } = useAuth();
  const [activeView, setActiveView] = useState<AppView>('marketplace');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [refreshSignal, setRefreshSignal] = useState(0);

  const handleAuthenticated = (loggedUser: SafeUser) => {
    setActiveView(defaultViewForRole(loggedUser.role));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafaf9] text-sm text-slate-500">
        Chargement de CampusSave...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#fafaf9] text-slate-900">
      <Navbar
        activeView={activeView}
        onNavigate={setActiveView}
        onOpenAuth={() => setAuthModalOpen(true)}
      />

      <div className="flex-1">
        {activeView === 'marketplace' && (
          <MarketplacePage
            onSelectOffer={(offer) => setSelectedOffer(offer)}
            refreshSignal={refreshSignal}
          />
        )}
        {activeView === 'student_orders' && user?.role === 'student' && <StudentOrdersPage />}
        {activeView === 'merchant_dashboard' && user?.role === 'merchant' && <MerchantDashboardPage />}
        {activeView === 'admin_dashboard' && user?.role === 'admin' && <AdminDashboardPage />}
      </div>

      <footer className="border-t border-stone-200 bg-white mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>CampusSave · ESSECT Tunis — Plateforme anti-gaspillage alimentaire</p>
          <p>Paiements sécurisés Konnect (Mode Test)</p>
        </div>
      </footer>

      <AuthModal
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuthenticated={handleAuthenticated}
      />

      <OfferDetailModal
        offer={selectedOffer}
        onClose={() => setSelectedOffer(null)}
        onRequireAuth={() => {
          setSelectedOffer(null);
          setAuthModalOpen(true);
        }}
        onOrderCompleted={() => setRefreshSignal((n) => n + 1)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CampusSaveShell />
    </AuthProvider>
  );
}
