import 'package:flutter/material.dart';
import '../models/offer.dart';
import '../utils/formatters.dart';
class OfferCard extends StatelessWidget {
  final Offer offer; final VoidCallback onTap;
  const OfferCard({super.key, required this.offer, required this.onTap});
  @override Widget build(BuildContext ctx) {
    final s = Theme.of(ctx).colorScheme;
    final t = Theme.of(ctx).textTheme;
    return Card(clipBehavior: Clip.antiAlias, child: InkWell(onTap: onTap,
      child: Padding(padding: const EdgeInsets.all(14),
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Container(width: 72, height: 72,
            decoration: BoxDecoration(color: s.primaryContainer,
              borderRadius: BorderRadius.circular(12)),
            child: Icon(categoryIcon(offer.category), size: 32, color: s.onPrimaryContainer)),
          const SizedBox(width: 12),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(offer.title, style: t.titleMedium, maxLines: 1, overflow: TextOverflow.ellipsis),
            Text(offer.merchantName, style: t.bodySmall, maxLines: 1, overflow: TextOverflow.ellipsis),
            const SizedBox(height: 4),
            Text(fPickup(offer.pickupStart, offer.pickupEnd), style: t.bodySmall),
            const SizedBox(height: 6),
            Row(children: [
              Text(fPrice(offer.discountedPrice),
                style: t.titleSmall?.copyWith(color: s.primary, fontWeight: FontWeight.bold)),
              const SizedBox(width: 8),
              Text(fPrice(offer.originalPrice),
                style: t.bodySmall?.copyWith(decoration: TextDecoration.lineThrough)),
            ]),
          ])),
          Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
            Container(padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(color: s.secondary,
                borderRadius: BorderRadius.circular(8)),
              child: Text('-${offer.discountPercent}%',
                style: TextStyle(color: s.onSecondary, fontWeight: FontWeight.bold, fontSize: 12))),
            const SizedBox(height: 8),
            Text(offer.soldOut ? 'Sold out' : '${offer.quantity} left',
              style: t.bodySmall?.copyWith(color: offer.soldOut ? s.error : Colors.grey.shade600)),
          ]),
        ]))));
  }
}
