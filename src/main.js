import './style.css';

const app = document.querySelector('#app');
let state = { name: 'Luma Botanics — Restore Shampoo', brief: '', bleed: 3, safe: 5, assets: [], plan: null };
const render = () => app.innerHTML = `
  <header><span class="mark">DIP</span><span>Packaging job / ${state.name}</span><button id="export">Export package</button></header>
  <main>
    <aside><p class="eyebrow">JOB INPUTS</p><label>Job name<input id="name" value="${state.name}"></label><label>Creative brief<textarea id="brief" placeholder="Premium retail shampoo for women 20–35. Restore ritual, botanical efficacy…">${state.brief}</textarea></label><div class="measure"><label>Bleed (mm)<input id="bleed" type="number" value="${state.bleed}"></label><label>Safe area (mm)<input id="safe" type="number" value="${state.safe}"></label></div><button class="primary" id="plan">Generate composition plan</button><section><p class="eyebrow">ASSETS</p><button id="asset">+ Add approved asset</button><ul>${state.assets.map(a=>`<li>${a} <b>approved</b></li>`).join('') || '<li class="muted">No approved assets yet</li>'}</ul></section></aside>
    <section class="canvas"><div class="canvasbar"><span>FRONT PANEL / 180 × 75 mm</span><span class="pass">VECTOR READY</span></div><div class="pack"><div class="trim"><div class="safe"><span class="logo">LUMA<br>BOTANICS</span><h1>RESTORE</h1><p>Botanical repair shampoo</p><i>400 ml</i></div></div></div><p class="caption">Locked dieline • trim, bleed, and safe area shown</p></section>
    <aside class="review"><p class="eyebrow">PRODUCTION REVIEW</p><div class="score"><strong>${state.plan ? '82' : '—'}</strong><span>readiness score</span></div><ul class="checks"><li class="ok">Editable text preserved</li><li class="ok">Safe area declared</li><li class="warn">${state.assets.length ? 'Asset provenance recorded' : 'Add logo and product asset'}</li><li class="warn">Print process not selected</li></ul>${state.plan ? `<article><p class="eyebrow">COMPOSITION PLAN</p><p>${state.plan}</p></article>` : '<article><p>Generate a plan to review hierarchy, typography, and colour intent.</p></article>'}</aside>
  </main>`;
document.addEventListener('input', e => { if(e.target.id in state) state[e.target.id] = e.target.type==='number' ? +e.target.value : e.target.value; });
document.addEventListener('click', e => { if(e.target.id==='asset'){ state.assets.push(state.assets.length ? 'Product image' : 'Primary logo'); render(); } if(e.target.id==='plan'){ state.plan='Hero claim leads on the upper third; restrained botanical field supports premium efficacy; logo anchors trust at the top.'; render(); } if(e.target.id==='export') alert(state.plan ? 'Export package queued for human approval.' : 'Create a composition plan before export.'); });
render();
