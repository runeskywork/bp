import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import Chart from 'chart.js/auto';

/* ================= 디자인 ================= */
const CSS = `
@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css');
:root{--bg:#0a0a0b;--panel:#111214;--line:#1f2125;--txt:#e8e9eb;--sub:#a7abb2;--mute:#7a7e86;--gold:#c8a96a;--up:#e5675c;--down:#5b8def}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--txt);font-family:Pretendard,'Noto Sans KR',sans-serif;font-size:13px;-webkit-font-smoothing:antialiased}
header{max-width:1440px;margin:0 auto;padding:26px 32px 0;display:flex;align-items:flex-end;justify-content:space-between;border-bottom:1px solid var(--line)}
.eb{color:var(--gold);font-size:10px;letter-spacing:3px;font-weight:600}
h1{margin:6px 0 16px;font-size:18px;font-weight:600;letter-spacing:.2px}
nav{display:flex;gap:2px}
nav button{background:none;border:0;color:var(--mute);font:600 11px Pretendard,sans-serif;letter-spacing:2px;padding:0 14px 14px;cursor:pointer;border-bottom:2px solid transparent}
nav button:hover{color:var(--sub)}
nav button.on{color:var(--txt);border-bottom-color:var(--gold)}
main{max-width:1440px;margin:0 auto;padding:22px 32px 40px}
.hidden{display:none!important}
.center{text-align:center;padding:120px 0;color:var(--sub);font-size:12.5px}
.basis{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:12px}
.basis b{font-size:13.5px;font-weight:600}
.basis span{color:var(--mute);font-size:11px}
.kpi{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:10px}
.k{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:15px 18px}
.k .l{color:var(--sub);font-size:11px}
.k .v{font-size:20px;font-weight:600;margin:7px 0 5px;letter-spacing:-.2px;font-variant-numeric:tabular-nums}
.k .d{font-size:10.5px;color:var(--mute)}
.up{color:var(--up)!important}.down{color:var(--down)!important}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px}
.card{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:16px 18px 14px}
.card.wide{grid-column:1/-1}
.card h2{margin:0 0 12px;font-size:12px;font-weight:600;display:flex;justify-content:space-between;align-items:baseline}
.card h2 span{color:var(--mute);font-size:10.5px;font-weight:400}
.hint{color:var(--mute);font-size:10.5px;margin-top:8px}
.lg{display:flex;justify-content:flex-end;flex-wrap:wrap;gap:6px}
.lg button{display:flex;align-items:center;gap:6px;background:none;border:1px solid var(--line);color:var(--sub);font:500 11px Pretendard,sans-serif;padding:4px 11px;border-radius:14px;cursor:pointer}
.lg button:hover{border-color:#34373e}
.lg button i{width:7px;height:7px;border-radius:50%;display:inline-block}
.lg button.off{opacity:.35}
.lg button.all{color:var(--gold);border-color:rgba(200,169,106,.45)}
.lghint{text-align:right;color:var(--mute);font-size:10.5px;margin:6px 0 8px}
.pies{display:grid;grid-template-columns:1fr 1fr;gap:8px;text-align:center}
.pies h3{margin:4px 0 10px;font-size:12.5px;font-weight:600;color:var(--txt)}
.pies p{color:var(--sub);margin:8px 0 0;font-size:11px}
.hr{display:flex;flex-direction:column;align-items:flex-end;gap:8px}
.stampTop{color:var(--mute);font-size:10.5px;letter-spacing:.2px}
.stampInv{color:var(--mute);text-align:right;font-size:10.5px;margin-top:12px}
.invbig{font-size:12px;font-weight:600;color:var(--txt);margin-right:6px}
.invnote{color:var(--mute);font-size:10.5px;margin-top:10px;line-height:1.5}
@media(max-width:1000px){.grid{grid-template-columns:1fr}.kpi{grid-template-columns:1fr 1fr}}
`;

