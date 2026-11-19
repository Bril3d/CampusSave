import 'package:flutter/material.dart';
import '../../models/order.dart';
import '../../models/payment.dart';
import '../../repositories/payment_repository.dart';
import '../../utils/formatters.dart';
import '../../widgets/state_views.dart';

class PaymentScreen extends StatefulWidget {
  final Order order;
  const PaymentScreen({super.key, required this.order});
  @override State<PaymentScreen> createState() => _State();
}
class _State extends State<PaymentScreen> {
  late Future<PaymentSession> _fut;
  bool _busy = false;
  @override void initState() { super.initState(); _fut = FakePaymentRepository().createPayment(widget.order); }
  void _retry() => setState(() => _fut = FakePaymentRepository().createPayment(widget.order));

  Future<void> _finish(PaymentSession session, bool success) async {
    final msg = ScaffoldMessenger.of(context);
    final nav = Navigator.of(context);
    setState(() => _busy = true);
    try {
      FakePaymentRepository().simulateOutcome(session.id, success: success);
      final status = await FakePaymentRepository().getStatus(session.id);
      if (status == PaymentStatus.success) { nav.pop(true); return; }
      msg.showSnackBar(const SnackBar(content: Text('Payment failed. Please try again.')));
      if (mounted) _retry();
    } on PaymentException catch (e) {
      msg.showSnackBar(SnackBar(content: Text(e.message)));
    } finally { if (mounted) setState(() => _busy = false); }
  }

  @override Widget build(BuildContext c) {
    final s = Theme.of(c).colorScheme;
    return Scaffold(appBar: AppBar(title: const Text('Payment')),
      body: FutureBuilder<PaymentSession>(future: _fut,
        builder: (c, snap) {
          if (snap.connectionState != ConnectionState.done) return const LoadingView();
          if (snap.hasError) return ErrorView(
            message: snap.error is PaymentException ? snap.error.toString() : 'Could not start payment.',
            onRetry: _retry);
          final session = snap.data!;
          return ListView(padding: const EdgeInsets.all(24), children: [
            Container(padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(color: s.secondaryContainer,
                borderRadius: BorderRadius.circular(14)),
              child: Row(children: [
                Icon(Icons.science_outlined, color: s.onSecondaryContainer),
                const SizedBox(width: 10),
                Expanded(child: Text('Demo payment – Konnect test mode will replace this once backend is connected.',
                  style: TextStyle(color: s.onSecondaryContainer, fontSize: 13))),
              ])),
            const SizedBox(height: 24),
            Card(child: Padding(padding: const EdgeInsets.all(16), child: Column(
              crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('Order Summary', style: Theme.of(c).textTheme.titleMedium),
              const SizedBox(height: 12),
              _row('Item', widget.order.offerTitle),
              _row('Merchant', widget.order.merchantName),
              _row('Quantity', '${widget.order.quantity}'),
              _row('Pickup', fPickup(widget.order.pickupStart, widget.order.pickupEnd)),
              const Divider(height: 24),
              Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                Text('Total', style: Theme.of(c).textTheme.titleLarge),
                Text(fPrice(session.amount),
                  style: Theme.of(c).textTheme.titleLarge?.copyWith(
                    color: s.primary, fontWeight: FontWeight.bold)),
              ]),
            ]))),
            const SizedBox(height: 24),
            ElevatedButton.icon(icon: const Icon(Icons.check_circle_outline),
              label: _busy ? const SizedBox(height: 20, width: 20,
                child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                : const Text('Simulate successful payment'),
              onPressed: _busy ? null : () => _finish(session, true)),
            const SizedBox(height: 12),
            OutlinedButton.icon(icon: const Icon(Icons.cancel_outlined),
              label: const Text('Simulate failed payment'),
              style: OutlinedButton.styleFrom(foregroundColor: Colors.red,
                side: const BorderSide(color: Colors.red)),
              onPressed: _busy ? null : () => _finish(session, false)),
          ]);
        }));
  }
  Widget _row(String k, String v) => Padding(padding: const EdgeInsets.symmetric(vertical: 3),
    child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [Text(k, style: const TextStyle(color: Colors.grey)),
        Flexible(child: Text(v, textAlign: TextAlign.end))]));
}
