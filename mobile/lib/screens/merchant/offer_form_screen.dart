import 'package:flutter/material.dart';
import '../../models/offer.dart';
import '../../repositories/admin_repository.dart';
import '../../repositories/offer_repository.dart';
import '../../utils/validators.dart';

class OfferFormScreen extends StatefulWidget {
  final String merchantId; final Offer? existing;
  const OfferFormScreen({super.key, required this.merchantId, this.existing});
  @override State<OfferFormScreen> createState() => _State();
}
class _State extends State<OfferFormScreen> {
  final _fk = GlobalKey<FormState>();
  late final TextEditingController _title, _desc, _orig, _disc, _qty;
  String _cat = offerCategories.first;
  TimeOfDay _start = const TimeOfDay(hour: 17, minute: 0);
  TimeOfDay _end   = const TimeOfDay(hour: 19, minute: 0);
  bool _busy = false;

  @override void initState() {
    super.initState();
    final e = widget.existing;
    _title = TextEditingController(text: e?.title ?? '');
    _desc  = TextEditingController(text: e?.description ?? '');
    _orig  = TextEditingController(text: e != null ? e.originalPrice.toString() : '');
    _disc  = TextEditingController(text: e != null ? e.discountedPrice.toString() : '');
    _qty   = TextEditingController(text: e != null ? e.quantity.toString() : '');
    if (e != null) {
      _cat   = e.category;
      _start = TimeOfDay(hour: e.pickupStart.hour, minute: e.pickupStart.minute);
      _end   = TimeOfDay(hour: e.pickupEnd.hour,   minute: e.pickupEnd.minute);
    }
  }

  @override void dispose() {
    _title.dispose(); _desc.dispose(); _orig.dispose();
    _disc.dispose(); _qty.dispose(); super.dispose();
  }

  Future<void> _pickTime(bool isStart) async {
    final t = await showTimePicker(context: context,
      initialTime: isStart ? _start : _end);
    if (t == null) return;
    setState(() { if (isStart) _start = t; else _end = t; });
  }

  Future<void> _save() async {
    if (!_fk.currentState!.validate()) return;
    setState(() => _busy = true);
    final now = DateTime.now();
    DateTime at(TimeOfDay t) => DateTime(now.year, now.month, now.day, t.hour, t.minute);
    final biz = FakeAdminRepository().businessName(widget.merchantId);
    try {
      if (widget.existing == null) {
        await FakeOfferRepository().createOffer(
          merchantId: widget.merchantId, merchantName: biz,
          title: _title.text.trim(), description: _desc.text.trim(), category: _cat,
          originalPrice: double.parse(_orig.text.trim()),
          discountedPrice: double.parse(_disc.text.trim()),
          quantity: int.parse(_qty.text.trim()),
          pickupStart: at(_start), pickupEnd: at(_end));
      } else {
        final e = widget.existing!;
        await FakeOfferRepository().updateOffer(Offer(
          id: e.id, merchantId: e.merchantId, merchantName: e.merchantName,
          title: _title.text.trim(), description: _desc.text.trim(), category: _cat,
          originalPrice: double.parse(_orig.text.trim()),
          discountedPrice: double.parse(_disc.text.trim()),
          quantity: int.parse(_qty.text.trim()),
          pickupStart: at(_start), pickupEnd: at(_end)));
      }
      if (mounted) Navigator.of(context).pop(true);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
    } finally { if (mounted) setState(() => _busy = false); }
  }

  @override Widget build(BuildContext c) => Scaffold(
    appBar: AppBar(title: Text(widget.existing == null ? 'New Offer' : 'Edit Offer')),
    body: Form(key: _fk, child: ListView(padding: const EdgeInsets.all(16), children: [
      TextFormField(controller: _title, textCapitalization: TextCapitalization.sentences,
        decoration: const InputDecoration(labelText: 'Title', prefixIcon: Icon(Icons.title)),
        validator: (v) => Validators.required(v, label: 'Title')),
      const SizedBox(height: 14),
      TextFormField(controller: _desc, maxLines: 3,
        decoration: const InputDecoration(labelText: 'Description',
          prefixIcon: Icon(Icons.description_outlined), alignLabelWithHint: true),
        validator: (v) => Validators.required(v, label: 'Description')),
      const SizedBox(height: 14),
      DropdownButtonFormField<String>(value: _cat,
        decoration: const InputDecoration(labelText: 'Category',
          prefixIcon: Icon(Icons.category_outlined)),
        items: offerCategories.map((c) =>
          DropdownMenuItem(value: c, child: Text(c))).toList(),
        onChanged: (v) => setState(() => _cat = v ?? _cat)),
      const SizedBox(height: 14),
      Row(children: [
        Expanded(child: TextFormField(controller: _orig, keyboardType: TextInputType.number,
          decoration: const InputDecoration(labelText: 'Original price (TND)',
            prefixIcon: Icon(Icons.price_change_outlined)),
          validator: Validators.positiveNumber)),
        const SizedBox(width: 12),
        Expanded(child: TextFormField(controller: _disc, keyboardType: TextInputType.number,
          decoration: const InputDecoration(labelText: 'Discounted price (TND)',
            prefixIcon: Icon(Icons.sell_outlined)),
          validator: Validators.positiveNumber)),
      ]),
      const SizedBox(height: 14),
      TextFormField(controller: _qty, keyboardType: TextInputType.number,
        decoration: const InputDecoration(labelText: 'Quantity available',
          prefixIcon: Icon(Icons.inventory_2_outlined)),
        validator: Validators.positiveInt),
      const SizedBox(height: 16),
      Text('Pickup window', style: Theme.of(c).textTheme.titleSmall),
      const SizedBox(height: 8),
      Row(children: [
        Expanded(child: OutlinedButton.icon(icon: const Icon(Icons.access_time),
          label: Text('Start: ${_start.format(c)}'),
          onPressed: () => _pickTime(true))),
        const SizedBox(width: 12),
        Expanded(child: OutlinedButton.icon(icon: const Icon(Icons.access_time_filled),
          label: Text('End: ${_end.format(c)}'),
          onPressed: () => _pickTime(false))),
      ]),
      const SizedBox(height: 24),
      ElevatedButton(onPressed: _busy ? null : _save,
        child: _busy ? const SizedBox(height: 22, width: 22,
          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
          : Text(widget.existing == null ? 'Create offer' : 'Save changes')),
    ])));
}
