/// Catégories PROVISOIRES : à confirmer avec le Backend / le Web.
const List<String> offerCategories = [
  'Meals',
  'Bakery',
  'Drinks',
  'Desserts',
  'Snacks',
];

/// Offre alimentaire.
/// PROVISOIRE : les noms de champs seront alignés sur le contrat API
/// (méthode fromJson ajoutée à l'étape 7b).
class Offer {
  final String id;
  final String title;
  final String description;
  final String merchantName;
  final String category;
  final double originalPrice;
  final double discountedPrice;
  final int quantity;
  final String? imageUrl;
  final DateTime pickupStart;
  final DateTime pickupEnd;

  const Offer({
    required this.id,
    required this.title,
    required this.description,
    required this.merchantName,
    required this.category,
    required this.originalPrice,
    required this.discountedPrice,
    required this.quantity,
    required this.pickupStart,
    required this.pickupEnd,
    this.imageUrl,
  });

  Offer copyWith({int? quantity}) {
    return Offer(
      id: id,
      title: title,
      description: description,
      merchantName: merchantName,
      category: category,
      originalPrice: originalPrice,
      discountedPrice: discountedPrice,
      quantity: quantity ?? this.quantity,
      imageUrl: imageUrl,
      pickupStart: pickupStart,
      pickupEnd: pickupEnd,
    );
  }

  int get discountPercent {
    if (originalPrice <= 0) return 0;
    return (((originalPrice - discountedPrice) / originalPrice) * 100).round();
  }

  bool get soldOut => quantity <= 0;
}
