const CODES = {
  invalidCode: 'invalidCode',
  userExists: 'userExists',
  invalidContacts: 'invalidContacts',
  tooManyRequests: 'tooManyRequests',
  invalidLoginOrPassword: 'invalidLoginOrPassword',
  invalidRefreshToken: 'invalidRefreshToken',
  unauthorized: 'unauthorized',
  tokenExpired: 'tokenExpired',
  userNotExists: 'userNotExists',
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

export class ErrorNotUserExists extends Error {
  constructor() {
    super(CODES.userNotExists);
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

export class ErrorInvalidRefreshToken extends Error {
  constructor() {
    super(CODES.invalidRefreshToken);
  }
}

export class ErrorUnauthorized extends Error {
  constructor() {
    super(CODES.unauthorized);
  }
}

export class ErrorTokenExpired extends Error {
  constructor() {
    super(CODES.tokenExpired);
  }
}
