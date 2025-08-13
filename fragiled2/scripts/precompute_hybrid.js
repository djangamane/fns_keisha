#!/usr/bin/env node

/**
 * Precompute hybrid-enhanced JSON snapshots for FNS
 * - Generates top_6.json and rest.json for fast CDN delivery
 * - Intended to be run by GitHub Actions hourly or on-demand
 */

const fs = require('fs');
const path = require('path');

async function main() {
  const outDirArgIndex = process.argv.indexOf('--out-dir');
  const outDir = outDirArgIndex !== -1 ? process.argv[outDirArgIndex + 1] : path.join('fragiled2', 'precomputed');

  // Lazy require to avoid side effects when not needed
  const HybridNewsService = require('../services/hybridNewsService');
  const hybridService = new HybridNewsService();

  const limit = parseInt(process.env.PRECOMPUTE_LIMIT || '24', 10);
  const minSeverity = parseFloat(process.env.PRECOMPUTE_MIN_SEVERITY || '70');
  const daysBack = parseInt(process.env.PRECOMPUTE_DAYS_BACK || '1', 10);

  console.log(`🧮 Precomputing hybrid data (limit=${limit}, minSeverity=${minSeverity}, daysBack=${daysBack})...`);

  const enhanced = await hybridService.getEnhancedArticles({
    limit,
    minSeverity,
    daysBack,
    includeImages: true,
    allowPartial: true,
  });

  // Sort by severity desc just to be safe
  const sorted = [...enhanced].sort((a, b) => (b.severity_score || 0) - (a.severity_score || 0));
  const top6 = sorted.slice(0, 6);
  const rest = sorted.slice(6);

  const status = {
    lastUpdated: new Date().toISOString(),
    total: sorted.length,
    topCount: top6.length,
    restCount: rest.length,
    minSeverity,
    daysBack,
  };

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'top_6.json'), JSON.stringify(top6, null, 2));
  fs.writeFileSync(path.join(outDir, 'rest.json'), JSON.stringify(rest, null, 2));
  fs.writeFileSync(path.join(outDir, 'status.json'), JSON.stringify(status, null, 2));

  console.log(`✅ Wrote precomputed files to ${outDir}`);
}

main().catch((err) => {
  console.error('❌ Precompute failed:', err);
  process.exit(1);
});

