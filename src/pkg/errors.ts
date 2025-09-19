const CODES = {
  invalidCode: 'invalidCode',
  userExists: 'userExists',
  invalidContacts: 'invalidContacts',
  tooManyRequests: 'tooManyRequests',
  invalidLoginOrPassword: 'invalidLoginOrPassword',
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

export class ErrorTooManyRequests extends Error {
  constructor() {
    super(CODES.tooManyRequests);
  }
}

export class ErrorInvalidLoginOrPassword extends Error {
  constructor() {
    super(CODES.invalidLoginOrPassword);
  }
}
