// Valida la coherencia de nara_datos_prueba.json: conteos por rol, relaciones por territorio,
// perfiles recalculados con las reglas de la plataforma, estados, rutas, cursos y activos.
// Uso: node datos_prueba/validar.js [ruta.json]
const fs = require('fs');
const path = require('path');
const R = require('./reglas_nara.js');

const file = process.argv[2] || path.join(__dirname, 'nara_datos_prueba.json');
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
const { territorios = [], usuarios = [], pacientes = [], activos = [] } = data;
const HOY = new Date((data.meta && data.meta.fechaReferencia) || new Date().toISOString().slice(0, 10));
const errores = [], avisos = [];
const err = (donde, msg) => errores.push(`${donde}: ${msg}`);
const warn = (donde, msg) => avisos.push(`${donde}: ${msg}`);
// Metas de captación acordadas en la reunión del 8 oct 2026 (iguales para todo el equipo por ahora).
const META_DIA = 9, META_SEMANA = 45;
const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();
const vReglas = data.meta && data.meta.versionReglas;
if (vReglas !== R.VERSION_REGLAS) err('meta', `versionReglas = ${vReglas}, pero reglas_nara.js es la versión ${R.VERSION_REGLAS}`);
const dias = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);
const json = x => JSON.stringify(x);
// Servicios de una ruta, tolerante a rutas mal formadas (el JSON se edita a mano).
const srv = ruta => (ruta && Array.isArray(ruta.servicios)) ? ruta.servicios : [];

// ---------- Unicidad ----------
const dup = (arr, key, donde) => {
  const seen = new Map();
  arr.forEach(x => { const v = typeof key === 'function' ? key(x) : x[key]; if (v == null || v === '') return; if (seen.has(v)) err(donde, `«${v}» está repetido`); seen.set(v, 1); });
};
dup(usuarios, 'id', 'usuarios.id');
dup(usuarios, u => (u.correo || '').toLowerCase(), 'usuarios.correo');
dup(territorios, 'codigo', 'territorios.codigo');
dup(territorios, 'nombre', 'territorios.nombre');
dup(pacientes, 'id', 'pacientes.id');
dup(pacientes, 'codigo', 'pacientes.codigo');
dup(pacientes, 'idOriginal2022', 'pacientes.idOriginal2022');
dup(activos, 'codigo', 'activos.codigo');

const U = Object.fromEntries(usuarios.map(u => [u.id, u]));
const T = Object.fromEntries(territorios.map(t => [t.codigo, t]));
const PAC = Object.fromEntries(pacientes.map(p => [p.id, p]));

// ---------- Conteos por rol ----------
const ROLES = ['Administrador', 'Experto de campo', 'Clínico', 'Paciente', 'Observador'];
const cuenta = rol => usuarios.filter(u => u.rol === rol).length;
usuarios.forEach(u => { if (!ROLES.includes(u.rol)) err(`usuario ${u.id}`, `rol «${u.rol}» no existe (válidos: ${ROLES.join(', ')})`); });
if (cuenta('Administrador') !== 1) err('roles', `debe haber exactamente 1 Administrador; hay ${cuenta('Administrador')}`);
['Experto de campo', 'Clínico', 'Observador'].forEach(r => { if (cuenta(r) < 5) err('roles', `mínimo 5 «${r}»; hay ${cuenta(r)}`); });
if (cuenta('Paciente') < 15) err('roles', `mínimo 15 pacientes; hay ${cuenta('Paciente')}`);

