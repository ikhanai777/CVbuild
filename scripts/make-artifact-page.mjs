/**
 * Generates `dist/artifact.html` from the Vite build.
 *
 * Some hosts (Claude Artifacts among them) serve a page that they wrap in their
 * own `<html>`/`<head>`/`<body>` skeleton, so the published file must be body
 * content only. This derives that file from `dist/index.html` rather than
 * duplicating it by hand, so the asset hashes can never drift out of step.
 *
 * Run automatically after `npm run build`.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const dist = join(process.cwd(), 'dist');
const indexPath = join(dist, 'index.html');

if (!existsSync(indexPath)) {
  console.error('dist/index.html not found — run `npm run build` first.');
  process.exit(1);
}

const html = readFileSync(indexPath, 'utf8');

const pick = (re) => [...html.matchAll(re)].map((m) => m[0]);
const title = /<title>[\s\S]*?<\/title>/.exec(html)?.[0] ?? '<title>CVBuild</title>';
const links = pick(/<link\b(?![^>]*rel="icon")[^>]*>/g);
const scripts = pick(/<script\b[^>]*><\/script>/g);

// Strip the leading "./" so each path is relative with no prefix, which is what
// a host serving the supporting files alongside the page expects.
const relative = (tag) => tag.replace(/(href|src)="\.\//g, '$1="');

const page = `${title}
${links.map(relative).join('\n')}
<style>
  /* A fixed, one-screen editor: height rather than 100vh, so it sits inside
     any safe-area padding the host applies on a phone. */
  html,
  body {
    height: 100%;
    margin: 0;
  }
  #root {
    height: 100%;
  }
</style>
<div id="root"></div>
${scripts.map(relative).join('\n')}
`;

writeFileSync(join(dist, 'artifact.html'), page);
console.log(`dist/artifact.html written (${links.length} links, ${scripts.length} scripts)`);
