# Rotación de contraseñas demo (TRL 5.9 / 6.12)

Fecha: 2026-10-10

Los repositorios son públicos y el historial de git contiene claves demo antiguas. En **producción** hay que rotar o desactivar estas cuentas y avisarnos por escrito cuáles quedaron rotadas/desactivadas:

| Cuenta | Correo típico |
|--------|----------------|
| Administrador | `admin@nara.com` |
| Observador Salento | `observador@nara.com` |
| Observador financiador | `financiador@nara.com` |
| Observador investigación | `investigacion@nara.com` |
| Paciente demo | `gloria.patino@nara.com` |
| Experto demo | `camila.restrepo@nara.com` |
| Clínico demo | `lucia.marin@nara.com` |

Variables de entorno (sin default en scripts):

- `SEED_ADMIN_PASSWORD`
- `SEED_OBS_SALENTO_PASSWORD`
- `SEED_OBS_FINANCIADOR_PASSWORD`
- `SEED_OBS_INVESTIGACION_PASSWORD`
- `SEED_DEMO_PATIENT_PASSWORD`
- `SEED_DEMO_EXPERT_PASSWORD`
- `SEED_DEMO_CLINICO_PASSWORD`

## Repos públicos → privados

**Recomendación:** pasar `nara-web` y `nara-api` a **privados** en GitHub mientras el historial contenga secretos, o reescribir historial (costoso). Decisión pendiente del equipo.
