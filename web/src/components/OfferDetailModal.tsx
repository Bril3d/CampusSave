import { useState } from 'react';
import { CheckCircle2, CreditCard, Minus, Plus, QrCode, Utensils, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ordersApi } from '../services/api';
import type { Offer, Order } from '../types';

interface OfferDetailModalProps {
  offer: Offer | null;
  onClose: () => void;
  onRequireAuth: () => void;
  onOrderCompleted: () => void;
}

export function OfferDetailModal({ offer, onClose, onRequireAuth, onOrderCompleted }: OfferDetailModalProps) {
  const { user } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [step, setStep] = useState<'details' | 'checkout' | 'paid'>('details');
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [paymentRef, setPaymentRef] = useState<string | null>(null);
  const [payUrl, setPayUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imgFailed, setImgFailed] = useState(false);

  if (!offer) return null;

  const totalAmount = Number((offer.discountedPrice * quantity).toFixed(2));
  const outOfStock = offer.availableQuantity <= 0;

  const handleReserveAndInitPayment = async () => {
    if (!user) {
      onRequireAuth();
      return;
    }
    if (user.role !== 'student') {
      setError('Seuls les comptes étudiants peuvent réserver une offre.');
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const reserveRes = await ordersApi.reserve(offer.id, quantity);
      const createdOrder = reserveRes.order;
      setActiveOrder(createdOrder);

      const konnectInit = await ordersApi.initKonnect(createdOrder.id);
      setPaymentRef(konnectInit.paymentRef);
      setPayUrl(konnectInit.payUrl);
      setStep('checkout');
      onOrderCompleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la réservation.');
    } finally {
      setBusy(false);
    }
  };

  const handleConfirmKonnectSandbox = async () => {
    if (!activeOrder || !paymentRef) return;
    setBusy(true);
    setError(null);
    try {
      const res = await ordersApi.verifyKonnect({
        orderId: activeOrder.id,
        paymentRef,
        sandboxConfirmed: true,
      });
      setActiveOrder(res.order);
      setStep('paid');
      onOrderCompleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Échec de vérification Konnect.');
    } finally {
      setBusy(false);
    }
  };

  const handleClose = () => {
    setStep('details');
    setQuantity(1);
    setActiveOrder(null);
    setPaymentRef(null);
    setPayUrl(null);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-stone-200 rounded-xl w-full max-w-lg overflow-hidden shadow-xl my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200">
          <h2 className="font-display text-lg font-bold text-slate-900 truncate pr-4">
            {step === 'details' && offer.title}
            {step === 'checkout' && 'Paiement Konnect (Mode Test)'}
            {step === 'paid' && 'Commande confirmée — QR Code'}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Fermer"
            className="p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {step === 'details' && (
            <>
              <div className="aspect-[16/10] w-full rounded-lg overflow-hidden bg-stone-100">
                {!imgFailed ? (
                  <img
                    src={offer.imageUrl}
                    alt={offer.title}
                    referrerPolicy="no-referrer"
                    onError={() => setImgFailed(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                    <Utensils className="w-8 h-8 mb-2" />
                    <span className="text-xs">{offer.title}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-slate-500">
                  {offer.commerceName} · {offer.category} · Retrait {offer.pickupWindow}
                </p>
                <p className="text-sm text-slate-700 leading-relaxed">{offer.description}</p>
              </div>

              <div className="flex items-center justify-between py-4 border-y border-stone-200">
                <div>
                  <p className="text-xs text-slate-500">Prix étudiant</p>
                  <div className="flex items-baseline gap-2 tabular-nums">
                    <span className="font-mono text-2xl font-bold text-teal-800">
                      {offer.discountedPrice.toFixed(2)} DT
                    </span>
                    <span className="font-mono text-sm text-slate-400 line-through">
                      {offer.originalPrice.toFixed(2)} DT
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={quantity <= 1 || outOfStock}
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    aria-label="Diminuer la quantité"
                    className="w-10 h-10 flex items-center justify-center border border-stone-300 rounded-lg hover:bg-stone-100 disabled:opacity-40 cursor-pointer"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="font-mono text-base font-semibold tabular-nums w-6 text-center">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    disabled={quantity >= offer.availableQuantity || outOfStock}
                    onClick={() => setQuantity((q) => Math.min(offer.availableQuantity, q + 1))}
                    aria-label="Augmenter la quantité"
                    className="w-10 h-10 flex items-center justify-center border border-stone-300 rounded-lg hover:bg-stone-100 disabled:opacity-40 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <button
                type="button"
                disabled={busy || outOfStock}
                onClick={handleReserveAndInitPayment}
                className="w-full py-3 px-4 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 disabled:opacity-50 rounded-lg transition-colors cursor-pointer tabular-nums"
              >
                {outOfStock
                  ? 'Offre épuisée'
                  : busy
                    ? 'Réservation en cours...'
                    : `Réserver et payer ${totalAmount.toFixed(2)} DT`}
              </button>
            </>
          )}

          {step === 'checkout' && activeOrder && (
            <div className="space-y-5">
              <div className="bg-stone-50 border border-stone-200 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <CreditCard className="w-4 h-4 text-teal-700" />
                  <span>Passerelle Konnect Sandbox</span>
                </div>
                <p className="text-sm text-slate-600">
                  Commande <span className="font-mono font-medium text-slate-900">{activeOrder.id}</span> · Référence{' '}
                  <span className="font-mono text-slate-800">{paymentRef}</span>
                </p>
                <div className="flex items-center justify-between pt-2 border-t border-stone-200 text-sm">
                  <span className="text-slate-600">
                    {activeOrder.quantity} × {activeOrder.offerTitle}
                  </span>
                  <span className="font-mono font-bold text-slate-900 tabular-nums">
                    {activeOrder.totalAmount.toFixed(2)} DT
                  </span>
                </div>
              </div>

              {payUrl ? (
                <div className="space-y-3">
                  <a
                    href={payUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="block w-full text-center py-3 px-4 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg"
                  >
                    Ouvrir la page de paiement Konnect Sandbox
                  </a>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={handleConfirmKonnectSandbox}
                    className="w-full py-2.5 px-4 text-sm font-semibold text-teal-800 border border-teal-700 rounded-lg hover:bg-teal-50 cursor-pointer"
                  >
                    {busy ? 'Vérification serveur...' : 'Vérifier la confirmation Konnect'}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Mode test local actif (ajoutez <span className="font-mono">KONNECT_API_KEY</span> et{' '}
                    <span className="font-mono">KONNECT_RECEIVER_WALLET_ID</span> dans <span className="font-mono">.env</span>{' '}
                    pour ouvrir la page Konnect Sandbox officielle). Le serveur vérifiera la transaction avant de délivrer votre QR Code.
                  </p>
                  {error && (
                    <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                      {error}
                    </p>
                  )}
                  <button
                    type="button"
                    disabled={busy}
                    onClick={handleConfirmKonnectSandbox}
                    className="w-full py-3 px-4 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 disabled:opacity-50 rounded-lg transition-colors cursor-pointer"
                  >
                    {busy ? 'Vérification côté serveur...' : 'Autoriser le paiement test Konnect'}
                  </button>
                </div>
              )}
            </div>
          )}

          {step === 'paid' && activeOrder && (
            <div className="space-y-5 text-center">
              <div className="flex items-center justify-center gap-2 text-emerald-700 font-semibold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                <span>Paiement confirmé · QR Code à usage unique généré</span>
              </div>

              {activeOrder.qrDataUrl ? (
                <div className="inline-block p-4 bg-white border border-stone-200 rounded-xl">
                  <img
                    src={activeOrder.qrDataUrl}
                    alt={`QR Code commande ${activeOrder.id}`}
                    className="w-52 h-52 mx-auto"
                  />
                </div>
              ) : (
                <div className="p-6 bg-stone-50 rounded-xl inline-flex flex-col items-center">
                  <QrCode className="w-16 h-16 text-slate-700" />
                </div>
              )}

              <div className="bg-stone-50 border border-stone-200 rounded-lg p-3 text-xs space-y-1">
                <p className="text-slate-500">Code de retrait (usage unique)</p>
                <p className="font-mono font-semibold text-slate-900 select-all break-all">
                  {activeOrder.qrToken}
                </p>
              </div>

              <p className="text-xs text-slate-600">
                Présentez ce QR Code chez <strong>{activeOrder.commerceName}</strong>. Vous le retrouverez aussi dans l&apos;onglet <strong>Mes commandes</strong>.
              </p>

              <button
                type="button"
                onClick={handleClose}
                className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                Terminer
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
