(function () {
  'use strict';

  const calendarGrid = document.getElementById('calendar-grid');
  const calendarStatus = document.getElementById('calendar-status');
  const printButton = document.getElementById('print-calendar');
  const yearPillar = document.getElementById('year-pillar');
  const monthPillar = document.getElementById('month-pillar');

  function createTextElement(tagName, className, text) {
    const element = document.createElement(tagName);
    element.className = className;
    element.textContent = text;
    return element;
  }

  function getEventLabel(day) {
    if (day.solarTerm) {
      return { text: day.solarTerm, className: 'day-event is-term' };
    }
    if (day.festival) {
      return { text: day.festival, className: 'day-event is-festival' };
    }
    return { text: '', className: 'day-event' };
  }

  function createDayCell(day) {
    const cell = document.createElement('article');
    const event = getEventLabel(day);
    const stateClasses = [
      'calendar-day',
      day.isWeekend ? 'is-weekend' : '',
      day.isCurrentMonth ? '' : 'is-adjacent',
      day.isToday ? 'is-today' : '',
    ].filter(Boolean);

    cell.className = stateClasses.join(' ');
    cell.setAttribute('role', 'gridcell');
    cell.setAttribute(
      'aria-label',
      `${day.solarDate}，农历${day.lunarMonth}${day.lunarDay}，${day.dayGanZhi}日${event.text ? `，${event.text}` : ''}`,
    );

    cell.append(createTextElement('time', 'solar-day', String(day.solarDay)));
    cell.append(createTextElement('p', event.className, event.text));

    const metadata = document.createElement('div');
    metadata.className = 'day-meta';
    metadata.append(createTextElement('span', 'lunar-date', day.lunarLabel));
    metadata.append(createTextElement('span', 'ganzhi-day', `${day.dayGanZhi}日`));
    cell.append(metadata);

    return cell;
  }

  function renderCalendar() {
    try {
      const calendar = CalendarCore.generateCalendar(2026, 7);
      const monthPillars = [
        ...new Set(
          calendar.cells
            .filter((day) => day.isCurrentMonth)
            .map((day) => day.monthGanZhi),
        ),
      ];

      yearPillar.textContent = calendar.yearGanZhi;
      monthPillar.textContent = monthPillars.join(' · ');
      calendarGrid.replaceChildren(...calendar.cells.map(createDayCell));
      calendarStatus.hidden = true;
    } catch (error) {
      calendarGrid.replaceChildren();
      calendarStatus.textContent = error instanceof Error ? error.message : '日历加载失败。';
      calendarStatus.hidden = false;
    }
  }

  printButton.addEventListener('click', function () {
    window.print();
  });

  renderCalendar();
})();
