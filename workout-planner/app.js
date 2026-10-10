'use strict';
/* ---------- helpers ---------- */
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Math.random().toString(36).slice(2, 9);
const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return iso(d); };
const mondayOf = s => { const d = parse(s); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return iso(d); };
const today = () => iso(new Date());
const fmt = (s, o) => parse(s).toLocaleDateString(undefined, o || { weekday: 'short', month: 'short', day: 'numeric' });
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

/* ---------- state ---------- */
const KEY = 'workout-planner-v1';
let S;
function seed() {
  const P = (name, detail, notes = '', timer = 0) => ({ id: uid(), name, detail, notes, timer });
  const W = (name, desc, parts) => ({ id: uid(), name, desc, parts });
  const upper = W('Upper Strength', 'Push / pull focus', [
    P('Warm-up', '5 min easy cardio + arm circles', '', 300),
    P('Bench Press', '4 x 6 @ heavy', 'Rest 2 min between sets', 120),
    P('Bent-over Row', '4 x 8', 'Keep back flat', 90),
    P('Overhead Press', '3 x 8'),
    P('Pull-ups', '3 x max reps'),
    P('Cool-down', 'Stretch chest, lats, shoulders', '', 180)]);
  const lower = W('Lower Strength', 'Legs and core', [
    P('Warm-up', '5 min bike + leg swings', '', 300),
    P('Back Squat', '4 x 6 @ heavy', 'Rest 2-3 min', 150),
    P('Romanian Deadlift', '3 x 8'),
    P('Walking Lunges', '3 x 12 each leg'),
    P('Plank', '3 x 45 sec', '', 45),
    P('Cool-down', 'Stretch quads, hamstrings, hips', '', 180)]);
  const easy = W('Easy Run', 'Conversational pace', [
    P('Warm-up walk', '5 min', '', 300), P('Run', '30 min easy, Zone 2', 'You should be able to hold a conversation', 1800), P('Cool-down walk', '5 min', '', 300)]);
  const intervals = W('Intervals', 'Speed work', [
    P('Warm-up', '10 min easy jog', '', 600),
    P('Intervals', '6 x 3 min hard / 2 min easy', 'Hard = 5k effort'),
    P('Cool-down', '10 min easy jog', '', 600)]);
  const long = W('Long Run', 'Build endurance', [
    P('Run', '60 min steady', 'Take water. Start slow.', 3600), P('Stretch', '10 min full body', '', 600)]);
  const mobility = W('Mobility & Core', 'Recovery day', [
    P('Hip openers', '2 x 10 each side'), P('Cat-cow / thoracic rotations', '2 x 10'), P('Dead bug', '3 x 10'), P('Foam roll', '10 min', 'Quads, calves, back', 600)]);
  const workouts = [upper, lower, easy, intervals, long, mobility];
  S = { plan: { name: '12-Week Training Plan', start: mondayOf(today()), weeks: 12 }, workouts, schedule: {}, progress: {} };
  generate(S.plan.start, 12, [upper.id, easy.id, lower.id, intervals.id, mobility.id, long.id, null]);
}
function generate(start, weeks, pattern) {
  S.schedule = {};
  for (let w = 0; w < weeks; w++) pattern.forEach((wid, i) => { if (wid) S.schedule[addDays(start, w * 7 + i)] = [wid]; });
  S.plan = { ...S.plan, start, weeks };
}
function load() {
  try { S = JSON.parse(localStorage.getItem(KEY)); } catch { S = null; }
  if (!S || !S.workouts) seed();
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { alert('Could not save (storage full or blocked).'); } }
const wById = id => S.workouts.find(w => w.id === id);
const dayWorkouts = d => (S.schedule[d] || []).map(wById).filter(Boolean);
const prog = (d, wid) => S.progress[`${d}|${wid}`] || (S.progress[`${d}|${wid}`] = { parts: {}, done: false });
const peek = (d, wid) => S.progress[`${d}|${wid}`] || { parts: {}, done: false };
function nextAfter(d) {
  const ds = Object.keys(S.schedule).filter(k => k > d && dayWorkouts(k).length).sort();
  return ds[0];
}

