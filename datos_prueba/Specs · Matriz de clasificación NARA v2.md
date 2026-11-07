# Specs · Matriz de clasificación NARA v2

Oct 8, 2026 · @Daniel

La matriz v2 quedó aprobada el 8 de octubre de 2026. La Fase 1 cambia solo reglas y rutas en 4 archivos, sin pantallas nuevas; la Fase 2 agrega la pregunta de privacidad y la crisis en dos pasos. Los 15 perfiles (P01–P15) y los cortes del PHQ-9 no cambian.

## Qué cambia en la clasificación

Cambian dos reglas de capacidad digital en la Fase 1 y dos reglas en la Fase 2; el riesgo, los cortes y la fórmula del perfil siguen iguales.

| Regla | Hoy | v2 | Fase |
| --- | --- | --- | --- |
| Riesgo PHQ-9 | 0–4 Mínimo · 5–9 Leve · 10–14 Moderado · 15–19 Moderado-severo · 20–27 Severo | Sin cambio | — |
| Puntaje digital | 6 preguntas, 0–11 · Baja 0–4 · Media 5–8 · Alta 9–11 | Sin cambio en preguntas ni cortes | — |
| Sin teléfono | Puede quedar en Media o Alta | Teléfono «Ninguno» ⇒ Baja, sin importar el puntaje | 1 |
| Uso diario contra teléfono | Se acepta «Apps y videollamadas» con teléfono compartido | «Uso diario» no puede ser mayor que «Teléfono»: no deja calcular el resultado | 1 |
| Perfil | P = riesgo × 3 + digital + 1 | Sin cambio (P01–P15) | — |
| Privacidad del teléfono | No se pregunta | Pregunta nueva sin puntos: si no puede usar el teléfono a solas, se atiende como Baja | 2 |
| Crisis | Pregunta 9 > 0 ⇒ protocolo de crisis | Pregunta 9 > 0 ⇒ alerta inmediata (igual) + tamizaje C-SSRS para marcar la urgencia como aguda o prioritaria | 2 |
| Crisis manual | Solo la pregunta 9 activa el protocolo | El experto puede activarlo a mano aunque la pregunta 9 sea 0 | 2 |

## Rutas v2 por perfil

Esta tabla es el criterio de aceptación: con la Fase 1 lista, `pathList(r, d)` sin override debe devolver exactamente estos servicios y frecuencias. Todas las frecuencias ya existen en `SERVICES`; no hay opciones nuevas.

