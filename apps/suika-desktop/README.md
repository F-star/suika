# Suika Desktop

The Electron wrapper for the local Suika editor. It deliberately does not load
the multiplayer app or backend.

## Development

```bash
pnpm install
pnpm desktop:dev
```

## Packaging

```bash
pnpm desktop:build
```

Installers are written to `release/`. `pnpm desktop:clean` removes `dist/` and
`release/`; the build runs it first.

The packaged application includes the built Web renderer as an Electron extra
resource. The renderer has no Node.js access; native file dialogs and file I/O
are exposed through the narrow `window.suikaDesktop` preload API.
