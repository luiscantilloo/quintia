// Genera el Excel de carga de NARA a partir de nara_datos_prueba.json.
// Antes de generar corre validar.js: si hay errores, no genera nada.
// Uso:
//   node generar_excel.js            → NARA_datos_prueba_borrador.xlsx (sin contraseñas, para revisar)
//   node generar_excel.js --final    → NARA_datos_prueba_final.xlsx (con contraseñas iniciales, para cargar)
//   --salida=<ruta.xlsx>             → otra ruta de salida (por ejemplo, si el archivo está abierto en Excel)
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const ExcelJS = require('exceljs');
const R = require('./reglas_nara.js');

const FINAL = process.argv.includes('--final');
const JSON_PATH = path.join(__dirname, 'nara_datos_prueba.json');
const salidaArg = process.argv.find(a => a.startsWith('--salida='));
const OUT = salidaArg ? path.resolve(salidaArg.slice('--salida='.length)) : path.join(__dirname, FINAL ? 'NARA_datos_prueba_final.xlsx' : 'NARA_datos_prueba_borrador.xlsx');

// ---------- 1. Validar primero ----------
let reporte;
try {
  reporte = execFileSync(process.execPath, [path.join(__dirname, 'validar.js'), JSON_PATH], { encoding: 'utf8' });
} catch (e) {
  console.error((e.stdout || '') + '\nNo se genera el Excel: el JSON tiene errores de coherencia.');
  process.exit(1);
}
const avisos = reporte.split('\n').filter(l => l.trim().startsWith('!')).map(l => l.trim().replace(/^!\s*/, ''));

const data = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
const { meta, territorios, usuarios, pacientes, activos, solicitudesCambioRuta = [] } = data;
const U = Object.fromEntries(usuarios.map(u => [u.id, u]));
const T = Object.fromEntries(territorios.map(t => [t.codigo, t]));
const P = Object.fromEntries(pacientes.map(p => [p.id, p]));
const nombre = id => (U[id] || P[id] || {}).nombre || '';
const [ry, rm, rd] = meta.fechaReferencia.split('-').map(Number);
const HOY_XL = `DATE(${ry},${rm},${rd})`;
// Fechas a medianoche (o a la hora indicada) en UTC: Excel las muestra tal cual y las restas dan días enteros.
const D = s => (s ? new Date(s.length > 10 ? s + ':00Z' : s + 'T00:00:00Z') : null);
const rutaTxt = r => (r ? r.servicios.map(x => `${x.servicio} (${x.frecuencia})`).join(' · ') : '');

// Contraseñas solo en la versión final. Cambian cada vez que se genera.
const ALPH = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
const pwd = () => Array.from(crypto.randomBytes(10), b => ALPH[b % ALPH.length]).join('') + '#' + (10 + crypto.randomInt(90));

// ---------- Estilos ----------
const INK = 'FF161413', YEL = 'FFFDCD22', MIST = 'FFF0ECE6';
const RISK_BG = ['FFDCEDE2', 'FFEEF2DF', 'FFF9EBC8', 'FFF7E2D2', 'FFEFDCDA'];
const ESTADO_BG = { 'Sin evaluación': 'FFFFFFFF', 'Por aprobar': 'FFF9EBC8', 'Aprobado': 'FFE6E1D9', 'Activo': 'FFD8FBE3', 'Inactivo': MIST, 'Rechazado': 'FFF7E2D2', 'Crisis': 'FFFDE7E4' };
const ROL_BG = { 'Administrador': 'FFE6E1D9', 'Experto de campo': 'FFD8FBE3', 'Clínico': 'FFFFE3F1', 'Observador': 'FFE8EEF9', 'Paciente': MIST };
const hdr = c => { c.font = { bold: true, color: { argb: 'FFFFFFFF' } }; c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: INK } }; c.alignment = { vertical: 'middle', wrapText: true }; };
const fill = (c, argb) => { c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb } }; };
const colL = n => { let s = ''; while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); } return s; };
const f = (formula, result) => ({ formula, result });

const wb = new ExcelJS.Workbook();
wb.creator = 'Polaria · Daniel Galvis';
wb.created = new Date();