| Perfil | Riesgo × digital | Meses | Servicios y frecuencia |
| --- | --- | --- | --- |
| P01 | Mínimo × Baja | 3 | Llamada de seguimiento (Mensual) · Técnicas guiadas (Material impreso) · Revisita del experto (Mensual) · Grupo de apoyo en la vereda (Mensual) · Cursos y cuentos (Curso con el experto) |
| P02 | Mínimo × Media | 3 | Check-ins por WhatsApp (1 vez por semana) · Videos psicoeducativos (Serie completa) · Técnicas guiadas (En audio) · Grupo de apoyo en la vereda (Mensual) · Cursos y cuentos (Curso guiado por TEO) |
| P03 | Mínimo × Alta | 3 | Estado de ánimo (Diario) · Acompañante con IA (TEO) (Acceso libre) · Check-ins por WhatsApp (1 vez por semana) · Videos psicoeducativos (Serie completa) · Técnicas guiadas (En audio) · Cursos y cuentos (Curso guiado por TEO) |
| P04 | Leve × Baja | 3 | Llamada de seguimiento (Mensual) · Técnicas guiadas (Material impreso) · Revisita del experto (Cada 2 semanas) · Grupo de apoyo en la vereda (Mensual) · Cursos y cuentos (Curso con el experto) |
| P05 | Leve × Media | 3 | Check-ins por WhatsApp (1 vez por semana) · Videos psicoeducativos (Serie completa) · Técnicas guiadas (En audio) · Revisita del experto (Mensual) · Grupo de apoyo en la vereda (Mensual) · Cursos y cuentos (Curso guiado por TEO) |
| P06 | Leve × Alta | 3 | Estado de ánimo (Diario) · Acompañante con IA (TEO) (Acceso libre) · Check-ins por WhatsApp (1 vez por semana) · Videos psicoeducativos (Serie completa) · Técnicas guiadas (En audio) · Revisita del experto (Mensual) · Cursos y cuentos (Curso guiado por TEO) |
| P07 | Moderado × Baja | 6 | Psicólogo clínico (Mensual) · Llamada de seguimiento (Semanal) · Manilla de monitoreo (6 meses) · Técnicas guiadas (Material impreso) · Revisita del experto (Cada 2 semanas) · Problem Management Plus (PM+) (5 sesiones semanales) · Grupo de apoyo en la vereda (Quincenal) · Cursos y cuentos (Curso con el experto) |
| P08 | Moderado × Media | 6 | Psicólogo clínico (Mensual) · Check-ins por WhatsApp (3 veces por semana) · Manilla de monitoreo (6 meses) · Videos psicoeducativos (Serie completa) · Técnicas guiadas (En audio) · Problem Management Plus (PM+) (5 sesiones semanales) · Grupo de apoyo en la vereda (Quincenal) · Cursos y cuentos (Curso con el experto) |
| P09 | Moderado × Alta | 6 | Estado de ánimo (Diario) · Psicólogo clínico (Mensual) · Acompañante con IA (TEO) (Entre sesiones) · Check-ins por WhatsApp (3 veces por semana) · Manilla de monitoreo (6 meses) · Videos psicoeducativos (Serie completa) · Técnicas guiadas (En audio) · Problem Management Plus (PM+) (5 sesiones semanales) · Cursos y cuentos (Curso con el experto) |
| P10 | Moderado-severo × Baja | 12 | Psicólogo clínico (Quincenal) · Llamada de seguimiento (Semanal) · Manilla de monitoreo (12 meses) · Técnicas guiadas (Material impreso) · Revisita del experto (Cada 2 semanas) · Problem Management Plus (PM+) (5 sesiones semanales) · Grupo de apoyo en la vereda (Quincenal) · Cursos y cuentos (Asignado por la psicóloga) |
| P11 | Moderado-severo × Media | 12 | Psicólogo clínico (Quincenal) · Check-ins por WhatsApp (3 veces por semana) · Manilla de monitoreo (12 meses) · Videos psicoeducativos (Serie completa) · Técnicas guiadas (En audio) · Revisita del experto (Cada 2 semanas) · Problem Management Plus (PM+) (5 sesiones semanales) · Grupo de apoyo en la vereda (Quincenal) · Cursos y cuentos (Asignado por la psicóloga) |
| P12 | Moderado-severo × Alta | 12 | Estado de ánimo (Diario) · Psicólogo clínico (Quincenal) · Acompañante con IA (TEO) (Entre sesiones) · Check-ins por WhatsApp (3 veces por semana) · Manilla de monitoreo (12 meses) · Videos psicoeducativos (Serie completa) · Técnicas guiadas (En audio) · Revisita del experto (Cada 2 semanas) · Problem Management Plus (PM+) (5 sesiones semanales) · Cursos y cuentos (Asignado por la psicóloga) |
| P13 | Severo × Baja | 12 | Psicólogo clínico (Semanal) · Llamada de seguimiento (Semanal) · Manilla de monitoreo (12 meses) · Técnicas guiadas (Material impreso) · Revisita del experto (Cada 2 semanas) · Cursos y cuentos (Asignado por la psicóloga) |
| P14 | Severo × Media | 12 | Psicólogo clínico (Semanal) · Check-ins por WhatsApp (3 veces por semana) · Manilla de monitoreo (12 meses) · Videos psicoeducativos (Serie completa) · Técnicas guiadas (En audio) · Revisita del experto (Cada 2 semanas) · Cursos y cuentos (Asignado por la psicóloga) |
| P15 | Severo × Alta | 12 | Estado de ánimo (Diario) · Psicólogo clínico (Semanal) · Check-ins por WhatsApp (3 veces por semana) · Manilla de monitoreo (12 meses) · Videos psicoeducativos (Serie completa) · Técnicas guiadas (En audio) · Revisita del experto (Cada 2 semanas) · Cursos y cuentos (Asignado por la psicóloga) |

