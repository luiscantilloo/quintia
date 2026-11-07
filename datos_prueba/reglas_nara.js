// Reglas de clasificación y rutas de NARA · versión 2 (matriz definitiva aprobada el 8 oct 2026).
// Base: repo_src/nara-web/src/lib/store/store.js (RISK, DIG, basePath, defaultPath, pathList, courseFor)
// y useExpertoScreen.ts (calcResult). La v2 cambia: regla «sin teléfono ⇒ Baja», «uso diario ≤ teléfono»,
// ánimo en app solo con capacidad Alta, cursos con el experto en Baja, PM+ en Moderado y Moderado-severo,
// y revisitas en Leve. La especificación para la plataforma está en el documento de specs para Lucho.
const VERSION_REGLAS = 2;

const RISK = [
  { k: 'Mínimo', min: 0, max: 4 },
  { k: 'Leve', min: 5, max: 9 },
  { k: 'Moderado', min: 10, max: 14 },
  { k: 'Moderado-severo', min: 15, max: 19 },
  { k: 'Severo', min: 20, max: 27 },
];
const DIG = [{ k: 'Baja', min: 0, max: 4 }, { k: 'Media', min: 5, max: 8 }, { k: 'Alta', min: 9, max: 11 }];
const riskIdx = t => RISK.findIndex(r => t >= r.min && t <= r.max);
const digIdx = t => DIG.findIndex(r => t >= r.min && t <= r.max);
const code = (r, d) => 'P' + String(r * 3 + d + 1).padStart(2, '0');
const parseCode = p => { const n = parseInt(p.slice(1), 10) - 1; return { r: Math.floor(n / 3), d: n % 3 }; };

const PHQ = ['Poco interés o placer en hacer las cosas', 'Se ha sentido decaído/a, deprimido/a o sin esperanza', 'Dificultad para dormir o dormir demasiado', 'Se ha sentido cansado/a o con poca energía', 'Poco apetito o come en exceso', 'Se ha sentido mal consigo mismo/a, o una carga para su familia', 'Dificultad para concentrarse', 'Se mueve o habla muy lento, o está muy inquieto/a', 'Pensamientos de que estaría mejor muerto/a o de hacerse daño'];
const PHQ_OPTS = ['Nunca', 'Varios días', 'Más de la mitad de los días', 'Casi todos los días'];
const DIGQ = [
  { q: 'Teléfono', o: ['Ninguno', 'Compartido', 'Smartphone propio'] },
  { q: 'Conexión en casa', o: ['Sin señal', 'Datos limitados', 'Estable'] },
  { q: 'Uso diario', o: ['Solo llamadas', 'WhatsApp y audios', 'Apps y videollamadas'] },
  { q: 'Lectura y escritura', o: ['Prefiere voz', 'Básica', 'Cómoda'] },
  { q: '¿Hablaría con una app?', o: ['No', 'Tal vez', 'Sí'] },
  { q: 'Alguien en casa le ayuda con el celular', o: ['No', 'Sí'] },
];
const SERVICES = [
  { id: 'mood', name: 'Estado de ánimo' }, { id: 'clin', name: 'Psicólogo clínico' }, { id: 'ia', name: 'Acompañante con IA (TEO)' },
  { id: 'wa', name: 'Check-ins por WhatsApp' }, { id: 'call', name: 'Llamada de seguimiento' }, { id: 'bracelet', name: 'Manilla de monitoreo' },
  { id: 'videos', name: 'Videos psicoeducativos' }, { id: 'tech', name: 'Técnicas guiadas' }, { id: 'revisit', name: 'Revisita del experto' },
  { id: 'pmplus', name: 'Problem Management Plus (PM+)' }, { id: 'group', name: 'Grupo de apoyo en la vereda' },
  { id: 'social', name: 'Vinculación a ayudas sociales' }, { id: 'cursos', name: 'Cursos y cuentos' },
];
const CLIN_CH = ['En persona', 'Por teléfono', 'Videollamada o teléfono'];
const cursosFreq = r => r <= 1 ? 'Curso guiado por TEO' : r === 2 ? 'Curso con el experto' : 'Asignado por la psicóloga';
// v2: con capacidad Baja, Mínimo a Moderado llevan el curso con el experto (no usan la app ni TEO).
const modalidadCurso = (r, d) => r >= 3 ? 'Asignado por la psicóloga' : d === 0 ? 'Curso con el experto' : cursosFreq(r);
const recChannel = d => d === 2 ? 'App · leer y escuchar' : d === 1 ? 'WhatsApp · portada, audio y pregunta' : 'Cuadernillo impreso · audio en la visita';
const CURSOS = {
  dormir: { titulo: 'Dormir mejor después del sismo', semanas: 4 },
  calma: { titulo: 'Calma cuando tiembla', semanas: 4 },
  perdimos: { titulo: 'Lo que perdimos', semanas: 4 },
  animo: { titulo: 'Ánimo, paso a paso', semanas: 4 },
  familia: { titulo: 'En familia', semanas: 4 },
  mayores: { titulo: 'La sabiduría de los mayores', semanas: 3 },
};
// Los 7 estados acordados en la reunión del 8 oct 2026.
const ESTADOS = ['Sin evaluación', 'Por aprobar', 'Aprobado', 'Rechazado', 'Activo', 'Inactivo', 'Crisis'];
// Seguimiento (decidido el 8 oct 2026): el contacto se mide por el canal de la capacidad digital.
// A los 14 días sin contacto sale la alerta «Sin contacto» (sigue Activo); a más de 28 pasa a Inactivo.
// Con un contacto nuevo vuelve solo a Activo.
const UMBRAL_SIN_CONTACTO = 14, UMBRAL_INACTIVO = 28;
const CANAL_MEDICION = ['Llamada o revisita', 'WhatsApp', 'Ingreso a la app'];
const CANAL_RX = [/llamada|revisita/i, /whatsapp/i, /ingreso a la app/i];
const canalMideContacto = (d, canal) => CANAL_RX[d].test(canal || '');

