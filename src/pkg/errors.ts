const CODES = {
  invalidCode: 'invalidCode',
  userExists: 'userExists',
  invalidContacts: 'invalidContacts',
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

export class ErrorInvalidContacts extends Error {
  constructor() {
    super(CODES.invalidContacts);
  }
}