// ---------- Territorios ----------
territorios.forEach(t => {
  const d = `territorio ${t.codigo}`;
  [['expertoId', 'Experto de campo'], ['clinicoId', 'Clínico'], ['observadorId', 'Observador']].forEach(([k, rol]) => {
    const u = U[t[k]];
    if (!u) return err(d, `${k} «${t[k]}» no existe en usuarios`);
    if (u.rol !== rol) err(d, `${k} «${u.nombre}» tiene rol ${u.rol}, no ${rol}`);
    if (u.territorio !== t.codigo) err(d, `${k} «${u.nombre}» está en el territorio ${u.territorio}`);
    const n = usuarios.filter(x => x.rol === rol && x.territorio === t.codigo).length;
    if (n !== 1) err(d, `debe tener exactamente 1 «${rol}»; tiene ${n}`);
  });
});
usuarios.filter(u => u.rol !== 'Administrador').forEach(u => { if (!T[u.territorio]) err(`usuario ${u.id}`, `territorio «${u.territorio}» no existe`); });
usuarios.filter(u => u.rol === 'Experto de campo').forEach(u => { if (!territorios.some(t => t.expertoId === u.id)) err(`usuario ${u.id}`, 'es experto pero ningún territorio lo tiene asignado'); });
usuarios.filter(u => u.rol === 'Clínico').forEach(u => { if (!territorios.some(t => t.clinicoId === u.id)) err(`usuario ${u.id}`, 'es clínico pero ningún territorio lo tiene asignado'); });
usuarios.filter(u => u.rol === 'Experto de campo').forEach(u => {
  if (u.metaDia !== META_DIA || u.metaSemana !== META_SEMANA) err(`usuario ${u.id}`, `metas ${u.metaDia}/${u.metaSemana}; lo acordado es ${META_DIA} por día y ${META_SEMANA} por semana`);
  if (u.tablet && !activos.some(a => a.codigo === u.tablet && a.asignadoA === u.id)) err(`usuario ${u.id}`, `dice tener la tablet ${u.tablet}, pero en activos no está asignada a él`);
});
// «Limpiar tabla de expertos: sin elementos repetidos» — nombres de personal únicos.
dup(usuarios.filter(u => u.rol !== 'Paciente'), u => norm(u.nombre), 'nombre del personal');
if (usuarios.filter(u => u.liderClinica).length !== 1) err('roles', `debe haber exactamente 1 líder clínica; hay ${usuarios.filter(u => u.liderClinica).length}`);

