import 'package:flutter/material.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../../models/order.dart';
import '../../utils/formatters.dart';

class OrderConfirmationScreen extends StatelessWidget {
  final Order order;
  const OrderConfirmationScreen({super.key, required this.order});
  @override Widget build(BuildContext c) {
    return Scaffold(appBar: AppBar(title: const Text('Order Confirmed')),
      body: Center(child: ListView(padding: const EdgeInsets.all(24),
        shrinkWrap: true, children: [
        Container(padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(color: Colors.green.shade50,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.green.shade200)),
          child: Column(children: [
            const Icon(Icons.check_circle, color: Colors.green, size: 56),
            const SizedBox(height: 8),
            Text('Payment Confirmed!',
              style: Theme.of(c).textTheme.titleLarge?.copyWith(color: Colors.green)),
          ])),
        const SizedBox(height: 24),
        Card(child: Padding(padding: const EdgeInsets.all(16), child: Column(children: [
          Text('Show this QR code to the merchant on pickup',
            textAlign: TextAlign.center,
            style: TextStyle(color: Colors.grey.shade600, fontSize: 13)),
          const SizedBox(height: 16),
          Center(child: QrImageView(data: order.id, version: QrVersions.auto, size: 200,
            backgroundColor: Colors.white,
            errorCorrectionLevel: QrErrorCorrectLevel.M)),
          const SizedBox(height: 12),
          Text('Order #${order.id}',
            style: const TextStyle(fontFamily: 'monospace', fontSize: 12, color: Colors.grey)),
        ]))),
        const SizedBox(height: 16),
        Card(child: Padding(padding: const EdgeInsets.all(16), child: Column(children: [
          _row(c, 'Item', order.offerTitle),
          _row(c, 'Merchant', order.merchantName),
          _row(c, 'Quantity', '${order.quantity}'),
          _row(c, 'Total', fPrice(order.total)),
          _row(c, 'Pickup', fPickup(order.pickupStart, order.pickupEnd)),
        ]))),
        const SizedBox(height: 24),
        ElevatedButton(onPressed: () => Navigator.of(c).pop(),
          child: const Text('Back to my orders')),
      ])));
  }
  Widget _row(BuildContext c, String k, String v) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 4),
    child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [Text(k, style: const TextStyle(color: Colors.grey)), Text(v)]));
}
