# Vendored PathKit

Checked in rather than installed, so the demo does not depend on a skia checkout being present at
a particular path. It is exposed to the workspace as `@suika/pathkit`. BSD-3-Clause, see
[LICENSE](./LICENSE).

```ts
import PathKitInit from '@suika/pathkit';

const PathKit = await PathKitInit();
```

| File | What it is |
| --- | --- |
| `pathkit.mjs` | The ES module build (`compile.sh esm`). Vite consumes this directly. |
| `pathkit.wasm` | The wasm binary, loaded through `locateFile`. |
| `pathkit.d.mts` | Type definitions. TypeScript picks these up for `./pathkit.mjs` automatically. |
| `SKIA_REVISION` | The skia commit these were built from. |

## Refreshing

From a skia checkout with PathKit restored:

```bash
cd modules/pathkit && EMSDK=$PWD/../../third_party/externals/emsdk make npm
```

then copy `npm-wasm/bin/pathkit.mjs`, `npm-wasm/bin/pathkit.wasm` and
`npm-wasm/types/index.d.ts` (renamed to `pathkit.d.mts`) over the files here, and update
`SKIA_REVISION`.

The ES module build is web/worker only. The CommonJS `pathkit.js` in the same npm package is the
one to use from node — that is what the module's own `tests/node/` drivers load.
