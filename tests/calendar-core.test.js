const test = require('node:test');
const assert = require('node:assert/strict');

const lunarLibrary = require('../vendor/lunar.js');
global.Solar = lunarLibrary.Solar;

const CalendarCore = require('../calendar-core.js');

test('generates a Monday-first 35-cell grid for July 2026', () => {
  const calendar = CalendarCore.generateCalendar(2026, 7);

  assert.equal(calendar.cells.length, 35);
  assert.equal(calendar.cells[0].isoDate, '2026-06-29');
  assert.equal(calendar.cells[2].isoDate, '2026-07-01');
  assert.equal(calendar.cells[2].solarDay, 1);
  assert.equal(calendar.cells[2].isCurrentMonth, true);
  assert.equal(calendar.cells[34].isoDate, '2026-08-02');
});

test('provides lunar and Ganzhi data for every July day', () => {
  const currentMonthDays = CalendarCore.generateCalendar(2026, 7).cells
    .filter((day) => day.isCurrentMonth);

  assert.equal(currentMonthDays.length, 31);
  for (const day of currentMonthDays) {
    assert.match(day.lunarMonth, /月$/);
    assert.ok(day.lunarDay.length >= 2);
    assert.match(day.yearGanZhi, /^[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]$/);
    assert.match(day.monthGanZhi, /^[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]$/);
    assert.match(day.dayGanZhi, /^[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]$/);
  }
});

test('normalizes the known July 14 lunar and Ganzhi values', () => {
  const day = CalendarCore.generateCalendar(2026, 7).cells
    .find((item) => item.isoDate === '2026-07-14');

  assert.equal(day.lunarMonth, '六月');
  assert.equal(day.lunarDay, '初一');
  assert.equal(day.yearGanZhi, '丙午');
  assert.equal(day.monthGanZhi, '乙未');
  assert.equal(day.dayGanZhi, '己丑');
});

test('marks Xiaoshu and Dashu on their July 2026 dates', () => {
  const days = CalendarCore.generateCalendar(2026, 7).cells;
  const xiaoshu = days.find((day) => day.solarTerm === '小暑');
  const dashu = days.find((day) => day.solarTerm === '大暑');

  assert.equal(xiaoshu.isoDate, '2026-07-07');
  assert.equal(dashu.isoDate, '2026-07-23');
});

test('adds configured Gregorian festivals without mixing them into lunar data', () => {
  const days = CalendarCore.generateCalendar(2026, 7).cells;

  assert.equal(days.find((day) => day.isoDate === '2026-07-01').festival, '建党节');
  assert.equal(days.find((day) => day.isoDate === '2026-07-07').festival, '七七事变纪念日');
});
