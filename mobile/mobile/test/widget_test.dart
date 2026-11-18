import 'package:flutter_test/flutter_test.dart';
import 'package:campus_save/app.dart';

void main() {
  testWidgets('App starts and shows the title', (tester) async {
    await tester.pumpWidget(const CampusSaveApp());
    expect(find.text('CampusSave'), findsWidgets);
  });
}
