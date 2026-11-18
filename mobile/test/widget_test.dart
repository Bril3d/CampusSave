import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/utils/validators.dart';

void main() {
  test('email validator', () {
    expect(Validators.email(''), isNotNull);
    expect(Validators.email('abc'), isNotNull);
    expect(Validators.email('a@b.com'), isNull);
  });

  test('password validator', () {
    expect(Validators.password(''), isNotNull);
    expect(Validators.password('123'), isNotNull);
    expect(Validators.password('123456'), isNull);
  });

  test('confirm password validator', () {
    expect(Validators.confirmPassword('', 'abcdef'), isNotNull);
    expect(Validators.confirmPassword('abcxyz', 'abcdef'), isNotNull);
    expect(Validators.confirmPassword('abcdef', 'abcdef'), isNull);
  });
}
