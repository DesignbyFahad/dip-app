export const getProductionChecks = (job) => [
  ['Editable text preserved', true],
  [`Bleed is ${job.bleed} mm (minimum 3 mm)`, Number.isFinite(Number(job.bleed)) && Number(job.bleed) >= 3],
  [`Safe area is ${job.safe} mm (minimum 5 mm)`, Number.isFinite(Number(job.safe)) && Number(job.safe) >= 5],
  ['Approved logo and product artwork recorded', job.assets.some((asset) => asset.type === 'Logo') && job.assets.some((asset) => asset.type === 'Product artwork')],
  ['Print process selected', Boolean(job.printProcess?.trim())],
  ['Composition plan approved', Boolean(job.plan)],
];

export const isProductionReady = (job) => getProductionChecks(job).every(([, ready]) => ready);

export const getProductionRisks = (job) => {
  const risks = [];
  if (!job.brief?.trim()) risks.push('Add a creative brief so hierarchy and tone can be reviewed against an intended outcome.');
  if (!Number.isFinite(Number(job.bleed)) || Number(job.bleed) < 3) risks.push('Increase bleed to at least 3 mm before print export.');
  if (!Number.isFinite(Number(job.safe)) || Number(job.safe) < 5) risks.push('Increase safe area to at least 5 mm for mandatory copy.');
  if (!job.assets.every((asset) => asset.source?.trim())) risks.push('Record a source or rights note for every approved asset.');
  if (!job.printProcess?.trim()) risks.push('Select a print process before colour and trapping decisions are finalised.');
  return risks;
};
