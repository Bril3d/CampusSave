import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { CheckCircle2, QrCode, Store, Trash2 } from 'lucide-react';
import { merchantApi } from '../services/api';
import type { Commerce, MerchantDashboardStats, Offer, Order } from '../types';

export function MerchantDashboardPage() {
  const [commerces, setCommerces] = useState<Commerce[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<MerchantDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // QR Validation
  const [qrInput, setQrInput] = useState('');
  const [qrResult, setQrResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [validatingQr, setValidatingQr] = useState(false);

  // Commerce form
  const [comName, setComName] = useState('');
  const [comCategory, setComCategory] = useState('Boulangerie & Pâtisserie');
  const [comAddress, setComAddress] = useState('');
  const [comDistance, setComDistance] = useState('2 min de l\'ESSECT');
  const [comHours, setComHours] = useState('08:00 - 19:30');
  const [comDesc, setComDesc] = useState('');

  // Offer form
  const [selectedCommerceId, setSelectedCommerceId] = useState('');
  const [offerTitle, setOfferTitle] = useState('');
  const [offerDesc, setOfferDesc] = useState('');
  const [offerCategory, setOfferCategory] = useState<Offer['category']>('Boulangerie');
  const [origPrice, setOrigPrice] = useState('12');
  const [discPrice, setDiscPrice] = useState('5');
  const [qty, setQty] = useState('5');
  const [pickupWindow, setPickupWindow] = useState('17:30 - 19:30');
  const [submitting, setSubmitting] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashRes, ordRes] = await Promise.all([
        merchantApi.dashboard(),
        merchantApi.orders(),
      ]);
      setCommerces(dashRes.commerces);
      setOffers(dashRes.offers);
      setStats(dashRes.stats);
      setOrders(ordRes.orders);

      const firstApproved = dashRes.commerces.find((c) => c.status === 'approved');
      if (firstApproved && !selectedCommerceId) {
        setSelectedCommerceId(firstApproved.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement.');
    } finally {
      setLoading(false);
    }
  }, [selectedCommerceId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleRegisterCommerce = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await merchantApi.createCommerce({
        name: comName,
        category: comCategory,
        address: comAddress,
        distanceLabel: comDistance,
        openingHours: comHours,
        description: comDesc,
      });
      setComName('');
      setComAddress('');
      setComDesc('');
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur d\'enregistrement.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateOffer = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await merchantApi.createOffer({
        commerceId: selectedCommerceId,
        title: offerTitle,
        description: offerDesc,
        category: offerCategory,
        originalPrice: Number(origPrice),
        discountedPrice: Number(discPrice),
        availableQuantity: Number(qty),
        pickupWindow,
      });
      setOfferTitle('');
      setOfferDesc('');
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStock = async (offer: Offer, delta: number) => {
    const nextQty = Math.max(0, offer.availableQuantity + delta);
    try {
      await merchantApi.updateOffer(offer.id, { availableQuantity: nextQty });
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de mettre à jour le stock.');
    }
  };

  const handleDeleteOffer = async (offerId: string) => {
    try {
      await merchantApi.deleteOffer(offerId);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Suppression impossible.');
    }
  };

  const handleValidateQr = async (e: FormEvent) => {
    e.preventDefault();
    setValidatingQr(true);
    setQrResult(null);
    try {
      const res = await merchantApi.validateQr(qrInput);
      setQrResult({
        ok: true,
        text: `${res.message} (${res.order.studentName} · ${res.order.quantity} × ${res.order.offerTitle})`,
      });
      setQrInput('');
      await loadAll();
    } catch (err) {
      setQrResult({
        ok: false,
        text: err instanceof Error ? err.message : 'QR Code invalide.',
      });
    } finally {
      setValidatingQr(false);
    }
  };

  const approvedCommerces = commerces.filter((c) => c.status === 'approved');

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      <div>
        <h1 className="font-display text-3xl font-bold text-slate-900">
          Espace commerçant
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Publiez vos invendus, suivez vos ventes et validez les QR Codes étudiants lors du retrait.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {stats && (
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-stone-200 rounded-xl p-5">
            <p className="text-xs text-slate-500">Offres actives</p>
            <p className="font-mono text-2xl font-bold text-slate-900 mt-1 tabular-nums">{stats.activeOffers}</p>
          </div>
          <div className="bg-white border border-stone-200 rounded-xl p-5">
            <p className="text-xs text-slate-500">En attente de retrait</p>
            <p className="font-mono text-2xl font-bold text-amber-700 mt-1 tabular-nums">{stats.awaitingPickup}</p>
          </div>
          <div className="bg-white border border-stone-200 rounded-xl p-5">
            <p className="text-xs text-slate-500">Portions sauvées</p>
            <p className="font-mono text-2xl font-bold text-slate-900 mt-1 tabular-nums">{stats.portionsSaved}</p>
          </div>
          <div className="bg-white border border-stone-200 rounded-xl p-5">
            <p className="text-xs text-slate-500">Chiffre d&apos;affaires</p>
            <p className="font-mono text-2xl font-bold text-teal-800 mt-1 tabular-nums">
              {stats.revenueTnd.toFixed(2)} DT
            </p>
          </div>
        </section>
      )}

      {/* QR Code Validation */}
      <section className="bg-white border border-stone-200 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <QrCode className="w-5 h-5 text-teal-700" />
          <h2 className="font-display text-lg font-bold text-slate-900">
            Valider un QR Code de retrait (usage unique)
          </h2>
        </div>

        <form onSubmit={handleValidateQr} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={qrInput}
            onChange={(e) => setQrInput(e.target.value)}
            placeholder="Collez ou saisissez le code (ex : CS-CMD-...)"
            className="flex-1 px-3.5 py-2.5 text-sm font-mono border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700"
          />
          <button
            type="submit"
            disabled={validatingQr || !qrInput.trim()}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 disabled:opacity-50 rounded-lg cursor-pointer whitespace-nowrap"
          >
            {validatingQr ? 'Vérification...' : 'Valider le retrait'}
          </button>
        </form>

        {qrResult && (
          <div
            className={`rounded-lg px-4 py-3 text-sm border flex items-center gap-2 ${
              qrResult.ok
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}
          >
            {qrResult.ok && <CheckCircle2 className="w-4 h-4 shrink-0" />}
            <span>{qrResult.text}</span>
          </div>
        )}
      </section>

      {/* My Commerces */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 bg-white border border-stone-200 rounded-xl p-6 space-y-5">
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-teal-700" />
            <h2 className="font-display text-lg font-bold text-slate-900">
              Mes établissements
            </h2>
          </div>

          {!loading && commerces.length > 0 && (
            <div className="space-y-3">
              {commerces.map((c) => (
                <div key={c.id} className="p-4 border border-stone-200 rounded-lg space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-sm text-slate-900">{c.name}</p>
                    <span
                      className={`text-xs font-semibold ${
                        c.status === 'approved'
                          ? 'text-emerald-700'
                          : c.status === 'rejected'
                            ? 'text-red-700'
                            : 'text-amber-700'
                      }`}
                    >
                      {c.status === 'approved' && 'Validé'}
                      {c.status === 'pending' && 'En attente admin'}
                      {c.status === 'rejected' && 'Refusé'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {c.category} · {c.address}
                  </p>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleRegisterCommerce} className="space-y-3 pt-2 border-t border-stone-200">
            <p className="text-sm font-semibold text-slate-900">Enregistrer un nouvel établissement</p>
            <input
              type="text"
              required
              value={comName}
              onChange={(e) => setComName(e.target.value)}
              placeholder="Nom du restaurant ou de la cafétéria"
              className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg"
            />
            <input
              type="text"
              required
              value={comCategory}
              onChange={(e) => setComCategory(e.target.value)}
              placeholder="Catégorie (ex : Boulangerie)"
              className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg"
            />
            <input
              type="text"
              required
              value={comAddress}
              onChange={(e) => setComAddress(e.target.value)}
              placeholder="Adresse près de l'ESSECT"
              className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={comDistance}
                onChange={(e) => setComDistance(e.target.value)}
                placeholder="Distance ESSECT"
                className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg"
              />
              <input
                type="text"
                value={comHours}
                onChange={(e) => setComHours(e.target.value)}
                placeholder="Horaires"
                className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg"
              />
            </div>
            <textarea
              rows={2}
              value={comDesc}
              onChange={(e) => setComDesc(e.target.value)}
              placeholder="Description courte de l'établissement"
              className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg"
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer"
            >
              Soumettre à validation admin
            </button>
          </form>
        </div>

        {/* Publish New Offer */}
        <div className="lg:col-span-7 bg-white border border-stone-200 rounded-xl p-6 space-y-5">
          <h2 className="font-display text-lg font-bold text-slate-900">
            Publier une offre d&apos;invendus
          </h2>

          {approvedCommerces.length === 0 ? (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-4">
              Vous devez disposer d&apos;au moins un commerce validé par l&apos;administrateur avant de publier des offres.
            </p>
          ) : (
            <form onSubmit={handleCreateOffer} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Établissement</label>
                  <select
                    value={selectedCommerceId}
                    onChange={(e) => setSelectedCommerceId(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg bg-white"
                  >
                    {approvedCommerces.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Catégorie</label>
                  <select
                    value={offerCategory}
                    onChange={(e) => setOfferCategory(e.target.value as Offer['category'])}
                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg bg-white"
                  >
                    <option value="Boulangerie">Boulangerie</option>
                    <option value="Plats chauds">Plats chauds</option>
                    <option value="Sandwichs">Sandwichs</option>
                    <option value="Pâtisserie & Jus">Pâtisserie &amp; Jus</option>
                    <option value="Panier Surprise">Panier Surprise</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Titre de l&apos;offre</label>
                <input
                  type="text"
                  required
                  value={offerTitle}
                  onChange={(e) => setOfferTitle(e.target.value)}
                  placeholder="Ex : Panier Viennoiseries 18h"
                  className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
                <textarea
                  rows={2}
                  required
                  value={offerDesc}
                  onChange={(e) => setOfferDesc(e.target.value)}
                  placeholder="Détail des produits inclus dans l'offre"
                  className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Prix initial (DT)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    required
                    value={origPrice}
                    onChange={(e) => setOrigPrice(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono border border-stone-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Prix réduit (DT)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.5"
                    required
                    value={discPrice}
                    onChange={(e) => setDiscPrice(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono border border-stone-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Quantité</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono border border-stone-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Créneau retrait</label>
                  <input
                    type="text"
                    required
                    value={pickupWindow}
                    onChange={(e) => setPickupWindow(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg cursor-pointer"
              >
                Publier l&apos;offre
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Merchant Offers Table */}
      <section className="bg-white border border-stone-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-200">
          <h2 className="font-display text-lg font-bold text-slate-900">Mes offres publiées</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-stone-50 text-xs text-slate-500 border-b border-stone-200">
              <tr>
                <th className="py-3 px-6 font-medium">Offre</th>
                <th className="py-3 px-4 font-medium">Commerce</th>
                <th className="py-3 px-4 font-medium text-right">Prix réduit</th>
                <th className="py-3 px-4 font-medium text-right">Stock</th>
                <th className="py-3 px-6 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {offers.map((offer) => (
                <tr key={offer.id} className="hover:bg-stone-50">
                  <td className="py-3 px-6 font-medium text-slate-900">{offer.title}</td>
                  <td className="py-3 px-4 text-slate-600">{offer.commerceName}</td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-teal-800 font-semibold">
                    {offer.discountedPrice.toFixed(2)} DT
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums">
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleUpdateStock(offer, -1)}
                        className="w-7 h-7 border border-stone-300 rounded hover:bg-stone-100 cursor-pointer"
                      >
                        -
                      </button>
                      <span className="w-6 text-center">{offer.availableQuantity}</span>
                      <button
                        type="button"
                        onClick={() => handleUpdateStock(offer, 1)}
                        className="w-7 h-7 border border-stone-300 rounded hover:bg-stone-100 cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td className="py-3 px-6 text-right">
                    <button
                      type="button"
                      onClick={() => handleDeleteOffer(offer.id)}
                      aria-label={`Supprimer ${offer.title}`}
                      className="p-2 text-slate-400 hover:text-red-700 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {offers.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    Aucune offre publiée pour le moment.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Incoming Orders */}
      <section className="bg-white border border-stone-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-200">
          <h2 className="font-display text-lg font-bold text-slate-900">Commandes reçues</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-stone-50 text-xs text-slate-500 border-b border-stone-200">
              <tr>
                <th className="py-3 px-6 font-medium">Référence</th>
                <th className="py-3 px-4 font-medium">Étudiant</th>
                <th className="py-3 px-4 font-medium">Offre</th>
                <th className="py-3 px-4 font-medium text-right">Qté</th>
                <th className="py-3 px-4 font-medium text-right">Montant</th>
                <th className="py-3 px-6 font-medium">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {orders.map((ord) => (
                <tr key={ord.id} className="hover:bg-stone-50">
                  <td className="py-3 px-6 font-mono text-xs text-slate-800">{ord.id}</td>
                  <td className="py-3 px-4 text-slate-700">{ord.studentName}</td>
                  <td className="py-3 px-4 text-slate-700">{ord.offerTitle}</td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums">{ord.quantity}</td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold">
                    {ord.totalAmount.toFixed(2)} DT
                  </td>
                  <td className="py-3 px-6 text-xs font-semibold">
                    {ord.status === 'paid' && <span className="text-emerald-700">Payée · À retirer</span>}
                    {ord.status === 'collected' && <span className="text-slate-600">Récupérée</span>}
                    {ord.status === 'reserved' && <span className="text-amber-700">Réservée (non payée)</span>}
                    {ord.status === 'cancelled' && <span className="text-red-700">Annulée</span>}
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    Aucune commande reçue pour le moment.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
