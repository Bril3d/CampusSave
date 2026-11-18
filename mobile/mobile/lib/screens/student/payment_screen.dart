import 'package:flutter/material.dart';
import '../../models/order.dart';
import '../../models/payment.dart';
import '../../repositories/payment_repository.dart';
import '../../utils/formatters.dart';
import '../../widgets/state_views.dart';

/// Écran de paiement d'une commande.
/// Se ferme avec `true` quand le paiement est confirmé.
class PaymentScreen extends StatefulWidget {
  final Order order;
  final PaymentRepository repository;

  PaymentScreen({super.key, required this.order, PaymentRepository? repository})
      : repository = repository ?? FakePaymentRepository();

  @override
  State<PaymentScreen> createState() => _PaymentScreenState();
}

class _PaymentScreenState extends State<PaymentScreen> {
  late Future<PaymentSession> _sessionFuture;
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    _sessionFuture = widget.repository.createPayment(widget.order);
  }

  void _restart() {
    setState(() {
      _sessionFuture = widget.repository.createPayment(widget.order);
    });
  }

  Future<void> _finish(PaymentSession session, {required bool success}) async {
    final messenger = ScaffoldMessenger.of(context);
    final navigator = Navigator.of(context);
    setState(() => _busy = true);
    try {
      final repo = widget.repository;
      if (repo is FakePaymentRepository) {
        repo.simulateOutcome(session.id, success: success);
      }
      // L'application ne décide jamais du résultat : elle lit le statut
      // confirmé par le Backend.
      final status = await repo.getPaymentStatus(session.id);

      if (status == PaymentStatus.success) {
        navigator.pop(true);
        return;
      }
      if (status == PaymentStatus.failed) {
        messenger.showSnackBar(
          const SnackBar(content: Text('Payment failed. You can try again.')),
        );
        if (mounted) _restart();
      } else {
        messenger.showSnackBar(
          const SnackBar(content: Text('Payment is still pending.')),
        );
      }
    } on PaymentException catch (e) {
      messenger.showSnackBar(SnackBar(content: Text(e.message)));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final order = widget.order;
    final textTheme = Theme.of(context).textTheme;
    final isDemo = widget.repository is FakePaymentRepository;

    return Scaffold(
      appBar: AppBar(title: const Text('Payment')),
      body: FutureBuilder<PaymentSession>(
        future: _sessionFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const LoadingView();
          }
          if (snapshot.hasError) {
            final error = snapshot.error;
            return ErrorView(
              message: error is PaymentException
                  ? error.message
                  : 'Could not start the payment.',
              onRetry: _restart,
            );
          }

          final session = snapshot.data!;
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              if (isDemo)
                Card(
                  color: Theme.of(context).colorScheme.secondaryContainer,
                  child: const Padding(
                    padding: EdgeInsets.all(12),
                    child: Text(
                      'Simulated payment. The Konnect test payment will replace '
                      'this screen once the backend is connected.',
                    ),
                  ),
                ),
              const SizedBox(height: 16),
              Text(order.offerTitle, style: textTheme.titleLarge),
              Text(order.merchantName),
              const SizedBox(height: 16),
              Text('Quantity: ${order.quantity}'),
              Text(formatPickup(order.pickupStart, order.pickupEnd)),
              const Divider(height: 32),
              Text(
                'Total: ${formatPrice(session.amount)}',
                style: textTheme.headlineSmall,
              ),
              const SizedBox(height: 24),
              if (isDemo) ...[
                ElevatedButton(
                  onPressed:
                      _busy ? null : () => _finish(session, success: true),
                  child: _busy
                      ? const SizedBox(
                          height: 22,
                          width: 22,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Text('Simulate successful payment'),
                ),
                const SizedBox(height: 12),
                OutlinedButton(
                  onPressed:
                      _busy ? null : () => _finish(session, success: false),
                  child: const Text('Simulate failed payment'),
                ),
              ] else
                const Text(
                  'Real payment is not connected yet.',
                  textAlign: TextAlign.center,
                ),
            ],
          );
        },
      ),
    );
  }
}
