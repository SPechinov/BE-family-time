const CODES = {
  invalidCode: 'invalidCode',
  userExists: 'userExists',
};

export class ErrorInvalidCode extends Error {
  constructor() {
    super(CODES.invalidCode);
  }
}

export class ErrorUserExists extends Error {
  constructor() {
    super(CODES.userExists);
  }
}