/* ================= 공통 ================= */
const COL = { gold: '#c8a96a', goldDark: '#6e5d3c', green: '#39ff8f', up: '#e5675c', down: '#5b8def', labor: '#4b5262', exp: '#7d8594', prev: '#34373e', text: '#e8e9eb', sub: '#a7abb2' };
const PAL = ['#c8a96a','#5b8def','#e5675c','#6fb59a','#9b8bd6','#d79a5a','#5fb3c7','#c7849e','#8fa36b','#7d828a','#b39578','#a9adb3'];
const MONTH_GRAYS = ['#5c6170', '#7d828a', '#4b5262', '#a7abb2'];   // 전전월 이전 달 막대 색
const colorOf = (names, n) => PAL[names.indexOf(n) % PAL.length];
const won = v => Math.round(v).toLocaleString('ko-KR');
const man = v => Math.round(v / 1e4).toLocaleString('ko-KR') + '만';
const fmtT = t => (t ? new Date(t).toLocaleString('ko-KR') : '');
const KPI = [['매출', 'sales'], ['순매출', 'net'], ['인건비', 'labor'], ['경비', 'exp'], ['순익', 'profit']];

const FS_URL = 'https://firestore.googleapis.com/v1/projects/biz-plan-1022/databases/(default)/documents/biz/latest';
const FS_URL_INV = 'https://firestore.googleapis.com/v1/projects/biz-plan-1022/databases/(default)/documents/inv/latest';
const INV_BENCHMARK = 2.0;
const INV_COLORS = { 전체: '#c8a96a', CIGA: '#5b8def', AIRAIN: '#e5675c', SHER: '#6fb59a', Blackout: '#9b8bd6', '업계 평균': '#39ff8f' };

/* 막대 위 금액 표시 (기존 차트용) */
const valueLabels = {
  id: 'valueLabels',
  afterDatasetsDraw(chart, _a, opts) {
    if (!opts || !opts.on) return;
    const { ctx } = chart;
    ctx.save();
    ctx.font = '500 10.5px Pretendard, sans-serif';
    ctx.fillStyle = '#c8cbd0';
    ctx.textAlign = 'center';
    chart.data.datasets.forEach((ds, i) => {
      const meta = chart.getDatasetMeta(i);
      if (meta.hidden || meta.type !== 'bar') return;
      meta.data.forEach((el, j) => {
        const v = ds.data[j];
        if (v == null || v === 0) return;
        ctx.textBaseline = v >= 0 ? 'bottom' : 'top';
        ctx.fillText(man(v), el.x, v >= 0 ? el.y - 4 : el.y + 4);
      });
    });
    ctx.restore();
  },
};
Chart.register(valueLabels);

/* 선 끝에 값 표시 — 재고자산 회전율 차트에만 로컬로 붙임(다른 차트엔 영향 없음) */
const endLabel = {
  id: 'endLabel',
  afterDatasetsDraw(chart) {
    const { ctx, chartArea } = chart;
    ctx.save();
    ctx.font = '600 11px Pretendard, sans-serif';
    ctx.textBaseline = 'middle';
    chart.data.datasets.forEach((ds, i) => {
      const meta = chart.getDatasetMeta(i);
      if (meta.hidden) return;
      const pts = meta.data;
      let lastIdx = -1;
      for (let j = ds.data.length - 1; j >= 0; j--) {
        if (ds.data[j] != null) { lastIdx = j; break; }
      }
      if (lastIdx < 0) return;
      const last = pts[lastIdx];
      const v = ds.data[lastIdx];
      ctx.fillStyle = ds.borderColor;
      ctx.fillText(v.toFixed(1) + '회', chartArea.right + 8, last.y);
    });
    ctx.restore();
  },
};

function setDefaults() {
  Chart.defaults.aspectRatio = 1.8;
  Chart.defaults.color = COL.sub;
  Chart.defaults.font.family = "Pretendard, 'Noto Sans KR', sans-serif";
  Chart.defaults.font.size = 11;
  Chart.defaults.borderColor = '#17191c';
  Chart.defaults.scale.grid.color = '#17191c';
  Chart.defaults.scale.border.display = false;
  Chart.defaults.scale.ticks.padding = 6;
  Object.assign(Chart.defaults.plugins.legend.labels, { boxWidth: 7, boxHeight: 7, usePointStyle: true, pointStyle: 'circle', padding: 14 });
  Chart.defaults.plugins.legend.align = 'end';
  Object.assign(Chart.defaults.plugins.tooltip, {
    backgroundColor: '#16181b', borderColor: '#2a2d33', borderWidth: 1, titleColor: COL.text, bodyColor: '#c8cbd0',
    padding: 10, cornerRadius: 6, boxPadding: 4, usePointStyle: true,
  });
  Chart.defaults.elements.bar.borderRadius = 3;
  Chart.defaults.datasets.bar.maxBarThickness = 34;
  Chart.defaults.elements.line.borderWidth = 1.5;
  Chart.defaults.elements.point.radius = 2;
}

