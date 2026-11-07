# consiente-web (QUINTIA) → núcleo

Guía de subida manual. **No incluye push ni deploy automático.**

Referencia compartida: `nucleo-api/DEPLOY-MANUAL.md` · programa en `nucleo-api/programs/quintia/` (`program.yaml`, `marca.json`).

## Arquitectura

```
consiente-web (Vercel)  ──NUCLEO_API_URL──►  Render nucleo-api (:$PORT)
       │                                      │
       └── NEXT_PUBLIC_PROGRAM_ID=quintia      └── proxy → stack interno :4200
            + header x-program-id: quintia          → Mongo: nucleo_consiente
```

Coexisten **Parienta**, **NARA** y **QUINTIA** en un solo servicio Render si defines `PARIENTA_*`, `NARA_*` y `QUINTIA_*` (`deploy/RENDER-UNICO.env.example`). Cada front fija su programa con `NEXT_PUBLIC_PROGRAM_ID`; el núcleo enruta por `x-program-id`.

| Programa | `PROGRAM_ID` / header | Mongo (habitual) | Dev API |
| -------- | --------------------- | ---------------- | ------- |
| Parienta | `parienta` | `nucleo_parienta` | `:4000` |
| NARA | `nara` | `nara` | `:4100` |
| QUINTIA | `quintia` | **`nucleo_consiente`** | `:4200` |

**Nombre de base:** scripts y `.env` local usan `nucleo_consiente`. Si en Atlas creas otra DB (p. ej. `nucleo_quintia`), pon el mismo nombre en `QUINTIA_MONGODB_DB` / `MONGODB_DB` al init, seed y en Render.

## Front (Vercel o static)

Variables: `deploy/VERCEL-QUINTIA.env.example` (alias legado: `VERCEL-CONSCIENTE.env.example`).

| Variable | Valor |
| -------- | ----- |
| `NUCLEO_API_URL` | URL pública del núcleo en Render |
| `NARA_API_URL` | Misma URL (compat cliente) |
| `NEXT_PUBLIC_PROGRAM_ID` | `quintia` |
| `NEXT_PUBLIC_SITE_URL` | URL del proyecto Vercel QUINTIA |

Build/start: los del repo Next (p. ej. `npm run build`). Puerto local del front: **3004** (CORS del núcleo debe incluir `http://localhost:3004`).

## API (Render web service)

- Repo: `nucleo-api`
- Build: `npm ci && npm run build`
- Start: `npm run start:prod` (escucha **`0.0.0.0:$PORT`**; Render define `PORT`)
- Modo **triple**: variables `QUINTIA_MONGODB_URI`, `QUINTIA_MONGODB_DB=nucleo_consiente`, `QUINTIA_AUTH_SECRET`, `QUINTIA_CORS_ORIGIN` (URL Vercel + localhost:3004)
- Modo **solo QUINTIA**: `deploy/RENDER-QUINTIA.env.example`

Smoke:

```bash
curl -s -H 'x-program-id: quintia' 'https://TU-NUCLEO.onrender.com/api/health'
```

## Orden recomendado (antes de publicar)

Desde `nucleo-api` con URI de Atlas en `.env` (`QUINTIA_MONGODB_URI` o `MONGODB_URI`):

```bash
npm run test:quintia
npm run db:init:quintia
SEED_QUINTIA_DEMO_PASSWORD='…' npm run db:seed:quintia   # ≥12 caracteres; no commitear
```

Luego:

1. Deploy / actualizar **API** en Render (env triple o QUINTIA).
2. Deploy **consiente-web** en Vercel con env QUINTIA.
3. Login con cuenta de prueba (misma contraseña que el seed).

## Cuentas de prueba

Patrón **`{rol}+prueba@quintia.com`** (detalle en `nucleo-api/programs/quintia/LEEME.md` y `datos_prueba/README_QUINTIA.md`):

`admin`, `experto`, `clinico`, `cuidador`, `observador`, `paciente`, `paciente2` + `+prueba@quintia.com`.

Contraseña: solo vía entorno **`SEED_QUINTIA_DEMO_PASSWORD`** (o `SEED_ADMIN_PASSWORD`) al ejecutar el seed — **nunca** en git ni en variables de Vercel.

## Secretos

- Auth producción: `QUINTIA_AUTH_SECRET` en Render.
- Mongo: usuario/contraseña solo en Render / Atlas, no en el repo.
- Seed demo: `SEED_QUINTIA_DEMO_PASSWORD` solo en tu máquina o pipeline privado al correr `db:seed:quintia`.
