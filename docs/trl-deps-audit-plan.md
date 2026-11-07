# Plan TRL 5.13 — dependencias high (nara-web)

Fecha: 2026-10-10 (actualizado)

## Hecho

- **next** y **eslint-config-next** → **16.4.0** (fuera de 16.0.0–16.3.7).
- **xlsx** eliminado; scripts de Excel usan **exceljs@4.4.0**.
- **source-map-js**: override `>=1.2.2` (llegaba a producción vía `next` → `postcss`; advisory high en 1.2.1).

## Restantes

| Paquete | Severidad | Cadena | Prod/dev | Fecha | Notas |
|---------|-----------|--------|----------|-------|-------|
| **uuid** (&lt;11.1.1) | moderate | `exceljs@4.4.0` → `uuid` | **producción** (scripts / dep directa de exceljs) | 2026-10-10 | `npm audit fix --force` bajaría exceljs a 3.4.0 (breaking). Mantener exceljs 4.x; re-auditar cuando exceljs suba uuid. |
| braces / micromatch / fast-glob (si aparecen) | high | eslint → … | **dev** | 2026-10-10 | No bajar Next a 14.x. Re-auditar en cada bump de `eslint-config-next`. |

## Seed de contraseñas (5.9 / 6.12)

Variables obligatorias en `.env.local` (sin default):

- `SEED_OBS_SALENTO_PASSWORD`
- `SEED_OBS_FINANCIADOR_PASSWORD`
- `SEED_OBS_INVESTIGACION_PASSWORD`
- `SEED_DEMO_PATIENT_PASSWORD`
- `SEED_DEMO_EXPERT_PASSWORD`
- `SEED_DEMO_CLINICO_PASSWORD`

Ver también `docs/trl-password-rotation.md` (rotar/desactivar en producción; repos públicos vs privados).