/* ---------- dialog ---------- */
const dlg = $('#dlg');
function openDlg(html, mount) { dlg.innerHTML = html; mount && mount(dlg); if (!dlg.open) dlg.showModal(); }
function closeDlg() { dlg.close(); }
dlg.addEventListener('click', e => { if (e.target === dlg) closeDlg(); });

/* ---------- views ---------- */
const view = $('#view');
let tab = 'today';
function route() {
  tab = (location.hash || '#today').slice(1);
  if (!['today', 'plan', 'workouts', 'more'].includes(tab)) tab = 'today';
  document.querySelectorAll('#tabs a').forEach(a => a.classList.toggle('on', a.dataset.tab === tab));
  render();
  if (tab === 'plan') requestAnimationFrame(() => { const t = $('.day.today') || $('.week'); t && t.scrollIntoView({ block: 'center' }); });
}
function render() { ({ today: vToday, plan: vPlan, workouts: vWorkouts, more: vMore })[tab](); }

function partsList(w, d) {
  const p = peek(d, w.id);
  return `<ol class="parts">${w.parts.map((x, i) => `<li class="${p.parts[x.id] ? 'd' : ''}">
    <input type="checkbox" style="width:22px;height:22px;margin-top:2px" data-chk="${d}|${w.id}|${x.id}" ${p.parts[x.id] ? 'checked' : ''}>
    <div class="grow"><div class="pn">${esc(x.name)}</div><div class="pd">${esc(x.detail)}</div></div></li>`).join('')}</ol>`;
}
function workoutCard(w, d, big) {
  const p = peek(d, w.id), n = w.parts.filter(x => p.parts[x.id]).length;
  return `<div class="card ${big ? 'big' : ''} ${p.done ? 'done' : ''}">
    <div class="row between"><h3>${esc(w.name)}</h3><span class="tag ${p.done ? 'ok' : ''}">${p.done ? 'Done' : `${n}/${w.parts.length}`}</span></div>
    ${w.desc ? `<div class="sub">${esc(w.desc)}</div>` : ''}
    ${big ? partsList(w, d) : `<div class="pd">${w.parts.map(x => esc(x.name)).join(' · ')}</div>`}
    <div class="row wrap" style="margin-top:12px">
      ${big ? `<button class="pri grow" data-focus="${d}|${w.id}">⛶ Focus</button>` : ''}
      <button class="${p.done ? '' : 'ok'}" data-done="${d}|${w.id}">${p.done ? 'Undo done' : '✓ Mark done'}</button>
    </div></div>`;
}
function vToday() {
  const t = today(), ws = dayWorkouts(t), nx = nextAfter(t);
  let h = `<h1>${fmt(t, { weekday: 'long', month: 'long', day: 'numeric' })}</h1><p class="sub">${esc(S.plan.name)}${weekLabel(t)}</p>`;
  h += `<h2>Today</h2>`;
  h += ws.length ? ws.map(w => workoutCard(w, t, true)).join('') : `<div class="card empty">Rest day 😌<br><button class="ghost sm" data-editday="${t}" style="margin-top:10px">Add a workout</button></div>`;
  if (nx) {
    h += `<h2>Next · ${fmt(nx)}${nx === addDays(t, 1) ? ' (tomorrow)' : ''}</h2>`;
    h += dayWorkouts(nx).map(w => workoutCard(w, nx, false)).join('');
  }
  view.innerHTML = h;
}
function weekLabel(d) {
  const w = Math.floor((parse(d) - parse(mondayOf(S.plan.start))) / 6048e5) + 1;
  return w >= 1 && w <= S.plan.weeks ? ` · Week ${w} of ${S.plan.weeks}` : '';
}
function vPlan() {
  const keys = Object.keys(S.schedule).sort();
  const first = mondayOf(keys[0] || S.plan.start), last = mondayOf(keys[keys.length - 1] || S.plan.start), t = today();
  let h = `<h1>${esc(S.plan.name)}</h1><p class="sub">Tap a day to edit it.</p>`;
  for (let m = first, n = 1; m <= last; m = addDays(m, 7), n++) {
    h += `<div class="week"><h3>Week ${n} · ${fmt(m, { month: 'short', day: 'numeric' })}</h3>`;
    for (let i = 0; i < 7; i++) {
      const d = addDays(m, i), ws = dayWorkouts(d);
      h += `<div class="day ${d === t ? 'today' : ''}" data-editday="${d}">
        <div class="dn">${DAYS[i].slice(0, 3)}<small>${fmt(d, { month: 'short', day: 'numeric' })}</small></div>
        <div class="grow wl">${ws.length ? ws.map(w => `<b>${esc(w.name)}</b>${peek(d, w.id).done ? ' ✅' : ''}`).join('<br>') : 'Rest'}</div></div>`;
    }
    h += `</div>`;
  }
  h += `<div class="row wrap"><button id="addweek">+ Add week (copy last)</button><button id="regen" class="ghost">Generate new plan…</button></div>`;
  view.innerHTML = h;
  $('#addweek').onclick = () => {
    const lm = last;
    for (let i = 0; i < 7; i++) { const ws = S.schedule[addDays(lm, i)]; if (ws) S.schedule[addDays(lm, 7 + i)] = [...ws]; }
    S.plan.weeks++; save(); render();
  };
  $('#regen').onclick = genDialog;
}
function vWorkouts() {
  let h = `<h1>Workouts</h1><p class="sub">Your library. Each workout is made of one or more parts.</p>`;
  h += S.workouts.length ? S.workouts.map(w => `<div class="card"><div class="row between"><div class="grow"><h3>${esc(w.name)}</h3><div class="sub" style="margin:0">${w.parts.length} parts${w.desc ? ' · ' + esc(w.desc) : ''}</div></div>
    <button class="sm" data-editw="${w.id}">Edit</button></div></div>`).join('') : `<div class="empty">No workouts yet.</div>`;
  h += `<button class="pri fab" data-editw="new">+ New workout</button>`;
  view.innerHTML = h;
}
function vMore() {
  view.innerHTML = `<h1>More</h1>
  <div class="card"><h3>Plan</h3><label>Name</label><input id="pname" value="${esc(S.plan.name)}">
  <div class="row wrap" style="margin-top:12px"><button id="pgen">Generate plan from weekly pattern…</button></div></div>
  <div class="card"><h3>Backup</h3><p class="sub">Data lives only on this device. Export to back up or move to another device.</p>
  <div class="row wrap"><button id="exp">Export</button><button id="imp">Import</button><input type="file" id="file" accept="application/json" hidden></div></div>
  <div class="card"><h3>Reset</h3><div class="row wrap"><button class="danger" id="reset">Reset to sample plan</button></div></div>`;
  $('#pname').onchange = e => { S.plan.name = e.target.value.trim() || S.plan.name; save(); };
  $('#pgen').onclick = genDialog;
  $('#exp').onclick = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' }));
    a.download = `workout-plan-${today()}.json`; a.click();
  };
  $('#imp').onclick = () => $('#file').click();
  $('#file').onchange = async e => {
    try {
      const d = JSON.parse(await e.target.files[0].text());
      if (!d.workouts || !d.schedule || !d.plan) throw 0;
      if (confirm('Replace all current data with this file?')) { S = { progress: {}, ...d }; save(); alert('Imported.'); }
    } catch { alert('Not a valid backup file.'); }
  };
  $('#reset').onclick = () => { if (confirm('Erase everything and restore the sample plan?')) { seed(); save(); render(); } };
}

