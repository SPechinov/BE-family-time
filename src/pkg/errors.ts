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
  doubleRegistration: 'doubleRegistration',
  invalidUserAgent: 'invalidUserAgent',
};

export abstract class BusinessError extends Error {
  abstract statusCode: number;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class ErrorInvalidCode extends BusinessError {
  statusCode = 400;
  constructor() {
    super(CODES.invalidCode);
  }
}

export class ErrorInvalidUserAgent extends BusinessError {
  statusCode = 400;
  constructor() {
    super(CODES.invalidUserAgent);
  }
}

export class ErrorDoubleRegistration extends BusinessError {
  statusCode = 429;
  constructor() {
    super(CODES.doubleRegistration);
  }
}

export class ErrorUserExists extends BusinessError {
  statusCode = 400;
  constructor() {
    super(CODES.userExists);
  }
}

export class ErrorUserNotExists extends BusinessError {
  statusCode = 400;
  constructor() {
    super(CODES.userNotExists);
  }
}

export class ErrorInvalidContacts extends BusinessError {
  statusCode = 400;
  constructor() {
    super(CODES.invalidContacts);
  }
}

export class ErrorTooManyRequests extends BusinessError {
  statusCode = 429;
  constructor() {
    super(CODES.tooManyRequests);
  }
}

export class ErrorInvalidLoginOrPassword extends BusinessError {
  statusCode = 400;
  constructor() {
    super(CODES.invalidLoginOrPassword);
  }
}

export class ErrorInvalidRefreshToken extends BusinessError {
  statusCode = 400;
  constructor() {
    super(CODES.invalidRefreshToken);
  }
}

export class ErrorUnauthorized extends BusinessError {
  statusCode = 401;
  constructor() {
    super(CODES.unauthorized);
  }
}

export class ErrorTokenExpired extends BusinessError {
  statusCode = 401;
  constructor() {
    super(CODES.tokenExpired);
  }
}
