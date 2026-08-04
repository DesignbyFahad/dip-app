export const getProductionChecks = (job) => [
  ['Editable text preserved', true],
  [`Bleed is ${job.bleed} mm (minimum 3 mm)`, Number(job.bleed) >= 3],
  [`Safe area is ${job.safe} mm (minimum 5 mm)`, Number(job.safe) >= 5],
  ['Approved logo and product artwork recorded', job.assets.some((asset) => asset.type === 'Logo') && job.assets.some((asset) => asset.type === 'Product artwork')],
  ['Print process selected', Boolean(job.printProcess)],
  ['Composition plan approved', Boolean(job.plan)],
];

export const isProductionReady = (job) => getProductionChecks(job).every(([, ready]) => ready);
