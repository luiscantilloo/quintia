# Evidencia T1 · Offline al alta (experto)

**Fecha:** 2026-10-11  
**Código:** cambios en `nara-web` (formulario alta) + `nara-api` (`clientKey` idempotente).

## Qué se corrigió

| # | Condición del pedido | Implementación |
|---|----------------------|----------------|
| 1 | Aviso claro sin red (no chrome-error) | `postOrQueue` + mensaje `OFFLINE_KEEP_MSG`; no se navega a consentimiento si falla |
| 2 | Lo escrito sigue en el formulario | Estado `nf` + borrador `localStorage` clave `nara.experto.nfDraft` |
| 3 | Reintentar con red | Botón del modal pasa a **Reintentar** y reusa el mismo `id`/`clientKey` |
| 4 | Sin duplicados | Front envía `clientKey` (= id del borrador); API busca por `clientKey` antes de crear |
| 5 | Consentimiento de persona inexistente | Effect en visita/consentimiento: sin ficha local/servidor → toast y vuelta a `/experto` |

## Archivos tocados

- `nara-web/src/modules/experto/hooks/useExpertoScreen.ts`
- `nara-web/src/modules/experto/components/ExpertoBody.tsx`
- `nara-api/apps/people/src/people/people.service.ts`
- E2E existente: `nara-web/e2e/r04-alta-sin-red.spec.ts`

## Prueba automática

```bash
cd nara-web && npm run test:e2e -- e2e/r04-alta-sin-red.spec.ts
```

## Prueba manual (Chrome)

1. Login `prueba.experto` → Nueva persona → llenar nombre/apellido/fecha/barrio.
2. DevTools → Red → **Offline** → Agregar y empezar visita.
3. Debe verse el aviso; datos en el form; botón **Reintentar**.
4. Volver Online → Reintentar → entra a consentimiento; 1 sola persona `TRL-QA-…`.
5. Abrir `/experto/visita/<uuid-falso>/consentimiento` → error y panel, no ficha vacía.

## Tabla de 5 condiciones (rellenar tras correr script/manual)

| # | Condición | Resultado |
|---|-----------|-----------|
| 1 | Aviso de la app sin red | Pendiente de corrida local/prod |
| 2 | Datos en el formulario | Pendiente |
| 3 | Reintento guarda | Pendiente |
| 4 | Exactamente 1 registro | Pendiente |
| 5 | Consentimiento inexistente bloqueado | Código listo; pendiente verificación en navegador |

> Commit / video / salida de `r04_red_cliente.js`: pendientes de que el usuario pida commit y de disponer del script aparte.
