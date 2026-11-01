// jalali-kit: Gregorian <-> Solar Hijri (Jalali) conversion, Persian dates, digits and money.
// Node 22, no dependencies, nothing else imported.

// ------------------------------------------------------------------ names

export const MONTH_NAMES = Object.freeze([
  'فروردین', // فروردین
  'اردیبهشت', // اردیبهشت
  'خرداد', // خرداد
  'تیر', // تیر
  'مرداد', // مرداد
  'شهریور', // شهریور
  'مهر', // مهر
  'آبان', // آبان
  'آذر', // آذر
  'دی', // دی
  'بهمن', // بهمن
  'اسفند', // اسفند
]);

export const WEEKDAY_NAMES = Object.freeze([
  'شنبه', // شنبه
  'یکشنبه', // یکشنبه
  'دوشنبه', // دوشنبه
  'سه‌شنبه', // سه‌شنبه
  'چهارشنبه', // چهارشنبه
  'پنجشنبه', // پنجشنبه
  'جمعه', // جمعه
]);

const RIAL = 'ریال'; // ریال
const TOMAN = 'تومان'; // تومان
const THOUSANDS = '٬';

// ------------------------------------------------------------------ the calendar

const MIN_YEAR = 1300;
const MAX_YEAR = 1500;
const LEAP_REMAINDERS = new Set([1, 5, 9, 13, 17, 22, 26, 30]);

const isInt = (value) => typeof value === 'number' && Number.isInteger(value);
const floorDiv = (a, b) => Math.floor(a / b);
const mod = (a, b) => ((a % b) + b) % b;

const jalaliLeap = (year) => LEAP_REMAINDERS.has(mod(year, 33));
const jalaliYearLength = (year) => (jalaliLeap(year) ? 366 : 365);

/** Days since 1970-01-01 of a proleptic Gregorian date (month 1-12, day 1-31, not validated). */
function daysFromCivil(year, month, day) {
  const y = month <= 2 ? year - 1 : year;
  const era = floorDiv(y, 400);
  const yoe = y - era * 400;
  const doy = floorDiv(153 * (month + (month > 2 ? -3 : 9)) + 2, 5) + day - 1;
  const doe = yoe * 365 + floorDiv(yoe, 4) - floorDiv(yoe, 100) + doy;
  return era * 146097 + doe - 719468;
}

/** The Gregorian date of a day count since 1970-01-01. */
function civilFromDays(days) {
  const z = days + 719468;
  const era = floorDiv(z, 146097);
  const doe = z - era * 146097;
  const yoe = floorDiv(doe - floorDiv(doe, 1460) + floorDiv(doe, 36524) - floorDiv(doe, 146096), 365);
  const doy = doe - (365 * yoe + floorDiv(yoe, 4) - floorDiv(yoe, 100));
  const mp = floorDiv(5 * doy + 2, 153);
  const day = doy - floorDiv(153 * mp + 2, 5) + 1;
  const month = mp < 10 ? mp + 3 : mp - 9;
  return { year: yoe + era * 400 + (month <= 2 ? 1 : 0), month, day };
}