// ---------- Pacientes ----------
const perfiles = new Set();
pacientes.forEach(p => {
  const d = `paciente ${p.codigo || p.id} (${p.nombre})`;
  const t = T[p.territorio];
  if (!t) return err(d, `territorio «${p.territorio}» no existe`);

  // Relaciones
  if (p.expertoId !== t.expertoId) err(d, `expertoId «${p.expertoId}» no es el experto del territorio (${t.expertoId})`);
  if (p.clinicoId !== t.clinicoId) err(d, `clinicoId «${p.clinicoId}» no es el clínico del territorio (${t.clinicoId})`);
  const cta = U[p.cuentaId];
  if (!cta) err(d, `cuentaId «${p.cuentaId}» no existe en usuarios`);
  else {
    if (cta.rol !== 'Paciente') err(d, `la cuenta ${cta.id} no tiene rol Paciente`);
    if (cta.territorio !== p.territorio) err(d, `la cuenta está en ${cta.territorio} y el paciente en ${p.territorio}`);
    if (cta.nombre !== p.nombre) err(d, `el nombre de la cuenta («${cta.nombre}») no coincide`);
    if (cta.pacienteId !== p.id) err(d, `la cuenta apunta a pacienteId «${cta.pacienteId}»`);
  }
  if (!p.codigo || !p.codigo.startsWith(p.territorio + '-')) err(d, `el código debe empezar por ${p.territorio}-`);
  // Territorio real: el municipio de la base 2022 debe ser el del territorio asignado.
  if (p.municipioBase2022 && norm(p.municipioBase2022) !== norm(t.nombre)) err(d, `vive en «${p.municipioBase2022}» según la base 2022, pero está en el territorio ${t.nombre}`);
  if (!(p.edad >= 18)) err(d, `edad ${p.edad}: debe ser mayor de edad`);
  if (!p.nombre || !p.nombre.trim()) err(d, 'sin nombre');
  if (/@|\d/.test(p.nombre || '')) err(d, `el nombre «${p.nombre}» parece un usuario o correo`);

  const ev = p.evaluacion || {}, fl = p.flujo || {}, dc = fl.decisionClinica || {};
  if (!R.ESTADOS.includes(fl.estado)) err(d, `estado «${fl.estado}» no es uno de los 7 (${R.ESTADOS.join(', ')})`);
  // La cuenta del paciente queda lista para la app solo cuando el clínico aprueba su perfil y su ruta.
  if (cta && cta.perfilListo !== ((dc.decision || null) === 'Aprobado')) err(d, `la cuenta tiene perfilListo = ${cta.perfilListo}, pero la decisión clínica es «${dc.decision || 'ninguna'}»`);
  if (fl.estado === 'Sin evaluación') {
    // Edgar: la persona nace «Sin evaluación», asignada al experto de su territorio, sin perfil.
    ['evaluacion', 'resultado', 'ruta', 'curso', 'consentimiento', 'seguimiento'].forEach(k => { if (p[k]) err(d, `«Sin evaluación» no puede tener ${k}`); });
    if (fl.decisionClinica) err(d, '«Sin evaluación» no puede tener decisión clínica');
    if (fl.alertaCrisis) err(d, '«Sin evaluación» no puede tener alerta de crisis');
    if (!fl.visitaProgramada) warn(d, 'sin visita programada para la entrevista');
    else if (dias(HOY, fl.visitaProgramada) < 0) err(d, `la visita programada (${fl.visitaProgramada}) ya pasó y sigue sin evaluación`);
    return;
  }

  // Evaluación
  if (ev.expertoId !== p.expertoId) err(d, `la evaluación la hizo «${ev.expertoId}», no el experto del territorio`);
  if (!Array.isArray(ev.phq9) || ev.phq9.length !== 9 || ev.phq9.some(v => !Number.isInteger(v) || v < 0 || v > 3)) return err(d, `phq9 debe tener 9 respuestas de 0 a 3: ${json(ev.phq9)}`);
  if (!Array.isArray(ev.digital) || ev.digital.length !== 6 || ev.digital.slice(0, 5).some(v => !Number.isInteger(v) || v < 0 || v > 2) || ![0, 1].includes(ev.digital[5])) return err(d, `digital debe tener 5 respuestas de 0 a 2 y la última 0 o 1: ${json(ev.digital)}`);
  if (ev.duracionMin < 20) warn(d, `entrevista de ${ev.duracionMin} min: la plataforma la deja «En revisión · no cuenta aún»`);
  if (new Date(ev.fecha) > HOY) err(d, `fecha de evaluación ${ev.fecha} en el futuro`);

  // Coherencia de capacidad digital (regla v2: el formulario no deja guardar)
  if (!R.digitalCoherente(ev.digital)) err(d, `«Uso diario» (${R.DIGQ[2].o[ev.digital[2]]}) no puede superar a «Teléfono» (${R.DIGQ[0].o[ev.digital[0]]})`);

  // Resultado recalculado
  const res = R.resultado(ev.phq9, ev.digital, ev.telefonoPrivado);
  const pr = p.resultado || {};
  ['phqTotal', 'riesgo', 'digitalTotal', 'capacidadDigital', 'notaFamiliar', 'perfil'].forEach(k => { if (pr[k] !== res[k]) err(d, `resultado.${k} = ${json(pr[k])}, pero con las respuestas da ${json(res[k])}`); });
  perfiles.add(res.perfil);

  // Contexto del sismo
  const ctx = ev.contexto || {};
  const conSismo = (t.contenidoLocal || []).includes('Contexto del sismo');
  if (!conSismo && ((ctx.danoVivienda || 0) > 0 || (ctx.perdidaFamiliar || 0) > 0)) err(d, 'tiene contexto del sismo, pero su territorio no lo usa');

  // Crisis
  const q9 = ev.phq9[8];
  if (q9 > 0 && fl.estado !== 'Crisis') err(d, `pregunta 9 = ${q9}: el estado debe ser Crisis`);
  if (fl.estado === 'Crisis' && !(fl.alertaCrisis && fl.alertaCrisis.estado === 'Abierta')) err(d, 'estado Crisis sin alerta de crisis abierta');
  if (fl.alertaCrisis && fl.estado !== 'Crisis') warn(d, 'tiene alerta de crisis pero su estado no es Crisis');
  if (q9 > 0 && fl.alertaCrisis && !/pregunta 9/i.test(fl.alertaCrisis.origen || '')) warn(d, 'pregunta 9 > 0, pero el origen de la alerta no lo menciona');
  // «Que las notificaciones lleguen correctamente al clínico»: la alerta va al clínico del territorio.
  if (fl.alertaCrisis && fl.alertaCrisis.clinicoId !== p.clinicoId) err(d, `la alerta de crisis va a «${fl.alertaCrisis.clinicoId}», no al clínico del territorio (${p.clinicoId})`);
  // Edgar: Activo, Inactivo y Crisis son estados posteriores a la aprobación.
  if (fl.estado === 'Crisis' && dc.decision !== 'Aprobado') warn(d, 'está en Crisis sin ruta aprobada (crisis por la pregunta 9 en la visita). Edgar definió Crisis como estado posterior a la aprobación: decidir si se acepta esta excepción');

  // Estado vs decisión clínica
  const debe = { 'Por aprobar': ['Pendiente'], 'Aprobado': ['Aprobado'], 'Activo': ['Aprobado'], 'Inactivo': ['Aprobado'], 'Rechazado': ['Rechazado'], 'Crisis': ['Pendiente', 'Aprobado'] }[fl.estado];
  if (debe && !debe.includes(dc.decision)) err(d, `estado ${fl.estado} con decisión clínica «${dc.decision}»`);
  if (dc.decision !== 'Pendiente') {
    if (dc.clinicoId !== p.clinicoId) err(d, `decidió «${dc.clinicoId}», no el clínico del territorio`);
    if (!dc.fecha) err(d, 'decisión sin fecha');
    else if (dias(ev.fecha, dc.fecha) < 0) err(d, `decisión (${dc.fecha}) anterior a la evaluación (${ev.fecha})`);
  }
  if (dc.decision === 'Rechazado' && !dc.motivo) err(d, 'rechazo sin motivo');

  // Ruta y curso
  const rutaCalc = R.ruta(res.r, res.d, { dano: ctx.danoVivienda || 0, perdida: ctx.perdidaFamiliar || 0 });
  const rutaVista = fl.estado === 'Rechazado' ? p.rutaPropuesta : p.ruta;
  if (fl.estado === 'Rechazado' && p.ruta) err(d, 'rechazado: no debe tener ruta activa (va en rutaPropuesta)');
  if (!rutaVista) err(d, 'sin ruta');
  else if (json(rutaVista) !== json(rutaCalc)) err(d, `la ruta no es la que calcula la plataforma para ${res.perfil}`);
  const cur = R.curso(ev.phq9, p.edad, ctx);
  if (!p.curso || p.curso.id !== cur.id) err(d, `curso «${p.curso && p.curso.id}», la plataforma propone «${cur.id}»`);
  else if (p.curso.modalidad !== R.modalidadCurso(res.r, res.d) || p.curso.canal !== R.recChannel(res.d)) err(d, 'modalidad o canal del curso no coinciden con el perfil');

  // Consentimiento
  const cs = p.consentimiento || {};
  if (cs.obligatorios !== true) err(d, 'sin los 3 consentimientos obligatorios no puede haber evaluación');
  if (rutaVista && srv(rutaVista).some(x => x.id === 'bracelet') && !cs.manilla) err(d, 'la ruta incluye manilla y no autorizó manilla');
  if (rutaVista && srv(rutaVista).some(x => ['wa', 'call'].includes(x.id)) && !cs.contacto) err(d, 'la ruta incluye WhatsApp o llamadas y no autorizó contacto');

  // Seguimiento
  const sg = p.seguimiento;
  if (['Activo', 'Inactivo'].includes(fl.estado) && !sg) err(d, `estado ${fl.estado} sin seguimiento`);
  if (['Por aprobar', 'Aprobado', 'Rechazado'].includes(fl.estado) && sg) warn(d, `estado ${fl.estado} con seguimiento: aún no debería haber contactos de la ruta`);
  if (sg) {
    // Seguimiento: 14 días sin contacto = alerta «Sin contacto»; más de 28 = Inactivo; contacto nuevo = Activo.
    const sin = dias(sg.ultimoContacto, HOY);
    if (fl.estado === 'Activo' && sin > R.UMBRAL_INACTIVO) err(d, `Activo pero lleva ${sin} días sin contacto (más de ${R.UMBRAL_INACTIVO} = Inactivo)`);
    if (fl.estado === 'Inactivo' && sin <= R.UMBRAL_INACTIVO) err(d, `Inactivo pero tuvo contacto hace ${sin} días: debería volver a Activo`);
    if (sg.sinContacto !== (sin >= R.UMBRAL_SIN_CONTACTO)) err(d, `sinContacto = ${sg.sinContacto}, pero lleva ${sin} días sin contacto (alerta desde ${R.UMBRAL_SIN_CONTACTO})`);
    // El contacto se mide por el canal de su capacidad digital.
    if (!R.canalMideContacto(res.d, sg.canal)) err(d, `con capacidad ${res.capacidadDigital} el contacto se mide por «${R.CANAL_MEDICION[res.d]}», no por «${sg.canal}»`);
    if (dc.fecha && dias(dc.fecha, sg.ultimoContacto) < 0) err(d, 'último contacto anterior a la aprobación de la ruta');
    if (rutaVista && /WhatsApp/.test(sg.canal) && !srv(rutaVista).some(x => x.id === 'wa')) err(d, `último contacto por WhatsApp, pero su ruta no tiene WhatsApp`);
    if (rutaVista && /Llamada/.test(sg.canal) && !srv(rutaVista).some(x => x.id === 'call')) err(d, `último contacto por llamada, pero su ruta no tiene llamadas`);
    if (rutaVista && /Revisita/.test(sg.canal) && !srv(rutaVista).some(x => x.id === 'revisit')) err(d, `último contacto por revisita, pero su ruta no tiene revisitas`);
  }
});
for (let i = 1; i <= 15; i++) { const c = 'P' + String(i).padStart(2, '0'); if (!perfiles.has(c)) err('perfiles', `falta un paciente con perfil ${c}`); }

