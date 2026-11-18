import { useState } from 'react';
import { Utensils } from 'lucide-react';
import type { Offer } from '../types';

interface OfferCardProps {
  offer: Offer;
  onSelect: (offer: Offer) => void;
}

export function OfferCard({ offer, onSelect }: OfferCardProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const discountPct = Math.round(((offer.originalPrice - offer.discountedPrice) / offer.originalPrice) * 100);
  const outOfStock = offer.availableQuantity <= 0;

  return (
    <article className="group bg-white border border-stone-200 rounded-xl overflow-hidden flex flex-col transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <button
        type="button"
        onClick={() => onSelect(offer)}
        className="text-left flex flex-col flex-1 cursor-pointer"
      >
        <div className="relative aspect-[4/3] w-full bg-stone-100 overflow-hidden">
          {!imgFailed ? (
            <img
              src={offer.imageUrl}
              alt={offer.title}
              referrerPolicy="no-referrer"
              onError={() => setImgFailed(true)}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-stone-100 text-slate-500 p-4 text-center">
              <Utensils className="w-8 h-8 mb-2 text-slate-400" />
              <span className="text-xs font-medium">{offer.title}</span>
            </div>
          )}
        </div>

        <div className="p-5 flex-1 flex flex-col justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="font-medium text-slate-700 truncate">{offer.commerceName}</span>
              <span aria-hidden="true">·</span>
              <span className="whitespace-nowrap">{offer.category}</span>
            </div>

            <h3 className="font-display text-base font-semibold text-slate-900 leading-snug">
              {offer.title}
            </h3>

            <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
              {offer.description}
            </p>
          </div>

          <div className="pt-3 border-t border-stone-100 flex items-end justify-between gap-4">
            <div className="space-y-0.5">
              <div className="flex items-baseline gap-2 tabular-nums">
                <span className="font-mono text-lg font-semibold text-teal-800">
                  {offer.discountedPrice.toFixed(2)} DT
                </span>
                <span className="font-mono text-xs text-slate-400 line-through">
                  {offer.originalPrice.toFixed(2)} DT
                </span>
              </div>
              <p className="text-xs text-slate-500 tabular-nums">
                Retrait {offer.pickupWindow} · -{discountPct}%
              </p>
            </div>

            <span
              className={`text-xs font-semibold tabular-nums whitespace-nowrap ${
                outOfStock ? 'text-red-700' : 'text-slate-700'
              }`}
            >
              {outOfStock ? 'Épuisé' : `${offer.availableQuantity} dispo.`}
            </span>
          </div>
        </div>
      </button>
    </article>
  );
}
