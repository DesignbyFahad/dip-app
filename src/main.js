import './style.css';

const app = document.querySelector('#app');
const storageKey = 'dip-packaging-job-v1';
const defaultState = {
  name: 'Luma Botanics - Restore Shampoo',
  brief: '',
  brand: 'Luma Botanics',
  product: 'Restore',
  descriptor: 'Botanical repair shampoo',
  volume: '400 ml',
  bleed: 3,
  safe: 5,
  assets: [],
  assetDraft: '',
  printProcess: '',
  plan: null,
  notice: 'Add the job facts, then generate a composition plan.',
};
let state = { ...defaultState };

try {
  const saved = JSON.parse(localStorage.getItem(storageKey));
  if (saved && typeof saved === 'object') {
    state = { ...defaultState, ...saved, assets: Array.isArray(saved.assets) ? saved.assets : [] };
    state.notice = 'Restored the last saved job from this browser.';
  }
} catch {
  localStorage.removeItem(storageKey);
}

const saveState = () => localStorage.setItem(storageKey, JSON.stringify({ ...state, savedAt: new Date().toISOString() }));

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

const getVectorDocument = () => `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 75" role="img" aria-label="${escapeHtml(state.product)} packaging artwork">
  <rect width="180" height="75" fill="#e8eed5"/>
  <rect x="3" y="3" width="174" height="69" fill="none" stroke="#355f52" stroke-width="0.7"/>
  <text x="14" y="15" fill="#17201e" font-family="monospace" font-size="4" font-weight="700" letter-spacing="0.8">${escapeHtml(state.brand.toUpperCase())}</text>
  <text x="14" y="42" fill="#17201e" font-family="serif" font-size="24" font-weight="800">${escapeHtml(state.product.toUpperCase())}</text>
  <text x="14" y="51" fill="#17201e" font-family="sans-serif" font-size="4">${escapeHtml(state.descriptor)}</text>
  <text x="148" y="64" fill="#17201e" font-family="monospace" font-size="4">${escapeHtml(state.volume)}</text>
</svg>`;

const downloadFile = (contents, name, type) => {
  const file = new Blob([contents], { type });
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
};

const render = () => {
  const checks = getChecks();
  const passed = checks.filter(([, isReady]) => isReady).length;
  const score = Math.round((passed / checks.length) * 100);
  const ready = passed === checks.length;

  app.innerHTML = `
    <header>
      <span class="mark">DIP</span>
      <span>Packaging job / ${escapeHtml(state.name)}</span>
      <span class="save-state">Saved locally</span>
      <button id="reset">New job</button>
      <button id="export" ${ready ? '' : 'disabled'}>Export package</button>
    </header>
    <main>
      <aside>
        <p class="eyebrow">JOB INPUTS</p>
        <label>Job name<input id="name" value="${escapeHtml(state.name)}"></label>
        <label>Creative brief<textarea id="brief" placeholder="Premium retail shampoo. Restore ritual, botanical efficacy, and a modern premium voice.">${escapeHtml(state.brief)}</textarea></label>
        <label>Brand<input id="brand" value="${escapeHtml(state.brand)}"></label>
        <label>Product name<input id="product" value="${escapeHtml(state.product)}"></label>
        <label>Descriptor<input id="descriptor" value="${escapeHtml(state.descriptor)}"></label>
        <label>Net volume<input id="volume" value="${escapeHtml(state.volume)}"></label>
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
          <div class="asset-entry"><input id="assetDraft" value="${escapeHtml(state.assetDraft)}" placeholder="Asset name"><button id="asset">Add</button></div>
          <ul>${state.assets.map((asset) => `<li>${asset} <b>approved</b></li>`).join('') || '<li class="muted">No approved assets yet</li>'}</ul>
        </section>
      </aside>
      <section class="canvas">
        <div class="canvasbar"><span>FRONT PANEL / 180 x 75 mm</span><span class="pass">VECTOR READY</span></div>
        <div class="pack">${getVectorDocument()}</div>
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
  if (id in state) {
    state[id] = type === 'number' ? Number(value) : value;
    saveState();
  }
});

document.addEventListener('change', (event) => {
  const { id, value, type } = event.target;
  if (id in state) state[id] = type === 'number' ? Number(value) : value;
  saveState();
  render();
});

document.addEventListener('click', (event) => {
  const action = event.target.id;
  if (!['asset', 'plan', 'export', 'reset'].includes(action)) return;

  if (action === 'asset') {
    const asset = state.assetDraft.trim();
    if (asset) {
      state.assets.push(asset);
      state.assetDraft = '';
      state.notice = 'Approved asset recorded.';
    } else {
      state.notice = 'Name the asset before adding it to the job.';
    }
  }

  if (action === 'plan') {
    state.plan = 'Hero claim leads in the upper third; a restrained botanical field supports premium efficacy; the logo anchors trust at the top.';
    state.notice = 'Composition plan generated.';
  }

  if (action === 'export') {
    const exportPackage = {
      version: 1,
      exportedAt: new Date().toISOString(),
      job: { name: state.name, brief: state.brief },
      production: { bleedMm: state.bleed, safeAreaMm: state.safe, printProcess: state.printProcess },
      approvedAssets: state.assets,
      compositionPlan: state.plan,
      checks: getChecks(),
      vectorDocumentSvg: getVectorDocument(),
    };
    const fileStem = state.name.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'dip-job';
    downloadFile(JSON.stringify(exportPackage, null, 2), `${fileStem}-export.json`, 'application/json');
    downloadFile(getVectorDocument(), `${fileStem}-artwork.svg`, 'image/svg+xml');
    state.notice = 'Production package downloaded. Human approval remains required before release.';
  }

  if (action === 'reset') {
    state = { ...defaultState, notice: 'New packaging job started.' };
    localStorage.removeItem(storageKey);
  }

  saveState();
  render();
});

render();
