import './style.css';

const app = document.querySelector('#app');
const state = {
  name: 'Luma Botanics - Restore Shampoo',
  brief: '',
  bleed: 3,
  safe: 5,
  assets: [],
  printProcess: '',
  plan: null,
  notice: 'Add the job facts, then generate a composition plan.',
};

const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
})[character]);

const getChecks = () => [
  ['Editable text preserved', true],
  [`Bleed is ${state.bleed} mm (minimum 3 mm)`, state.bleed >= 3],
  [`Safe area is ${state.safe} mm (minimum 5 mm)`, state.safe >= 5],
  ['Primary logo and product asset approved', state.assets.length >= 2],
  ['Print process selected', Boolean(state.printProcess)],
  ['Composition plan approved', Boolean(state.plan)],
];

const render = () => {
  const checks = getChecks();
  const passed = checks.filter(([, isReady]) => isReady).length;
  const score = Math.round((passed / checks.length) * 100);
  const ready = passed === checks.length;

  app.innerHTML = `
    <header>
      <span class="mark">DIP</span>
      <span>Packaging job / ${escapeHtml(state.name)}</span>
      <button id="export" ${ready ? '' : 'disabled'}>Export package</button>
    </header>
    <main>
      <aside>
        <p class="eyebrow">JOB INPUTS</p>
        <label>Job name<input id="name" value="${escapeHtml(state.name)}"></label>
        <label>Creative brief<textarea id="brief" placeholder="Premium retail shampoo. Restore ritual, botanical efficacy, and a modern premium voice.">${escapeHtml(state.brief)}</textarea></label>
        <div class="measure">
          <label>Bleed (mm)<input id="bleed" type="number" min="0" value="${state.bleed}"></label>
          <label>Safe area (mm)<input id="safe" type="number" min="0" value="${state.safe}"></label>
        </div>
        <label>Print process
          <select id="printProcess">
            <option value="">Select process</option>
            <option value="CMYK offset" ${state.printProcess === 'CMYK offset' ? 'selected' : ''}>CMYK offset</option>
            <option value="Digital press" ${state.printProcess === 'Digital press' ? 'selected' : ''}>Digital press</option>
            <option value="Flexographic" ${state.printProcess === 'Flexographic' ? 'selected' : ''}>Flexographic</option>
          </select>
        </label>
        <button class="primary" id="plan">Generate composition plan</button>
        <section>
          <p class="eyebrow">ASSETS</p>
          <button id="asset">+ Add approved asset</button>
          <ul>${state.assets.map((asset) => `<li>${asset} <b>approved</b></li>`).join('') || '<li class="muted">No approved assets yet</li>'}</ul>
        </section>
      </aside>
      <section class="canvas">
        <div class="canvasbar"><span>FRONT PANEL / 180 x 75 mm</span><span class="pass">VECTOR READY</span></div>
        <div class="pack"><div class="trim"><div class="safe"><span class="logo">LUMA<br>BOTANICS</span><h1>RESTORE</h1><p>Botanical repair shampoo</p><i>400 ml</i></div></div></div>
        <p class="caption">Locked dieline - trim, bleed, and safe area shown</p>
      </section>
      <aside class="review">
        <p class="eyebrow">PRODUCTION REVIEW</p>
        <div class="score"><strong>${score}</strong><span>readiness score</span></div>
        <ul class="checks">${checks.map(([label, isReady]) => `<li class="${isReady ? 'ok' : 'warn'}">${label}</li>`).join('')}</ul>
        <article><p class="eyebrow">${state.plan ? 'COMPOSITION PLAN' : 'NEXT ACTION'}</p><p>${escapeHtml(state.plan || state.notice)}</p></article>
      </aside>
    </main>`;
};

document.addEventListener('input', (event) => {
  const { id, value, type } = event.target;
  if (id in state) state[id] = type === 'number' ? Number(value) : value;
});

document.addEventListener('change', (event) => {
  const { id, value, type } = event.target;
  if (id in state) state[id] = type === 'number' ? Number(value) : value;
  render();
});

document.addEventListener('click', (event) => {
  if (event.target.id === 'asset') {
    state.assets.push(state.assets.length ? 'Product image' : 'Primary logo');
    state.notice = 'Asset added. Approve the remaining job requirements.';
  }

  if (event.target.id === 'plan') {
    state.plan = 'Hero claim leads in the upper third; a restrained botanical field supports premium efficacy; the logo anchors trust at the top.';
    state.notice = 'Composition plan generated.';
  }

  if (event.target.id === 'export') {
    state.notice = 'Export package queued for human approval.';
  }

  render();
});

render();
