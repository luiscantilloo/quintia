# Datos de prueba

## QUINTIA

Ver [README_QUINTIA.md](./README_QUINTIA.md) (cohorte Mongo + cuentas `{rol}+prueba@quintia.com`).

---

# NARA · Datos de prueba

Datos coherentes para probar la plataforma: 5 territorios, 36 cuentas (1 administrador, 5 expertos, 5 clínicos, 5 observadores, 20 pacientes) y 1 cambio de ruta pendiente. Siguen la matriz de clasificación v2 aprobada el 8 oct 2026. La especificación para la plataforma está en el documento «Specs · Matriz de clasificación NARA v2».

## Archivos

| Archivo | Para qué |
| --- | --- |
| `nara_datos_prueba.json` | La fuente de los datos. Si algo cambia, se cambia aquí. |
| `reglas_nara.js` | Las reglas v2 (perfil, ruta, curso, seguimiento). Es la misma lógica que pide la Fase 1. |
| `validar.js` | Revisa la coherencia del JSON. Tiene que terminar en 0 errores. |
| `generar_excel.js` | Arma el Excel de carga. Solo lo genera si la validación pasa. |
| `comparar_excel.js` | Comprueba que el Excel tiene cada dato del JSON (IDs, rutas con canal, fechas). |
| `NARA_datos_prueba_borrador.xlsx` | Borrador para revisar, sin contraseñas. |
| `Specs · Matriz de clasificación NARA v2.md` | La especificación completa: reglas, rutas v2, cambios de código (Fase 1), seguimiento, pruebas de aceptación y Fase 2. |

## Comandos

```
npm install                      # una vez: instala exceljs
node validar.js                  # revisa el JSON
node generar_excel.js            # borrador sin contraseñas
node generar_excel.js --final    # versión para cargar, con contraseñas iniciales
node comparar_excel.js           # el Excel contiene todo el JSON (0 faltantes)
```

La versión final genera contraseñas nuevas cada vez: generarla una sola vez, justo antes de cargar, y no compartirla fuera del equipo.

## Antes de cargar

1. Desplegar la Fase 1 y la sección de Seguimiento de las specs: las rutas de estos datos son las de la matriz v2.
2. Limpiar la carga anterior de Cursor (108 territorios, 109 expertos, 453 personas y 455 cuentas de paciente con correos reales).
3. No guardar `modulesEnabled` en los pacientes, para que la app muestre su ruta.
4. Confirmar los nombres de campo propuestos en la hoja «Mapeo Mongo» (estado del flujo, decisión clínica).