Los cambios frente a hoy son cinco: «Estado de ánimo» solo en Alta; cursos con el experto en Baja para Mínimo, Leve y Moderado; PM+ sale de Leve y entra en Moderado-severo; Leve gana revisita (cada 2 semanas en Baja, mensual en Media y Alta); y Moderado × Baja pasa a revisita cada 2 semanas. «Vinculación a ayudas sociales» sigue igual: se agrega sola si hay daño en la vivienda o pérdida de un familiar.

## Fase 1 · Cambios en el código

Son 6 cambios en 4 archivos de `nara-web/src`, más un registro de versión en `program_settings`. Las líneas citadas son de la copia del 7 oct 2026.

### 1. `lib/store/store.js` · rutas por perfil

Después de `cursosFreq` (línea 78), agregar:

```js
// v2: con capacidad Baja, Mínimo a Moderado llevan el curso con el experto.
const cursosMod = (r, d) => r >= 3 ? 'Asignado por la psicóloga' : d === 0 ? 'Curso con el experto' : cursosFreq(r);
```

Reemplazar `defaultPath` (línea 144) completa. `basePath` no cambia:

```js
function defaultPath(r, d) {
  const p = basePath(r, d);
  // v2: el check-in de ánimo en la app solo con capacidad Alta.
  if (d === 2) p.s.mood = 'Diario'; else delete p.s.mood;
  p.s.cursos = cursosMod(r, d);
  // v2: PM+ para Moderado y Moderado-severo (PHQ-9 ≥ 10).
  if (r === 2 || r === 3) p.s.pmplus = '5 sesiones semanales';
  // v2: Leve recibe revisita en vez de PM+; Leve y Moderado con capacidad Baja, cada 2 semanas.
  if (r === 1) p.s.revisit = d === 0 ? 'Cada 2 semanas' : 'Mensual';
  if (r === 2 && d === 0) p.s.revisit = 'Cada 2 semanas';
  if (d <= 1 && r <= 3) p.s.group = r >= 2 ? 'Quincenal' : 'Mensual';
  return p;
}
```

En `pathList` (líneas 193–194), dentro de `if (usingDefault)`:

```js
if (!p.s.cursos) p.s.cursos = cursosMod(r, d);
if (!p.s.mood && d === 2) p.s.mood = 'Diario';
```

En `REC.RULES` (línea 138), actualizar el texto de Mínimo y Leve: «guiado por TEO; con capacidad digital baja, con el experto». Si el estado guardado en Mongo (`app_state`) tiene una copia de `recursos.rules`, actualizarla también.

### 2. `modules/experto/hooks/useExpertoScreen.ts` · resultado y validación

Reemplazar `calcResult` (línea 219):

```ts
function calcResult() {
  const it = st.items;
  const phqT = it.phq.reduce((a, x) => a + (x.v || 0), 0);
  const digT = it.dig.reduce((a, x) => a + (x.v || 0), 0);
  // v2: sin teléfono ⇒ capacidad digital Baja, sin importar el puntaje.
  const sinTel = it.dig[0].v === 0;
  const r = store.riskIdx(phqT), d = sinTel ? 0 : store.digIdx(digT);
  const dNoHelp = sinTel ? 0 : store.digIdx(digT - (it.dig[5].v || 0));
  return { phqT, digT, r, d, dNoHelp, sinTel, code: store.code(r, d) };
}
```

En `calc` (línea 469), antes de `go('result')` cuando `allOk` y sin crisis:

```ts
if ((it.dig[2].v || 0) > (it.dig[0].v || 0)) return flash('«Uso diario» no puede ser mayor que «Teléfono». Revise la sección Capacidad digital.');
```

En `digNote` (línea 476), anteponer el caso sin teléfono: `res.sinTel ? 'Sin teléfono: la capacidad digital queda en Baja.' : …`.

En `cpVals` (línea 217), el subtítulo del curso: si `r <= 1 && res.d === 0`, mostrar «Con el experto, en la revisita» en vez de «Guiado por TEO».

### 3. `modules/admin/screens/adminModel.ts` · simulador de reglas

El simulador (líneas 119–123) solo recibe puntajes, así que no conoce el teléfono. Agregar una casilla «Sin teléfono» (`st.simNoPhone`) y usar `const di2 = st.simNoPhone ? 0 : Math.min(2, di)`.

