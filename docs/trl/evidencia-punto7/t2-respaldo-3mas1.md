# Evidencia T2 · Prueba respaldo «3 + 1»

**Fecha intento:** 2026-10-11  
**Entorno de trabajo del agente:** macOS (máquina de desarrollo), sin la tarea programada «NARA respaldo 2.5h» ni `mongodump`/`mongorestore` instalados aquí.

## Resultado

| Paso | Estado |
|------|--------|
| 1. Sacar respaldo con el script de la tarea | **No ejecutado** — no hay acceso a la máquina de respaldos ni a `datos/respaldos_db` desde este entorno |
| 2. Crear 3 `TRL-QA-R06-*` + archivar 1 en Prueba | Pendiente (depende del paso 1) |
| 3. Restaurar en Mongo local y medir tiempo | **No ejecutado** — sin volcado ni Mongo tools locales |
| 4. Verificar 3 checks (sin las 3 nuevas; archivada activa; conteos) | Pendiente |
| 5. Limpiar en prod | Pendiente |
| 6. Borrar base local | Pendiente |

## Motivo

La prueba exige operar **en la máquina donde corre el respaldo automático**, porque los volcados tienen datos reales de salud mental y no deben copiarse a otra máquina. Este entorno no es esa máquina.

## Quién debe completar el acta

Quien tenga acceso a la tarea «NARA respaldo 2.5h», siguiendo el runbook `docs/trl/runbooks/03_restauracion_respaldo.md` §3.

### Plantilla de acta (llenar allí)

- Hora del respaldo:
- Inicio restauración:
- Fin restauración:
- Tiempo total:
- Check A (3 TRL-QA-R06 no existen): sí / no
- Check B (archivada vuelve activa): sí / no
- Check C (conteos OK): sí / no — anotar solo números
- Base local borrada: sí / no