/* ================= Firestore에서 데이터 읽기 ================= */
function days(period) {
  const m = String(period).match(/(\d+)-(\d+)\s*~\s*(\d+)-(\d+)/);
  if (!m) return 7;
  const y = new Date().getFullYear();
  return Math.round((new Date(y, m[3] - 1, m[4]) - new Date(y, m[1] - 1, m[2])) / 864e5) + 1;
}

function periodRange(period) {
  const m = String(period).match(/(\d+)-(\d+)\s*~\s*(\d+)-(\d+)/);
  const y = new Date().getFullYear();
  return { start: new Date(y, m[1] - 1, m[2]), end: new Date(y, m[3] - 1, m[4]) };
}

function fsToValue(v) {
  if (v.stringValue !== undefined) return v.stringValue;
  if (v.doubleValue !== undefined) return v.doubleValue;
  if (v.integerValue !== undefined) return Number(v.integerValue);
  if (v.booleanValue !== undefined) return v.booleanValue;
  if (v.nullValue !== undefined) return null;
  if (v.arrayValue !== undefined) return (v.arrayValue.values || []).map(fsToValue);
  if (v.mapValue !== undefined) return fsFieldsToObj(v.mapValue.fields || {});
  return null;
}
function fsFieldsToObj(fields) {
  return Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, fsToValue(v)]));
}

async function fetchData() {
  const res = await fetch(FS_URL);
  if (!res.ok) return null;
  const json = await res.json();
  if (!json.fields) return null;
  const raw = fsFieldsToObj(json.fields);
  if (!raw.weeks) return null;
  return {
    t: raw.updatedAt,
    unitNames: raw.names,
    weeks: raw.weeks.map(w => ({
      label: w.l, month: w.m, period: w.p, days: days(w.p),
      sales: w.s, net: w.n, labor: w.lb, exp: w.e, profit: w.pf,
      units: raw.names.map((name, i) => ({ name, net: w.u[i].net, profit: w.u[i].profit })),
    })),
  };
}

async function fetchInvData() {
  try {
    const res = await fetch(FS_URL_INV);
    if (!res.ok) return null;
    const json = await res.json();
    if (!json.fields) return null;
    const raw = fsFieldsToObj(json.fields);
    if (!raw.months || !raw.months.length) return null;
    return {
      t: raw.updatedAt,
      brands: raw.brands || [],
      months: raw.months.map(m => ({ label: m.label, turnover: m.turnover, byBrand: m.byBrand || {} })),
    };
  } catch (e) { return null; }
}

/* 비용까지 입력된 주만 집계 */
function summarize(d) {
  const done = d.weeks.filter(w => w.labor || w.exp);
  const lastIdx = d.weeks.indexOf(done.at(-1));
  const pending = d.weeks.filter((w, i) => i > lastIdx && (w.sales || w.net));
  const months = [];
  done.forEach(w => {
    let m = months.find(x => x.month === w.month);
    if (!m) {
      m = { month: w.month, label: w.month + '월', sales: 0, net: 0, labor: 0, exp: 0, profit: 0, days: 0, weeks: [],
        units: d.unitNames.map(n => ({ name: n, net: 0, profit: 0 })) };
      months.push(m);
    }
    ['sales', 'net', 'labor', 'exp', 'profit', 'days'].forEach(k => m[k] += w[k]);
    m.weeks.push(w);
    w.units.forEach((u, i) => { m.units[i].net += u.net; m.units[i].profit += u.profit; });
  });

  /* 전월누계: 당월을 뺀 모든 달의 사업아이템별 순매출 합계 (예: 11월이면 9월~10월) */
  const before = months.slice(0, -1);
  const prevCum = before.length ? {
    range: before.length > 1 ? `${before[0].label}~${before.at(-1).label}` : before[0].label,
    units: d.unitNames.map((n, i) => ({ name: n, net: before.reduce((a, m) => a + m.units[i].net, 0) })),
  } : null;

  const trendUnits = d.unitNames.filter((n, i) => done.some(w => w.units[i].net > 0));
  return { done, pending, months, prevCum, unitNames: d.unitNames, trendUnits, t: d.t };
}

