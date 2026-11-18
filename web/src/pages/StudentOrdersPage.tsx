import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Clock, CreditCard, QrCode, XCircle } from 'lucide-react';
import { ordersApi } from '../services/api';
import type { Order, StudentDashboardStats } from '../types';

export function StudentOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<StudentDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);
  const [pendingKonnect, setPendingKonnect] = useState<{
    orderId: string;
    paymentRef: string;
    payUrl: string | null;
  } | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ordersRes, dashRes] = await Promise.all([
        ordersApi.myOrders(),
        ordersApi.studentDashboard(),
      ]);
      setOrders(ordersRes.orders);
      setStats(dashRes.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleInitPayment = async (orderId: string) => {
    setBusyOrderId(orderId);
    setError(null);
    try {
      const res = await ordersApi.initKonnect(orderId);
      setPendingKonnect({
        orderId,
        paymentRef: res.paymentRef,
        payUrl: res.payUrl,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur d\'initialisation Konnect.');
    } finally {
      setBusyOrderId(null);
    }
  };

  const handleConfirmPayment = async () => {
    if (!pendingKonnect) return;
    setBusyOrderId(pendingKonnect.orderId);
    setError(null);
    try {
      await ordersApi.verifyKonnect({
        orderId: pendingKonnect.orderId,
        paymentRef: pendingKonnect.paymentRef,
        sandboxConfirmed: true,
      });
      setPendingKonnect(null);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de confirmation.');
    } finally {
      setBusyOrderId(null);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    setBusyOrderId(orderId);
    setError(null);
    try {
      await ordersApi.cancel(orderId);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'annulation.');
    } finally {
      setBusyOrderId(null);
    }
  };

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-slate-900">
            Mes commandes et QR Codes
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Réglez vos réservations via Konnect et présentez votre QR Code unique lors du retrait.
          </p>
        </div>
        <button
          type="button"
          onClick={loadData}
          className="self-start sm:self-auto px-4 py-2 text-xs font-medium text-slate-700 border border-stone-300 bg-white hover:bg-stone-50 rounded-lg cursor-pointer"
        >
          Actualiser
        </button>
      </div>

      {stats && (
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-stone-200 rounded-xl p-5">
            <p className="text-xs text-slate-500">Portions sauvées</p>
            <p className="font-mono text-2xl font-bold text-slate-900 mt-1 tabular-nums">
              {stats.mealsSaved}
            </p>
          </div>
          <div className="bg-white border border-stone-200 rounded-xl p-5">
            <p className="text-xs text-slate-500">Économies estimées</p>
            <p className="font-mono text-2xl font-bold text-teal-800 mt-1 tabular-nums">
              {stats.moneySaved.toFixed(2)} DT
            </p>
          </div>
          <div className="bg-white border border-stone-200 rounded-xl p-5">
            <p className="text-xs text-slate-500">Prêtes au retrait</p>
            <p className="font-mono text-2xl font-bold text-slate-900 mt-1 tabular-nums">
              {stats.readyForPickup}
            </p>
          </div>
          <div className="bg-white border border-stone-200 rounded-xl p-5">
            <p className="text-xs text-slate-500">En attente de paiement</p>
            <p className="font-mono text-2xl font-bold text-slate-900 mt-1 tabular-nums">
              {stats.pendingPayment}
            </p>
          </div>
        </section>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {pendingKonnect && (
        <section className="bg-white border border-teal-700 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <CreditCard className="w-5 h-5 text-teal-700" />
            <span>Finalisation Konnect Sandbox · Commande {pendingKonnect.orderId}</span>
          </div>
          <p className="text-sm text-slate-600">
            Référence de transaction : <span className="font-mono font-medium">{pendingKonnect.paymentRef}</span>
          </p>
          <div className="flex flex-wrap items-center gap-3">
            {pendingKonnect.payUrl && (
              <a
                href={pendingKonnect.payUrl}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2.5 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg"
              >
                Ouvrir Konnect Sandbox
              </a>
            )}
            <button
              type="button"
              disabled={busyOrderId === pendingKonnect.orderId}
              onClick={handleConfirmPayment}
              className="px-4 py-2.5 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg cursor-pointer"
            >
              {busyOrderId === pendingKonnect.orderId
                ? 'Vérification serveur...'
                : 'Confirmer le paiement test Konnect'}
            </button>
            <button
              type="button"
              onClick={() => setPendingKonnect(null)}
              className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              Fermer
            </button>
          </div>
        </section>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white border border-stone-200 rounded-xl h-36 animate-pulse" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-xl p-10 text-center space-y-2">
          <p className="font-display text-lg font-semibold text-slate-900">
            Aucune commande pour le moment
          </p>
          <p className="text-sm text-slate-600">
            Parcourez les offres autour de l&apos;ESSECT pour réserver votre premier panier.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white border border-stone-200 rounded-xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6"
            >
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span className="font-mono font-semibold text-slate-800">{order.id}</span>
                  <span aria-hidden="true">·</span>
                  <span>{order.commerceName}</span>
                  <span aria-hidden="true">·</span>
                  <span>{new Date(order.createdAt).toLocaleString('fr-FR')}</span>
                </div>

                <h2 className="font-display text-lg font-semibold text-slate-900">
                  {order.offerTitle}
                </h2>

                <div className="flex flex-wrap items-center gap-4 text-sm tabular-nums">
                  <span className="text-slate-700">Quantité : {order.quantity}</span>
                  <span className="font-mono font-semibold text-slate-900">
                    Total : {order.totalAmount.toFixed(2)} DT
                  </span>
                </div>

                <div className="pt-1 text-sm font-medium">
                  {order.status === 'reserved' && (
                    <span className="inline-flex items-center gap-1.5 text-amber-700">
                      <Clock className="w-4 h-4" />
                      Réservée — en attente de paiement Konnect
                    </span>
                  )}
                  {order.status === 'paid' && (
                    <span className="inline-flex items-center gap-1.5 text-emerald-700">
                      <QrCode className="w-4 h-4" />
                      Payée — QR Code actif pour le retrait
                    </span>
                  )}
                  {order.status === 'collected' && (
                    <span className="inline-flex items-center gap-1.5 text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                      Récupérée le {new Date(order.collectedAt || '').toLocaleString('fr-FR')}
                    </span>
                  )}
                  {order.status === 'cancelled' && (
                    <span className="inline-flex items-center gap-1.5 text-red-700">
                      <XCircle className="w-4 h-4" />
                      Annulée
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 shrink-0">
                {order.status === 'reserved' && (
                  <>
                    <button
                      type="button"
                      disabled={busyOrderId === order.id}
                      onClick={() => handleInitPayment(order.id)}
                      className="px-4 py-2.5 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg cursor-pointer whitespace-nowrap"
                    >
                      Payer avec Konnect
                    </button>
                    <button
                      type="button"
                      disabled={busyOrderId === order.id}
                      onClick={() => handleCancelOrder(order.id)}
                      className="px-4 py-2.5 text-sm font-medium text-slate-700 border border-stone-300 hover:bg-stone-50 rounded-lg cursor-pointer whitespace-nowrap"
                    >
                      Annuler
                    </button>
                  </>
                )}

                {order.status === 'paid' && order.qrDataUrl && (
                  <div className="flex items-center gap-4 bg-stone-50 border border-stone-200 rounded-lg p-3">
                    <img
                      src={order.qrDataUrl}
                      alt={`QR Code ${order.id}`}
                      className="w-24 h-24 bg-white rounded border border-stone-200"
                    />
                    <div className="text-xs space-y-1 max-w-[200px]">
                      <p className="font-medium text-slate-700">Code à présenter :</p>
                      <p className="font-mono text-slate-900 break-all select-all">{order.qrToken}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
