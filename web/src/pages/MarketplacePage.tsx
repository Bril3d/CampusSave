import { useEffect, useState } from 'react';
import { MapPin, Search } from 'lucide-react';
import { OfferCard } from '../components/OfferCard';
import { useOffers } from '../hooks/useOffers';
import type { Offer } from '../types';

interface MarketplacePageProps {
  onSelectOffer: (offer: Offer) => void;
  refreshSignal: number;
}

const CATEGORIES = ['Toutes', 'Boulangerie', 'Plats chauds', 'Sandwichs', 'Pâtisserie & Jus', 'Panier Surprise'];

export function MarketplacePage({ onSelectOffer, refreshSignal }: MarketplacePageProps) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Toutes');
  const [commerceId, setCommerceId] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const { offers, commerces, loading, error, refresh } = useOffers({
    search,
    category,
    commerceId,
    maxPrice,
  });

  useEffect(() => {
    if (refreshSignal > 0) {
      refresh();
    }
  }, [refreshSignal, refresh]);

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-14">
      {/* Hero Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div className="lg:col-span-6 flex flex-col justify-center space-y-6 py-4">
          <p className="text-sm font-medium text-teal-800">
            ESSECT Tunis · Montfleury et alentours
          </p>
          <h1
            className="font-display font-bold text-slate-900 tracking-tight leading-[1.12]"
            style={{ fontSize: 'clamp(2rem, 3.8vw, 3.25rem)', textWrap: 'balance' }}
          >
            Sauvez les invendus du campus à prix étudiant.
          </h1>
          <p className="text-base text-slate-600 leading-relaxed max-w-xl">
            Réservez les paniers frais des boulangeries et restaurants partenaires autour de l&apos;ESSECT, réglez en ligne avec Konnect et récupérez votre commande grâce à un QR Code unique.
          </p>
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <a
              href="#catalogue-offres"
              className="px-6 py-3 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors whitespace-nowrap"
            >
              Découvrir les offres du jour
            </a>
            <span className="text-sm text-slate-500 tabular-nums">
              {offers.length} offre(s) disponible(s) · {commerces.length} commerce(s) validé(s)
            </span>
          </div>
        </div>

        <div className="lg:col-span-6 rounded-xl overflow-hidden border border-stone-200 bg-stone-100 min-h-[260px]">
          <img
            src="/src/assets/images/hero_campus_food_1794947730758.jpg"
            alt="Paniers alimentaires CampusSave prêts pour le retrait"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </div>
      </section>

      {/* Search & Filters */}
      <section id="catalogue-offres" className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold text-slate-900">
              Offres alimentaires disponibles
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Filtrez par catégorie, commerce partenaire ou budget maximum.
            </p>
          </div>
          <button
            type="button"
            onClick={refresh}
            className="self-start md:self-auto px-3.5 py-2 text-xs font-medium text-slate-700 border border-stone-300 bg-white hover:bg-stone-50 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
          >
            Actualiser les stocks
          </button>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-5 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un plat, croissant, sandwich..."
                className="w-full pl-10 pr-3.5 py-2.5 text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700"
              />
            </div>

            <div className="md:col-span-4">
              <select
                aria-label="Filtrer par commerce"
                value={commerceId}
                onChange={(e) => setCommerceId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-stone-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-700"
              >
                <option value="">Tous les commerces</option>
                {commerces.map((commerce) => (
                  <option key={commerce.id} value={commerce.id}>
                    {commerce.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-3">
              <select
                aria-label="Budget maximum"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-stone-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-700"
              >
                <option value="">Tous les prix</option>
                <option value="5">Moins de 5.00 DT</option>
                <option value="7">Moins de 7.00 DT</option>
                <option value="10">Moins de 10.00 DT</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-stone-100 rounded-lg">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  category === cat
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white border border-stone-200 rounded-xl h-80 animate-pulse" />
            ))}
          </div>
        )}

        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-sm text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && offers.length === 0 && (
          <div className="bg-white border border-stone-200 rounded-xl p-10 text-center space-y-3">
            <p className="font-display text-lg font-semibold text-slate-900">
              Aucune offre ne correspond à vos critères
            </p>
            <p className="text-sm text-slate-600">
              Essayez d&apos;élargir votre recherche ou réinitialisez les filtres.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setCategory('Toutes');
                setCommerceId('');
                setMaxPrice('');
              }}
              className="px-4 py-2 text-sm font-medium text-teal-800 border border-teal-700 rounded-lg hover:bg-teal-50 cursor-pointer"
            >
              Réinitialiser les filtres
            </button>
          </div>
        )}

        {!loading && !error && offers.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {offers.map((offer) => (
              <OfferCard key={offer.id} offer={offer} onSelect={onSelectOffer} />
            ))}
          </div>
        )}
      </section>

      {/* Approved Commerces Strip */}
      <section className="space-y-6 pt-4 border-t border-stone-200">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-900">
            Établissements partenaires autour de l&apos;ESSECT
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Tous les commerces partenaires sont vérifiés par l&apos;administration CampusSave.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {commerces.map((commerce) => (
            <div
              key={commerce.id}
              className="bg-white border border-stone-200 rounded-xl p-5 flex flex-col justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-display text-lg font-semibold text-slate-900">
                    {commerce.name}
                  </h3>
                  <span className="text-xs font-medium text-teal-800 whitespace-nowrap">
                    {commerce.distanceLabel}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  {commerce.category} · Horaires {commerce.openingHours}
                </p>
                <p className="text-sm text-slate-600 leading-relaxed">{commerce.description}</p>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-stone-100 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {commerce.address}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setCommerceId(commerce.id);
                    document.getElementById('catalogue-offres')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="font-semibold text-teal-800 hover:underline whitespace-nowrap cursor-pointer"
                >
                  Voir ses offres
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