/* ================= 그래프 ================= */
const ma = (a, n) => a.map((_, i) => i < n - 1 ? null : a.slice(i - n + 1, i + 1).reduce((x, y) => x + y, 0) / n);

function trailing30(weeks, key) {
  const daily = [];
  weeks.forEach(w => {
    const { start, end } = periodRange(w.period);
    const perDay = w[key] / w.days;
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) daily.push({ t: d.getTime(), v: perDay });
  });
  return weeks.map(w => {
    const { end } = periodRange(w.period);
    const cutoff = new Date(end); cutoff.setDate(cutoff.getDate() - 29);
    const inWin = daily.filter(x => x.t >= cutoff.getTime() && x.t <= end.getTime());
    return inWin.length ? inWin.reduce((a, x) => a + x.v, 0) / inWin.length : null;
  });
}
const yMan = () => ({ ticks: { callback: man } });
const zeroGrid = () => ({ color: c => c.tick && c.tick.value === 0 ? '#3a3d44' : '#17191c' });
const tipWon = () => ({ callbacks: { label: c => ` ${c.dataset.label}  ${won(c.parsed.y)}` } });

/* 사업아이템별 손익 막대 색: 당월 금색, 전월 진회색, 그 이전 달은 회색 계열 */
const monthBarColor = (i, n) => i === n - 1 ? COL.gold : i === n - 2 ? COL.prev : MONTH_GRAYS[(n - 3 - i) % MONTH_GRAYS.length];

