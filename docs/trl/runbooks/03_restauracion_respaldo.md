# Runbook · Restauración de respaldo (R-06 / Punto 7 · T3)

**Valores acordados:** RTO = **1 hora** · RPO = **2,5 horas** (respaldo automático cada 2,5 h).  
**Alcance de pruebas:** solo territorio «Prueba» en `https://www.proyectonara.com`.  
**Fecha de este procedimiento:** 2026-10-11 (alineado a la prueba «3 + 1» del pedido Punto 7).

---

## 1. Dónde están los respaldos

| Qué | Dónde |
|-----|--------|
| Tarea programada | «NARA respaldo 2.5h» en la máquina que ya genera los respaldos (no el portátil de desarrollo diario) |
| Carpeta de respaldos | `datos/respaldos_db` (en esa máquina) |
| Intervalo | Cada **2,5 horas** (cumple el RPO) |
| Base de producción | MongoDB Atlas, base `nara` (clúster polaria) |
| App | `nara-web` (Vercel) → `nara-api` (Render) → Atlas |

Los respaldos contienen datos reales de salud mental: **no se copian a otra máquina ni se comparten**. La verificación se hace en la misma máquina del respaldo, restaurando a un Mongo **local**.

---

## 2. Script de respaldo (sin secretos)

Usar **el mismo script** que ejecuta la tarea programada «NARA respaldo 2.5h».

Parámetros típicos (nombres; los valores van en el almacén de secretos / variables de la máquina, nunca en el runbook):

- URI de solo lectura hacia Atlas (usuario de respaldo).
- Carpeta de salida bajo `datos/respaldos_db`.
- Nombre/fecha del volcado (p. ej. `nara_YYYYMMDD_HHMM`).

No documentar aquí cadenas de conexión ni contraseñas.

---

## 3. Prueba «3 + 1» (integridad del instante)

Objetivo: demostrar que el respaldo captura el estado **en el momento** en que se tomó, no un resumen circular.

1. Anotar la hora y sacar un respaldo con el script de la tarea.
2. Justo después, en producción (territorio Prueba), con `prueba.experto` o `prueba.admin`:
   - Crear 3 personas: `TRL-QA-R06-1`, `TRL-QA-R06-2`, `TRL-QA-R06-3`.
   - Archivar 1 persona de prueba que **ya existía** antes del respaldo. Anotar su código/id interno (sin PII en el acta).
3. Restaurar el respaldo del paso 1 en una base **local** (nunca sobre Atlas) y medir el tiempo hasta poder consultar.
4. En la base restaurada, verificar:
   - Las 3 `TRL-QA-R06-*` **no** existen.
   - La persona archivada en el paso 2 aparece **activa** (como al momento del respaldo).
   - Los conteos por colección coinciden con el resumen del respaldo (p. ej. vía `comparar_db.js` si está en la máquina de ops).
5. En producción: archivar las 3 `TRL-QA-R06-*` y reactivar la del paso 2.
6. Borrar la base local restaurada.

**Acta mínima:** hora del respaldo · inicio/fin restauración · tiempo total · sí/no de las 3 checks (solo conteos) · confirmación de borrado local. Sin nombres de personas reales.

---

## 4. Restaurar en local (verificación)

1. Tener MongoDB local escuchando (puerto habitual 27017).
2. Crear una base vacía dedicada, p. ej. `nara_restore_verif`.
3. Ejecutar el script de restauración apuntando al volcado elegido → base local (parámetros sin secretos en la línea de comando; URI local).
4. Comprobar con el cliente `mongosh` o el script de comparación de conteos.
5. Borrar la base local al terminar: `db.dropDatabase()` sobre `nara_restore_verif`.

**Nunca** restaurar un volcado de prueba sobre Atlas producción.

---

## 5. Emergencia: restaurar producción (Atlas)

Solo si la base de producción está perdida o irreparable y un responsable lo autoriza por escrito.

**Ruta preferida (menor riesgo):**

1. Restaurar el volcado más reciente a una **base nueva** en Atlas (p. ej. `nara_restore_YYYYMMDD`).
2. Verificar conteos y un login de prueba (territorio Prueba).
3. Cambiar `MONGODB_URI` / `MONGODB_DB` de **nara-api** en Render hacia la base nueva.
4. Redeploy / reinicio del servicio gateway en Render.
5. Comprobar: login → abrir una ficha de Prueba → health del gateway OK.
6. Dejar la base antigua retenida el tiempo que diga el responsable; luego archivar/borrar según inventario.

**Ruta alternativa (solo si no hay otra opción):** restaurar sobre la base `nara` existente. Requiere autorización explícita: implica sobrescribir el estado actual.

**Quién ejecuta / quién autoriza:** operador con acceso a la máquina de respaldos + admin de Atlas/Render; autorización del responsable del proyecto NARA.

**RTO:** el reloj empieza en «se pierde la base» y termina cuando «la app inicia sesión y abre una ficha contra la base restaurada». Objetivo ≤ **1 hora**.

---

## 6. Cómo comprobar que la plataforma volvió

Checklist post-restauración (territorio Prueba):

1. `GET` health del gateway (`nara-api`) → `ok: true`.
2. Login con `prueba.admin` o `prueba.experto`.
3. Abrir lista de personas / una ficha conocida de Prueba.
4. (Opcional) Conteos de colecciones clave vs resumen del respaldo.

---

## 7. RTO y RPO (recordatorio)

| Indicador | Valor | Significado operativo |
|-----------|-------|----------------------|
| RPO | 2,5 h | Máxima pérdida de datos aceptable; el respaldo automático no debe espaciarse más |
| RTO | 1 h | Tiempo máximo desde incidente hasta app usable contra base restaurada |

---

## 8. Estado de la prueba «3 + 1» (T2)

Ver `docs/trl/evidencia-punto7/t2-respaldo-3mas1.md`. Si la prueba aún no se ejecutó en la máquina de respaldos, el runbook se considera listo para seguir; la evidencia de tiempos y checks se completa allí.
