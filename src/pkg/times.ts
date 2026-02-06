export class Times {
  static millisecond = 1;
  static second = 1000 * Times.millisecond;
  static minute = 60 * Times.second;
  static hour = 60 * Times.minute;
  static day = 24 * Times.hour;
  static week = 7 * Times.day;
  static month = 30 * Times.day;
}