import { appendFileSync } from 'node:fs';
import { setTimeout } from 'node:timers/promises';

const endpoint =
  process.argv[2] || 'https://dice-research.org/api/rag/ingestion';
const deployment = process.env.RAG_DEPLOYMENT_ID;
if (!deployment) throw new Error('RAG_DEPLOYMENT_ID is required');
const deadline = Date.now() + 4 * 60 * 60 * 1000;
while (Date.now() < deadline) {
  let report;
  try {
    const response = await fetch(endpoint, {
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    report = await response.json();
  } catch (error) {
    console.warn(`Waiting for ingestion report: ${error.message}`);
  }
  if (
    report?.deployment === deployment &&
    ['complete', 'failed', 'disabled'].includes(report.status)
  ) {
    const summary = [
      '### Paper PDF ingestion',
      '',
      `Status: ${report.status}`,
      '',
      '| Metric | Count |',
      '| --- | ---: |',
      ...Object.entries({
        'Papers found': report.papersFound,
        'With PDF URL': report.withPdfUrl,
        'Already unchanged': report.alreadyUnchanged,
        'New PDFs': report.newPdfs,
        'Changed PDFs': report.changedPdfs,
        'Reprocessed PDFs': report.reprocessedPdfs,
        'Failed PDFs': report.failedPdfs,
        'Chunks added': report.chunksAdded,
        'Chunks removed': report.chunksRemoved,
        'Paper metadata updated': report.metadataUpdated,
      }).map(([label, count]) => `| ${label} | ${count ?? 0} |`),
      '',
    ].join('\n');
    console.log(summary);
    if (process.env.GITHUB_STEP_SUMMARY)
      appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
    if (report.status !== 'complete')
      throw new Error(
        `Paper ingestion ${report.status}; inspect RAG container logs`
      );
    process.exit(0);
  }
  console.log(
    `Waiting for deployment ${deployment} to finish paper ingestion...`
  );
  await setTimeout(15000);
}
throw new Error(
  'Paper ingestion did not finish within four hours; it may still be running in the RAG container'
);
