const millisecond = 1;
const second = 1000 * millisecond;
const minute = 60 * second;
const hour = 60 * minute;
const day = 24 * hour;
const week = 7 * day;
const month = 30 * day;

export const TIMES = Object.freeze({
  millisecond,
  second,
  minute,
  hour,
  day,
  week,
  month,
} as const);