function draw(s, inv) {
  const list = [];
  const add = (id, cfg) => { const el = document.getElementById(id); if (el) list.push(new Chart(el, cfg)); };
  const color = n => colorOf(s.unitNames, n);
  const cur = s.months.at(-1);
  const W = s.done, L = W.map(w => w.label);

  // 손익 구성 (기존, 변경 없음)
  add('cMix', {
    type: 'bar',
    data: { labels: ['매출', '순매출', '인건비', '경비', '순익'],
      datasets: [{ label: cur.label, data: [cur.sales, cur.net, -cur.labor, -cur.exp, cur.profit],
        backgroundColor: [COL.goldDark, COL.gold, COL.labor, COL.exp, cur.profit >= 0 ? COL.up : COL.down] }] },
    options: { layout: { padding: { top: 18, bottom: 6 } },
      plugins: { legend: { display: false }, valueLabels: { on: true }, tooltip: tipWon() },
      scales: { x: { grid: { display: false } }, y: { ...yMan(), grid: zeroGrid() } } },
  });

  // 월별 매출·순매출·비용·순익 (기존, 변경 없음)
  add('cMonthly', {
    type: 'bar',
    data: { labels: s.months.map(m => m.label), datasets: [
      { label: '매출', data: s.months.map(m => m.sales), backgroundColor: COL.goldDark },
      { label: '순매출', data: s.months.map(m => m.net), backgroundColor: COL.gold },
      { label: '총비용', data: s.months.map(m => m.labor + m.exp), backgroundColor: COL.labor },
      { label: '순익', data: s.months.map(m => m.profit), backgroundColor: s.months.map(m => m.profit >= 0 ? COL.up : COL.down) },
    ] },
    options: { layout: { padding: { top: 18 } },
      plugins: { valueLabels: { on: true }, tooltip: tipWon() },
      scales: { x: { grid: { display: false } }, y: { ...yMan(), grid: zeroGrid() } } },
  });

  // SUMMARY 하단 — 월별 매출·순매출 추이 (왼쪽 절반 폭, 선 2개)
  add('cMonthlyTrend', {
    type: 'line',
    data: { labels: s.months.map(m => m.label), datasets: [
      { label: '매출', data: s.months.map(m => m.sales), borderColor: COL.green, backgroundColor: COL.green, pointBackgroundColor: COL.green, borderWidth: 2, tension: .3 },
      { label: '순매출', data: s.months.map(m => m.net), borderColor: COL.gold, backgroundColor: COL.gold, pointBackgroundColor: COL.gold, borderWidth: 2, tension: .3 },
    ] },
    options: { plugins: { legend: { display: false }, tooltip: tipWon() },
      scales: { x: { grid: { display: false } }, y: yMan() } },
  });

  add('cSales', {
    data: { labels: L, datasets: [
      { type: 'bar', label: '매출', data: W.map(w => w.sales), backgroundColor: COL.goldDark },
      { type: 'bar', label: '순매출', data: W.map(w => w.net), backgroundColor: COL.gold },
      { type: 'line', label: '매출 30일 이동평균', data: trailing30(W, 'sales'), yAxisID: 'y2',
        borderColor: COL.down, borderDash: [5, 4], pointRadius: 0, tension: .3, spanGaps: true },
      { type: 'line', label: '순매출 30일 이동평균', data: trailing30(W, 'net'), yAxisID: 'y2',
        borderColor: COL.gold, borderDash: [5, 4], pointRadius: 0, tension: .3, spanGaps: true },
    ] },
    options: { plugins: { tooltip: tipWon() },
      scales: { x: { grid: { display: false } }, y: yMan(), y2: { position: 'right', min: 0, grid: { display: false }, ticks: { callback: man } } } },
  });

  add('cCost', {
    data: { labels: L, datasets: [
      { type: 'bar', label: '인건비', data: W.map(w => w.labor), backgroundColor: COL.labor, stack: 'c' },
      { type: 'bar', label: '경비', data: W.map(w => w.exp), backgroundColor: COL.exp, stack: 'c' },
      { type: 'line', label: '4주 이동평균', data: ma(W.map(w => w.labor + w.exp), 4), stack: 'ma',
        borderColor: COL.gold, borderDash: [5, 4], pointBackgroundColor: COL.gold, spanGaps: true },
    ] },
    options: { plugins: { tooltip: tipWon() },
      scales: { x: { stacked: true, grid: { display: false } }, y: { stacked: true, ...yMan() } } },
  });

  {
    const p = W.map(w => w.profit);
    add('cProfit', {
      data: { labels: L, datasets: [
        { type: 'bar', label: '순익', data: p, backgroundColor: p.map(v => v >= 0 ? COL.up : COL.down) },
        { type: 'line', label: '순익 30일 이동평균', data: trailing30(W, 'profit'), borderColor: COL.gold, borderDash: [5, 4], pointRadius: 0, spanGaps: true },
      ] },
      options: { plugins: { tooltip: tipWon() },
        scales: { x: { grid: { display: false } }, y: { ...yMan(), grid: zeroGrid() } } },
    });
  }

  add('cCover', {
    type: 'line',
    data: { labels: L, datasets: [
      { label: '비용 커버율', data: W.map(w => (w.labor + w.exp) ? w.net / (w.labor + w.exp) * 100 : null),
        borderColor: COL.gold, backgroundColor: 'rgba(200,169,106,.08)', pointBackgroundColor: COL.gold, fill: true, tension: .3 },
      { label: '손익분기 100%', data: L.map(() => 100), borderColor: COL.gold, borderDash: [4, 4], pointRadius: 0 },
    ] },
    options: { plugins: { tooltip: { callbacks: { label: c => ` ${c.dataset.label}  ${c.parsed.y.toFixed(1)}%` } } },
      scales: { x: { grid: { display: false } }, y: { min: 0, ticks: { callback: v => v + '%' } } } },
  });

  // 사업아이템별 손익 — 세로 막대, 입력된 모든 달 표시 (예: 9월·10월·11월)
  {
    const n = s.months.length;
    const ds = s.months.map((m, i) => ({
      label: m.label, data: m.units.map(u => u.profit), backgroundColor: monthBarColor(i, n),
    }));
    add('cUnitPL', {
      type: 'bar',
      data: { labels: cur.units.map(u => u.name), datasets: ds },
      options: { aspectRatio: 1.05,
        plugins: { tooltip: tipWon() },
        scales: {
          x: { grid: { display: false }, ticks: { autoSkip: false, maxRotation: 45, minRotation: 0 } },
          y: { ...yMan(), grid: zeroGrid() },
        } },
    });
  }

  // 순매출 비중 — 왼쪽 전월누계, 오른쪽 당월 (마이너스 순매출 항목은 도넛에서 제외)
  for (const [id, m] of [['cPiePrev', s.prevCum], ['cPieCur', cur]]) {
    if (!m) continue;
    const us = m.units.filter(u => u.net > 0);
    const tot = us.reduce((a, u) => a + u.net, 0);
    add(id, {
      type: 'doughnut',
      data: { labels: us.map(u => u.name),
        datasets: [{ data: us.map(u => u.net), backgroundColor: us.map(u => color(u.name)), borderColor: '#111214', borderWidth: 2 }] },
      options: { aspectRatio: 0.9, cutout: '68%', plugins: { legend: { position: 'bottom', align: 'center' },
        tooltip: { callbacks: { label: c => ` ${c.label}  ${won(c.parsed)} (${(c.parsed / tot * 100).toFixed(1)}%)` } } } },
    });
  }

  if (W.length) {
    const ds = s.trendUnits.map(n => {
      const i = s.unitNames.indexOf(n);
      return {
        label: n, data: W.map(w => w.units[i].net),
        borderColor: color(n), backgroundColor: color(n), pointBackgroundColor: color(n),
        cubicInterpolationMode: 'monotone', fill: false, pointRadius: 3, borderWidth: 2,
      };
    });
    add('cUnitTrend', {
      type: 'line',
      data: { labels: L, datasets: ds },
      options: { aspectRatio: 3.1, interaction: { mode: 'index', intersect: false },
        plugins: { legend: { display: false }, tooltip: tipWon() },
        scales: { x: { grid: { display: false } }, y: { ...yMan(), grid: zeroGrid() } } },
    });
  }

  // BUSINESS 탭 — 재고자산 회전율 (Chart.js 기본 범례 끔 — 범례는 아래 HTML 버튼으로 별도 렌더링)
  if (inv && inv.months && inv.months.length) {
    const brandColors = ['#5b8def', '#e5675c', '#6fb59a', '#9b8bd6', '#d79a5a'];
    const ds = [
      { label: '전체', data: inv.months.map(m => m.turnover), borderColor: COL.gold,
        backgroundColor: 'rgba(200,169,106,.08)', pointBackgroundColor: COL.gold, fill: true, borderWidth: 3, tension: .3, spanGaps: true },
      ...inv.brands.map((b, i) => ({
        label: b, data: inv.months.map(m => m.byBrand[b] ?? null),
        borderColor: brandColors[i % brandColors.length], pointBackgroundColor: brandColors[i % brandColors.length],
        borderWidth: 1.5, tension: .3, spanGaps: true,
      })),
      { label: `업계 평균(${INV_BENCHMARK.toFixed(1)}회)`, data: inv.months.map(() => INV_BENCHMARK), borderColor: COL.green, pointRadius: 0, borderWidth: 2 },
    ];
    add('cInvByBrand', {
      type: 'line',
      data: { labels: inv.months.map(m => m.label), datasets: ds },
      options: {
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => c.parsed.y == null ? ` ${c.dataset.label}  재고 없음` : ` ${c.dataset.label}  ${c.parsed.y.toFixed(2)}회` } } },
        scales: { x: { grid: { display: false } }, y: { min: 0, max: 3, ticks: { callback: v => v + '회' } } },
        layout: { padding: { right: 48 } },
      },
      plugins: [endLabel],
    });
  }

  return list;
}

