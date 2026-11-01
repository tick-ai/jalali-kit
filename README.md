# jalali-kit: Persian dates and numbers, no dependencies

## The job

Our invoices and reports are read in Iran, and date bugs at the turn of the year keep reaching customers. Build a small Node library, with **no dependencies**, that converts between the Gregorian and the Solar Hijri (Jalali, Persian) calendar, and formats Persian dates, digits and money.

It must work with **Node 22 and nothing installed** (no `npm install`), and with **no network**. Use only Node built-ins, if anything at all.

## Files to create, and the rule

Create exactly one file: **`src/index.mjs`**, an ES module with the named exports listed below. It is the whole answer.

**The rule:** only the paths named here as the territory may change. The territory is `src/index.mjs`. Do not change `README.md` or anything else. A directory `sealed/` may appear beside `src/` when your work is checked; do not touch it.

## How it is run

The work is checked from the root of the project (the folder that holds `src/`) with:

    node sealed/check.mjs

It imports `./src/index.mjs`, runs with Node 22, no network, no git, nothing installed, and exits non-zero on any failure.

## The calendar (exact rules)

* Months 1-6 have 31 days, months 7-11 have 30 days, month 12 (Esfand) has 29 days, or 30 in a leap year.
* A Jalali year `y` is a leap year exactly when `y % 33` is one of `1, 5, 9, 13, 17, 22, 26, 30`. (So 1403 and 1408 are leap years, 1404 and 1407 are not.)
* Anchor: 1 Farvardin 1400 is 2021-03-21 (Gregorian). 1 Farvardin 1403 is 2024-03-20; 1 Farvardin 1408 is 2029-03-20.
* **Supported range:** Jalali 1300-01-01 (Gregorian 1921-03-21) to Jalali 1500-12-29 (Gregorian 2122-03-20), every day inclusive, and all of it must be correct, both ways. Anything outside it (a Jalali year below 1300 or above 1500, or a Gregorian date before 1921-03-21 or after 2122-03-20) is invalid.
* Gregorian dates are the proleptic Gregorian calendar (leap years: divisible by 4, except centuries not divisible by 400).
* Weekdays number 0 to 6 with **Saturday = 0**, Sunday = 1, ... Friday = 6. (2025-03-21 was a Friday, so its weekday is 6.)

## Invalid input: RangeError

Whenever a date is invalid, throw a **`RangeError`** with a non-empty message. Never roll over silently: month 13, day 0, day 32, day 31 in months 7-12, day 30 of Esfand in a non-leap year (1404-12-30), February 30 and the like are all errors, never turned into another date. Year, month and day must be integers of type `number` (a string such as `"1403"`, `1.5` or `NaN` is a `RangeError`).

## Exports of `src/index.mjs`

All are named exports.

### Conversion

* `gregorianToJalali(gy, gm, gd)` returns a plain object `{ year, month, day }` (numbers).
* `jalaliToGregorian(jy, jm, jd)` returns a plain object `{ year, month, day }` (numbers).
* `isLeapYear(jy)` returns a boolean for a Jalali year; `daysInMonth(jy, jm)` returns 29, 30 or 31. Both throw `RangeError` for a year outside 1300-1500 or a month that is not an integer 1-12.
* Both conversions throw `RangeError` on an invalid input date, as described above.

### `JalaliDate`

A class. Instances never change (every operation returns a new instance).

* `new JalaliDate(year, month, day)` throws `RangeError` if the date does not exist or is outside the supported range.
* Read-only properties: `year`, `month`, `day`, and `weekday` (0 to 6, Saturday first).
* `JalaliDate.fromGregorian(gy, gm, gd)` returns a `JalaliDate`; `date.toGregorian()` returns `{ year, month, day }`.
* `date.isoformat()` returns `'YYYY-MM-DD'` with Latin digits, zero padded, for example `'1403-12-30'`. `date.toString()` returns the same.
* `date.addDays(n)` and `date.subtractDays(n)` return a new `JalaliDate` `n` days later or earlier (`n` an integer, may be negative or zero, otherwise `RangeError`). Months and years roll over correctly (`1403-12-30` plus 1 day is `1404-01-01`). A result outside the supported range is a `RangeError`.
* `date.compare(other)` returns `-1`, `0` or `1` when `date` is before, the same day as, or after `other` (another `JalaliDate`). `date.equals(other)` returns a boolean.
* `date.format(pattern = 'YYYY/MM/DD', options)`: the pattern is scanned left to right and at each position the longest of these tokens is replaced; every other character stays as it is:
  * `YYYY` year, 4 digits, zero padded; `YY` last two digits of the year, zero padded
  * `MMMM` Persian month name; `MM` month, 2 digits, zero padded; `M` month without padding
  * `DD` day, 2 digits, zero padded; `D` day without padding
  * `dddd` Persian weekday name
  
  Numbers come out in Latin digits, unless `options` is `{ digits: 'persian' }`, in which case every Latin digit `0-9` in the finished result is converted to a Persian digit. `{ digits: 'latin' }` or no options is the default; any other `digits` value is a `RangeError`.
  Example: for 1403-12-30, `format('dddd D MMMM YYYY')` is the weekday name, `30`, the name of Esfand and `1403`, joined by single spaces.