/* ---------- dialogs ---------- */
function genDialog() {
  const opts = (sel) => `<option value="">Rest</option>` + S.workouts.map(w => `<option value="${w.id}" ${w.id === sel ? 'selected' : ''}>${esc(w.name)}</option>`).join('');
  openDlg(`<h3>Generate plan</h3><p class="sub">Repeats a weekly pattern. Replaces the current schedule (workouts and progress are kept).</p>
    <label>Name</label><input id="gn" value="${esc(S.plan.name)}">
    <div class="row"><div class="grow"><label>Start (Monday)</label><input type="date" id="gs" value="${S.plan.start}"></div>
    <div class="grow"><label>Weeks</label><input type="number" id="gw" min="1" max="104" value="${S.plan.weeks}"></div></div>
    ${DAYS.map((d, i) => `<label>${d}</label><select data-gd="${i}">${opts((S.schedule[addDays(S.plan.start, i)] || [])[0])}</select>`).join('')}
    <div class="row between" style="margin-top:16px"><button id="gc">Cancel</button><button class="pri" id="gok">Generate</button></div>`, d => {
    $('#gc', d).onclick = closeDlg;
    $('#gok', d).onclick = () => {
      if (!confirm('Replace the current schedule?')) return;
      const start = mondayOf($('#gs', d).value || today());
      S.plan.name = $('#gn', d).value.trim() || S.plan.name;
      generate(start, Math.max(1, +$('#gw', d).value || 12), [...d.querySelectorAll('[data-gd]')].map(s => s.value || null));
      save(); closeDlg(); render();
    };
  });
}
function dayDialog(d) {
  const draw = () => {
    const ids = S.schedule[d] || [];
    openDlg(`<h3>${fmt(d, { weekday: 'long', month: 'long', day: 'numeric' })}</h3>
      <div style="margin-top:10px">${ids.length ? ids.map((id, i) => `<div class="row" style="padding:6px 0"><div class="grow"><b>${esc(wById(id)?.name || '?')}</b></div>
        <button class="sm" data-up="${i}" ${i ? '' : 'disabled'}>↑</button><button class="sm danger" data-rm="${i}">Remove</button></div>`).join('') : '<p class="sub">Rest day</p>'}</div>
      <label>Add workout</label><select id="add"><option value="">Choose…</option>${S.workouts.map(w => `<option value="${w.id}">${esc(w.name)}</option>`).join('')}</select>
      <label>Move all to date</label><input type="date" id="mv" value="${d}">
      <div class="row between" style="margin-top:16px"><button id="x">Close</button><button class="ghost" id="open">Open day</button></div>`, e => {
      $('#x', e).onclick = () => { closeDlg(); render(); };
      $('#open', e).onclick = () => { closeDlg(); if (d === today()) location.hash = '#today'; };
      $('#add', e).onchange = ev => { if (ev.target.value) { (S.schedule[d] ||= []).push(ev.target.value); save(); draw(); } };
      $('#mv', e).onchange = ev => {
        const nd = ev.target.value; if (!nd || nd === d) return;
        S.schedule[nd] = [...(S.schedule[nd] || []), ...ids]; delete S.schedule[d]; save(); closeDlg(); render();
      };
      e.querySelectorAll('[data-rm]').forEach(b => b.onclick = () => { ids.splice(+b.dataset.rm, 1); if (!ids.length) delete S.schedule[d]; save(); draw(); });
      e.querySelectorAll('[data-up]').forEach(b => b.onclick = () => { const i = +b.dataset.up; [ids[i - 1], ids[i]] = [ids[i], ids[i - 1]]; save(); draw(); });
    });
  };
  draw();
}
function workoutDialog(id) {
  const w = id === 'new' ? { id: uid(), name: '', desc: '', parts: [{ id: uid(), name: '', detail: '', notes: '', timer: 0 }], isNew: true }
    : JSON.parse(JSON.stringify(wById(id)));
  const draw = () => {
    openDlg(`<h3>${w.isNew ? 'New workout' : 'Edit workout'}</h3>
      <label>Name</label><input id="wn" value="${esc(w.name)}">
      <label>Description</label><input id="wd" value="${esc(w.desc)}">
      <h2>Parts</h2>
      ${w.parts.map((p, i) => `<div class="partedit" data-i="${i}">
        <div class="row"><input data-f="name" placeholder="Move / part name" value="${esc(p.name)}">
        <button class="sm" data-mv="-1" ${i ? '' : 'disabled'}>↑</button><button class="sm" data-mv="1" ${i < w.parts.length - 1 ? '' : 'disabled'}>↓</button><button class="sm danger" data-del>✕</button></div>
        <label>Details (sets, reps, distance…)</label><textarea data-f="detail">${esc(p.detail)}</textarea>
        <label>Notes</label><input data-f="notes" value="${esc(p.notes)}">
        <label>Timer (seconds, 0 = none)</label><input data-f="timer" type="number" min="0" value="${p.timer || 0}"></div>`).join('')}
      <button id="addp" style="margin-top:10px">+ Add part</button>
      <div class="row between" style="margin-top:16px">${w.isNew ? '<span></span>' : '<button class="danger" id="delw">Delete</button>'}<div class="row"><button id="c">Cancel</button><button class="pri" id="s">Save</button></div></div>`, e => {
      const sync = () => {
        w.name = $('#wn', e).value; w.desc = $('#wd', e).value;
        e.querySelectorAll('.partedit').forEach(pe => { const p = w.parts[+pe.dataset.i]; pe.querySelectorAll('[data-f]').forEach(f => p[f.dataset.f] = f.dataset.f === 'timer' ? Math.max(0, +f.value || 0) : f.value); });
      };
      e.querySelectorAll('[data-del]').forEach(b => b.onclick = () => { sync(); w.parts.splice(+b.closest('.partedit').dataset.i, 1); draw(); });
      e.querySelectorAll('[data-mv]').forEach(b => b.onclick = () => { sync(); const i = +b.closest('.partedit').dataset.i, j = i + +b.dataset.mv; [w.parts[i], w.parts[j]] = [w.parts[j], w.parts[i]]; draw(); });
      $('#addp', e).onclick = () => { sync(); w.parts.push({ id: uid(), name: '', detail: '', notes: '', timer: 0 }); draw(); };
      $('#c', e).onclick = closeDlg;
      $('#s', e).onclick = () => {
        sync();
        if (!w.name.trim()) return alert('Give the workout a name.');
        w.parts = w.parts.filter(p => p.name.trim() || p.detail.trim());
        const { isNew, ...clean } = w;
        if (isNew) S.workouts.push(clean); else S.workouts[S.workouts.findIndex(x => x.id === w.id)] = clean;
        save(); closeDlg(); render();
      };
      const dw = $('#delw', e);
      if (dw) dw.onclick = () => {
        if (!confirm(`Delete "${w.name}" and remove it from the schedule?`)) return;
        S.workouts = S.workouts.filter(x => x.id !== w.id);
        for (const k of Object.keys(S.schedule)) { S.schedule[k] = S.schedule[k].filter(x => x !== w.id); if (!S.schedule[k].length) delete S.schedule[k]; }
        save(); closeDlg(); render();
      };
    });
  };
  draw();
}