function tabla(ws, cols, rows, opts = {}) {
  ws.columns = cols.map(c => ({ header: c.h, key: c.k, width: c.w || 14 }));
  const hr = ws.getRow(1); hr.height = opts.alto || 32; hr.eachCell(hdr);
  rows.forEach(r => ws.addRow(r));
  ws.views = [{ state: 'frozen', ySplit: 1, xSplit: opts.fijas || 0 }];
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: cols.length } };
  cols.forEach((c, i) => {
    if (c.fmt) ws.getColumn(i + 1).numFmt = c.fmt;
    if (c.wrap) ws.getColumn(i + 1).alignment = { wrapText: true, vertical: 'top' };
  });
  return Object.fromEntries(cols.map((c, i) => [c.k, colL(i + 1)]));
}
function colorOk(ws, ref) {
  ws.addConditionalFormatting({ ref, rules: [
    { type: 'containsText', operator: 'containsText', text: 'REVISAR', style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFFDE7E4' } }, font: { color: { argb: 'FFB42318' }, bold: true } } },
    { type: 'containsText', operator: 'containsText', text: 'OK', style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFD8FBE3' } }, font: { color: { argb: 'FF1E6B3A' } } } },
  ] });
}
function textoLargo(ws, lineas, ancho = 120) {
  ws.getColumn(1).width = ancho;
  lineas.forEach(([t, k]) => {
    const c = ws.addRow([t]).getCell(1);
    c.alignment = { wrapText: true, vertical: 'top' };
    if (k === 'titulo') c.font = { bold: true, size: 16 };
    if (k === 'h') { c.font = { bold: true, size: 12 }; fill(c, YEL); }
    if (k === 'aviso') c.font = { color: { argb: 'FFB42318' } };
  });
}

const evaluados = pacientes.filter(p => p.resultado);
const cuenta = (arr, fn) => arr.filter(fn).length;

// ---------- Léame ----------
textoLargo(wb.addWorksheet('Léame'), [
  [`NARA · Datos de prueba · ${FINAL ? 'versión final para cargar' : 'BORRADOR para revisar'}`, 'titulo'],
  [`Generado desde nara_datos_prueba.json (versión ${meta.version}, reglas v${meta.versionReglas}) · fecha de referencia ${meta.fechaReferencia}.`, ''],
  [FINAL ? 'Incluye contraseñas iniciales: no compartir fuera del equipo y pedir cambio de clave al primer ingreso. Cambian cada vez que se genera el archivo.' : 'Borrador: no trae contraseñas. Se generan con «node generar_excel.js --final».', FINAL ? 'aviso' : ''],
  ['', ''],
  ['Qué contiene', 'h'],
  [`• ${usuarios.length} cuentas: ${['Administrador', 'Experto de campo', 'Clínico', 'Observador', 'Paciente'].map(r => `${cuenta(usuarios, u => u.rol === r)} ${r.toLowerCase()}`).join(', ')}.`, ''],
  [`• ${territorios.length} territorios: ${territorios.map(t => t.nombre).join(', ')}. Cada uno con 1 experto, 1 clínico y 1 observador.`, ''],
  [`• ${pacientes.length} pacientes de la base 2022: ${evaluados.length} evaluados (uno por perfil P01–P15) y ${pacientes.length - evaluados.length} «Sin evaluación» (uno por territorio).`, ''],
  [`• ${activos.length} activos y ${solicitudesCambioRuta.length} cambio(s) de ruta para la líder clínica.`, ''],
  ['', ''],
  ['Hojas', 'h'],
  ['• Matriz y Reglas: los 15 perfiles con su ruta v2 y las reglas de clasificación aprobadas el 8 oct 2026.', ''],
  ['• Territorios, Usuarios y Asignaciones: quién trabaja dónde y con quién.', ''],
  ['• Pacientes: datos de la base 2022 y respuestas de la entrevista. Si se cambia una respuesta, el perfil se recalcula y los checks lo marcan.', ''],
  ['• Flujo: estado, decisión clínica, alertas, consentimiento, ruta, curso y seguimiento.', ''],
  ['• Cambios de ruta, Activos, Validación y Mapeo Mongo.', ''],
  ['', ''],
  ['Validación (validar.js)', 'h'],
  ['0 errores. Este archivo solo se genera si el JSON pasa la validación.', ''],
  ...avisos.map(a => ['Aviso: ' + a, 'aviso']),
  ['', ''],
  ['Decisiones', 'h'],
  ...meta.decisiones.map(x => ['• ' + x, '']),
  ['', ''],
  ['Antes de cargar', 'h'],
  ['• Las rutas son las de la matriz v2: cargar junto con la Fase 1 de las specs, o después. Antes, la interfaz muestra rutas distintas.', ''],
  ['• Limpiar primero la carga anterior de Cursor (108 territorios, 109 expertos, 453 personas, 455 cuentas de paciente con correos reales).', ''],
  ['• No guardar modulesEnabled en los pacientes: así la app muestra su ruta.', ''],
]);

// ---------- Matriz ----------
const mz = wb.addWorksheet('Matriz');
const filasMatriz = [];
for (let r = 0; r < 5; r++) for (let d = 0; d < 3; d++) {
  const code = R.code(r, d), ruta = R.ruta(r, d, {});
  const quienes = evaluados.filter(p => p.resultado.perfil === code);
  filasMatriz.push({
    p: code, riesgo: R.RISK[r].k, phq: `${R.RISK[r].min}–${R.RISK[r].max}`, dig: R.DIG[d].k, digr: `${R.DIG[d].min}–${R.DIG[d].max}`,
    canal: d === 2 ? 'App + WhatsApp' : d === 1 ? 'WhatsApp (audio primero)' : 'Teléfono, visita y material impreso',
    n: ruta.servicios.length, ruta: rutaTxt(ruta), meses: ruta.duracionMeses, cursos: `${R.modalidadCurso(r, d)} · ${R.recChannel(d)}`,
    pac: quienes.map(p => `${p.nombre} (${p.codigo})`).join(' · '), estado: quienes.map(p => p.flujo.estado).join(' · '), _r: r,
  });
}
tabla(mz, [
  { h: 'Perfil', k: 'p', w: 8 }, { h: 'Riesgo (PHQ-9)', k: 'riesgo', w: 16 }, { h: 'Puntaje PHQ-9', k: 'phq', w: 10 }, { h: 'Capacidad digital', k: 'dig', w: 11 },
  { h: 'Puntaje digital', k: 'digr', w: 10 }, { h: 'Canal principal', k: 'canal', w: 22, wrap: true }, { h: 'Nº servicios', k: 'n', w: 9 },
  { h: 'Ruta v2 (servicio y frecuencia)', k: 'ruta', w: 75, wrap: true }, { h: 'Meses', k: 'meses', w: 7 }, { h: 'Cursos y cuentos', k: 'cursos', w: 34, wrap: true },
  { h: 'Paciente de prueba', k: 'pac', w: 32, wrap: true }, { h: 'Estado', k: 'estado', w: 12 },
], filasMatriz, { fijas: 1 });
filasMatriz.forEach((x, i) => fill(mz.getRow(i + 2).getCell(2), RISK_BG[x._r]));
const g0 = filasMatriz.length + 4;
mz.getCell(`A${g0}`).value = 'Cuadro de perfiles: riesgo × capacidad digital';
mz.getCell(`A${g0}`).font = { bold: true, size: 12 };
const gh = mz.getRow(g0 + 1);
[['B', 'Riesgo \\ Digital'], ['F', 'Baja (0–4 o sin teléfono)'], ['H', 'Media (5–8)'], ['J', 'Alta (9–11)']].forEach(([c, v]) => { gh.getCell(c).value = v; hdr(gh.getCell(c)); });
for (let r = 0; r < 5; r++) {
  const row = mz.getRow(g0 + 2 + r); row.height = 30;
  row.getCell('B').value = `${R.RISK[r].k} (${R.RISK[r].min}–${R.RISK[r].max})`; row.getCell('B').font = { bold: true }; fill(row.getCell('B'), RISK_BG[r]);
  ['F', 'H', 'J'].forEach((c, d) => {
    const code = R.code(r, d), q = evaluados.filter(p => p.resultado.perfil === code);
    const cell = row.getCell(c); cell.value = `${code} · ${q.map(p => `${p.nombre} (${p.territorio})`).join(', ')}`;
    cell.alignment = { wrapText: true, vertical: 'middle' }; fill(cell, RISK_BG[r]);
  });
}

// ---------- Reglas ----------
textoLargo(wb.addWorksheet('Reglas'), [
  ['Reglas de clasificación v2 (aprobadas el 8 oct 2026)', 'titulo'],
  ['', ''],
  ['Clasificación', 'h'],
  ['• Riesgo PHQ-9 (9 preguntas de 0 a 3, total 0–27): Mínimo 0–4 · Leve 5–9 · Moderado 10–14 · Moderado-severo 15–19 · Severo 20–27.', ''],
  ['• Capacidad digital (6 preguntas, total 0–11): Baja 0–4 · Media 5–8 · Alta 9–11.', ''],
  ['• Sin teléfono (pregunta 1 = «Ninguno») ⇒ Baja, sin importar el puntaje.', ''],
  ['• «Uso diario» (pregunta 3) no puede ser mayor que «Teléfono» (pregunta 1): no deja calcular el resultado.', ''],
  ['• Perfil = riesgo × 3 + digital + 1 → P01 (Mínimo × Baja) a P15 (Severo × Alta).', ''],
  ['• Crisis: pregunta 9 mayor que 0 ⇒ alerta inmediata al clínico de turno del territorio.', ''],
  ['', ''],
  ['Seguimiento (decidido el 8 oct 2026)', 'h'],
  ['• El contacto se mide por el canal de la capacidad digital: Alta = ingreso a la app · Media = respuesta por WhatsApp · Baja = llamada o revisita.', ''],
  [`• ${R.UMBRAL_SIN_CONTACTO} días sin contacto ⇒ alerta «Sin contacto» para que el experto la busque; la persona sigue Activa.`, ''],
  [`• Más de ${R.UMBRAL_INACTIVO} días sin contacto ⇒ estado Inactivo. Un contacto nuevo la devuelve sola a Activo.`, ''],
  ['', ''],
  ['Rutas (ver hoja Matriz)', 'h'],
  ['• «Estado de ánimo» en la app solo con capacidad Alta; en Baja y Media se pregunta en la llamada, la revisita o el WhatsApp.', ''],
  ['• Cursos con el experto en Baja (Mínimo a Moderado); asignados por la psicóloga desde Moderado-severo.', ''],
  ['• PM+ en Moderado y Moderado-severo (PHQ-9 ≥ 10). Leve recibe revisita: cada 2 semanas en Baja, mensual en Media y Alta.', ''],
  ['', ''],
  ['Fase 2 (pendiente de construir)', 'h'],
  ['• Pregunta de privacidad del teléfono: si no puede usarlo a solas, se atiende como Baja.', ''],
  ['• Crisis en dos pasos: tamizaje C-SSRS tras la pregunta 9 para marcar la urgencia como aguda (30 min) o prioritaria (24 h).', ''],
  ['• Botón para que el experto active la crisis aunque la pregunta 9 sea 0.', ''],
  ['', ''],
  ['Pendiente de Edgar', 'h'],
  ['• ¿Se acepta Crisis antes de la aprobación cuando la pregunta 9 sale positiva en la visita? (caso de Neil, BAR)', ''],
]);

// ---------- Territorios ----------
const tw = wb.addWorksheet('Territorios');
const TC = tabla(tw, [
  { h: 'Código', k: 'codigo', w: 8 }, { h: 'Territorio', k: 'nombre', w: 15 }, { h: 'Departamento', k: 'dep', w: 16 }, { h: 'Nivel', k: 'nivel', w: 18 },
  { h: 'Meta de captación', k: 'meta', w: 10 }, { h: 'Rural mínima %', k: 'rural', w: 9 }, { h: '60+ mínima %', k: 'sesenta', w: 9 },
  { h: 'Contenido local', k: 'contenido', w: 30, wrap: true }, { h: 'Lugares', k: 'lugares', w: 26 },
  { h: 'Experto de campo', k: 'experto', w: 32 }, { h: 'Clínico', k: 'clinico', w: 34 }, { h: 'Observador', k: 'observador', w: 32 },
  { h: 'Experto (ID cuenta)', k: 'expertoId', w: 22 }, { h: 'Clínico (ID cuenta)', k: 'clinicoId', w: 22 }, { h: 'Observador (ID cuenta)', k: 'observadorId', w: 22 },
], territorios.map(t => ({
  codigo: t.codigo, nombre: t.nombre, dep: t.departamento, nivel: t.nivel, meta: t.metaCaptacion, rural: t.ruralMinPct, sesenta: t.sesentaMinPct,
  contenido: t.contenidoLocal.join(' · '), lugares: t.lugares.join(' · '), experto: nombre(t.expertoId), clinico: nombre(t.clinicoId), observador: nombre(t.observadorId),
  expertoId: t.expertoId, clinicoId: t.clinicoId, observadorId: t.observadorId,
})));

// ---------- Usuarios ----------
const uw = wb.addWorksheet('Usuarios');
const filasU = usuarios.map(u => ({
  id: u.id, rol: u.rol, nombre: u.nombre, correo: u.correo, tel: u.telefono, terr: u.territorio === 'TODOS' ? 'Todos' : (T[u.territorio] || {}).nombre,
  org: u.organizacion, lider: u.rol === 'Clínico' ? (u.liderClinica ? 'Sí' : 'No') : '', estado: u.estado,
  expertsId: u.expertsId || '', metaDia: u.metaDia ?? '', metaSemana: u.metaSemana ?? '', tablet: u.tablet || '', capacitacion: u.capacitacion || '',
  modulos: (u.modulos || []).join(' · '), pacienteId: u.pacienteId || '', perfilListo: u.rol === 'Paciente' ? (u.perfilListo ? 'Sí' : 'No') : '',
  origen: u.origen, nota: u.nota || '', pwd: FINAL ? pwd() : '(versión final)',
}));
const UC = tabla(uw, [
  { h: 'ID cuenta', k: 'id', w: 22 }, { h: 'Rol', k: 'rol', w: 16 }, { h: 'Nombre', k: 'nombre', w: 32 }, { h: 'Correo', k: 'correo', w: 34 },
  { h: 'Teléfono', k: 'tel', w: 14 }, { h: 'Territorio', k: 'terr', w: 14 }, { h: 'Organización', k: 'org', w: 26 }, { h: 'Líder clínica', k: 'lider', w: 9 },
  { h: 'Estado de la cuenta', k: 'estado', w: 10 },
  { h: 'Experto · ID en experts', k: 'expertsId', w: 20 }, { h: 'Experto · meta por día', k: 'metaDia', w: 9 }, { h: 'Experto · meta por semana', k: 'metaSemana', w: 9 },
  { h: 'Experto · tablet', k: 'tablet', w: 9 }, { h: 'Experto · capacitación', k: 'capacitacion', w: 11 }, { h: 'Observador · módulos', k: 'modulos', w: 34, wrap: true },
  { h: 'Paciente · ID paciente', k: 'pacienteId', w: 11 }, { h: 'Paciente · perfil listo (profileReady)', k: 'perfilListo', w: 11 },
  { h: 'Origen de los datos', k: 'origen', w: 30, wrap: true }, { h: 'Nota', k: 'nota', w: 40, wrap: true }, { h: 'Contraseña inicial (temporal)', k: 'pwd', w: 18 },
], filasU, { fijas: 3 });
filasU.forEach((u, i) => fill(uw.getRow(i + 2).getCell(2), ROL_BG[u.rol]));
uw.getCell(`${UC.pwd}1`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB42318' } };

// ---------- Pacientes ----------
const pw = wb.addWorksheet('Pacientes');
const pCols = [
  { h: 'ID paciente', k: 'id', w: 10 }, { h: 'Código', k: 'codigo', w: 12 }, { h: 'ID original 2022', k: 'id22', w: 9 }, { h: 'Nombre', k: 'nombre', w: 28 },
  { h: 'Origen del nombre', k: 'origen', w: 20, wrap: true }, { h: 'Valor original en la base', k: 'original', w: 24 }, { h: 'Edad', k: 'edad', w: 6 },
  { h: 'Sexo', k: 'sexo', w: 10 }, { h: 'Identidad de género', k: 'genero', w: 10 }, { h: 'Estado civil', k: 'civil', w: 12 }, { h: 'Estrato', k: 'estrato', w: 7 },
  { h: 'Municipio (base 2022)', k: 'mun', w: 14 }, { h: 'Fecha de registro 2022', k: 'reg22', w: 11, fmt: 'yyyy-mm-dd' }, { h: 'Territorio', k: 'terr', w: 8 },
  { h: 'Experto de campo', k: 'experto', w: 30 }, { h: 'Clínico', k: 'clinico', w: 32 },
  { h: 'Experto (ID cuenta)', k: 'expertoId', w: 20 }, { h: 'Clínico (ID cuenta)', k: 'clinicoId', w: 18 }, { h: 'Cuenta del paciente (ID)', k: 'cuentaId', w: 15 },
  { h: 'Correo (ficticio)', k: 'correo', w: 30 }, { h: 'Teléfono (ficticio)', k: 'tel', w: 14 }, { h: 'Estado', k: 'estado', w: 13 },
  ...R.PHQ.map((q, i) => ({ h: `PHQ ${i + 1} · ${q}`, k: 'q' + i, w: 9 })),
  { h: 'PHQ-9 total', k: 'phqT', w: 8 }, { h: 'Riesgo', k: 'riesgo', w: 15 },
  ...R.DIGQ.map((q, i) => ({ h: `DIG ${i + 1} · ${q.q} (${q.o.map((o, j) => j + ' ' + o).join(', ')})`, k: 'g' + i, w: 11 })),
  { h: 'Digital total', k: 'digT', w: 8 }, { h: 'Capacidad digital', k: 'dig', w: 10 }, { h: 'Nota de capacidad digital', k: 'nota', w: 30, wrap: true },
  { h: 'Contexto · daño en la vivienda (0 Ninguno, 1 Parcial, 2 Total)', k: 'ctxDano', w: 11 }, { h: 'Contexto · perdió a un familiar (0 No, 1 Sí)', k: 'ctxPerdida', w: 11 },
  { h: 'Perfil (JSON)', k: 'perfil', w: 8 }, { h: 'Perfil calculado', k: 'pc', w: 9 },
  { h: 'Check · perfil = respuestas', k: 'c1', w: 12 }, { h: 'Check · experto del territorio', k: 'c2', w: 12 }, { h: 'Check · clínico del territorio', k: 'c3', w: 12 },
  { h: 'Check · edad ≥ 18', k: 'c4', w: 10 }, { h: 'Check · uso ≤ teléfono', k: 'c5', w: 11 },
];
const PC = tabla(pw, pCols, [], { alto: 90, fijas: 4 });
const lk = (x, pasos, etiquetas) => `LOOKUP(${x},{${pasos.join(',')}},{${etiquetas.map(e => `"${e}"`).join(',')}})`;
pacientes.forEach((p, i) => {
  const n = i + 2, ev = p.evaluacion, res = p.resultado;
  const row = {
    id: p.id, codigo: p.codigo, id22: p.idOriginal2022, nombre: p.nombre, origen: p.origenNombre, original: p.valorOriginalEnBase, edad: p.edad,
    sexo: p.sexo, genero: p.identidadGenero, civil: p.estadoCivil, estrato: p.estrato, mun: p.municipioBase2022, reg22: D(p.fechaRegistro2022), terr: p.territorio,
    experto: nombre(p.expertoId), clinico: nombre(p.clinicoId), expertoId: p.expertoId, clinicoId: p.clinicoId, cuentaId: p.cuentaId,
    correo: (U[p.cuentaId] || {}).correo, tel: (U[p.cuentaId] || {}).telefono,
    estado: p.flujo.estado, perfil: res ? res.perfil : '',
    ctxDano: ev ? ev.contexto.danoVivienda : '', ctxPerdida: ev ? ev.contexto.perdidaFamiliar : '',
  };
  if (ev) { ev.phq9.forEach((v, j) => { row['q' + j] = v; }); ev.digital.forEach((v, j) => { row['g' + j] = v; }); }
  const phqR = `${PC.q0}${n}:${PC.q8}${n}`, digR = `${PC.g0}${n}:${PC.g5}${n}`, dT = `${PC.digT}${n}`, g1 = `${PC.g0}${n}`, g6 = `${PC.g5}${n}`;
  const nivel = x => lk(x, [0, 5, 9], R.DIG.map(d => d.k));
  row.phqT = f(`IF(COUNT(${phqR})=0,"",SUM(${phqR}))`, res ? res.phqTotal : '');
  row.riesgo = f(`IF(${PC.phqT}${n}="","",${lk(`${PC.phqT}${n}`, [0, 5, 10, 15, 20], R.RISK.map(r => r.k))})`, res ? res.riesgo : '');
  row.digT = f(`IF(COUNT(${digR})=0,"",SUM(${digR}))`, res ? res.digitalTotal : '');
  row.dig = f(`IF(${dT}="","",IF(${g1}=0,"Baja",${nivel(dT)}))`, res ? res.capacidadDigital : '');
  row.nota = f(`IF(${dT}="","",IF(${g1}=0,"Sin teléfono: la capacidad digital queda en Baja.",IF(${nivel(`${dT}-${g6}`)}<>${PC.dig}${n},"El apoyo de un familiar sube el nivel de "&${nivel(`${dT}-${g6}`)}&" a "&${PC.dig}${n}&".",IF(${g6}=1,"Tiene apoyo de un familiar con el celular.",""))))`, res ? res.notaFamiliar : '');
  row.pc = f(`IF(${PC.phqT}${n}="","","P"&TEXT((MATCH(${PC.phqT}${n},{0,5,10,15,20},1)-1)*3+IF(${g1}=0,1,MATCH(${dT},{0,5,9},1)),"00"))`, res ? res.perfil : '');
  row.c1 = f(`IF(${PC.perfil}${n}=${PC.pc}${n},"OK","REVISAR")`, 'OK');
  row.c2 = f(`IF(INDEX(Territorios!$${TC.experto}:$${TC.experto},MATCH(${PC.terr}${n},Territorios!$${TC.codigo}:$${TC.codigo},0))=${PC.experto}${n},"OK","REVISAR")`, 'OK');
  row.c3 = f(`IF(INDEX(Territorios!$${TC.clinico}:$${TC.clinico},MATCH(${PC.terr}${n},Territorios!$${TC.codigo}:$${TC.codigo},0))=${PC.clinico}${n},"OK","REVISAR")`, 'OK');
  row.c4 = f(`IF(${PC.edad}${n}>=18,"OK","REVISAR")`, 'OK');
  row.c5 = f(`IF(COUNT(${digR})=0,"OK",IF(${PC.g2}${n}>${g1},"REVISAR","OK"))`, 'OK');
  pw.addRow(row);
  fill(pw.getCell(`${PC.estado}${n}`), ESTADO_BG[p.flujo.estado]);
  if (res) fill(pw.getCell(`${PC.riesgo}${n}`), RISK_BG[R.RISK.findIndex(r => r.k === res.riesgo)]);
  if (ev && ev.phq9[8] > 0) { const c = pw.getCell(`${PC.q8}${n}`); fill(c, 'FFFDE7E4'); c.font = { bold: true, color: { argb: 'FFB42318' } }; }
});
const lastP = pacientes.length + 1;
for (let n = 2; n <= lastP; n++) {
  for (let j = 0; j < 9; j++) pw.getCell(`${PC['q' + j]}${n}`).dataValidation = { type: 'whole', operator: 'between', allowBlank: true, formulae: [0, 3], showErrorMessage: true, error: 'Respuesta de 0 a 3' };
  for (let j = 0; j < 5; j++) pw.getCell(`${PC['g' + j]}${n}`).dataValidation = { type: 'whole', operator: 'between', allowBlank: true, formulae: [0, 2], showErrorMessage: true, error: 'Respuesta de 0 a 2' };
  pw.getCell(`${PC.g5}${n}`).dataValidation = { type: 'whole', operator: 'between', allowBlank: true, formulae: [0, 1], showErrorMessage: true, error: '0 No · 1 Sí' };
}
colorOk(pw, `${PC.c1}2:${PC.c5}${lastP}`);

// ---------- Flujo ----------
const fw = wb.addWorksheet('Flujo');
const fCols = [
  { h: 'ID paciente', k: 'id', w: 10 }, { h: 'Nombre', k: 'nombre', w: 26 }, { h: 'Territorio', k: 'terr', w: 8 }, { h: 'Perfil', k: 'perfil', w: 7 },
  { h: 'Estado', k: 'estado', w: 13 }, { h: 'Visita programada', k: 'visita', w: 11, fmt: 'yyyy-mm-dd' },
  { h: 'Fecha de evaluación', k: 'ev', w: 11, fmt: 'yyyy-mm-dd' }, { h: 'Duración entrevista (min)', k: 'min', w: 10 },
  { h: 'Decisión clínica', k: 'dec', w: 11 }, { h: 'Fecha de la decisión', k: 'decAt', w: 11, fmt: 'yyyy-mm-dd' }, { h: 'Clínico que decidió', k: 'decPor', w: 28 },
  { h: 'Motivo del rechazo', k: 'motivo', w: 34, wrap: true },
  { h: 'Alerta de crisis', k: 'alerta', w: 9 }, { h: 'Origen de la alerta', k: 'alOrigen', w: 26, wrap: true }, { h: 'Fecha y hora de la alerta', k: 'alAt', w: 15, fmt: 'yyyy-mm-dd hh:mm' },
  { h: 'Alerta dirigida a', k: 'alA', w: 28 },
  { h: 'Consentimiento obligatorio (3/3)', k: 'cons', w: 11 }, { h: 'Autoriza contacto por teléfono o WhatsApp', k: 'contacto', w: 10 }, { h: 'Autoriza manilla', k: 'manilla', w: 9 }, { h: 'Autoriza remisión', k: 'remision', w: 9 },
  { h: 'Ruta (servicio y frecuencia)', k: 'ruta', w: 70, wrap: true }, { h: 'Nº servicios', k: 'n', w: 8 }, { h: 'Meses', k: 'meses', w: 7 },
  { h: 'Curso propuesto', k: 'curso', w: 28 }, { h: 'Semanas del curso', k: 'cSem', w: 8 }, { h: 'Motivo del curso', k: 'cMotivo', w: 26, wrap: true }, { h: 'Modalidad del curso', k: 'cMod', w: 22 }, { h: 'Canal del curso', k: 'cCanal', w: 26 },
  { h: 'Último contacto', k: 'ult', w: 11, fmt: 'yyyy-mm-dd' }, { h: 'Canal del último contacto', k: 'ultCanal', w: 24 }, { h: 'Días sin contacto', k: 'dias', w: 9 }, { h: 'Alerta «Sin contacto» (14 días o más)', k: 'sinC', w: 11 }, { h: 'Adherencia %', k: 'adh', w: 9 },
  { h: 'Cuenta lista para la app (perfilListo)', k: 'listo', w: 10 }, { h: 'Próximo paso', k: 'prox', w: 44, wrap: true },
  { h: 'Check · pregunta 9 > 0 ⇒ Crisis', k: 'c1', w: 12 }, { h: 'Check · manilla autorizada', k: 'c2', w: 12 }, { h: 'Check · estado y decisión', k: 'c3', w: 12 }, { h: 'Check · días sin contacto (14 y 28)', k: 'c4', w: 12 }, { h: 'Check · canal según capacidad', k: 'c5', w: 12 },
];
const FC = tabla(fw, fCols, [], { alto: 60, fijas: 2 });
pacientes.forEach((p, i) => {
  const n = i + 2, fl = p.flujo, dc = fl.decisionClinica || {}, al = fl.alertaCrisis, ev = p.evaluacion, cs = p.consentimiento, sg = p.seguimiento;
  const m = `MATCH(${FC.id}${n},Pacientes!$${PC.id}:$${PC.id},0)`;
  const ix = (k, res) => f(`INDEX(Pacientes!$${PC[k]}:$${PC[k]},${m})`, res);
  const ruta = p.ruta || p.rutaPropuesta;
  const diasSin = sg ? Math.round((new Date(meta.fechaReferencia) - new Date(sg.ultimoContacto)) / 86400000) : '';
  const fila = {
    // «&""» evita que una celda vacía (Sin evaluación) se muestre como 0.
    id: p.id, nombre: ix('nombre', p.nombre), terr: ix('terr', p.territorio), perfil: f(`INDEX(Pacientes!$${PC.perfil}:$${PC.perfil},${m})&""`, p.resultado ? p.resultado.perfil : ''), estado: fl.estado,
    visita: D(fl.visitaProgramada), ev: ev ? D(ev.fecha) : null, min: ev ? ev.duracionMin : '',
    dec: dc.decision || '', decAt: D(dc.fecha), decPor: dc.clinicoId ? nombre(dc.clinicoId) : '', motivo: dc.motivo || '',
    alerta: al ? al.estado : '', alOrigen: al ? al.origen : '', alAt: al ? D(al.fechaHora) : null, alA: al ? nombre(al.clinicoId) : '',
    cons: cs ? (cs.obligatorios ? 'Sí' : 'No') : '', contacto: cs ? (cs.contacto ? 'Sí' : 'No') : '', manilla: cs ? (cs.manilla ? 'Sí' : 'No aplica') : '', remision: cs ? (cs.remision ? 'Sí' : 'No') : '',
    ruta: p.ruta ? rutaTxt(p.ruta) : p.rutaPropuesta ? 'Sin ruta hasta repetir la evaluación. Propuesta: ' + rutaTxt(p.rutaPropuesta) : '',
    n: ruta ? ruta.servicios.length : '', meses: ruta ? ruta.duracionMeses : '',
    curso: p.curso ? p.curso.titulo : '', cSem: p.curso ? p.curso.semanas : '', cMotivo: p.curso ? p.curso.motivo : '', cMod: p.curso ? p.curso.modalidad : '', cCanal: p.curso ? p.curso.canal : '',
    ult: sg ? D(sg.ultimoContacto) : null, ultCanal: sg ? sg.canal : '', adh: sg ? sg.adherenciaPct : '',
    dias: f(`IF(${FC.ult}${n}="","",${HOY_XL}-${FC.ult}${n})`, diasSin),
    sinC: f(`IF(${FC.dias}${n}="","",IF(${FC.dias}${n}>=${R.UMBRAL_SIN_CONTACTO},"Sí","No"))`, sg ? (sg.sinContacto ? 'Sí' : 'No') : ''),
    listo: (U[p.cuentaId] || {}).perfilListo ? 'Sí' : 'No', prox: fl.proximoPaso,
  };
  fila.c1 = f(`IF(AND(N(INDEX(Pacientes!$${PC.q8}:$${PC.q8},${m}))>0,${FC.estado}${n}<>"Crisis"),"REVISAR","OK")`, 'OK');
  fila.c2 = f(`IF(AND(ISNUMBER(SEARCH("Manilla",${FC.ruta}${n})),${FC.manilla}${n}<>"Sí",LEFT(${FC.ruta}${n},8)<>"Sin ruta"),"REVISAR","OK")`, 'OK');
  const E = `${FC.estado}${n}`, DEC = `${FC.dec}${n}`;
  fila.c3 = f(`IF(OR(AND(${E}="Sin evaluación",${DEC}<>""),AND(${E}="Por aprobar",${DEC}<>"Pendiente"),AND(OR(${E}="Aprobado",${E}="Activo",${E}="Inactivo"),${DEC}<>"Aprobado"),AND(${E}="Rechazado",${DEC}<>"Rechazado")),"REVISAR","OK")`, 'OK');
  fila.c4 = f(`IF(${E}="Inactivo",IF(N(${FC.dias}${n})>${R.UMBRAL_INACTIVO},"OK","REVISAR"),IF(${E}="Activo",IF(N(${FC.dias}${n})<=${R.UMBRAL_INACTIVO},"OK","REVISAR"),"OK"))`, 'OK');
  // Alta = ingreso a la app · Media = WhatsApp · Baja = llamada o revisita.
  const capX = `INDEX(Pacientes!$${PC.dig}:$${PC.dig},${m})`, canX = `${FC.ultCanal}${n}`;
  fila.c5 = f(`IF(${canX}="","OK",IF(OR(AND(${capX}="Alta",ISNUMBER(SEARCH("app",${canX}))),AND(${capX}="Media",ISNUMBER(SEARCH("WhatsApp",${canX}))),AND(${capX}="Baja",OR(ISNUMBER(SEARCH("Llamada",${canX})),ISNUMBER(SEARCH("Revisita",${canX}))))),"OK","REVISAR"))`, 'OK');
  fw.addRow(fila);
  fw.getCell(E).dataValidation = { type: 'list', allowBlank: false, formulae: ['"' + R.ESTADOS.join(',') + '"'] };
  fw.getCell(DEC).dataValidation = { type: 'list', allowBlank: true, formulae: ['"Pendiente,Aprobado,Rechazado"'] };
  fill(fw.getCell(E), ESTADO_BG[fl.estado]);
  if (fl.estado === 'Crisis') fw.getCell(E).font = { bold: true, color: { argb: 'FFB42318' } };
});
colorOk(fw, `${FC.c1}2:${FC.c5}${lastP}`);

// ---------- Rutas (una fila por servicio, con su canal) ----------
const filasRuta = [];
const agregarRuta = (id, quien, perfil, tipo, ruta) => ruta && ruta.servicios.forEach(x => filasRuta.push({ id, quien, perfil, tipo, servicio: x.servicio, frec: x.frecuencia, canal: x.canal, meses: ruta.duracionMeses }));
pacientes.forEach(p => {
  if (p.ruta) agregarRuta(p.id, p.nombre, p.resultado.perfil, 'Vigente', p.ruta);
  if (p.rutaPropuesta) agregarRuta(p.id, p.nombre, p.resultado.perfil, 'Propuesta (rechazada: repetir la evaluación)', p.rutaPropuesta);
});
solicitudesCambioRuta.forEach(s => {
  agregarRuta(s.id, `Cambio de ruta ${s.id}`, s.perfil, 'Actual', s.rutaActual);
  agregarRuta(s.id, `Cambio de ruta ${s.id}`, s.perfil, 'Propuesta', s.rutaPropuesta);
});
tabla(wb.addWorksheet('Rutas'), [
  { h: 'ID (paciente o cambio)', k: 'id', w: 12 }, { h: 'Paciente o cambio', k: 'quien', w: 28 }, { h: 'Perfil', k: 'perfil', w: 7 }, { h: 'Tipo', k: 'tipo', w: 22, wrap: true },
  { h: 'Servicio', k: 'servicio', w: 30 }, { h: 'Frecuencia', k: 'frec', w: 24 }, { h: 'Canal', k: 'canal', w: 34 }, { h: 'Duración de la ruta (meses)', k: 'meses', w: 10 },
], filasRuta, { fijas: 2 });

// ---------- Cambios de ruta ----------
const cw = wb.addWorksheet('Cambios de ruta');
const CC = tabla(cw, [
  { h: 'ID', k: 'id', w: 8 }, { h: 'Perfil', k: 'perfil', w: 7 }, { h: 'Alcance', k: 'alcance', w: 18 }, { h: 'Enviado por', k: 'por', w: 20 }, { h: 'Fecha', k: 'fecha', w: 11, fmt: 'yyyy-mm-dd' },
  { h: 'Revisa', k: 'revisa', w: 22 }, { h: 'Estado', k: 'estado', w: 11 }, { h: 'Motivo', k: 'motivo', w: 40, wrap: true }, { h: 'Cambios', k: 'cambios', w: 40, wrap: true },
  { h: 'Ruta actual', k: 'actual', w: 60, wrap: true }, { h: 'Ruta propuesta', k: 'propuesta', w: 60, wrap: true }, { h: 'Si se rechaza', k: 'rechazo', w: 28, wrap: true },
  { h: 'Enviado por (ID)', k: 'porId', w: 10 }, { h: 'Revisa (ID)', k: 'revisaId', w: 12 }, { h: 'Meses ruta actual', k: 'mA', w: 8 }, { h: 'Meses ruta propuesta', k: 'mP', w: 8 },
], solicitudesCambioRuta.map(s => ({
  porId: s.solicitadoPorId, revisaId: s.revisorId, mA: s.rutaActual.duracionMeses, mP: s.rutaPropuesta.duracionMeses,
  id: s.id, perfil: s.perfil, alcance: s.alcance, por: nombre(s.solicitadoPorId), fecha: D(s.fecha), revisa: nombre(s.revisorId), estado: s.estado, motivo: s.motivo,
  cambios: s.cambios.map(c => `${c.servicio}: ${c.de} → ${c.a}`).join(' · '), actual: rutaTxt(s.rutaActual), propuesta: rutaTxt(s.rutaPropuesta), rechazo: s.siSeRechaza,
})));
for (let n = 2; n <= solicitudesCambioRuta.length + 1; n++) cw.getCell(`${CC.estado}${n}`).dataValidation = { type: 'list', formulae: ['"Pendiente,Aprobado,Rechazado"'] };

// ---------- Activos ----------
tabla(wb.addWorksheet('Activos'), [
  { h: 'Código', k: 'codigo', w: 9 }, { h: 'Tipo', k: 'tipo', w: 9 }, { h: 'Estado', k: 'estado', w: 11 }, { h: 'Asignado a', k: 'a', w: 32 }, { h: 'Rol', k: 'rol', w: 16 },
  { h: 'Territorio', k: 'terr', w: 14 }, { h: 'Desde', k: 'desde', w: 11, fmt: 'yyyy-mm-dd' }, { h: 'Nota', k: 'nota', w: 50, wrap: true },
  { h: 'Asignado a (ID)', k: 'aId', w: 20 },
], activos.map(a => ({ aId: a.asignadoA, codigo: a.codigo, tipo: a.tipo, estado: a.estado, a: nombre(a.asignadoA), rol: U[a.asignadoA] ? U[a.asignadoA].rol : 'Paciente', terr: (T[a.territorio] || {}).nombre, desde: D(a.desde), nota: a.nota || '' })));

// ---------- Asignaciones ----------
const sw = wb.addWorksheet('Asignaciones');
const SC = tabla(sw, [
  { h: 'Territorio', k: 'terr', w: 14 }, { h: 'Código', k: 'cod', w: 8 }, { h: 'Experto de campo', k: 'experto', w: 30 }, { h: 'Clínico', k: 'clinico', w: 34 }, { h: 'Observador', k: 'obs', w: 30 },
  { h: 'Pacientes', k: 'np', w: 9 }, { h: 'Perfiles', k: 'perfiles', w: 18 }, { h: 'Sin evaluación', k: 'se', w: 10 }, { h: 'Por aprobar', k: 'pa', w: 9 }, { h: 'Crisis abiertas', k: 'cr', w: 9 },
  { h: 'Check · 1 experto', k: 'c1', w: 11 }, { h: 'Check · 1 clínico', k: 'c2', w: 11 }, { h: 'Check · 1 observador', k: 'c3', w: 11 },
  { h: 'Check · clínico con algo por aprobar', k: 'c4', w: 13 }, { h: 'Check · experto con alguien sin evaluar', k: 'c5', w: 13 },
], [], { alto: 48 });
territorios.forEach((t, i) => {
  const n = i + 2, mios = pacientes.filter(p => p.territorio === t.codigo);
  const porRol = rol => `COUNTIFS(Usuarios!$${UC.rol}:$${UC.rol},"${rol}",Usuarios!$${UC.terr}:$${UC.terr},${SC.terr}${n})`;
  const porEstado = e => `COUNTIFS(Flujo!$${FC.terr}:$${FC.terr},${SC.cod}${n},Flujo!$${FC.estado}:$${FC.estado},"${e}")`;
  sw.addRow({
    terr: t.nombre, cod: t.codigo, experto: nombre(t.expertoId), clinico: nombre(t.clinicoId), obs: nombre(t.observadorId),
    np: f(`COUNTIF(Pacientes!$${PC.terr}:$${PC.terr},${SC.cod}${n})`, mios.length),
    perfiles: mios.filter(p => p.resultado).map(p => p.resultado.perfil).join(' · '),
    se: f(porEstado('Sin evaluación'), cuenta(mios, p => p.flujo.estado === 'Sin evaluación')),
    pa: f(porEstado('Por aprobar'), cuenta(mios, p => p.flujo.estado === 'Por aprobar')),
    cr: f(`COUNTIFS(Flujo!$${FC.terr}:$${FC.terr},${SC.cod}${n},Flujo!$${FC.alerta}:$${FC.alerta},"Abierta")`, cuenta(mios, p => p.flujo.alertaCrisis)),
    c1: f(`IF(${porRol('Experto de campo')}=1,"OK","REVISAR")`, 'OK'),
    c2: f(`IF(${porRol('Clínico')}=1,"OK","REVISAR")`, 'OK'),
    c3: f(`IF(${porRol('Observador')}=1,"OK","REVISAR")`, 'OK'),
    c4: f(`IF(${SC.pa}${n}>=1,"OK","REVISAR")`, 'OK'),
    c5: f(`IF(${SC.se}${n}>=1,"OK","REVISAR")`, 'OK'),
  });
});
colorOk(sw, `${SC.c1}2:${SC.c5}${territorios.length + 1}`);

// ---------- Validación ----------
const vw = wb.addWorksheet('Validación');
vw.columns = [{ header: 'Regla', key: 'r', width: 64 }, { header: 'Resultado', key: 'v', width: 12 }, { header: 'Esperado', key: 'e', width: 12 }, { header: 'Estado', key: 's', width: 11 }];
vw.getRow(1).eachCell(hdr); vw.getRow(1).height = 24; vw.views = [{ state: 'frozen', ySplit: 1 }];
const rng = (hoja, C, k, last) => `${hoja}!$${C[k]}$2:$${C[k]}$${last}`;
const lastU = usuarios.length + 1, lastT = territorios.length + 1;
const nRol = r => cuenta(usuarios, u => u.rol === r);
const REGLAS = [
  ['Cuentas de Administrador (exactamente 1)', `COUNTIF(${rng('Usuarios', UC, 'rol', lastU)},"Administrador")`, 1, nRol('Administrador')],
  ['Cuentas de Experto de campo (mínimo 5)', `COUNTIF(${rng('Usuarios', UC, 'rol', lastU)},"Experto de campo")`, 5, nRol('Experto de campo'), '>='],
  ['Cuentas de Clínico (mínimo 5)', `COUNTIF(${rng('Usuarios', UC, 'rol', lastU)},"Clínico")`, 5, nRol('Clínico'), '>='],
  ['Cuentas de Observador (mínimo 5)', `COUNTIF(${rng('Usuarios', UC, 'rol', lastU)},"Observador")`, 5, nRol('Observador'), '>='],
  ['Cuentas de Paciente (mínimo 15)', `COUNTIF(${rng('Usuarios', UC, 'rol', lastU)},"Paciente")`, 15, nRol('Paciente'), '>='],
  ['Perfiles distintos entre los evaluados (P01–P15)', `SUMPRODUCT((${rng('Pacientes', PC, 'perfil', lastP)}<>"")/COUNTIF(${rng('Pacientes', PC, 'perfil', lastP)},${rng('Pacientes', PC, 'perfil', lastP)}&""))`, 15, 15],
  ['Pacientes cuyo territorio no existe', `SUMPRODUCT(--(COUNTIF(Territorios!$${TC.codigo}$2:$${TC.codigo}$${lastT},${rng('Pacientes', PC, 'terr', lastP)})=0))`, 0, 0],
  ['Pacientes con perfil distinto al de sus respuestas', `COUNTIF(${rng('Pacientes', PC, 'c1', lastP)},"REVISAR")`, 0, 0],
  ['Pacientes con un experto distinto al de su territorio', `COUNTIF(${rng('Pacientes', PC, 'c2', lastP)},"REVISAR")`, 0, 0],
  ['Pacientes con un clínico distinto al de su territorio', `COUNTIF(${rng('Pacientes', PC, 'c3', lastP)},"REVISAR")`, 0, 0],
  ['Pacientes menores de 18 años', `COUNTIF(${rng('Pacientes', PC, 'c4', lastP)},"REVISAR")`, 0, 0],
  ['«Uso diario» mayor que «Teléfono»', `COUNTIF(${rng('Pacientes', PC, 'c5', lastP)},"REVISAR")`, 0, 0],
  ['Pregunta 9 > 0 sin estado Crisis', `COUNTIF(${rng('Flujo', FC, 'c1', lastP)},"REVISAR")`, 0, 0],
  ['Ruta con manilla sin autorización', `COUNTIF(${rng('Flujo', FC, 'c2', lastP)},"REVISAR")`, 0, 0],
  ['Estado que no coincide con la decisión clínica', `COUNTIF(${rng('Flujo', FC, 'c3', lastP)},"REVISAR")`, 0, 0],
  ['Activo o Inactivo que no cuadra con los días sin contacto (28)', `COUNTIF(${rng('Flujo', FC, 'c4', lastP)},"REVISAR")`, 0, 0],
  ['Contacto medido por un canal que no es el de su capacidad digital', `COUNTIF(${rng('Flujo', FC, 'c5', lastP)},"REVISAR")`, 0, 0],
  ['Territorios sin exactamente 1 experto, 1 clínico y 1 observador', `COUNTIF(Asignaciones!$${SC.c1}$2:$${SC.c3}$${lastT},"REVISAR")`, 0, 0],
  ['Territorios sin nada por aprobar o sin nadie por evaluar', `COUNTIF(Asignaciones!$${SC.c4}$2:$${SC.c5}$${lastT},"REVISAR")`, 0, 0],
  ['Correos repetidos', `SUMPRODUCT(--(COUNTIF(${rng('Usuarios', UC, 'correo', lastU)},${rng('Usuarios', UC, 'correo', lastU)})>1))`, 0, 0],
  ['IDs de cuenta repetidos', `SUMPRODUCT(--(COUNTIF(${rng('Usuarios', UC, 'id', lastU)},${rng('Usuarios', UC, 'id', lastU)})>1))`, 0, 0],
  ['Estados distintos usados (de los 7)', `SUMPRODUCT(1/COUNTIF(${rng('Flujo', FC, 'estado', lastP)},${rng('Flujo', FC, 'estado', lastP)}))`, 7, new Set(pacientes.map(p => p.flujo.estado)).size],
];
REGLAS.forEach(([r, formula, esperado, res, op], i) => {
  const n = i + 2;
  vw.addRow({ r, v: f(formula, res), e: esperado, s: f(op === '>=' ? `IF(B${n}>=C${n},"OK","REVISAR")` : `IF(ROUND(B${n},6)=C${n},"OK","REVISAR")`, 'OK') });
});
const nR = REGLAS.length + 3;
vw.getCell(`A${nR}`).value = 'validar.js revisa además: municipio de la base = territorio, metas 9/45, alerta dirigida al clínico del territorio, nombres del personal sin repetir, perfilListo, rutas y cursos de la matriz v2, cambios de ruta e intensidad creciente de la matriz.';
vw.getCell(`A${nR}`).alignment = { wrapText: true };
colorOk(vw, `D2:D${REGLAS.length + 1}`);

// ---------- Mapeo Mongo ----------
tabla(wb.addWorksheet('Mapeo Mongo'), [{ h: 'Hoja y columna', k: 'a', w: 40 }, { h: 'Colección', k: 'c', w: 18 }, { h: 'Campo', k: 'f', w: 34 }, { h: 'Nota', k: 'n', w: 60, wrap: true }], [
  { a: 'Territorios', c: 'territories', f: 'name, dep, level, goal, ruralG, sixtyG, content, places', n: 'Reemplaza los 108 territorios actuales. Sin «Contexto del sismo».' },
  { a: 'Usuarios (todas las filas)', c: 'accounts', f: 'id, roleId, role, name, email, phone, terr, org, status', n: 'roleId: admin · experto · clinico · observador · paciente. La contraseña se guarda con hash (bcrypt).' },
  { a: 'Usuarios · Experto de campo', c: 'experts', f: 'id, accountId, name, phone, terr, target, training, tablet', n: 'Un experto por territorio; target = 9. Reemplaza los 109 actuales.' },
  { a: 'Usuarios · Clínico', c: 'accounts', f: 'terr, liderClinica', n: 'La Dra. Lucía Marín (umuvzhvkb) es la líder clínica: pasa de Quindío a Bogotá.' },
  { a: 'Usuarios · Observador', c: 'accounts', f: 'org, modules', n: 'Rol único. Módulos: avance y resultados agregados de su territorio, y TEO.' },
  { a: 'Usuarios · Paciente', c: 'accounts', f: 'patientId, profileReady', n: 'profileReady = perfilListo: verdadero solo con decisión clínica Aprobado. No guardar patientModules ni modulesEnabled.' },
  { a: 'Pacientes · ID, código, datos de la base', c: 'patients / people', f: 'id, code, name, age, sexo, estrato, estadoCivil, terr, place', n: 'Mismo formato de la migración actual (sm-ID, BUC-SM436). place = «Municipio, Departamento».' },
  { a: 'Pacientes · experto y clínico', c: 'patients / people / caseload', f: 'expert, expertId, clin · caseload.clinicianId', n: 'Siempre los del territorio.' },
  { a: 'Pacientes · PHQ 1–9 y DIG 1–6', c: 'patients / visits', f: 'phq, phqDates · visits.phq, visits.dig, visits.code', n: 'Los «Sin evaluación» no tienen visita ni respuestas.' },
  { a: 'Pacientes · Perfil', c: 'patients / people', f: 'profile', n: 'Vacío para «Sin evaluación».' },
  { a: 'Flujo · Estado', c: 'patients', f: 'estado (campo nuevo propuesto)', n: 'Los 7 estados. Lucho define el nombre del campo.' },
  { a: 'Flujo · Visita programada', c: 'worklist_items', f: 'expertId, personId, at', n: 'Solo para «Sin evaluación».' },
  { a: 'Flujo · Evaluación', c: 'visits / worklist_items', f: 'at, duración, status = validada', n: 'Todas duran 20 minutos o más.' },
  { a: 'Flujo · Decisión clínica', c: 'patients', f: 'decisión, fecha, clínico, motivo', n: 'Campo que define Lucho al implementar Aprobaciones.' },
  { a: 'Flujo · Alerta de crisis', c: 'alerts', f: 'status = open, at, personId, clinicianId', n: 'Va al clínico del territorio. Fase 2: sev = aguda o prioritaria.' },
  { a: 'Flujo · Consentimiento', c: 'consents', f: 'personId, contacto, manilla, remision, at', n: '' },
  { a: 'Flujo · Ruta', c: '(calculada)', f: 'pathList(r, d)', n: 'Es la ruta por defecto v2 del perfil: no requiere path_overrides.' },
  { a: 'Flujo · Curso', c: 'recursos', f: 'personId, course, week', n: '' },
  { a: 'Flujo · Seguimiento', c: 'patients', f: 'lastCheckin, adherence', n: '' },
  { a: 'Cambios de ruta', c: 'path_requests', f: 'id, code, draft, status, at, by', n: 'CR-001 pendiente para la líder clínica.' },
  { a: 'Activos', c: 'assets', f: 'code, type, status, assignedTo, terr', n: 'TB-001 hoy está asignada a Camila Restrepo (Salento): reasignar.' },
]);

wb.xlsx.writeFile(OUT).catch(e => {
  if (e.code === 'EBUSY' || e.code === 'EPERM') console.error(`No se pudo escribir ${path.basename(OUT)}: está abierto en Excel. Ciérrelo y vuelva a correr, o use --salida=<otra ruta>.`);
  else console.error(e);
  process.exit(1);
}).then(() => {
  console.log(`OK ${path.basename(OUT)} · ${usuarios.length} usuarios · ${pacientes.length} pacientes · ${activos.length} activos · ${solicitudesCambioRuta.length} cambio(s) de ruta · ${avisos.length} aviso(s)`);
});
