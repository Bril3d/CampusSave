import 'package:flutter/material.dart';
import '../../config/app_theme.dart';
import '../../models/offer.dart';
import '../../models/order.dart';
import '../../repositories/order_repository.dart';
import '../../utils/formatters.dart';
import '../../widgets/neo_widgets.dart';

class OfferDetailScreen extends StatefulWidget {
  final Offer offer;
  final String studentId;

  const OfferDetailScreen({super.key, required this.offer, required this.studentId});

  @override
  State<OfferDetailScreen> createState() => _OfferDetailScreenState();
}

class _OfferDetailScreenState extends State<OfferDetailScreen> {
  int _qty = 1;
  bool _busy = false;

  Future<void> _reserve() async {
    final msg = ScaffoldMessenger.of(context);
    final nav = Navigator.of(context);
    setState(() => _busy = true);
    try {
      final order = await FakeOrderRepository().create(
        offer: widget.offer,
        quantity: _qty,
        studentId: widget.studentId,
      );
      nav.pop(order);
    } on OrderException catch (e) {
      msg.showSnackBar(SnackBar(content: Text(e.message)));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final o = widget.offer;
    return Scaffold(
      backgroundColor: AppColors.cream,
      appBar: AppBar(title: const Text('Offer Details')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Hero banner
          NeoCard(
            color: AppColors.black,
            padding: const EdgeInsets.all(0),
            child: SizedBox(
              height: 160,
              child: Stack(
                children: [
                  Center(
                    child: Icon(categoryIcon(o.category), size: 80, color: Colors.white.withAlpha(60)),
                  ),
                  Positioned(
                    top: 16, right: 16,
                    child: NeoTag(
                      label: '-${o.discountPercent}%',
                      color: AppColors.yellow,
                    ),
                  ),
                  Positioned(
                    bottom: 16, left: 16,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(o.title,
                          style: const TextStyle(
                            color: Colors.white, fontWeight: FontWeight.w900,
                            fontSize: 20, shadows: [Shadow(color: Colors.black, blurRadius: 4)])),
                        Text(o.merchantName,
                          style: const TextStyle(color: Colors.white70, fontSize: 13,
                            fontWeight: FontWeight.w500)),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Price + category
          Row(
            children: [
              Expanded(
                child: NeoCard(
                  color: AppColors.cardYellow,
                  padding: const EdgeInsets.all(14),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Price', style: TextStyle(fontSize: 11,
                          fontWeight: FontWeight.w700, color: Colors.black54)),
                      const SizedBox(height: 4),
                      Text(fPrice(o.discountedPrice),
                        style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900)),
                      Text(fPrice(o.originalPrice),
                        style: const TextStyle(fontSize: 12, color: Colors.black38,
                            decoration: TextDecoration.lineThrough)),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: NeoCard(
                  color: AppColors.cardGreen,
                  padding: const EdgeInsets.all(14),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Available', style: TextStyle(fontSize: 11,
                          fontWeight: FontWeight.w700, color: Colors.black54)),
                      const SizedBox(height: 4),
                      Text(o.soldOut ? 'Sold out' : '${o.quantity} units',
                        style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900,
                            color: o.soldOut ? AppColors.red : AppColors.black)),
                    ],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),

          // Pickup
          NeoCard(
            color: AppColors.cardOrange,
            padding: const EdgeInsets.all(14),
            child: Row(
              children: [
                const Icon(Icons.schedule, color: AppColors.black),
                const SizedBox(width: 10),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Pickup window', style: TextStyle(fontSize: 11,
                        fontWeight: FontWeight.w700, color: Colors.black54)),
                    Text(fPickup(o.pickupStart, o.pickupEnd),
                      style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15)),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 10),

          // Description
          NeoCard(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Description', style: TextStyle(fontWeight: FontWeight.w800)),
                const SizedBox(height: 6),
                Text(o.description, style: const TextStyle(color: Colors.black87, height: 1.4)),
              ],
            ),
          ),

          if (!o.soldOut) ...[
            const SizedBox(height: 20),
            // Quantity selector
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Quantity',
                  style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16)),
                Row(
                  children: [
                    NeoOutlineButton(
                      label: '−',
                      onPressed: _qty > 1 && !_busy ? () => setState(() => _qty--) : null,
                      borderColor: AppColors.black,
                    ),
                    Container(
                      width: 56, height: 48,
                      decoration: const BoxDecoration(
                        border: Border.symmetric(
                            horizontal: BorderSide(color: AppColors.black, width: 2)),
                      ),
                      child: Center(
                        child: Text('$_qty',
                          style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 20)),
                      ),
                    ),
                    NeoOutlineButton(
                      label: '+',
                      onPressed: _qty < o.quantity && !_busy ? () => setState(() => _qty++) : null,
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 10),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Total', style: TextStyle(fontWeight: FontWeight.w700, color: Colors.black54)),
                Text(fPrice(o.discountedPrice * _qty),
                  style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 20, color: AppColors.black)),
              ],
            ),
            const SizedBox(height: 20),
          ],

          NeoButton(
            label: o.soldOut ? 'Sold out' : 'Reserve now',
            icon: o.soldOut ? null : Icons.shopping_bag_outlined,
            color: o.soldOut ? Colors.grey.shade300 : AppColors.yellow,
            onPressed: o.soldOut || _busy ? null : _reserve,
            isLoading: _busy,
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }
}
