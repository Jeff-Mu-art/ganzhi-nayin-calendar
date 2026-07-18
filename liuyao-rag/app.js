const state = { data: [], filter: 'all', query: '求财', selected: null, results: [] };
const $ = (selector) => document.querySelector(selector);
const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));

function itemType(item) {
  return item.kind === 'case' ? '案例' : '古籍规则';
}

function filterMatches(item) {
  if (state.filter === 'all') return true;
  return state.filter === 'case' ? item.kind === 'case' : item.kind !== 'case';
}

function rank(item, query) {
  const haystack = `${item.title}\n${item.text}`.toLowerCase();
  const normalized = query.toLowerCase();
  if (!normalized) return 1;
  let score = 0;
  if (item.title.toLowerCase().includes(normalized)) score += 50;
  if (haystack.includes(normalized)) score += 25;
  for (const char of [...normalized]) {
    if (char.trim() && haystack.includes(char)) score += 2;
  }
  return score;
}

function findResults() {
  const query = state.query.trim();
  state.results = state.data
    .filter(filterMatches)
    .map((item) => ({ item, score: rank(item, query) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.item.id - b.item.id)
    .slice(0, 24)
    .map(({ item }) => item);
  if (!state.selected || !state.results.some((item) => item.id === state.selected.id)) state.selected = state.results[0] ?? null;
}

function excerpt(text, limit = 132) {
  const normalized = text.replace(/\s+/g, ' ').trim();
  return normalized.length > limit ? `${normalized.slice(0, limit)}…` : normalized;
}

function renderResults() {
  const container = $('#results');
  $('#count').textContent = state.results.length ? `找到 ${state.results.length} 条相关资料` : '未找到相关资料';
  container.innerHTML = state.results.map((item) => `
    <button class="result ${state.selected?.id === item.id ? 'selected' : ''}" type="button" data-id="${item.id}">
      <span class="result-top"><span class="kind-mark">${item.kind === 'case' ? '案' : '规'}</span><span><h2>${escapeHtml(item.title)}</h2></span></span>
      <p>${escapeHtml(excerpt(item.text))}</p>
      <div class="result-meta">${escapeHtml(item.source)}${item.caseNo ? ` · 例${item.caseNo}` : ''}</div>
    </button>`).join('') || '<p class="empty">换一个关键词试试。</p>';
  container.querySelectorAll('.result').forEach((button) => button.addEventListener('click', () => {
    state.selected = state.results.find((item) => item.id === Number(button.dataset.id));
    render();
  }));
}

function buildPrompt() {
  if (!state.selected) return '选择资料后，这里会生成带来源摘录的提示词。';
  const question = $('#question').value.trim() || '请解释这段资料的判断依据，并说明资料未明示的部分。';
  const item = state.selected;
  return `你是六爻资料问答助手。只依据以下资料作答；资料未明示时明确说“资料未明示”，不要补造。\n\n用户问题：${question}\n\n资料标题：${item.title}\n资料类型：${itemType(item)}\n来源：${item.source}${item.url ? `\n原始来源：${item.url}` : ''}\n\n资料摘录：\n${item.text}\n\n请按“资料直接说明什么 / 判断依据 / 不足或边界”三部分回答。`;
}

function renderDetail() {
  const item = state.selected;
  const link = $('#source-link');
  if (!item) {
    $('#detail-kind').textContent = '资料';
    link.hidden = true;
    $('#detail-content').innerHTML = '<h1>开始检索</h1><p>输入问题关键词后，选择一条资料查看原文与来源。</p>';
  } else {
    $('#detail-kind').textContent = itemType(item);
    link.hidden = !item.url;
    link.href = item.url || '#';
    $('#detail-content').innerHTML = `<h1>${escapeHtml(item.title)}</h1><div class="meta">来源：${escapeHtml(item.source)}${item.caseNo ? ` · 例${item.caseNo}` : ''} · ${escapeHtml(item.layer)}</div><div class="excerpt">${escapeHtml(item.text)}</div>`;
  }
  $('#prompt-output').textContent = buildPrompt();
}

function render() {
  findResults();
  renderResults();
  renderDetail();
  document.querySelectorAll('[data-filter]').forEach((button) => button.classList.toggle('active', button.dataset.filter === state.filter));
}

async function initialize() {
  try {
    const response = await fetch('data/combined_rag.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    state.data = payload.items;
    render();
  } catch (error) {
    $('#count').textContent = '资料载入失败';
    $('#results').innerHTML = `<p class="empty">无法读取资料文件：${escapeHtml(error.message)}</p>`;
  }
}

$('#search-form').addEventListener('submit', (event) => {
  event.preventDefault();
  state.query = $('#query').value;
  state.selected = null;
  render();
});
document.querySelectorAll('[data-filter]').forEach((button) => button.addEventListener('click', () => {
  state.filter = button.dataset.filter;
  state.selected = null;
  render();
}));
$('#question').addEventListener('input', () => { $('#prompt-output').textContent = buildPrompt(); });
$('#copy-prompt').addEventListener('click', async () => {
  await navigator.clipboard.writeText(buildPrompt());
  $('#copy-prompt').textContent = '已复制';
  window.setTimeout(() => { $('#copy-prompt').textContent = '复制'; }, 1400);
});
initialize();
