import 'package:flutter/material.dart';
import '../../models/offer.dart';
import '../../repositories/order_repository.dart';
import '../../utils/formatters.dart';

class OfferDetailScreen extends StatefulWidget {
  final Offer offer; final String studentId;
  const OfferDetailScreen({super.key, required this.offer, required this.studentId});
  @override State<OfferDetailScreen> createState() => _State();
}
class _State extends State<OfferDetailScreen> {
  int _qty = 1; bool _busy = false;

  Future<void> _reserve() async {
    final msg = ScaffoldMessenger.of(context);
    final nav = Navigator.of(context);
    setState(() => _busy = true);
    try {
      final order = await FakeOrderRepository().create(
        offer: widget.offer, quantity: _qty, studentId: widget.studentId);
      nav.pop(order);
    } on OrderException catch (e) {
      msg.showSnackBar(SnackBar(content: Text(e.message)));
    } finally { if (mounted) setState(() => _busy = false); }
  }

  @override Widget build(BuildContext c) {
    final o = widget.offer;
    final s = Theme.of(c).colorScheme;
    final t = Theme.of(c).textTheme;
    return Scaffold(appBar: AppBar(title: const Text('Offer Details')),
      body: ListView(padding: const EdgeInsets.all(16), children: [
        Container(height: 180,
          decoration: BoxDecoration(color: s.primaryContainer,
            borderRadius: BorderRadius.circular(16)),
          child: Icon(categoryIcon(o.category), size: 72, color: s.onPrimaryContainer)),
        const SizedBox(height: 16),
        Text(o.title, style: t.headlineSmall),
        const SizedBox(height: 4),
        Row(children: [
          Icon(Icons.storefront_outlined, size: 16, color: s.secondary),
          const SizedBox(width: 4),
          Text(o.merchantName, style: TextStyle(color: s.secondary)),
          const SizedBox(width: 12),
          Container(padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
            decoration: BoxDecoration(color: s.secondaryContainer,
              borderRadius: BorderRadius.circular(8)),
            child: Text(o.category, style: const TextStyle(fontSize: 12))),
        ]),
        const SizedBox(height: 12),
        Row(crossAxisAlignment: CrossAxisAlignment.center, children: [
          Text(fPrice(o.discountedPrice),
            style: t.titleLarge?.copyWith(color: s.primary, fontWeight: FontWeight.bold)),
          const SizedBox(width: 10),
          Text(fPrice(o.originalPrice),
            style: t.bodyMedium?.copyWith(decoration: TextDecoration.lineThrough,
              color: Colors.grey)),
          const SizedBox(width: 10),
          Container(padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(color: s.secondary, borderRadius: BorderRadius.circular(8)),
            child: Text('-${o.discountPercent}%',
              style: TextStyle(color: s.onSecondary, fontWeight: FontWeight.bold))),
        ]),
        const SizedBox(height: 12),
        Text(o.description),
        const SizedBox(height: 16),
        Card(child: Column(children: [
          ListTile(dense: true, leading: const Icon(Icons.schedule),
            title: Text(fPickup(o.pickupStart, o.pickupEnd))),
          const Divider(height: 1),
          ListTile(dense: true, leading: const Icon(Icons.inventory_2_outlined),
            title: Text(o.soldOut ? 'Sold out' : '${o.quantity} available'),
            trailing: o.soldOut ? null : Container(padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(color: Colors.green.shade50,
                borderRadius: BorderRadius.circular(8)),
              child: Text('${o.discountPercent}% off',
                style: TextStyle(color: Colors.green.shade700, fontSize: 12,
                  fontWeight: FontWeight.bold)))),
        ])),
        const SizedBox(height: 20),
        if (!o.soldOut) ...[
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            Text('Quantity', style: t.titleMedium),
            Row(children: [
              IconButton(icon: const Icon(Icons.remove_circle_outline),
                onPressed: _qty > 1 && !_busy ? () => setState(() => _qty--) : null),
              Container(padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                decoration: BoxDecoration(color: s.primaryContainer,
                  borderRadius: BorderRadius.circular(8)),
                child: Text('$_qty', style: t.titleMedium?.copyWith(color: s.onPrimaryContainer))),
              IconButton(icon: const Icon(Icons.add_circle_outline),
                onPressed: _qty < o.quantity && !_busy ? () => setState(() => _qty++) : null),
            ]),
          ]),
          const SizedBox(height: 8),
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            Text('Total', style: t.titleMedium),
            Text(fPrice(o.discountedPrice * _qty),
              style: t.titleLarge?.copyWith(color: s.primary, fontWeight: FontWeight.bold)),
          ]),
          const SizedBox(height: 20),
        ],
        ElevatedButton(onPressed: o.soldOut || _busy ? null : _reserve,
          child: _busy ? const SizedBox(height: 22, width: 22,
            child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
            : Text(o.soldOut ? 'Sold out' : 'Reserve now')),
      ]));
  }
}