### 4. `modules/admin/screens/adminConstants.ts` · texto del servicio

Línea 33, `mood`: «Check-in «¿Cómo se siente hoy?» en la app · solo en rutas con capacidad digital alta; en baja y media se pregunta en la llamada, la revisita o el WhatsApp».

### 5. `program_settings` · historial de versiones

Agregar a `rules.versions` del documento `key: "main"` una entrada visible en Rutas › Reglas › Historial de versiones. Sirve de evidencia para TRL:

```js
{ v: 2, by: 'Daniel Galvis', at: Date.parse('2026-10-08'), what: 'Matriz v2: sin teléfono ⇒ Baja; uso diario ≤ teléfono; ánimo en app solo con capacidad Alta; cursos con el experto en Baja; PM+ en Moderado y Moderado-severo; revisitas en Leve.' }
```

### 6. Módulos del paciente (`modulesEnabled`)

En la app del paciente, `modulesEnabled` manda sobre la ruta (`usePacienteScreen.ts`, línea 1776). Los 453 pacientes migrados tienen módulos fijos (`mood, ia, cursos, videos, tech, hist`) sin importar su perfil. Para los pacientes de prueba, no guardar `modulesEnabled`: así la app muestra la ruta v2.

## Seguimiento · Sin contacto e Inactivo

Decidido el 8 oct 2026: el contacto se mide por el canal de la capacidad digital de cada paciente, con una alerta a los 14 días y el paso automático a Inactivo después de 28. Hoy Inactivo es una marca manual y «Sin contacto» solo mira el login a 3 días.

| Capacidad digital | Qué cuenta como contacto |
| --- | --- |
| Alta | Ingreso a la app (login) |
| Media | Respuesta por WhatsApp |
| Baja | Llamada o revisita registrada por el experto |

| Días sin contacto | Qué pasa |
| --- | --- |
| 0 a 13 | Activo, sin alerta |
| 14 a 28 | Sigue Activo y aparece la alerta «Sin contacto» para que el experto lo busque (tarjeta «Sin contacto +14 días» del administrador y lista del experto) |
| Más de 28 | Pasa solo a Inactivo |
| Contacto nuevo | Vuelve solo a Activo y se apaga la alerta |

Cómo implementarlo:

1. Guardar por paciente `ultimoContacto` (fecha) y `canalContacto`. Lo actualizan: el login en Alta, la respuesta por WhatsApp en Media, y la llamada o revisita que registra el experto en Baja.
2. Calcular `diasSinContacto = hoy − ultimoContacto` al leer la ficha o en un proceso diario.
3. Aplicar los umbrales solo a pacientes en Activo o Inactivo. Crisis, Por aprobar, Aprobado, Rechazado y Sin evaluación no cambian por esta regla.
4. Guardar los umbrales (14 y 28) en `program_settings`, junto a las metas, para poder ajustarlos sin tocar código.

Si no alcanza para TRL, el mínimo aceptable es aplicar la regla solo a capacidad Alta (login a 28 días) y dejar Media y Baja sin paso automático a Inactivo. La regla por canal sigue siendo el diseño correcto.

Pruebas con los datos de prueba:

- [ ] Ana (P07, Baja, Bogotá), 18 días sin llamada: Activa y con la alerta «Sin contacto».
- [ ] Darly (P01, Baja, Bucaramanga), 35 días: Inactiva.
- [ ] Paula (P12, Alta, Floridablanca), ingresó a la app hace 1 día: Activa, sin alerta.
- [ ] Al registrar una llamada a Darly, vuelve a Activa y se apaga la alerta.

## Datos de prueba

Los datos para cargar ya siguen la matriz v2 y pasan la validación con 0 errores; coinciden con la interfaz solo cuando la Fase 1 esté desplegada. Dani comparte el zip NARA_datos_prueba_para_Lucho.zip, que se descomprime en la carpeta `datos_prueba`:

