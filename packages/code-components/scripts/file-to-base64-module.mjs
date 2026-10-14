// Embeds a binary file (e.g. a .glb model or a small .png) as a base64 string module. The Webflow
// CLI bundler only emits images and fonts as assets, so binary models have to ship inside the JS.
//
// Usage: node scripts/file-to-base64-module.mjs <input> <output.ts>
import { readFileSync, writeFileSync } from 'node:fs';
import { basename } from 'node:path';

const [input, output] = process.argv.slice(2);

if (!input || !output) {
  console.error('Usage: node scripts/file-to-base64-module.mjs <input> <output.ts>');
  process.exit(1);
}

const base64 = readFileSync(input).toString('base64');

writeFileSync(
  output,
  `// Generated from ${basename(input)} by scripts/file-to-base64-module.mjs. Do not edit by hand.\n` +
    `export default '${base64}';\n`
);

console.log(`Wrote ${output} (${Math.round(base64.length / 1024)} KB of base64)`);
