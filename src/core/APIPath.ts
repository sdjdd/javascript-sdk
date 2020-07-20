export class APIPath {
  static readonly login = '/1.1/login';
  static readonly batch = '/1.1/batch';
  static readonly fileTokens = '/1.1/fileTokens';
  static readonly fileCallback = '/1.1/fileCallback';
  static readonly me = '/1.1/users/me';
  static readonly requestEmailVerify = '/1.1/requestEmailVerify';
  static readonly requestPasswordReset = '/1.1/requestPasswordReset';
  static readonly requestPasswordResetBySmsCode =
    '/1.1/requestPasswordResetBySmsCode';
  static readonly requestLoginSmsCode = '/1.1/requestLoginSmsCode';
  static readonly requestMobilePhoneVerify = '/1.1/requestMobilePhoneVerify';
  static readonly requestChangePhoneNumber = '/1.1/requestChangePhoneNumber';
  static readonly changePhoneNumber = '/1.1/changePhoneNumber';

  static class(className: string): string {
    switch (className) {
      case '_User':
        return '/1.1/users';
      default:
        return '/1.1/classes/' + className;
    }
  }

  static object(className: string, objectId: string): string {
    return this.class(className) + '/' + objectId;
  }

  static resetPasswordBySmsCode(code: string): string {
    return '/1.1/resetPasswordBySmsCode/' + code;
  }

  static verifyMobilePhone(code: string): string {
    return '/1.1/verifyMobilePhone/' + code;
  }

  static updatePassword(userId: string): string {
    return '/1.1/users/' + userId + '/updatePassword';
  }
}
