# Subida manual — QUINTIA / quintia-web (Vercel)

Guía completa (API + front): `../nucleo-api/DEPLOY-MANUAL.md`.

## Este front → Vercel

1. Repo GitHub **propio** (no uses el remote de `nara-web`).
2. Importar proyecto en Vercel.
3. Env vars: copiar `deploy/VERCEL-CONSCIENTE.env.example` (alias histórico) y poner la URL https del **nucleo-api** con `PROGRAM_ID=quintia` en Render.
4. Build: default Next (`npm run build`).
5. Después: en Render, `CORS_ORIGIN` debe incluir tu dominio Vercel.

## No tocar

- No despliegues `nara-web` con estos cambios.
- No apuntes `NUCLEO_API_URL` a la API NARA antigua.