| Archivo | Qué tiene |
| --- | --- |
| `nara_datos_prueba.json` | 5 territorios (Bucaramanga, Floridablanca, Bogotá, Cali, Barranquilla), 36 usuarios (1 administrador, 5 expertos, 5 clínicos, 5 observadores y 20 pacientes); 20 pacientes: 15 evaluados, uno por perfil P01–P15, y 5 «Sin evaluación», uno por territorio; 13 activos (5 tablets y 8 manillas); y 1 cambio de ruta pendiente (CR-001, P08) para probar «Aprobaciones» de la líder clínica |
| `reglas_nara.js` | Las reglas v2 en JavaScript: la misma lógica que pide la Fase 1, útil para comparar |
| `validar.js` | Revisa relaciones, perfiles, rutas, estados, activos, metas de 9 y 45, alertas dirigidas al clínico del territorio, seguimiento (14 y 28 días) y cambios de ruta. Uso: `node validar.js` |
| `generar_excel.js` | Arma el Excel de carga solo si la validación pasa. `node generar_excel.js` saca el borrador; `node generar_excel.js --final`, la versión con contraseñas iniciales |
| `comparar_excel.js` | Comprueba que el Excel tiene cada dato del JSON, incluidos los IDs y el canal de cada servicio. Uso: `node comparar_excel.js` |
| `NARA_datos_prueba_borrador.xlsx` | Borrador para revisar, sin contraseñas: 13 hojas, entre ellas Usuarios, Pacientes, Flujo, Rutas y Mapeo Mongo |
| `README.md` | Los comandos y lo que hay que hacer antes de cargar |

Al cargar:

1. Limpiar primero la carga anterior de Cursor: 108 territorios, 109 expertos, 453 personas y 455 cuentas de paciente con correos reales de 2022.
2. Cargar en este orden: territorios → cuentas y `experts` → `people` y `patients` → `visits` y `consents` → `caseload` → `alerts` → `assets`.
3. No guardar `modulesEnabled` en los pacientes de prueba (punto 6 de la Fase 1).
4. Las relaciones van por ID: cada paciente tiene `territorio`, `expertoId` y `clinicoId`, y los tres deben coincidir con el territorio.
5. Las contraseñas iniciales no están en el JSON: se generan con el Excel de carga.
6. Los correos y teléfonos de los pacientes son ficticios a propósito, para que WhatsApp y el restablecimiento de contraseña no le escriban a personas reales.

Los 7 estados del flujo (Sin evaluación, Por aprobar, Aprobado, Rechazado, Activo, Inactivo, Crisis) van en `flujo.estado` de cada paciente. El campo en Mongo lo define Lucho al implementar el flujo de evaluación.

Pendiente con Edgar: Neil (BAR-SM124) está en Crisis sin ruta aprobada porque marcó la pregunta 9 en la entrevista, y Edgar definió Crisis como un estado posterior a la aprobación. Si no se acepta como excepción, Dani ajusta ese registro y la regla «pregunta 9 > 0 ⇒ Crisis».

## Pruebas de aceptación de la Fase 1

La Fase 1 está lista cuando las 8 pruebas pasan en el ambiente desplegado.

- [ ] **Rutas:** en Admin › Rutas › Servicios por perfil, los 15 perfiles muestran exactamente la tabla «Rutas v2 por perfil».
- [ ] **Sin teléfono:** respuestas digitales Ninguno · Estable · Solo llamadas · Cómoda · Sí · Sí (7 puntos) dan capacidad Baja, con la nota «Sin teléfono: la capacidad digital queda en Baja.»
- [ ] **Uso mayor que teléfono:** Compartido · Estable · Apps y videollamadas · Cómoda · Sí · No no deja calcular y muestra el aviso. Al cambiar el uso a «WhatsApp y audios», calcula Media (8 puntos).
- [ ] **Ayuda del familiar:** Compartido · Datos limitados · WhatsApp y audios · Básica · No · Sí (5 puntos) da Media, con «El apoyo de un familiar sube el nivel de Baja a Media.»
- [ ] **Simulador:** con la casilla «Sin teléfono» marcada, PHQ-9 17 y digital 9 dan P10 (Moderado-severo × Baja); sin marcarla, P12.
- [ ] **App del paciente:** un paciente con capacidad Media (Mariluz, P02) no ve la tarjeta de ánimo; uno con capacidad Alta y ruta aprobada (Paula, P12) sí la ve.
- [ ] **Historial:** Rutas › Reglas › Historial de versiones muestra la versión 2 del 8 oct 2026.
- [ ] **Datos:** `node validar.js` termina en «RESULTADO: COHERENTE» con 0 errores.