function courseFor(x) {
  const phq = x.phq || [], age = x.age || 0, ctx = x.ctx || {};
  if ((phq[2] || 0) >= 2) return { id: 'dormir', motivo: 'porque duerme mal desde el sismo' };
  if (ctx.perdida > 0) return { id: 'perdimos', motivo: 'porque perdió a un familiar en el sismo' };
  if ((phq[0] || 0) >= 2 && (phq[1] || 0) >= 2) return { id: 'animo', motivo: 'porque tiene el ánimo bajo' };
  if (age >= 60) return { id: 'mayores', motivo: 'porque tiene 60 años o más' };
  return { id: 'calma', motivo: 'para manejar el miedo y el estrés' };
}
function basePath(r, d) {
  const s = { mood: 'Diario' };
  const on = (id, freq) => { s[id] = freq; };
  if (r <= 1) {
    if (d === 0) { on('call', 'Mensual'); on('tech', 'Material impreso'); on('revisit', 'Mensual'); }
    if (d === 1) { on('wa', '1 vez por semana'); on('videos', 'Serie completa'); on('tech', 'En audio'); }
    if (d === 2) { on('ia', 'Acceso libre'); on('wa', '1 vez por semana'); on('videos', 'Serie completa'); on('tech', 'En audio'); }
    return { s, months: 3 };
  }
  if (r === 2) {
    on('clin', 'Mensual'); on('bracelet', '6 meses');
    if (d === 0) { on('call', 'Semanal'); on('tech', 'Material impreso'); on('revisit', 'Mensual'); }
    if (d === 1) { on('wa', '3 veces por semana'); on('videos', 'Serie completa'); on('tech', 'En audio'); }
    if (d === 2) { on('ia', 'Entre sesiones'); on('wa', '3 veces por semana'); on('videos', 'Serie completa'); on('tech', 'En audio'); }
    return { s, months: 6 };
  }
  on('clin', r === 3 ? 'Quincenal' : 'Semanal'); on('bracelet', '12 meses'); on('revisit', 'Cada 2 semanas');
  if (d === 0) { on('call', 'Semanal'); on('tech', 'Material impreso'); }
  if (d >= 1) { on('wa', '3 veces por semana'); on('videos', 'Serie completa'); on('tech', 'En audio'); }
  if (r === 3 && d === 2) on('ia', 'Entre sesiones');
  return { s, months: 12 };
}
function defaultPath(r, d) {
  const p = basePath(r, d);
  // v2: el check-in de ánimo en la app solo aplica a capacidad Alta; en Baja y Media
  // el ánimo se pregunta en la llamada, la revisita o el check-in por WhatsApp.
  if (d === 2) p.s.mood = 'Diario'; else delete p.s.mood;
  p.s.cursos = modalidadCurso(r, d);
  // v2: PM+ para PHQ-9 ≥ 10 sin riesgo inminente (Moderado y Moderado-severo).
  if (r === 2 || r === 3) p.s.pmplus = '5 sesiones semanales';
  // v2: Leve recibe contacto humano en vez de PM+; en Baja, Leve y Moderado se revisitan cada 2 semanas.
  if (r === 1) p.s.revisit = d === 0 ? 'Cada 2 semanas' : 'Mensual';
  if (r === 2 && d === 0) p.s.revisit = 'Cada 2 semanas';
  if (d <= 1 && r <= 3) p.s.group = r >= 2 ? 'Quincenal' : 'Mensual';
  return p;
}
const needsSocial = ctx => !!ctx && ((ctx.dano || 0) > 0 || (ctx.perdida || 0) > 0);
// Ruta por defecto del perfil, en el formato del JSON.
function ruta(r, d, ctx) {
  const p0 = defaultPath(r, d);
  const s = Object.assign({}, p0.s);
  delete s.social;
  if (needsSocial(ctx)) s.social = 'Según el caso';
  return {
    duracionMeses: p0.months,
    servicios: SERVICES.filter(x => s[x.id]).map(x => ({
      id: x.id, servicio: x.name, frecuencia: s[x.id],
      canal: x.id === 'mood' ? 'App · check-in diario' : x.id === 'clin' ? CLIN_CH[d] : x.id === 'wa' ? 'Audio primero' : x.id === 'ia' ? 'App' : x.id === 'call' ? 'Teléfono' : x.id === 'revisit' ? 'Visita en casa' : x.id === 'bracelet' ? 'Sueño y ritmo cardiaco' : x.id === 'pmplus' ? 'En casa · experto capacitado' : x.id === 'group' ? 'En la vereda · con facilitador' : x.id === 'cursos' ? recChannel(d) : x.id === 'social' ? (ctx && ctx.dano === 2 ? 'Vivienda y reconstrucción' : ctx && ctx.dano === 1 ? 'Reparación de vivienda' : 'Apoyo por pérdida familiar') : '',
    })),
  };
}
// v2: sin teléfono la capacidad digital es Baja, sin importar el puntaje.
// Fase 2: si la persona no puede usar el teléfono a solas (telefonoPrivado === false), se atiende como Baja.
const nivelDigital = (digital, total, telefonoPrivado) => (digital[0] === 0 || telefonoPrivado === false) ? 0 : digIdx(total);
// v2: «Uso diario» (pregunta 3) no puede ser mayor que «Teléfono» (pregunta 1).
const digitalCoherente = digital => (digital[2] || 0) <= (digital[0] || 0);
// Resultado de la evaluación, igual que calcResult() del experto (v2).
function resultado(phq9, digital, telefonoPrivado) {
  const phqTotal = phq9.reduce((a, x) => a + (x || 0), 0);
  const digitalTotal = digital.reduce((a, x) => a + (x || 0), 0);
  const r = riskIdx(phqTotal), d = nivelDigital(digital, digitalTotal, telefonoPrivado);
  const dSinAyuda = nivelDigital(digital, digitalTotal - (digital[5] || 0), telefonoPrivado);
  return {
    r, d,
    phqTotal, riesgo: RISK[r].k, digitalTotal, capacidadDigital: DIG[d].k,
    notaFamiliar: digital[0] === 0 ? 'Sin teléfono: la capacidad digital queda en Baja.'
      : dSinAyuda < d ? `El apoyo de un familiar sube el nivel de ${DIG[dSinAyuda].k} a ${DIG[d].k}.`
      : (digital[5] ? 'Tiene apoyo de un familiar con el celular.' : ''),
    perfil: code(r, d),
  };
}
function curso(phq9, edad, ctx) {
  const c = courseFor({ phq: phq9, age: edad, ctx: { perdida: ctx.perdidaFamiliar || 0 } });
  return { id: c.id, titulo: CURSOS[c.id].titulo, semanas: CURSOS[c.id].semanas, motivo: c.motivo };
}

module.exports = { VERSION_REGLAS, RISK, DIG, riskIdx, digIdx, code, parseCode, PHQ, PHQ_OPTS, DIGQ, SERVICES, ESTADOS, CURSOS,
  UMBRAL_SIN_CONTACTO, UMBRAL_INACTIVO, CANAL_MEDICION, canalMideContacto, cursosFreq, modalidadCurso, recChannel, ruta, resultado, curso, nivelDigital, digitalCoherente };
