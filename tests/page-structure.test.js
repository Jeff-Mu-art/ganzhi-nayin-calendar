const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');

function readProjectFile(fileName) {
  return fs.readFileSync(path.join(projectRoot, fileName), 'utf8');
}

test('loads every runtime asset locally in dependency order', () => {
  const html = readProjectFile('index.html');

  assert.doesNotMatch(html, /https?:\/\//);
  const vendorIndex = html.indexOf('vendor/lunar.js');
  const coreIndex = html.indexOf('calendar-core.js');
  const appIndex = html.indexOf('script.js');
  assert.ok(vendorIndex > -1 && vendorIndex < coreIndex && coreIndex < appIndex);
});

test('provides semantic calendar, status, and print targets', () => {
  const html = readProjectFile('index.html');

  assert.match(html, /id="calendar-grid"/);
  assert.match(html, /id="calendar-status"/);
  assert.match(html, /id="print-calendar"/);
  assert.equal((html.match(/class="weekday(?:\s[^"]*)?"/g) || []).length, 7);
});

test('includes responsive and print-specific presentation rules', () => {
  const css = readProjectFile('style.css');

  assert.match(css, /grid-template-columns:\s*repeat\(7,/);
  assert.match(css, /@media\s+print/);
  assert.match(css, /@page/);
  assert.match(css, /size:\s*A4\s+landscape/);
});

test('renders the fixed July 2026 calendar and connects print behavior', () => {
  const script = readProjectFile('script.js');

  assert.match(script, /generateCalendar\(2026,\s*7\)/);
  assert.match(script, /window\.print\(\)/);
  assert.match(script, /calendar-grid/);
});
