# QUINTIA · Notas de desarrollo

## Arquitectura
- Cada pantalla es un `.dc.html` autónomo; `support.js` es el runtime.
- **Estado:** `store.js` (`window.AlientoStore`, clave `plateado-v1` en localStorage). Empieza con `if (window.AlientoStore) return;`. Se sincroniza entre pestañas con el evento `storage`.
- **IA:** `ai.js` (`window.AlientoAI.complete(texto, ctx)`). Primero revisa palabras clave de crisis (`detect`) y devuelve el **texto fijo**; solo si no hay crisis responde el motor local de frases. En producción, reemplazar el motor local por la función `/ai` del servidor, manteniendo la revisión de palabras clave antes.
- **Voz:** el audio de TEO usa `speechSynthesis` del navegador (es-CO, velocidad 0,85) como sustituto; en producción, audio generado en servidor y enviado como nota de voz de WhatsApp. Las notas de voz de la persona se transcriben en servidor; en el prototipo siguen un guion.
- **Marca de trabajo (provisional):** todo en `marca/plateado-tokens.css`, `marca/logo/plateado-logo.svg`, `marca/favicon.svg` y `marca/teo/` (4 emociones). Reemplazable sin tocar pantallas.
- `components.js` (UserMenu, AgentPanel, AdminNav del esqueleto base) no se usa en esta versión: cada pantalla trae su encabezado. Si se reincorporan, empaquetarlos ahí.

## Modelo clínico: PROVISIONAL Y CONFIGURABLE
Los instrumentos, cortes, perfiles PL01–PL08, rutas y el catálogo de 10 servicios son **contenido de muestra**. Un profesional de geriatría entregará los definitivos y se cargan en **Administración › Configuración del programa** (se guarda en `config` del store) sin cambiar el diseño. La interfaz no lo marca como provisional.
- Ánimo: escala geriátrica de 15 preguntas (ítems 1, 5, 7, 11 y 13 puntúan con «No»). Normal ≤4, Leve ≤8, Moderado-severo.
- Soledad: 3 preguntas (1–3 c/u). Baja ≤5, Alta.
- Memoria: 3 palabras + reloj. Solo deriva (agrega «Remisión a salud»), nunca diagnostica.
- Autonomía: 6 actividades + caídas. Independiente ≤1.
- Red de apoyo: sin cuidador o familiar de contacto = Sin red.
- Capacidad digital: 6 preguntas → canal Papel, Llamada, WhatsApp o App.
- Crisis: pregunta de ideación, siempre manual; >0 activa protocolo y alerta.
- Perfil = cruce ánimo (Normal / Leve o más) × soledad × autonomía.

## Crisis
Categorías: crisis (incluye indirecta: «soy una carga», «ya no sirvo para nada», «mejor no estar»), urgencia médica, abandono o maltrato, deterioro, inactividad. Crisis pausa la conversación, muestra texto fijo con 123 y Línea 192 opción 4, alerta a la clínica con meta de 30 minutos.

## Flujos
F1–F2 Gestor · F3, F11 Clínica · F4, F13 Administración · F5, F6 WhatsApp · F7, F9 Cuidadora · F8 avisos de inactividad (Gestor y Cuidadora) · F10 Plan impreso · F12 Observador.

## Pendiente
- Carpeta `propiedad-intelectual/` cuando se aprueben las pantallas.

## Tipografía
Atkinson Hyperlegible 400 y 700 en `marca/fuentes/` (subconjunto latino, OFL). Funciona sin internet.

## Ronda de correcciones 1
- **Sin internet:** React 18.3.1, ReactDOM 18.3.1 y Babel 7.29.0 van en `vendor/`; `support.js` los carga por ruta relativa (en el paquete entregado).
- **TEO sin rutas vacías:** las imágenes de TEO usan rutas fijas por estado.
- **Configuración del programa (F13):** ver y editar preguntas, opciones y puntajes de cada instrumento; agregar y quitar preguntas; cortes con campo de texto numérico; versión de la configuración (empieza en 0.1 y sube al guardar) y registro de cambios (quién, cuándo, qué); cargar y descargar la configuración en JSON. La pregunta de ideación y su corte (Sin riesgo ≤ 0) están **bloqueados**: cualquier respuesta mayor que 0 activa el protocolo. Los cambios solo aplican a evaluaciones nuevas.
- **Concordancia de género en TEO:** cada persona tiene `genero` y el motor local dice «solo» o «sola».
- **Inactividad:** el texto usa el plazo configurado (`config.inactividadHoras` = 48).
- **Cifras únicas:** `store.poblacion()` (personas con ficha + cohorte agregada de 348) y `store.actividad` alimentan administrador, informes y observador.
- Persona de muestra renombrada: Amparo Valencia.
- **Reglas de ruta** (`store.ajustarRuta`): sin cuidador no se propone «Orientación al cuidador» (se reemplaza por llamada o visita de acompañamiento); con alerta de abandono o maltrato abierta, «Ruta de protección» es obligatoria hasta que la clínica cierre la alerta.
- **Consentimiento:** 4 puntos con casilla (participar, datos según Ley 1581 de 2012, contacto si hay riesgo, contacto con el cuidador); el 4 es obligatorio si firma el cuidador. Firma con el dedo (con «Borrar») o con huella o a ruego (testigo).
- **Accesibilidad:** WhatsApp con espacio al final y desplazamiento automático al último mensaje; hora de los mensajes a 20 px. App: menú inferior a 20 px con íconos de casa, TEO y lista.

- WhatsApp: corregido un error de consola al abrir (desplazamiento automático). Encabezado de TEO vuelve a cambiar de cara según el estado.
- La hora de los mensajes de WhatsApp queda a 20 px.
- Verificado en esta ronda: crisis por nota de voz (pausa, texto fijo, 123, Línea 192 opción 4, alerta), crisis en campo (pregunta de ideación > 0), urgencia de la cuidadora, consentimiento con huella o a ruego, ruta con protección obligatoria y sin «Orientación al cuidador» cuando no hay red.
