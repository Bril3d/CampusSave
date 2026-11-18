import '../models/order.dart';
import '../models/payment.dart';
import 'order_repository.dart';

class PaymentException implements Exception {
  final String message;
  const PaymentException(this.message);

  @override
  String toString() => message;
}

/// Source des paiements. À l'étape 7b, on ajoutera ApiPaymentRepository :
/// le Backend crée la session Konnect (mode test), l'application ouvre
/// l'URL de paiement, puis interroge le statut. Jamais de clé Konnect
/// dans l'application, et seul le Backend confirme un paiement.
abstract class PaymentRepository {
  bool get isDemo;

  /// Demande au Backend de créer le paiement d'une commande (envoi de l'id
  /// de la commande uniquement, pas le montant).
  Future<PaymentSession> createPayment(Order order);

  Future<PaymentStatus> getPaymentStatus(String paymentId);
}

/// PAIEMENT SIMULÉ (provisoire) : aucun vrai paiement, aucune donnée bancaire.
class FakePaymentRepository implements PaymentRepository {
  FakePaymentRepository._();
  static final FakePaymentRepository _instance = FakePaymentRepository._();

  factory FakePaymentRepository() => _instance;

  final Map<String, PaymentSession> _sessions = {};
  final Map<String, PaymentStatus> _statuses = {};
  int _counter = 0;

  @override
  bool get isDemo => true;

  @override
  Future<PaymentSession> createPayment(Order order) async {
    await Future<void>.delayed(const Duration(milliseconds: 400));

    final current = FakeOrderRepository().find(order.id);
    if (current == null) {
      throw const PaymentException('Order not found.');
    }
    if (current.status != OrderStatus.pendingPayment) {
      throw const PaymentException('This order cannot be paid.');
    }

    _counter++;
    final session = PaymentSession(
      id: 'demo-pay-$_counter',
      orderId: current.id,
      amount: current.total,
    );
    _sessions[session.id] = session;
    _statuses[session.id] = PaymentStatus.pending;
    return session;
  }

  /// Simule le résultat que Konnect + Backend enverraient.
  void simulateOutcome(String paymentId, {required bool success}) {
    final session = _sessions[paymentId];
    if (session == null) return;
    if (_statuses[paymentId] != PaymentStatus.pending) return;

    _statuses[paymentId] =
        success ? PaymentStatus.success : PaymentStatus.failed;
    if (success) {
      FakeOrderRepository().markPaid(session.orderId);
    }
  }

  @override
  Future<PaymentStatus> getPaymentStatus(String paymentId) async {
    await Future<void>.delayed(const Duration(milliseconds: 300));
    final status = _statuses[paymentId];
    if (status == null) {
      throw const PaymentException('Payment not found.');
    }
    return status;
  }
}