// ---------- La matriz misma: más riesgo, más intensidad ----------
// Con la misma capacidad digital, subir de riesgo nunca baja la duración de la ruta ni la frecuencia del psicólogo.
const RANGO_CLIN = { undefined: 0, Mensual: 1, Quincenal: 2, Semanal: 3 };
for (let dd = 0; dd < 3; dd++) for (let rr = 1; rr < 5; rr++) {
  const a = R.ruta(rr - 1, dd, {}), b = R.ruta(rr, dd, {});
  const ca = (a.servicios.find(x => x.id === 'clin') || {}).frecuencia, cb = (b.servicios.find(x => x.id === 'clin') || {}).frecuencia;
  if (b.duracionMeses < a.duracionMeses) err('matriz', `${R.code(rr, dd)} dura menos que ${R.code(rr - 1, dd)}`);
  if (RANGO_CLIN[cb] < RANGO_CLIN[ca]) err('matriz', `${R.code(rr, dd)} tiene menos psicólogo que ${R.code(rr - 1, dd)}`);
}

// ---------- Activos ----------
activos.forEach(a => {
  const d = `activo ${a.codigo}`;
  const due = U[a.asignadoA] || PAC[a.asignadoA];
  if (!due) return err(d, `asignado a «${a.asignadoA}», que no existe`);
  const terr = due.territorio;
  if (terr !== a.territorio) err(d, `está en ${a.territorio} pero su dueño está en ${terr}`);
  if (a.tipo === 'Tablet' && !(U[a.asignadoA] && U[a.asignadoA].rol === 'Experto de campo')) err(d, 'una tablet debe estar asignada a un experto de campo');
  if (a.tipo === 'Manilla') {
    const p = PAC[a.asignadoA];
    if (!p) return err(d, 'una manilla debe estar asignada a un paciente');
    if (!(srv(p.ruta).some(x => x.id === 'bracelet'))) err(d, `${p.nombre} no tiene manilla en su ruta`);
    if (a.estado === 'Asignada' && ((p.flujo || {}).decisionClinica || {}).decision !== 'Aprobado') err(d, `entregada a ${p.nombre}, cuya ruta no está aprobada`);
  }
});
usuarios.filter(u => u.rol === 'Experto de campo').forEach(u => { if (!activos.some(a => a.tipo === 'Tablet' && a.asignadoA === u.id)) warn(`usuario ${u.id}`, 'experto sin tablet'); });
pacientes.filter(p => srv(p.ruta).some(x => x.id === 'bracelet')).forEach(p => { if (!activos.some(a => a.tipo === 'Manilla' && a.asignadoA === p.id)) warn(`paciente ${p.codigo}`, 'su ruta incluye manilla y no tiene una asignada ni reservada'); });

