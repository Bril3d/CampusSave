enum OrderStatus { pendingPayment, confirmed, collected, cancelled }
extension OrderStatusLabel on OrderStatus {
  String get label {
    switch (this) {
      case OrderStatus.pendingPayment: return 'Awaiting payment';
      case OrderStatus.confirmed: return 'Confirmed';
      case OrderStatus.collected: return 'Collected';
      case OrderStatus.cancelled: return 'Cancelled';
    }
  }
}

class Order {
  final String id;
  final String studentId;
  final String offerId;
  final String offerTitle;
  final String merchantId;
  final String merchantName;
  final int quantity;
  final double unitPrice;
  final DateTime createdAt;
  final DateTime pickupStart;
  final DateTime pickupEnd;
  OrderStatus status;

  Order({required this.id, required this.studentId, required this.offerId,
    required this.offerTitle, required this.merchantId, required this.merchantName,
    required this.quantity, required this.unitPrice, required this.createdAt,
    required this.pickupStart, required this.pickupEnd, required this.status});

  double get total => unitPrice * quantity;
}
