import 'package:flutter/material.dart';
import '../../models/offer.dart';
import '../../repositories/offer_repository.dart';
import '../../widgets/demo_banner.dart';
import '../../widgets/state_views.dart';
import '../../utils/formatters.dart';
import 'offer_form_screen.dart';

class MyOffersTab extends StatefulWidget {
  final String merchantId;
  const MyOffersTab({super.key, required this.merchantId});
  @override State<MyOffersTab> createState() => _State();
}
class _State extends State<MyOffersTab> {
  late Future<List<Offer>> _fut;
  @override void initState() { super.initState(); _load(); }
  void _load() => setState(() => _fut = FakeOfferRepository().fetchForMerchant(widget.merchantId));

  Future<void> _delete(Offer o) async {
    final ok = await showDialog<bool>(context: context, builder: (ctx) => AlertDialog(
      title: const Text('Delete offer'),
      content: Text('Delete "${o.title}"?'),
      actions: [
        TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
        TextButton(onPressed: () => Navigator.pop(ctx, true),
          child: const Text('Delete', style: TextStyle(color: Colors.red))),
      ]));
    if (ok != true) return;
    await FakeOfferRepository().deleteOffer(o.id);
    if (mounted) _load();
  }

  Future<void> _openForm({Offer? edit}) async {
    final saved = await Navigator.of(context).push<bool>(MaterialPageRoute(
      builder: (_) => OfferFormScreen(merchantId: widget.merchantId, existing: edit)));
    if (saved == true && mounted) _load();
  }

  @override Widget build(BuildContext c) => Column(children: [
    const DemoBanner(),
    Expanded(child: FutureBuilder<List<Offer>>(future: _fut,
      builder: (c, snap) {
        if (snap.connectionState != ConnectionState.done) return const LoadingView();
        if (snap.hasError) return ErrorView(message: 'Could not load offers.', onRetry: _load);
        final offers = snap.data ?? [];
        if (offers.isEmpty) return Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
          const EmptyView(message: 'No offers yet.\nCreate your first offer!',
            icon: Icons.add_box_outlined),
          const SizedBox(height: 16),
          ElevatedButton.icon(icon: const Icon(Icons.add), label: const Text('Create offer'),
            onPressed: () => _openForm()),
        ]));
        return RefreshIndicator(onRefresh: () async => _load(),
          child: ListView.separated(physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.all(16), itemCount: offers.length,
            separatorBuilder: (_, __) => const SizedBox(height: 12),
            itemBuilder: (_, i) => _OfferRow(offer: offers[i],
              onEdit: () => _openForm(edit: offers[i]),
              onDelete: () => _delete(offers[i]))));
      })),
  ]);
}

class _OfferRow extends StatelessWidget {
  final Offer offer; final VoidCallback onEdit, onDelete;
  const _OfferRow({required this.offer, required this.onEdit, required this.onDelete});
  @override Widget build(BuildContext c) {
    final s = Theme.of(c).colorScheme;
    return Card(child: Padding(padding: const EdgeInsets.all(14), child: Row(children: [
      Container(width: 56, height: 56,
        decoration: BoxDecoration(color: s.primaryContainer,
          borderRadius: BorderRadius.circular(10)),
        child: Icon(categoryIcon(offer.category), color: s.onPrimaryContainer)),
      const SizedBox(width: 12),
      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(offer.title, style: Theme.of(c).textTheme.titleSmall, maxLines: 1,
          overflow: TextOverflow.ellipsis),
        const SizedBox(height: 2),
        Row(children: [
          Text(fPrice(offer.discountedPrice),
            style: TextStyle(color: s.primary, fontWeight: FontWeight.bold)),
          const SizedBox(width: 6),
          Text(fPrice(offer.originalPrice),
            style: const TextStyle(color: Colors.grey, fontSize: 12,
              decoration: TextDecoration.lineThrough)),
        ]),
        const SizedBox(height: 2),
        Row(children: [
          Container(padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
            decoration: BoxDecoration(
              color: offer.soldOut ? Colors.red.shade50 : Colors.green.shade50,
              borderRadius: BorderRadius.circular(6)),
            child: Text(offer.soldOut ? 'Sold out' : '${offer.quantity} left',
              style: TextStyle(fontSize: 11,
                color: offer.soldOut ? Colors.red.shade700 : Colors.green.shade700,
                fontWeight: FontWeight.w600))),
        ]),
      ])),
      PopupMenuButton(itemBuilder: (_) => [
        PopupMenuItem(onTap: onEdit, child: const Row(children: [
          Icon(Icons.edit_outlined, size: 18), SizedBox(width: 8), Text('Edit')])),
        PopupMenuItem(onTap: onDelete, child: Row(children: [
          Icon(Icons.delete_outlined, size: 18, color: Colors.red),
          const SizedBox(width: 8), const Text('Delete', style: TextStyle(color: Colors.red))])),
      ]),
    ])));
  }
}