/* ---------- focus mode ---------- */
const focusEl = $('#focus');
let F = null, wake = null, tInt = null;
function openFocus(d, wid) {
  const w = wById(wid); if (!w || !w.parts.length) return;
  const p = peek(d, wid);
  let idx = w.parts.findIndex(x => !p.parts[x.id]); if (idx < 0) idx = 0;
  F = { d, wid, idx, all: false, fs: +(localStorage.getItem('wp-fs') || 1), remain: null };
  focusEl.hidden = false; drawFocus();
  try { navigator.wakeLock?.request('screen').then(l => wake = l).catch(() => { }); } catch { }
}
function closeFocus() {
  clearInterval(tInt); F = null; focusEl.hidden = true;
  try { wake?.release(); } catch { } wake = null; render();
}
function drawFocus() {
  const w = wById(F.wid), p = peek(F.d, F.wid), cur = w.parts[F.idx];
  const sec = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const body = F.all
    ? w.parts.map(x => `<div class="item ${p.parts[x.id] ? 'd' : ''}" data-tog="${x.id}"><div class="name">${p.parts[x.id] ? '✓ ' : ''}${esc(x.name)}</div><div class="detail">${esc(x.detail)}</div>${x.notes ? `<div class="notes">${esc(x.notes)}</div>` : ''}</div>`).join('')
    : `<div class="step">Part ${F.idx + 1} of ${w.parts.length}${p.parts[cur.id] ? ' · ✓ done' : ''}</div><div class="name">${esc(cur.name)}</div><div class="detail">${esc(cur.detail)}</div>${cur.notes ? `<div class="notes">${esc(cur.notes)}</div>` : ''}
      ${cur.timer ? `<div class="timer" id="tm">${sec(F.remain ?? cur.timer)}</div><div class="row"><button id="tgo" class="pri">${tInt ? 'Pause' : 'Start timer'}</button><button id="trs">Reset</button></div>` : ''}`;
  focusEl.innerHTML = `<div class="fbar"><div class="t">${esc(w.name)}</div>
    <button class="sm" id="fm">A−</button><button class="sm" id="fp">A+</button><button class="sm" id="fv">${F.all ? 'Step' : 'All'}</button><button class="sm" id="fx">✕</button></div>
    <div class="fbody ${F.all ? 'all' : ''}" style="--fs:${F.fs}">${body}</div>
    <div class="dots">${w.parts.map((x, i) => `<i class="${p.parts[x.id] ? 'd' : ''} ${i === F.idx && !F.all ? 'c' : ''}"></i>`).join('')}</div>
    ${F.all ? `<div class="fnav"><button class="ok" id="fdone">${p.done ? 'Undo workout done' : '✓ Finish workout'}</button></div>` :
      `<div class="fnav"><button id="fprev" ${F.idx ? '' : 'disabled'}>← Back</button>
      <button class="${p.parts[cur.id] ? '' : 'ok'}" id="fchk">${p.parts[cur.id] ? 'Undo' : '✓ Done'}</button>
      <button class="pri" id="fnext">${F.idx < w.parts.length - 1 ? 'Next →' : 'Finish'}</button></div>`}`;
  const on = (id, fn) => { const el = $(id, focusEl); if (el) el.onclick = fn; };
  on('#fx', closeFocus);
  on('#fm', () => { F.fs = Math.max(.6, F.fs - .15); localStorage.setItem('wp-fs', F.fs); drawFocus(); });
  on('#fp', () => { F.fs = Math.min(2.2, F.fs + .15); localStorage.setItem('wp-fs', F.fs); drawFocus(); });
  on('#fv', () => { F.all = !F.all; stopTimer(); drawFocus(); });
  on('#fprev', () => go(-1));
  on('#fnext', () => { if (F.idx < w.parts.length - 1) { markPart(cur.id, true); go(1); } else { markPart(cur.id, true); finishWorkout(); } });
  on('#fchk', () => { markPart(cur.id, !p.parts[cur.id]); drawFocus(); });
  on('#fdone', () => { const q = prog(F.d, F.wid); q.done = !q.done; save(); drawFocus(); });
  on('#tgo', toggleTimer);
  on('#trs', () => { stopTimer(); F.remain = null; drawFocus(); });
  focusEl.querySelectorAll('[data-tog]').forEach(el => el.onclick = () => { markPart(el.dataset.tog, !peek(F.d, F.wid).parts[el.dataset.tog]); drawFocus(); });
}
function markPart(pid, v) {
  const q = prog(F.d, F.wid); if (v) q.parts[pid] = true; else delete q.parts[pid];
  const w = wById(F.wid); q.done = w.parts.every(x => q.parts[x.id]); save();
}
function finishWorkout() { const q = prog(F.d, F.wid); q.done = true; save(); closeFocus(); }
function go(n) { stopTimer(); F.idx = Math.max(0, Math.min(wById(F.wid).parts.length - 1, F.idx + n)); F.remain = null; drawFocus(); }
function stopTimer() { clearInterval(tInt); tInt = null; }
function toggleTimer() {
  if (tInt) { stopTimer(); drawFocus(); return; }
  const cur = wById(F.wid).parts[F.idx];
  if (F.remain == null || F.remain <= 0) F.remain = cur.timer;
  tInt = setInterval(() => {
    F.remain--;
    const el = $('#tm', focusEl); if (el) el.textContent = `${Math.floor(F.remain / 60)}:${String(F.remain % 60).padStart(2, '0')}`;
    if (F.remain <= 0) { stopTimer(); try { navigator.vibrate?.([300, 150, 300]); } catch { } beep(); drawFocus(); }
  }, 1000);
  drawFocus();
}
function beep() {
  try { const c = new AudioContext(), o = c.createOscillator(); o.connect(c.destination); o.frequency.value = 880; o.start(); o.stop(c.currentTime + .4); } catch { }
}
// swipe + keyboard
let sx = null;
focusEl.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
focusEl.addEventListener('touchend', e => {
  if (sx == null || !F || F.all) return;
  const dx = e.changedTouches[0].clientX - sx; sx = null;
  if (Math.abs(dx) > 70) go(dx < 0 ? 1 : -1);
});
document.addEventListener('keydown', e => {
  if (!F || dlg.open) return;
  if (e.key === 'Escape') closeFocus();
  else if (!F.all && (e.key === 'ArrowRight' || e.key === ' ')) { e.preventDefault(); go(1); }
  else if (!F.all && e.key === 'ArrowLeft') go(-1);
});
document.addEventListener('visibilitychange', () => {
  if (F && document.visibilityState === 'visible') try { navigator.wakeLock?.request('screen').then(l => wake = l).catch(() => { }); } catch { }
});

