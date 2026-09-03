import { readFileSync } from 'node:fs';
import path from 'node:path';

import { defineConfig, type Plugin } from 'vite';

const pathKitWasmId = '@suika/pathkit/pathkit.wasm?url';
const pathKitWasmVirtualId = '\0pathkit-wasm-url';
const pathKitWasmFallback = '(new URL("pathkit.wasm",import.meta.url)).href';

/** Vite's library mode always inlines assets, so keep PathKit's WASM external. */
const emitPathKitWasm = (): Plugin => ({
  name: 'emit-pathkit-wasm',
  enforce: 'pre',
  resolveId(source) {
    if (source === pathKitWasmId) {
      return pathKitWasmVirtualId;
    }
  },
  load(id) {
    if (id !== pathKitWasmVirtualId) {
      return;
    }

    const referenceId = this.emitFile({
      type: 'asset',
      fileName: 'pathkit.wasm',
      source: readFileSync(path.resolve(__dirname, '../pathkit/pathkit.wasm')),
    });

    return `export default import.meta.ROLLUP_FILE_URL_${referenceId};`;
  },
  transform(code, id) {
    if (
      id.endsWith('/pathkit/pathkit.mjs') &&
      code.includes(pathKitWasmFallback)
    ) {
      // Emscripten's fallback URL is statically detected and inlined by Vite.
      // `q` is the same module-relative base URL calculated by Emscripten.
      return code.replace(pathKitWasmFallback, 'q+"pathkit.wasm"');
    }
  },
});

export default defineConfig({
  plugins: [emitPathKitWasm()],
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'core',
      fileName: (format) => `core.${format}.js`,
    },
  },
});
