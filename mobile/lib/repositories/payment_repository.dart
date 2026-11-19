import '../models/order.dart';
import '../models/payment.dart';
import 'order_repository.dart';

class PaymentException implements Exception {
  final String message;
  const PaymentException(this.message);
  @override String toString() => message;
}

class FakePaymentRepository {
  FakePaymentRepository._();
  static final FakePaymentRepository _i = FakePaymentRepository._();
  factory FakePaymentRepository() => _i;

  final Map<String, PaymentSession> _sessions = {};
  final Map<String, PaymentStatus> _statuses = {};
  int _c = 0;

  Future<PaymentSession> createPayment(Order order) async {
    await Future<void>.delayed(const Duration(milliseconds: 400));
    final cur = FakeOrderRepository().find(order.id);
    if (cur == null) throw const PaymentException('Order not found.');
    if (cur.status != OrderStatus.pendingPayment)
      throw const PaymentException('This order cannot be paid.');
    _c++;
    final s = PaymentSession(id: 'pay$_c', orderId: cur.id, amount: cur.total);
    _sessions[s.id] = s;
    _statuses[s.id] = PaymentStatus.pending;
    return s;
  }

  void simulateOutcome(String paymentId, {required bool success}) {
    if (_statuses[paymentId] != PaymentStatus.pending) return;
    _statuses[paymentId] = success ? PaymentStatus.success : PaymentStatus.failed;
    if (success) FakeOrderRepository().markPaid(_sessions[paymentId]!.orderId);
  }

  Future<PaymentStatus> getStatus(String paymentId) async {
    await Future<void>.delayed(const Duration(milliseconds: 300));
    return _statuses[paymentId] ?? (throw const PaymentException('Payment not found.'));
  }
}
