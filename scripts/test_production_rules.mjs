import assert from 'node:assert/strict';
import { getProductionChecks, getProductionRisks, isProductionReady } from '../src/rules.js';

const readyJob = {
  bleed: 3, safe: 5, printProcess: 'CMYK offset', plan: 'Approved composition',
  assets: [{ type: 'Logo' }, { type: 'Product artwork' }],
};

assert.equal(isProductionReady(readyJob), true);
assert.equal(isProductionReady({ ...readyJob, bleed: 2 }), false);
assert.equal(isProductionReady({ ...readyJob, safe: 4 }), false);
assert.equal(isProductionReady({ ...readyJob, assets: [{ type: 'Logo' }] }), false);
assert.equal(isProductionReady({ ...readyJob, printProcess: '' }), false);
assert.equal(isProductionReady({ ...readyJob, plan: null }), false);
assert.equal(isProductionReady({ ...readyJob, bleed: 'not-a-number' }), false);
assert.equal(isProductionReady({ ...readyJob, printProcess: '   ' }), false);
assert.equal(getProductionChecks(readyJob).length, 6);
assert.equal(getProductionRisks(readyJob).length, 2);
assert.equal(getProductionRisks({ ...readyJob, brief: 'Premium botanical repair', assets: [{ type: 'Logo', source: 'Brand portal' }, { type: 'Product artwork', source: 'Studio shoot' }] }).length, 0);
assert.equal(getProductionRisks({ ...readyJob, brief: 'Premium botanical repair', assets: [{ type: 'Logo', source: 'Brand portal' }, { type: 'Product artwork', source: '' }] }).length, 1);
console.log('Production-rule tests passed.');
