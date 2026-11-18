import 'package:flutter/material.dart';
import '../../models/offer.dart';
import '../../repositories/order_repository.dart';
import '../../utils/formatters.dart';

class OfferDetailScreen extends StatefulWidget {
  final Offer offer;
  final OrderRepository repository;

  OfferDetailScreen({
    super.key,
    required this.offer,
    OrderRepository? repository,
  }) : repository = repository ?? FakeOrderRepository();

  @override
  State<OfferDetailScreen> createState() => _OfferDetailScreenState();
}

class _OfferDetailScreenState extends State<OfferDetailScreen> {
  int _quantity = 1;
  bool _reserving = false;

  Future<void> _reserve() async {
    final messenger = ScaffoldMessenger.of(context);
    final navigator = Navigator.of(context);
    setState(() => _reserving = true);
    try {
      final order = await widget.repository.createOrder(
        offer: widget.offer,
        quantity: _quantity,
      );
      navigator.pop(order);
    } on OrderException catch (e) {
      messenger.showSnackBar(SnackBar(content: Text(e.message)));
    } finally {
      if (mounted) setState(() => _reserving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final offer = widget.offer;
    final scheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final total = offer.discountedPrice * _quantity;

    return Scaffold(
      appBar: AppBar(title: const Text('Offer details')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Container(
            height: 160,
            decoration: BoxDecoration(
              color: scheme.primaryContainer,
              borderRadius: BorderRadius.circular(16),
            ),
            child: offer.imageUrl != null
                ? ClipRRect(
                    borderRadius: BorderRadius.circular(16),
                    child: Image.network(
                      offer.imageUrl!,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) =>
                          Icon(categoryIcon(offer.category), size: 64),
                    ),
                  )
                : Icon(categoryIcon(offer.category),
                    size: 64, color: scheme.onPrimaryContainer),
          ),
          const SizedBox(height: 16),
          Text(offer.title, style: textTheme.headlineSmall),
          const SizedBox(height: 4),
          Text('${offer.merchantName}  -  ${offer.category}'),
          const SizedBox(height: 12),
          Row(
            children: [
              Text(
                formatPrice(offer.discountedPrice),
                style: textTheme.titleLarge?.copyWith(color: scheme.primary),
              ),
              const SizedBox(width: 8),
              Text(
                formatPrice(offer.originalPrice),
                style: const TextStyle(decoration: TextDecoration.lineThrough),
              ),
              const SizedBox(width: 8),
              Chip(label: Text('-${offer.discountPercent}%')),
            ],
          ),
          const SizedBox(height: 12),
          Text(offer.description),
          const SizedBox(height: 16),
          ListTile(
            contentPadding: EdgeInsets.zero,
            leading: const Icon(Icons.schedule),
            title: Text(formatPickup(offer.pickupStart, offer.pickupEnd)),
          ),
          ListTile(
            contentPadding: EdgeInsets.zero,
            leading: const Icon(Icons.inventory_2_outlined),
            title: Text(
                offer.soldOut ? 'Sold out' : '${offer.quantity} available'),
          ),
          const Divider(height: 32),
          if (!offer.soldOut) ...[
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Quantity', style: textTheme.titleMedium),
                Row(
                  children: [
                    IconButton(
                      onPressed: _quantity > 1 && !_reserving
                          ? () => setState(() => _quantity--)
                          : null,
                      icon: const Icon(Icons.remove_circle_outline),
                    ),
                    Text('$_quantity', style: textTheme.titleMedium),
                    IconButton(
                      onPressed: _quantity < offer.quantity && !_reserving
                          ? () => setState(() => _quantity++)
                          : null,
                      icon: const Icon(Icons.add_circle_outline),
                    ),
                  ],
                ),
              ],
            ),
            Text('Total: ${formatPrice(total)}', style: textTheme.titleMedium),
            const SizedBox(height: 16),
          ],
          ElevatedButton(
            onPressed: offer.soldOut || _reserving ? null : _reserve,
            child: _reserving
                ? const SizedBox(
                    height: 22,
                    width: 22,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : Text(offer.soldOut ? 'Sold out' : 'Reserve'),
          ),
        ],
      ),
    );
  }
}
