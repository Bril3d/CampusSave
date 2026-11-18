import 'package:flutter/material.dart';
import '../../models/offer.dart';
import '../../models/order.dart';
import '../../repositories/offer_repository.dart';
import '../../utils/offer_filter.dart';
import '../../widgets/demo_banner.dart';
import '../../widgets/offer_card.dart';
import '../../widgets/state_views.dart';
import 'offer_detail_screen.dart';

class OffersTab extends StatefulWidget {
  final OfferRepository repository;
  final ValueChanged<Order>? onReserved;

  OffersTab({super.key, OfferRepository? repository, this.onReserved})
      : repository = repository ?? FakeOfferRepository();

  @override
  State<OffersTab> createState() => _OffersTabState();
}

class _OffersTabState extends State<OffersTab> {
  static const double _sliderMax = 20;

  late Future<List<Offer>> _future;
  String _query = '';
  String? _category;
  double _maxPrice = _sliderMax;
  OfferSort _sort = OfferSort.relevance;

  @override
  void initState() {
    super.initState();
    _future = widget.repository.fetchOffers();
  }

  void _reload() {
    setState(() {
      _future = widget.repository.fetchOffers();
    });
  }

  Future<void> _openOffer(Offer offer) async {
    final order = await Navigator.of(context).push<Order>(
      MaterialPageRoute(builder: (_) => OfferDetailScreen(offer: offer)),
    );
    if (order == null || !mounted) return;
    _reload();
    widget.onReserved?.call(order);
  }

  Future<void> _refresh() async {
    final future = widget.repository.fetchOffers();
    setState(() => _future = future);
    try {
      await future;
    } catch (_) {
      // L'erreur est affichée par le FutureBuilder.
    }
  }

  String _sortLabel(OfferSort sort) {
    switch (sort) {
      case OfferSort.relevance:
        return 'Default order';
      case OfferSort.priceLow:
        return 'Price: low to high';
      case OfferSort.priceHigh:
        return 'Price: high to low';
      case OfferSort.discount:
        return 'Biggest discount';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        if (widget.repository.isDemo) const DemoBanner(),
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
          child: TextField(
            onChanged: (value) => setState(() => _query = value),
            decoration: const InputDecoration(
              labelText: 'Search product, shop or category',
              prefixIcon: Icon(Icons.search),
            ),
          ),
        ),
        SizedBox(
          height: 52,
          child: ListView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            children: [
              Padding(
                padding: const EdgeInsets.only(right: 8),
                child: ChoiceChip(
                  label: const Text('All'),
                  selected: _category == null,
                  onSelected: (_) => setState(() => _category = null),
                ),
              ),
              for (final category in offerCategories)
                Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ChoiceChip(
                    label: Text(category),
                    selected: _category == category,
                    onSelected: (_) => setState(() => _category = category),
                  ),
                ),
            ],
          ),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(
            children: [
              Text(_maxPrice >= _sliderMax
                  ? 'Any price'
                  : 'Up to ${_maxPrice.round()} TND'),
              Expanded(
                child: Slider(
                  value: _maxPrice,
                  min: 1,
                  max: _sliderMax,
                  divisions: 19,
                  onChanged: (value) => setState(() => _maxPrice = value),
                ),
              ),
              PopupMenuButton<OfferSort>(
                tooltip: 'Sort',
                icon: const Icon(Icons.sort),
                onSelected: (value) => setState(() => _sort = value),
                itemBuilder: (_) => [
                  for (final sort in OfferSort.values)
                    CheckedPopupMenuItem<OfferSort>(
                      value: sort,
                      checked: _sort == sort,
                      child: Text(_sortLabel(sort)),
                    ),
                ],
              ),
            ],
          ),
        ),
        Expanded(
          child: FutureBuilder<List<Offer>>(
            future: _future,
            builder: (context, snapshot) {
              if (snapshot.connectionState != ConnectionState.done) {
                return const LoadingView();
              }
              if (snapshot.hasError) {
                return ErrorView(
                  message: 'Could not load the offers.',
                  onRetry: _reload,
                );
              }

              final offers = filterOffers(
                snapshot.data ?? const [],
                query: _query,
                category: _category,
                maxPrice: _maxPrice >= _sliderMax ? null : _maxPrice,
                sort: _sort,
              );

              if (offers.isEmpty) {
                return const EmptyView(
                  message: 'No offers match your search.',
                  icon: Icons.search_off,
                );
              }

              return RefreshIndicator(
                onRefresh: _refresh,
                child: ListView.separated(
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: const EdgeInsets.all(16),
                  itemCount: offers.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 12),
                  itemBuilder: (context, index) {
                    final offer = offers[index];
                    return OfferCard(
                      offer: offer,
                      onTap: () => _openOffer(offer),
                    );
                  },
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}
