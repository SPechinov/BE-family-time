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
  groupNotExists: 'groupNotExists',
  groupsLimitExceeded: 'groupsLimitExceeded',
  groupUsersCountLimitExceeded: 'groupUsersCountLimitExceeded',
  userIsNotGroupOwner: 'userIsNotGroupOwner',
  userInGroup: 'userInGroup',
  userNotInGroup: 'userNotInGroup',
  userIsGroupOwner: 'userIsGroupOwner',
  groupHasUsers: 'groupHasUsers',
  calendarEventNotExists: 'calendarEventNotExists',
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
  public readonly msBeforeNext?: number;
  public readonly remainingPoints?: number;

  constructor(props?: { msBeforeNext?: number; remainingPoints?: number }) {
    super(CODES.tooManyRequests);
    this.msBeforeNext = props?.msBeforeNext;
    this.remainingPoints = props?.remainingPoints;
  }
}

export class ErrorInvalidLoginOrPassword extends BusinessError {
  statusCode = 400;
  constructor() {
    super(CODES.invalidLoginOrPassword);
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

export class ErrorGroupNotExists extends BusinessError {
  statusCode = 404;
  constructor() {
    super(CODES.groupNotExists);
  }
}

export class ErrorGroupsLimitExceeded extends BusinessError {
  statusCode = 403;

  constructor() {
    super(CODES.groupsLimitExceeded);
  }
}

export class ErrorGroupUsersCountLimitExceeded extends BusinessError {
  statusCode = 403;

  constructor() {
    super(CODES.groupUsersCountLimitExceeded);
  }
}

export class ErrorUserInGroup extends BusinessError {
  statusCode = 400;
  constructor() {
    super(CODES.userInGroup);
  }
}

export class ErrorUserNotInGroup extends BusinessError {
  statusCode = 400;
  constructor() {
    super(CODES.userNotInGroup);
  }
}

export class ErrorUserIsGroupOwner extends BusinessError {
  statusCode = 400;
  constructor() {
    super(CODES.userIsGroupOwner);
  }
}

export class ErrorUserIsNotGroupOwner extends BusinessError {
  statusCode = 400;
  constructor() {
    super(CODES.userIsNotGroupOwner);
  }
}

export class ErrorGroupHasUsers extends BusinessError {
  statusCode = 400;
  constructor() {
    super(CODES.groupHasUsers);
  }
}

export class ErrorCalendarEventNotExists extends BusinessError {
  statusCode = 404;
  constructor() {
    super(CODES.calendarEventNotExists);
  }
}
