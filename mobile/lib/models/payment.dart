/// Statuts PROVISOIRES : à aligner sur ceux du Backend / de Konnect.
enum PaymentStatus { pending, success, failed }

/// Session de paiement créée par le Backend.
/// PROVISOIRE : champs à aligner sur le contrat API.
class PaymentSession {
  final String id;
  final String orderId;

  /// Montant affiché uniquement. Il est calculé et contrôlé par le Backend :
  /// l'application n'envoie jamais le montant à payer.
  final double amount;

  /// URL de la page de paiement Konnect (null en mode démonstration).
  final String? paymentUrl;

  const PaymentSession({
    required this.id,
    required this.orderId,
    required this.amount,
    this.paymentUrl,
  });
}