### Names

`MONTH_NAMES` (12 strings, Farvardin first) and `WEEKDAY_NAMES` (7 strings, Saturday first) are exported arrays, and `format` uses exactly these strings. They use the Persian letters ی (U+06CC) and ک (U+06A9); the only zero-width non-joiner (U+200C) is the one inside the Tuesday name:

```js
const MONTH_NAMES = [
  '\u0641\u0631\u0648\u0631\u062F\u06CC\u0646', // فروردین
  '\u0627\u0631\u062F\u06CC\u0628\u0647\u0634\u062A', // اردیبهشت
  '\u062E\u0631\u062F\u0627\u062F', // خرداد
  '\u062A\u06CC\u0631', // تیر
  '\u0645\u0631\u062F\u0627\u062F', // مرداد
  '\u0634\u0647\u0631\u06CC\u0648\u0631', // شهریور
  '\u0645\u0647\u0631', // مهر
  '\u0622\u0628\u0627\u0646', // آبان
  '\u0622\u0630\u0631', // آذر
  '\u062F\u06CC', // دی
  '\u0628\u0647\u0645\u0646', // بهمن
  '\u0627\u0633\u0641\u0646\u062F', // اسفند
];
const WEEKDAY_NAMES = [
  '\u0634\u0646\u0628\u0647', // شنبه
  '\u06CC\u06A9\u0634\u0646\u0628\u0647', // یکشنبه
  '\u062F\u0648\u0634\u0646\u0628\u0647', // دوشنبه
  '\u0633\u0647\u200C\u0634\u0646\u0628\u0647', // سه‌شنبه
  '\u0686\u0647\u0627\u0631\u0634\u0646\u0628\u0647', // چهارشنبه
  '\u067E\u0646\u062C\u0634\u0646\u0628\u0647', // پنجشنبه
  '\u062C\u0645\u0639\u0647', // جمعه
];
```

### Digits

* `toPersianDigits(value)` takes a string or a number (a number is turned into a string first) and returns a string in which each `0-9` is replaced by the Persian digits `۰۱۲۳۴۵۶۷۸۹` (U+06F0 to U+06F9). All other characters stay. Any other type of argument is a `TypeError`.
* `toLatinDigits(value)` takes a string or a number and returns a string in which Persian digits (U+06F0 to U+06F9) **and Arabic-Indic digits** (U+0660 to U+0669) are replaced by `0-9`. All other characters stay. Any other type is a `TypeError`.

### Money

* `formatRial(amount)` returns the amount with Persian digits, a thousands separator, a space and the unit word `ریال` (`'ریال'`). The separator is the Arabic thousands separator `٬` (U+066C), placed between groups of three digits counted from the right. Example: `formatRial(1234567)` is `'۱٬۲۳۴٬۵۶۷ ریال'`, `formatRial(0)` is `'۰ ریال'`, `formatRial(999)` is `'۹۹۹ ریال'`.
* `formatToman(amount)` is the same with the unit word `تومان` (`'تومان'`). The amount is taken as Toman as given: there is no conversion between Rial and Toman.
* A negative amount gets an ASCII hyphen-minus `-` right before the first digit: `formatRial(-1500)` is `'-۱٬۵۰۰ ریال'`.
* `amount` must be a safe integer (`Number.isSafeInteger`) or a `bigint`; anything else (fractions, `NaN`, `Infinity`, strings, `undefined`) is a `RangeError`.

### Parsing

* `parse(text)` (also available as `JalaliDate.parse(text)`) turns text such as `'1403/12/30'`, `'1403-12-30'`, `'۱۴۰۳/۱۲/۳۰'` or `'1403-۱۲-30'` into a `JalaliDate`.
* Digits may be Persian, Arabic-Indic or Latin, mixed freely. The two separators are both `/` or both `-` (mixing them, as in `'1403/12-30'`, is an error). Leading and trailing whitespace is ignored.
* The year has exactly 4 digits; month and day have 1 or 2 digits (`'1403/1/5'` is fine).
* Text that does not have that shape, a value that is not a string, a day that does not exist (`'1404/12/30'`, `'1403/07/31'`), a month outside 1-12 or a year outside 1300-1500 all throw a **`RangeError`** whose message is a non-empty string that contains the trimmed input text (when the input is a string).
