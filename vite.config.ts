import { defineConfig, type Plugin } from 'vitest/config';
import react from '@vitejs/plugin-react';

/**
 * Rewrites awkward literal characters in emitted JavaScript as escape sequences.
 *
 * Minified dependencies embed characters directly in string literals that make
 * the bundle look like a binary file to text-based hosting and deployment
 * pipelines — some reject it outright. pdf.js carries raw control bytes; the
 * `string_decoder` polyfill (via `docx`) carries literal U+FFFD; U+2028 and
 * U+2029 have historically broken JavaScript consumers.
 *
 * All of these can only appear inside a string, template or regex literal in
 * valid source, so replacing them with their escape sequences leaves the parsed
 * value identical.
 */
function escapeControlChars(): Plugin {
  // C0 controls except tab, newline and carriage return, plus U+2028/9 and U+FFFD.
  // Built from a string so this file never contains the literal characters itself.
  const CONTROL_RE = new RegExp(
    '[\\u0000-\\u0008\\u000b\\u000c\\u000e-\\u001f\\u2028\\u2029\\ufffd]',
    'g',
  );
  return {
    name: 'escape-control-chars',
    generateBundle(_options, bundle) {
      const escape = (code: string) =>
        code.replace(CONTROL_RE, (c) => {
          const hex = c.charCodeAt(0).toString(16);
          return hex.length <= 2 ? `\\x${hex.padStart(2, '0')}` : `\\u${hex.padStart(4, '0')}`;
        });

      for (const file of Object.values(bundle)) {
        if (file.type === 'chunk') {
          file.code = escape(file.code);
          continue;
        }
        // The pdf.js worker arrives as an asset (imported for its URL), not a
        // chunk, and is read as bytes — decode it before escaping.
        if (!/\.m?js$/.test(file.fileName)) continue;
        const source =
          typeof file.source === 'string'
            ? file.source
            : new TextDecoder().decode(file.source as Uint8Array);
        file.source = escape(source);
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), escapeControlChars()],
  base: './',
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 1200,
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