## Fase 2 · Pantallas nuevas

La Fase 2 agrega 3 piezas al formulario del experto y a la vista del clínico; empieza cuando la Fase 1 pase sus pruebas.

1. **Privacidad del teléfono.** Una séptima pregunta en «Capacidad digital», sin puntos: «¿Puede usar el teléfono a solas, sin que otros lean sus mensajes?» (No / Sí). Si la respuesta es No, la capacidad digital queda en Baja y la ruta usa llamada y revisita en vez de WhatsApp. Guardar el valor como `telefonoPrivado`; `reglas_nara.js` y el validador ya lo leen.
2. **Crisis en dos pasos.** La pregunta 9 mayor que 0 sigue enviando la alerta al clínico de turno de inmediato. Después, el experto aplica en la visita el tamizaje C-SSRS (6 preguntas, versión para personal no clínico):
   - **Aguda** (sí a método, intención, plan o conducta en los últimos 3 meses): el protocolo actual. El experto se queda y el clínico llama en menos de 30 minutos. `alerts.sev = 'aguda'`.
   - **Prioritaria** (solo deseo de morir o ideación sin método): el clínico llama en menos de 24 horas. `alerts.sev = 'prioritaria'`.
   - El paciente queda en estado Crisis en ambos casos. La vista del clínico ordena por urgencia: aguda en rojo, prioritaria en naranja.
   - Antes de construirlo, confirmar la versión oficial en español del C-SSRS, sus condiciones de uso y su esquema de triaje.
3. **Crisis manual.** Un botón «Activar protocolo de crisis» en la visita, para cuando la pregunta 9 es 0 pero el experto ve señales de riesgo. Un 0 no descarta el riesgo.
4. **Manuales y pruebas.** Actualizar los manuales 01 (R6, reglas y simulador), 02 (R4, R6, R7 y R9), 03 (alertas y aprobaciones) y 05 (ánimo solo en la app con capacidad Alta), y los casos de crisis de `pruebas/01_casos_funcionales_uat.md`.

Queda para una versión 3 medir el funcionamiento con WHODAS 2.0 (12 preguntas), que usan NICE y el manual de PM+.

## Fuentes

- [Kroenke, Spitzer y Williams (2001), validez del PHQ-9](https://jci.org/references/scholar/35175/B74): cortes 5, 10, 15 y 20.
- [Cassiani-Miranda y otros (2021), PHQ-9 en atención primaria de Bucaramanga](https://www.elsevier.es/en-revista-revista-colombiana-psiquiatria-english-edition--479-articulo-validity-patient-health-questionnaire-9-phq-9--S2530312021000254): corte ≥ 7 para caso probable.
- [NICE NG222, depresión en adultos](https://www.nice.org.uk/guidance/NG222/chapter/recommendations) y su [revisión de evidencia](https://www.ncbi.nlm.nih.gov/books/NBK583074/): menos o más grave según PHQ-9 de 16, atención ajustada a la gravedad.
- [OMS, manual de PM+ (19 nov 2025)](https://www.who.int/publications/i/item/9789240109926) y el [protocolo de Bahamas](https://clinicaltrials.gov/study/NCT07208851): inclusión con PHQ-9 ≥ 10 y exclusión por riesgo suicida inminente.
- [Pregunta 9 del PHQ-9 frente a C-SSRS](https://pmc.ncbi.nlm.nih.gov/articles/PMC8258235): valor predictivo positivo de 28,6 %.
- [Psychiatric Services, conducta suicida tras el tamizaje con PHQ-9](https://psychiatryonline.org/doi/full/10.1176/appi.ps.201500149): un 0 en la pregunta 9 no descarta el riesgo.
- [NCFH, herramienta de preparación para telesalud](https://www.ncfh.org/wp-content/uploads/2025/04/revised_2023_final_patient_telehealth_readiness_tool_1.10.2023.pdf): acceso al dispositivo, uso privado e internet antes que habilidades.