// ---------- Cobertura para pruebas ----------
territorios.forEach(t => {
  const mine = pacientes.filter(p => p.territorio === t.codigo);
  if (!mine.some(p => (p.flujo || {}).estado === 'Por aprobar')) warn(`territorio ${t.codigo}`, 'el clínico no tiene ningún paciente por aprobar');
  const ds = new Set(mine.filter(p => p.resultado).map(p => p.resultado.capacidadDigital));
  if (ds.size < 3 && mine.length >= 3) warn(`territorio ${t.codigo}`, `solo tiene capacidad digital ${[...ds].join(', ')}`);
});
R.ESTADOS.forEach(e => { if (!pacientes.some(p => (p.flujo || {}).estado === e)) warn('estados', `ningún paciente en «${e}»`); });
territorios.forEach(t => { if (!pacientes.some(p => p.territorio === t.codigo && (p.flujo || {}).estado === 'Sin evaluación')) warn(`territorio ${t.codigo}`, 'el experto no tiene a nadie sin evaluar para la prueba de entrevista'); });
// Que se puedan probar los tres canales de medición y el escalón «Sin contacto».
const conSeg = pacientes.filter(p => p.seguimiento && p.resultado);
[0, 1, 2].forEach(dd => { if (!conSeg.some(p => R.canalMideContacto(dd, p.seguimiento.canal) && p.resultado.capacidadDigital === R.DIG[dd].k)) warn('seguimiento', `nadie con capacidad ${R.DIG[dd].k} tiene contacto registrado por «${R.CANAL_MEDICION[dd]}»`); });
if (!conSeg.some(p => p.flujo.estado === 'Activo' && p.seguimiento.sinContacto)) warn('seguimiento', `ningún Activo con la alerta «Sin contacto» (${R.UMBRAL_SIN_CONTACTO} a ${R.UMBRAL_INACTIVO} días)`);

