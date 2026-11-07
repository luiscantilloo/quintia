# quintia-web (repo `consiente-web`) · Frente QUINTIA (Núcleo Care)

Frente web de **QUINTIA** (asistente **TEJIVA**). El id técnico del programa es `quintia`.

**Assets:** la ruta canónica de marca es `public/quintia/`. `public/consiente/` queda como legado (recursos, fuentes, symlinks); no borrarla sin migrar referencias.

## Arranque

```bash
cp .env.example .env.local
# NUCLEO_API_URL=http://127.0.0.1:4200
# NEXT_PUBLIC_PROGRAM_ID=quintia
npm install
npm run dev   # :3004
```

API: `node scripts/run-dev.mjs quintia` en `nucleo-api` (:4200).

## Marca

- Colores: `src/styles/plateado-tokens.css` + `@theme` en `globals.css`
- Assets: `public/quintia/`
- `NEXT_PUBLIC_PROGRAM_ID=quintia` → header `x-program-id`
