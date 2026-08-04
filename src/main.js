import './style.css';
import { getProductionChecks, getProductionRisks } from './rules.js';

const app = document.querySelector('#app');
const workspaceKey = 'dip-packaging-workspace-v2';
const legacyStorageKey = 'dip-packaging-job-v1';
const legacyLibraryKey = 'dip-packaging-library-v1';
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
  assetType: 'Logo',
  assetSource: '',
  printProcess: '',
  plan: null,
  notice: 'Add the job facts, then generate a composition plan.',
};
const newId = () => `job-${Date.now()}-${Math.random().toString(16).slice(2)}`;
const normalizeJob = (job) => {
  if (!job || typeof job !== 'object' || Array.isArray(job)) return null;
  return {
    ...defaultState,
    ...job,
    id: typeof job.id === 'string' && job.id ? job.id : newId(),
    assets: Array.isArray(job.assets) ? job.assets.map((asset) => typeof asset === 'string' ? { name: asset, type: 'Artwork', source: '' } : asset).filter((asset) => asset && typeof asset === 'object').map((asset) => ({ name: String(asset.name || 'Untitled asset'), type: String(asset.type || 'Reference'), source: String(asset.source || '') })) : [],
  };
};
let state = { ...defaultState, id: newId() };
let library = [];

try {
  const workspace = JSON.parse(localStorage.getItem(workspaceKey));
  library = Array.isArray(workspace?.jobs) ? workspace.jobs.map(normalizeJob).filter(Boolean).slice(0, 12) : [];
  state = library.find((job) => job.id === workspace?.activeId) || library[0] || state;
} catch { /* Browser storage can be unavailable in private or restricted contexts. */ }

if (!library.length) {
  try {
    const legacyJobs = JSON.parse(localStorage.getItem(legacyLibraryKey));
    const legacyActive = normalizeJob(JSON.parse(localStorage.getItem(legacyStorageKey)));
    library = (Array.isArray(legacyJobs) ? legacyJobs.map(normalizeJob).filter(Boolean) : []).slice(0, 12);
    if (legacyActive && !library.some((job) => job.id === legacyActive.id) && library.length < 12) library.unshift(legacyActive);
    state = library.find((job) => job.id === legacyActive?.id) || library[0] || state;
    if (legacyActive && state.id !== legacyActive.id) state.notice = 'The legacy library was already full, so the oldest saved job remains active.';
  } catch { /* Start a fresh workspace when legacy storage is malformed. */ }
}
library = [{ ...state, assets: state.assets.map((asset) => ({ ...asset })) }, ...library.filter((job) => job.id !== state.id)].slice(0, 12);
const saveWorkspace = () => localStorage.setItem(workspaceKey, JSON.stringify({ activeId: state.id, jobs: library }));
try { saveWorkspace(); } catch { /* The workspace remains usable when browser storage is unavailable. */ }
const saveState = () => {
  const saved = { ...state, savedAt: new Date().toISOString() };
  const exists = library.some((job) => job.id === state.id);
  if (!exists && library.length >= 12) {
    state.notice = 'Job library is full (12 jobs). Remove or export a job before saving another.';
    return;
  }
  const nextLibrary = [saved, ...library.filter((job) => job.id !== state.id)];
  try {
    state.savedAt = saved.savedAt;
    library = nextLibrary;
    saveWorkspace();
  } catch {
    state.notice = 'Local storage is full. Your latest change is still open but was not saved.';
  }
};

const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
})[character]);

const getChecks = () => getProductionChecks(state);