/* ---------- global events ---------- */
document.addEventListener('click', e => {
  const t = e.target.closest('[data-focus],[data-done],[data-editday],[data-editw]');
  if (!t) return;
  if (t.dataset.focus) { const [d, w] = t.dataset.focus.split('|'); openFocus(d, w); }
  else if (t.dataset.done) { const [d, w] = t.dataset.done.split('|'), q = prog(d, w), wk = wById(w); q.done = !q.done; if (q.done) wk.parts.forEach(x => q.parts[x.id] = true); save(); render(); }
  else if (t.dataset.editday) dayDialog(t.dataset.editday);
  else if (t.dataset.editw) workoutDialog(t.dataset.editw);
});
document.addEventListener('change', e => {
  const c = e.target.dataset.chk; if (!c) return;
  const [d, w, p] = c.split('|'), q = prog(d, w);
  if (e.target.checked) q.parts[p] = true; else delete q.parts[p];
  q.done = wById(w).parts.every(x => q.parts[x.id]); save(); render();
});
window.addEventListener('hashchange', route);
// Re-render when the day rolls over while the app stays open.
let lastDay = today();
setInterval(() => { if (today() !== lastDay) { lastDay = today(); if (!F) render(); } }, 60000);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && today() !== lastDay) { lastDay = today(); if (!F) render(); } });

load();
if (!location.hash) history.replaceState(null, '', '#today'); // always open on today's workout
route();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => { });
