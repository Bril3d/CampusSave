/// Statuts PROVISOIRES : à aligner sur ceux du Backend.
enum OrderStatus { pendingPayment, confirmed, collected, cancelled }

extension OrderStatusLabel on OrderStatus {
  String get label {
    switch (this) {
      case OrderStatus.pendingPayment:
        return 'Awaiting payment';
      case OrderStatus.confirmed:
        return 'Confirmed';
      case OrderStatus.collected:
        return 'Collected';
      case OrderStatus.cancelled:
        return 'Cancelled';
    }
  }
}

/// Commande / réservation.
/// PROVISOIRE : champs à aligner sur le contrat API (fromJson à l'étape 7b).
class Order {
  final String id;
  final String offerId;
  final String offerTitle;
  final String merchantName;
  final int quantity;
  final double unitPrice;
  final DateTime createdAt;
  final DateTime pickupStart;
  final DateTime pickupEnd;
  final OrderStatus status;

  const Order({
    required this.id,
    required this.offerId,
    required this.offerTitle,
    required this.merchantName,
    required this.quantity,
    required this.unitPrice,
    required this.createdAt,
    required this.pickupStart,
    required this.pickupEnd,
    required this.status,
  });

  double get total => unitPrice * quantity;

  Order copyWith({OrderStatus? status}) {
    return Order(
      id: id,
      offerId: offerId,
      offerTitle: offerTitle,
      merchantName: merchantName,
      quantity: quantity,
      unitPrice: unitPrice,
      createdAt: createdAt,
      pickupStart: pickupStart,
      pickupEnd: pickupEnd,
      status: status ?? this.status,
    );
  }
}