const generateCompositionPlan = () => {
  const brief = state.brief.trim() || 'the product’s stated benefit';
  const process = state.printProcess || 'the selected print process';
  const assets = state.assets.map((asset) => asset.type).join(' and ') || 'pending approved assets';
  return `${state.product} leads the front panel as the primary recognition cue. ${state.brand} anchors trust in the upper field; the descriptor supports ${brief}. Build the layout for ${process}, using ${assets} as the approved visual evidence. Keep the net volume quiet at the lower edge and preserve the declared safe area for mandatory copy.`;
};

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
  const risks = getProductionRisks(state);

  app.innerHTML = `
    <header>
      <span class="mark">DIP</span>
      <span>Packaging job / ${escapeHtml(state.name)}</span>
      <span class="save-state">Saved locally</span>
      <select id="jobLibrary" aria-label="Saved jobs"><option value="">Saved jobs</option>${library.map((job) => `<option value="${escapeHtml(job.id)}" ${job.id === state.id ? 'selected' : ''}>${escapeHtml(job.name)}</option>`).join('')}</select>
      <button id="duplicate">Duplicate</button>
      <button id="deleteJob">Remove job</button>
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
          <div class="asset-entry"><input id="assetDraft" value="${escapeHtml(state.assetDraft)}" placeholder="Asset name"><select id="assetType"><option ${state.assetType === 'Logo' ? 'selected' : ''}>Logo</option><option ${state.assetType === 'Product artwork' ? 'selected' : ''}>Product artwork</option><option ${state.assetType === 'Reference' ? 'selected' : ''}>Reference</option></select><input id="assetSource" value="${escapeHtml(state.assetSource)}" placeholder="Source / rights note"><button id="asset">Add</button></div>
          <ul>${state.assets.map((asset, index) => `<li><span>${escapeHtml(asset.name)} <em>${escapeHtml(asset.type)}</em><small>${escapeHtml(asset.source || 'Source not recorded')}</small></span><button class="remove" data-remove-asset="${index}" aria-label="Remove ${escapeHtml(asset.name)}">Remove</button></li>`).join('') || '<li class="muted">No approved assets yet</li>'}</ul>
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
        <article><p class="eyebrow">${state.plan ? 'COMPOSITION PLAN' : 'NEXT ACTION'}</p><p>${escapeHtml(state.plan || state.notice)}</p>${risks.length ? `<ul class="risks">${risks.map((risk) => `<li>${escapeHtml(risk)}</li>`).join('')}</ul>` : '<p class="pass">No additional production risks detected.</p>'}</article>
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
  let openedJob = false;
  if (id === 'jobLibrary' && value) {
    state = { ...defaultState, ...library.find((job) => job.id === value), notice: 'Saved job opened.' };
    openedJob = true;
    try { saveWorkspace(); } catch { state.notice = 'Job opened, but browser storage could not update the active record.'; }
  }
  else if (id in state) state[id] = type === 'number' ? Number(value) : value;
  if (!openedJob) saveState();
  render();
});

document.addEventListener('click', (event) => {
  const action = event.target.id;
  const removeIndex = event.target.dataset.removeAsset;
  if (!['asset', 'plan', 'export', 'reset', 'duplicate', 'deleteJob'].includes(action) && removeIndex === undefined) return;

  if (action === 'deleteJob') {
    if (!library.some((job) => job.id === state.id)) {
      state.notice = 'This job has not been saved. Add capacity before creating another job.';
      render();
      return;
    }
    if (library.length <= 1) {
      state.notice = 'Keep at least one job in the local library.';
    } else {
      const nextLibrary = library.filter((job) => job.id !== state.id);
      const nextState = { ...defaultState, ...nextLibrary[0], notice: 'Job removed from the local library.' };
      try {
        localStorage.setItem(workspaceKey, JSON.stringify({ activeId: nextState.id, jobs: nextLibrary }));
        library = nextLibrary;
        state = nextState;
      } catch {
        state.notice = 'Could not remove this job because local storage is unavailable.';
      }
      render();
      return;
    }
  }

  if (action === 'duplicate') {
    if (library.length >= 12) {
      state.notice = 'Job library is full (12 jobs). Remove a saved job before duplicating.';
      render();
      return;
    }
    state = { ...state, id: newId(), assets: state.assets.map((asset) => ({ ...asset })), name: `${state.name} copy`, notice: 'Job duplicated as a new local record.' };
  }

  if (removeIndex !== undefined) {
    state.assets.splice(Number(removeIndex), 1);
    state.notice = 'Asset removed from the job.';
  }

  if (action === 'asset') {
    const asset = state.assetDraft.trim();
    if (asset) {
      state.assets.push({ name: asset, type: state.assetType, source: state.assetSource.trim() });
      state.assetDraft = '';
      state.assetSource = '';
      state.notice = 'Approved asset recorded.';
    } else {
      state.notice = 'Name the asset before adding it to the job.';
    }
  }

  if (action === 'plan') {
    state.plan = generateCompositionPlan();
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
    if (library.length >= 12) {
      state.notice = 'Job library is full (12 jobs). Remove a saved job before starting another.';
      render();
      return;
    }
    state = { ...defaultState, id: newId(), notice: 'New packaging job started.' };
  }

  saveState();
  render();
});

render();
