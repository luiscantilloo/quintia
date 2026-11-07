// Comprueba que el Excel contiene cada dato del JSON.
// Recorre cada valor del JSON (texto, número, fecha, sí/no) y lo busca en las filas del Excel
// que corresponden a ese registro. Reporta lo que no encuentra.
// Uso: node comparar_excel.js [archivo.xlsx]
const path = require('path');
const ExcelJS = require('exceljs');

const XLSX_PATH = process.argv[2] || path.join(__dirname, 'NARA_datos_prueba_borrador.xlsx');
const data = require('./nara_datos_prueba.json');

// Campos que no van al Excel a propósito (con el motivo).
const OMITIDOS = {
  'usuarios.organizacion': null, // se compara normal; ejemplo de formato
};
const IGNORAR = [/^meta\./, /\.id$/ /* ids de servicio de ruta: se muestran por nombre */];

const iso = d => d.toISOString().slice(0, 16).replace('T00:00', '').replace('T', ' ');
function valoresCelda(v) {
  if (v == null) return [];
  if (v instanceof Date) return [iso(v)];
  if (typeof v === 'object' && 'result' in v) return valoresCelda(v.result);
  if (typeof v === 'object' && v.richText) return [v.richText.map(t => t.text).join('')];
  return [String(v)];
}
function hojaComoFilas(ws) {
  const filas = [];
  ws.eachRow((row, n) => { if (n > 1) filas.push(row.values.flatMap(valoresCelda)); });
  return filas;
}
function hojas(wb) { const h = {}; wb.eachSheet(ws => { h[ws.name] = hojaComoFilas(ws); }); return h; }

// Aplana un objeto a pares [ruta, valor] con valores simples.
function hojasDe(obj, pref = '', out = []) {
  if (obj == null) return out;
  if (Array.isArray(obj)) { obj.forEach((x, i) => hojasDe(x, `${pref}[${i}]`, out)); return out; }
  if (typeof obj === 'object') { Object.entries(obj).forEach(([k, v]) => hojasDe(v, pref ? `${pref}.${k}` : k, out)); return out; }
  out.push([pref, obj]);
  return out;
}
// Formas en que un valor del JSON puede aparecer en el Excel.
function formas(v) {
  if (typeof v === 'boolean') return v ? ['Sí', 'true'] : ['No', 'false', 'No aplica'];
  const s = String(v);
  const f = [s];
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s)) f.push(s.replace('T', ' '));
  return f;
}
const nombreDe = id => {
  const u = data.usuarios.find(x => x.id === id) || data.pacientes.find(x => x.id === id) || data.territorios.find(x => x.codigo === id);
  return u ? (u.nombre || null) : null;
};

(async () => {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(XLSX_PATH);
  const H = hojas(wb);
  const faltan = [];
  const filasDe = (hoja, clave) => (H[hoja] || []).filter(f => f.includes(clave));

  function revisar(etiqueta, registro, filas, ruta0) {
    const textos = filas.flat();
    for (const [ruta, v] of hojasDe(registro)) {
      const r = `${ruta0}.${ruta}`;
      if (IGNORAR.some(rx => rx.test(r.replace(/\[\d+\]/g, '')))) continue;
      if (v === null || v === '') continue;
      const candidatos = formas(v);
      // Un id puede aparecer como el nombre de la persona.
      if (typeof v === 'string') { const n = nombreDe(v); if (n) candidatos.push(n); if (v === 'TODOS') candidatos.push('Todos'); }
      const ok = candidatos.some(c => textos.some(t => t === c || (c.length > 2 && t.includes(c))));
      if (!ok) faltan.push(`${etiqueta} · ${ruta} = ${JSON.stringify(v)}`);
    }
  }

  data.territorios.forEach(t => revisar(`territorio ${t.codigo}`, t, filasDe('Territorios', t.codigo), 'territorios'));
  data.usuarios.forEach(u => revisar(`usuario ${u.id}`, u, filasDe('Usuarios', u.id), 'usuarios'));
  data.pacientes.forEach(p => {
    const filas = [...filasDe('Pacientes', p.id), ...filasDe('Flujo', p.id), ...filasDe('Rutas', p.id)];
    revisar(`paciente ${p.codigo}`, p, filas, 'pacientes');
  });
  data.activos.forEach(a => revisar(`activo ${a.codigo}`, a, filasDe('Activos', a.codigo), 'activos'));
  (data.solicitudesCambioRuta || []).forEach(s => revisar(`cambio ${s.id}`, s, [...filasDe('Cambios de ruta', s.id), ...filasDe('Rutas', s.id)], 'solicitudesCambioRuta'));

  // Conteos: mismos registros en ambos.
  const conteos = [
    ['Territorios', data.territorios.length], ['Usuarios', data.usuarios.length], ['Pacientes', data.pacientes.length],
    ['Flujo', data.pacientes.length], ['Activos', data.activos.length], ['Cambios de ruta', (data.solicitudesCambioRuta || []).length],
  ].map(([h, n]) => [h, n, (H[h] || []).length]);

  console.log(`Comparación JSON ↔ ${path.basename(XLSX_PATH)}`);
  conteos.forEach(([h, j, x]) => console.log(`  ${h.padEnd(16)} JSON ${String(j).padStart(3)} · Excel ${String(x).padStart(3)} ${j === x ? '✓' : '✗'}`));
  console.log(`\nDatos del JSON que no aparecen en el Excel: ${faltan.length}`);
  const porCampo = {};
  faltan.forEach(f => { const campo = f.split(' · ')[1].split(' = ')[0].replace(/\[\d+\]/g, '[]'); (porCampo[campo] = porCampo[campo] || []).push(f.split(' · ')[0]); });
  Object.entries(porCampo).forEach(([c, quien]) => console.log(`  ${c}  (${quien.length}: ${[...new Set(quien)].slice(0, 3).join(', ')}${quien.length > 3 ? '…' : ''})`));
  process.exit(faltan.length || conteos.some(([, j, x]) => j !== x) ? 1 : 0);
})();
