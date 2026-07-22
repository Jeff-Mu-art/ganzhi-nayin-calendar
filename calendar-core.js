(function (root, factory) {
  const api = factory(root.Solar);

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }

  root.CalendarCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (SolarApi) {
  'use strict';

  const GREGORIAN_FESTIVALS = Object.freeze({
    '07-01': '建党节',
    '07-07': '七七事变纪念日',
  });

  function requireLunarLibrary() {
    if (!SolarApi || typeof SolarApi.fromYmd !== 'function') {
      throw new Error('农历数据组件未能加载，请确认 vendor/lunar.js 文件完整。');
    }
  }

  function pad(value) {
    return String(value).padStart(2, '0');
  }

  function toIsoDate(year, month, day) {
    return `${year}-${pad(month)}-${pad(day)}`;
  }

  function getFestivalData(month, day) {
    return GREGORIAN_FESTIVALS[`${pad(month)}-${pad(day)}`] || '';
  }

  function getLunarData(year, month, day) {
    requireLunarLibrary();

    const lunar = SolarApi.fromYmd(year, month, day).getLunar();
    const lunarMonth = `${lunar.getMonthInChinese()}月`;
    const lunarDay = lunar.getDayInChinese();

    return {
      lunarMonth,
      lunarDay,
      lunarLabel: lunarDay === '初一' ? lunarMonth : lunarDay,
      isLeapMonth: lunar.getMonth() < 0,
      yearGanZhi: lunar.getYearInGanZhiExact(),
      monthGanZhi: lunar.getMonthInGanZhiExact(),
      dayGanZhi: lunar.getDayInGanZhi(),
      solarTerm: lunar.getJieQi() || '',
    };
  }

  function createDayData(date, currentMonth, todayIso) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const isoDate = toIsoDate(year, month, day);
    const lunarData = getLunarData(year, month, day);

    return {
      solarDate: isoDate,
      isoDate,
      solarDay: day,
      solarMonth: month,
      festival: getFestivalData(month, day),
      isCurrentMonth: month === currentMonth,
      isToday: isoDate === todayIso,
      isWeekend: date.getDay() === 0 || date.getDay() === 6,
      ...lunarData,
    };
  }

  function generateCalendar(year, month, now) {
    if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
      throw new TypeError('year 和 month 必须是有效整数，month 范围为 1–12。');
    }

    const firstDay = new Date(year, month - 1, 1);
    const mondayOffset = (firstDay.getDay() + 6) % 7;
    const lastDay = new Date(year, month, 0);
    const currentDay = now instanceof Date ? now : new Date();
    const todayIso = toIsoDate(
      currentDay.getFullYear(),
      currentDay.getMonth() + 1,
      currentDay.getDate(),
    );
    const visibleCellCount = Math.ceil((mondayOffset + lastDay.getDate()) / 7) * 7;
    const gridStart = new Date(year, month - 1, 1 - mondayOffset);
    const cells = [];

    for (let index = 0; index < visibleCellCount; index += 1) {
      const date = new Date(
        gridStart.getFullYear(),
        gridStart.getMonth(),
        gridStart.getDate() + index,
      );
      cells.push(createDayData(date, month, todayIso));
    }

    const firstCurrentDay = cells.find((cell) => cell.isCurrentMonth);

    return {
      year,
      month,
      yearGanZhi: firstCurrentDay.yearGanZhi,
      monthGanZhi: firstCurrentDay.monthGanZhi,
      cells,
    };
  }

  return Object.freeze({
    generateCalendar,
    getFestivalData,
    getLunarData,
  });
});
