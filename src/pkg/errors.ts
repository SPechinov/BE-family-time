export class ErrorInvalidCode extends Error {
  static new() {
    return new ErrorInvalidCode('invalid_code');
  }
}