// ---------- Cambios de ruta (Aprobaciones de la líder clínica) ----------
// Edgar: el administrador propone, la líder clínica aprueba o rechaza; si rechaza, vuelve la ruta anterior.
const solicitudes = data.solicitudesCambioRuta || [];
dup(solicitudes, 'id', 'solicitudesCambioRuta.id');
solicitudes.forEach(s => {
  const d = `cambio de ruta ${s.id}`;
  if (!/^P(0[1-9]|1[0-5])$/.test(s.perfil || '')) return err(d, `perfil «${s.perfil}» no existe`);
  const { r, d: dg } = R.parseCode(s.perfil);
  const vigente = R.ruta(r, dg, {});
  if (!['Pendiente', 'Aprobado', 'Rechazado'].includes(s.estado)) err(d, `estado «${s.estado}» no válido`);
  if (!(U[s.solicitadoPorId] && U[s.solicitadoPorId].rol === 'Administrador')) err(d, 'lo debe enviar el administrador');
  if (!(U[s.revisorId] && U[s.revisorId].liderClinica)) err(d, 'lo debe revisar la líder clínica');
  if (json(s.rutaActual) !== json(vigente)) err(d, `rutaActual no es la ruta vigente de ${s.perfil}`);
  if (json(s.rutaPropuesta) === json(s.rutaActual)) err(d, 'la ruta propuesta es igual a la actual');
  // Los cambios listados deben ser exactamente las diferencias entre la ruta actual y la propuesta.
  const fa = Object.fromEntries(srv(s.rutaActual).map(x => [x.servicio, x.frecuencia]));
  const fp = Object.fromEntries(srv(s.rutaPropuesta).map(x => [x.servicio, x.frecuencia]));
  const reales = [...new Set([...Object.keys(fa), ...Object.keys(fp)])].filter(k => fa[k] !== fp[k]).map(k => `${k}:${fa[k] || '—'}→${fp[k] || '—'}`).sort();
  const listados = (s.cambios || []).map(c => `${c.servicio}:${c.de || '—'}→${c.a || '—'}`).sort();
  if (json(reales) !== json(listados)) err(d, `los cambios listados (${listados.join('; ')}) no son las diferencias reales (${reales.join('; ')})`);
  // Mientras está pendiente o si se rechaza, los pacientes del perfil siguen con la ruta actual.
  if (s.estado !== 'Aprobado') pacientes.filter(p => p.resultado && p.resultado.perfil === s.perfil && p.ruta).forEach(p => {
    if (json(p.ruta) !== json(s.rutaActual)) err(d, `${p.nombre} ya tiene la ruta propuesta, pero el cambio está ${s.estado.toLowerCase()}`);
  });
});
if (!solicitudes.some(s => s.estado === 'Pendiente')) warn('aprobaciones', 'no hay ningún cambio de ruta pendiente para probar «Aprobaciones» de la líder clínica');