/* ================= 화면 ================= */
function App() {
  const [tab, setTab] = useState('summary');
  const [view, setView] = useState(null);
  const [inv, setInv] = useState(null);
  const [msg, setMsg] = useState('불러오는 중...');
  const [off, setOff] = useState([]);
  const [invOff, setInvOff] = useState([]);
  const charts = useRef([]);

  useEffect(() => {
    setDefaults();
    (async () => {
      try {
        const d = await fetchData();
        const invData = await fetchInvData();
        if (!d) { setMsg("시트 변경 후 20분 내 자동 반영됩니다. 그래도 안 보이면 새로고침 해주세요."); return; }
        const s = summarize(d);
        if (!s.months.length) { setMsg('표시할 실적이 없습니다.'); return; }
        setInv(invData);
        setView(s);
      } catch (e) { setMsg('데이터를 읽지 못했습니다. 잠시 후 새로고침 해주세요.'); }
    })();
  }, []);

  useEffect(() => {
    if (!view) return;
    charts.current.forEach(c => c.destroy());
    charts.current = draw(view, inv);
    setOff([]);
    setInvOff([]);
    return () => charts.current.forEach(c => c.destroy());
  }, [view, inv]);

  useEffect(() => { charts.current.forEach(c => c.resize()); }, [tab]);

  const toggleUnit = n => {
    const ch = Chart.getChart('cUnitTrend'); if (!ch) return;
    const i = ch.data.datasets.findIndex(d => d.label === n); if (i < 0) return;
    const visible = ch.isDatasetVisible(i);
    ch.setDatasetVisibility(i, !visible); ch.update();
    setOff(prev => visible ? [...prev, n] : prev.filter(x => x !== n));
  };
  const showAll = () => {
    const ch = Chart.getChart('cUnitTrend'); if (!ch) return;
    ch.data.datasets.forEach((_, i) => ch.setDatasetVisibility(i, true)); ch.update();
    setOff([]);
  };

  const toggleInv = n => {
    const ch = Chart.getChart('cInvByBrand'); if (!ch) return;
    const i = ch.data.datasets.findIndex(d => d.label === n); if (i < 0) return;
    const visible = ch.isDatasetVisible(i);
    ch.setDatasetVisibility(i, !visible); ch.update();
    setInvOff(prev => visible ? [...prev, n] : prev.filter(x => x !== n));
  };
  const showAllInv = () => {
    const ch = Chart.getChart('cInvByBrand'); if (!ch) return;
    ch.data.datasets.forEach((_, i) => ch.setDatasetVisibility(i, true)); ch.update();
    setInvOff([]);
  };

  const cur = view?.months.at(-1), prev = view?.months.at(-2);
  const vis = t => (tab === t ? '' : 'hidden');
  const netTotal = m => m ? m.units.reduce((a, u) => a + u.net, 0) : 0;   // 도넛 아래 금액: 마이너스 포함 실제 순매출 합계
  const range = m => m ? `${m.weeks[0].period.split('~')[0]} ~ ${m.weeks.at(-1).period.split('~')[1]}` : '';
  const latestInv = inv && inv.months && inv.months.length ? inv.months.at(-1) : null;
  const invLegendItems = inv ? ['전체', ...inv.brands, `업계 평균(${INV_BENCHMARK.toFixed(1)}회)`] : [];
  const invLegendColor = n => n.startsWith('업계 평균') ? COL.green : (INV_COLORS[n] || '#5b8def');

  return (
    <>
      <style>{CSS}</style>
      <header>
        <div><div className="eb">WE GROUP</div><h1>Business Plan Summary</h1></div>
        <div className="hr">
          {view && view.t && <div className="stampTop">비즈니스 플랜 데이터 기준 {fmtT(view.t)}</div>}
          <nav>
            {['summary', 'weekly', 'business'].map(t => (
              <button key={t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>{t.toUpperCase()}</button>
            ))}
          </nav>
        </div>
      </header>

      <main>
        {!view && <section className="center">{msg}</section>}

        {view && (
          <>
            <section className={vis('summary')}>
              <div className="basis">
                <b>{cur.label} 누계</b>
                <span>
                  {range(cur)} · 비용 입력 완료분 기준
                  {view.pending.length > 0 && ` · ${view.pending.map(w => w.label).join(', ')} 비용 미입력 제외`}
                </span>
              </div>
              <div className="kpi">
                {KPI.map(([l, k]) => {
                  const v = cur[k];
                  const ca = v / cur.days, pa = prev ? prev[k] / prev.days : null;
                  const ch = pa ? (ca - pa) / Math.abs(pa) * 100 : null;
                  return (
                    <div className="k" key={k}>
                      <div className="l">{l}</div>
                      <div className={'v ' + (k === 'profit' ? (v >= 0 ? 'up' : 'down') : '')}>{won(v)}</div>
                      <div className="d">
                        {ch === null ? '—' : <>전월 일평균 대비 <span className={ch >= 0 ? 'up' : 'down'}>{ch >= 0 ? '+' : ''}{ch.toFixed(1)}%</span></>}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="grid">
                <div className="card"><h2>손익 구성 <span>{cur.label} · 단위 만원</span></h2><canvas id="cMix" /></div>
                <div className="card"><h2>월별 매출 · 순매출 · 비용 · 순익 <span>단위 만원</span></h2><canvas id="cMonthly" /></div>
              </div>
              <div className="grid">
                <div className="card">
                  <h2>월별 매출 · 순매출 추이 <span>단위 만원</span></h2>
                  <canvas id="cMonthlyTrend" />
                </div>
              </div>
            </section>

            <section className={vis('weekly')}>
              <div className="grid">
                <div className="card">
                  <h2>매출 및 순매출</h2><canvas id="cSales" />
                  <div className="hint">점선 — 최근 30일(달력일) 일평균 매출·순매출 이동평균. 위로 향하면 최근 한 달 흐름이 좋아지는 중, 아래로 향하면 나빠지는 중</div>
                </div>
                <div className="card">
                  <h2>주차별 비용</h2><canvas id="cCost" />
                  <div className="hint">점선(4주 이동평균) — 최근 4주 비용 평균, 내려가면 비용 수준 감소</div>
                </div>
                <div className="card">
                  <h2>주차별 순익</h2><canvas id="cProfit" />
                  <div className="hint">점선 — 최근 30일(달력일) 일평균 순익 이동평균. 위로 향하면 최근 한 달 흐름이 개선 중, 아래로 향하면 악화 중</div>
                </div>
                <div className="card"><h2>비용 커버율 <span>순매출 ÷ 총비용</span></h2><canvas id="cCover" /></div>
              </div>
            </section>

            <section className={vis('business')}>
              <div className="grid">
                <div className="card"><h2>사업아이템별 손익</h2><canvas id="cUnitPL" /></div>
                <div className="card"><h2>순매출 비중</h2>
                  <div className="pies">
                    {view.prevCum && (
                      <div>
                        <h3>전월누계</h3>
                        <canvas id="cPiePrev" />
                        <p>{`${view.prevCum.range} · ${won(netTotal(view.prevCum))}`}</p>
                      </div>
                    )}
                    <div>
                      <h3>{cur.label}</h3>
                      <canvas id="cPieCur" />
                      <p>{`${cur.label} · ${won(netTotal(cur))}`}</p>
                    </div>
                  </div>
                </div>
                <div className="card wide">
                  <h2>사업아이템별 주차 순매출 추이</h2>
                  <div className="lg">
                    <button className="all" onClick={showAll}>전체</button>
                    {view.trendUnits.map(n => (
                      <button key={n} className={off.includes(n) ? 'off' : ''} onClick={() => toggleUnit(n)}>
                        <i style={{ background: colorOf(view.unitNames, n) }} />{n}
                      </button>
                    ))}
                  </div>
                  <div className="lghint">항목을 한 번 누르면 숨김 · 다시 누르면 표시 · 전체는 모두 표시 — 각 선은 실제 값 그대로(쌓지 않음)</div>
                  <canvas id="cUnitTrend" />
                </div>
                {latestInv && (
                  <div className="card wide">
                    <h2><span className="invbig">{latestInv.turnover != null ? latestInv.turnover.toFixed(1) + '회' : '—'}</span>재고자산 회전율 — 브랜드별 <span>와치베이(구매일 기준) · 업계 평균 {INV_BENCHMARK.toFixed(1)}회</span></h2>
                    <div className="lg">
                      <button className="all" onClick={showAllInv}>전체</button>
                      {invLegendItems.map(n => (
                        <button key={n} className={invOff.includes(n) ? 'off' : ''} onClick={() => toggleInv(n)}>
                          <i style={{ background: invLegendColor(n) }} />{n}
                        </button>
                      ))}
                    </div>
                    <canvas id="cInvByBrand" />
                    <div className="invnote">재고자산 회전율은 지금 보유한 재고가 전부 팔리는 데 걸리는 기간을 뜻합니다. 연 1회전이면 재고 전체가 소진되는 데 약 1년, 연 2회전이면 약 6개월이 걸린다는 의미입니다. 숫자가 높을수록 재고가 빠르게 소진된다는 의미입니다. 보유 재고가 없는 구간은 선이 끊겨 표시됩니다.</div>
                    {inv.t && <div className="stampInv">재고 수불부 데이터 기준 {fmtT(inv.t)}</div>}
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </main>
    </>
  );
}

createRoot(document.getElementById('root')).render(<App />);