const gregorianLeap = (year) => (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
const gregorianMonthDays = (year, month) => [31, gregorianLeap(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];

// START[i] is the day count of 1 Farvardin of year 1300 + i, for 1300 up to 1501 (a sentinel).
const START = (() => {
  const table = new Array(MAX_YEAR + 2 - MIN_YEAR);
  const anchorYear = 1400;
  table[anchorYear - MIN_YEAR] = daysFromCivil(2021, 3, 21);
  for (let year = anchorYear; year <= MAX_YEAR; year += 1) table[year + 1 - MIN_YEAR] = table[year - MIN_YEAR] + jalaliYearLength(year);
  for (let year = anchorYear - 1; year >= MIN_YEAR; year -= 1) table[year - MIN_YEAR] = table[year + 1 - MIN_YEAR] - jalaliYearLength(year);
  return table;
})();

const FIRST_DAY = START[0]; // 1300-01-01 = 1921-03-21
const LAST_DAY = START[MAX_YEAR + 1 - MIN_YEAR] - 1; // 1500-12-29 = 2122-03-20

const MONTH_OFFSET = [0, 31, 62, 93, 124, 155, 186, 216, 246, 276, 306, 336];

function checkJalali(year, month, day, what = 'Jalali date') {
  if (!isInt(year) || !isInt(month) || !isInt(day)) {
    throw new RangeError(`${what}: year, month and day must be integers of type number (got ${String(year)}, ${String(month)}, ${String(day)})`);
  }
  if (year < MIN_YEAR || year > MAX_YEAR) throw new RangeError(`${what}: year ${year} is outside the supported range ${MIN_YEAR}-${MAX_YEAR}`);
  if (month < 1 || month > 12) throw new RangeError(`${what}: month ${month} does not exist`);
  const length = month <= 6 ? 31 : month <= 11 ? 30 : jalaliLeap(year) ? 30 : 29;
  if (day < 1 || day > length) throw new RangeError(`${what}: day ${day} does not exist in month ${month} of year ${year}`);
}

function jalaliToDays(year, month, day) {
  return START[year - MIN_YEAR] + MONTH_OFFSET[month - 1] + day - 1;
}

function daysToJalali(days) {
  let low = 0;
  let high = MAX_YEAR - MIN_YEAR;
  while (low < high) {
    const middle = (low + high + 1) >> 1;
    if (START[middle] <= days) low = middle;
    else high = middle - 1;
  }
  const year = MIN_YEAR + low;
  const index = days - START[low];
  let month = 12;
  while (MONTH_OFFSET[month - 1] > index) month -= 1;
  return { year, month, day: index - MONTH_OFFSET[month - 1] + 1 };
}

function checkGregorian(year, month, day) {
  if (!isInt(year) || !isInt(month) || !isInt(day)) {
    throw new RangeError(`Gregorian date: year, month and day must be integers of type number (got ${String(year)}, ${String(month)}, ${String(day)})`);
  }
  if (month < 1 || month > 12) throw new RangeError(`Gregorian date: month ${month} does not exist`);
  if (year < 1 || year > 9999) throw new RangeError(`Gregorian date: year ${year} is outside the supported range`);
  if (day < 1 || day > gregorianMonthDays(year, month)) throw new RangeError(`Gregorian date: day ${day} does not exist in month ${month} of year ${year}`);
  const days = daysFromCivil(year, month, day);
  if (days < FIRST_DAY || days > LAST_DAY) {
    throw new RangeError(`Gregorian date ${year}-${month}-${day} is outside the supported range 1921-03-21 to 2122-03-20`);
  }
  return days;
}

function checkYear(year) {
  if (!isInt(year) || year < MIN_YEAR || year > MAX_YEAR) throw new RangeError(`year ${String(year)} is outside the supported range ${MIN_YEAR}-${MAX_YEAR}`);
}

function checkMonth(month) {
  if (!isInt(month) || month < 1 || month > 12) throw new RangeError(`month ${String(month)} must be an integer from 1 to 12`);
}

export function isLeapYear(jy) {
  checkYear(jy);
  return jalaliLeap(jy);
}

export function daysInMonth(jy, jm) {
  checkYear(jy);
  checkMonth(jm);
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  return jalaliLeap(jy) ? 30 : 29;
}

export function gregorianToJalali(gy, gm, gd) {
  return daysToJalali(checkGregorian(gy, gm, gd));
}

export function jalaliToGregorian(jy, jm, jd) {
  checkJalali(jy, jm, jd);
  return civilFromDays(jalaliToDays(jy, jm, jd));
}

// ------------------------------------------------------------------ digits

const PERSIAN_ZERO = 0x06f0;
const ARABIC_ZERO = 0x0660;

function digitsInput(value) {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  throw new TypeError('expected a string or a number');
}

export function toPersianDigits(value) {
  return digitsInput(value).replace(/[0-9]/g, (digit) => String.fromCharCode(PERSIAN_ZERO + digit.charCodeAt(0) - 48));
}

export function toLatinDigits(value) {
  return digitsInput(value)
    .replace(/[۰-۹]/g, (digit) => String.fromCharCode(48 + digit.charCodeAt(0) - PERSIAN_ZERO))
    .replace(/[٠-٩]/g, (digit) => String.fromCharCode(48 + digit.charCodeAt(0) - ARABIC_ZERO));
}

// ------------------------------------------------------------------ money

function formatMoney(amount, unit) {
  if (!(typeof amount === 'bigint' || (typeof amount === 'number' && Number.isSafeInteger(amount)))) {
    throw new RangeError('amount must be a safe integer or a bigint');
  }
  const text = String(amount);
  const negative = text.startsWith('-');
  const digits = negative ? text.slice(1) : text;
  const grouped = digits.replace(/\B(?=(\d{3})+$)/g, THOUSANDS);
  return `${negative ? '-' : ''}${toPersianDigits(grouped)} ${unit}`;
}

export const formatRial = (amount) => formatMoney(amount, RIAL);
export const formatToman = (amount) => formatMoney(amount, TOMAN);

// ------------------------------------------------------------------ JalaliDate

const pad = (value, width) => String(value).padStart(width, '0');

export class JalaliDate {
  constructor(year, month, day) {
    checkJalali(year, month, day);
    const days = jalaliToDays(year, month, day);
    Object.defineProperty(this, 'year', { value: year, enumerable: true });
    Object.defineProperty(this, 'month', { value: month, enumerable: true });
    Object.defineProperty(this, 'day', { value: day, enumerable: true });
    Object.defineProperty(this, 'weekday', { value: mod(days + 5, 7), enumerable: true });
    Object.freeze(this);
  }

  static fromGregorian(gy, gm, gd) {
    const { year, month, day } = gregorianToJalali(gy, gm, gd);
    return new JalaliDate(year, month, day);
  }

  static parse(text) {
    return parse(text);
  }

  toGregorian() {
    return civilFromDays(jalaliToDays(this.year, this.month, this.day));
  }

  isoformat() {
    return `${pad(this.year, 4)}-${pad(this.month, 2)}-${pad(this.day, 2)}`;
  }

  toString() {
    return this.isoformat();
  }

  addDays(n) {
    if (!isInt(n)) throw new RangeError('the number of days must be an integer');
    const days = jalaliToDays(this.year, this.month, this.day) + n;
    if (!(days >= FIRST_DAY && days <= LAST_DAY)) throw new RangeError(`${this.isoformat()} plus ${n} days is outside the supported range`);
    const { year, month, day } = daysToJalali(days);
    return new JalaliDate(year, month, day);
  }

  subtractDays(n) {
    if (!isInt(n)) throw new RangeError('the number of days must be an integer');
    return this.addDays(-n);
  }

  compare(other) {
    if (!(other instanceof JalaliDate)) throw new TypeError('compare needs a JalaliDate');
    const a = jalaliToDays(this.year, this.month, this.day);
    const b = jalaliToDays(other.year, other.month, other.day);
    return a < b ? -1 : a > b ? 1 : 0;
  }

  equals(other) {
    return other instanceof JalaliDate && this.compare(other) === 0;
  }

  format(pattern = 'YYYY/MM/DD', options) {
    if (typeof pattern !== 'string') throw new TypeError('the pattern must be a string');
    let persian = false;
    if (options !== undefined && options !== null) {
      if (typeof options !== 'object') throw new RangeError('options must be an object');
      const digits = options.digits;
      if (digits === 'persian') persian = true;
      else if (digits !== undefined && digits !== 'latin') throw new RangeError(`unknown digits option ${String(digits)}`);
    }
    const tokens = [
      ['YYYY', () => pad(this.year, 4)],
      ['MMMM', () => MONTH_NAMES[this.month - 1]],
      ['dddd', () => WEEKDAY_NAMES[this.weekday]],
      ['YY', () => pad(this.year % 100, 2)],
      ['MM', () => pad(this.month, 2)],
      ['DD', () => pad(this.day, 2)],
      ['M', () => String(this.month)],
      ['D', () => String(this.day)],
    ];
    let result = '';
    for (let i = 0; i < pattern.length; ) {
      const token = tokens.find(([name]) => pattern.startsWith(name, i));
      if (token) {
        result += token[1]();
        i += token[0].length;
      } else {
        result += pattern[i];
        i += 1;
      }
    }
    return persian ? toPersianDigits(result) : result;
  }
}

// ------------------------------------------------------------------ parsing

export function parse(text) {
  if (typeof text !== 'string') throw new RangeError('cannot parse a value that is not a string as a Jalali date');
  const trimmed = text.trim();
  const match = /^(\d{4})([/-])(\d{1,2})\2(\d{1,2})$/.exec(toLatinDigits(trimmed));
  if (match === null) throw new RangeError(`not a Jalali date (expected YYYY/MM/DD or YYYY-MM-DD): ${trimmed}`);
  try {
    return new JalaliDate(Number(match[1]), Number(match[3]), Number(match[4]));
  } catch (error) {
    if (error instanceof RangeError) throw new RangeError(`${error.message}: ${trimmed}`);
    throw error;
  }
}