// ---------- Reporte ----------
console.log(`\nValidación de ${path.basename(file)} · referencia ${HOY.toISOString().slice(0, 10)}`);
console.log(`Usuarios: ${ROLES.map(r => `${r} ${cuenta(r)}`).join(' · ')}`);
console.log('\nTerritorio      Experto                          Clínico                              Observador                       Pacientes');
territorios.forEach(t => {
  const mine = pacientes.filter(p => p.territorio === t.codigo);
  const nm = id => (U[id] ? U[id].nombre : '¿' + id + '?');
  console.log(`${t.nombre.padEnd(15)} ${nm(t.expertoId).padEnd(32)} ${nm(t.clinicoId).padEnd(36)} ${nm(t.observadorId).padEnd(32)} ${mine.map(p => `${p.resultado ? p.resultado.perfil : '—'} ${(p.flujo || {}).estado}`).join(' | ')}`);
});
const porEstado = R.ESTADOS.map(e => `${e} ${pacientes.filter(p => (p.flujo || {}).estado === e).length}`).join(' · ');
console.log(`\nEstados: ${porEstado}`);
console.log(`Perfiles cubiertos: ${perfiles.size}/15`);
console.log(`\nErrores (${errores.length})`);
errores.forEach(e => console.log('  ✗ ' + e));
console.log(`Avisos (${avisos.length})`);
avisos.forEach(a => console.log('  ! ' + a));
console.log(errores.length ? '\nRESULTADO: HAY ERRORES' : '\nRESULTADO: COHERENTE' + (avisos.length ? ' (con avisos)' : ''));
process.exit(errores.length ? 1 : 0);
