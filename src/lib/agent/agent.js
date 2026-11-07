// QUINTIA · agente local de respaldo. Prefiera /api/teo/ask (TEJIVA + datos vivos).
// No use cohortes demo de NARA/Parienta: si no hay store, diga que faltan datos del programa.
const A = () => (typeof window !== 'undefined' ? window.AlientoStore : null);
  const n0 = v => Math.round(v).toLocaleString('es-CO');
  const d1 = v => v.toFixed(1).replace('.', ',');
  const norm = t => t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[¿?¡!.,]/g, '').trim();
  const avg = a => a.reduce((x, y) => x + y, 0) / a.length;
  const PER = 'datos vivos del programa QUINTIA';
  const noDemo = (topic) => ({
    text: 'En QUINTIA no uso la cohorte demo de otros programas. Pregunte a TEJIVA con los datos registrados, o cargue personas en el programa para ver ' + topic + '.',
    basis: 'Programa QUINTIA · sin cohorte demo',
    method: 'Solo datos vivos del store o del API.',
  });

  function gloriaCharts(P) {
    const R = A().RISK;
    return [
      { type: 'line', title: 'PHQ-9', labels: P.phqDates, series: [{ values: P.phq, color: '#0F2D3B' }], yMax: 27, ticks: [0, 5, 10, 15, 20, 27], bands: R.map(r => ({ from: r.min, to: r.max === 27 ? 27 : r.max + 1, bg: r.bg })), yLabel: 'PHQ-9' },
      { type: 'bar', title: 'Sueño', labels: P.sleep.map((_, i) => String(15 + i)), values: P.sleep, colors: P.sleep.map(v => v < 4.5 ? '#D9692B' : '#A9D4FF'), ref: { value: 4.5, label: 'Referencia 4,5 h' }, yMax: 8, decimals: 1, unit: ' h', yLabel: 'Horas', tips: P.sleep.map((v, i) => 'Noche del ' + (15 + i) + ' sep: ' + d1(v) + ' h' + (v < 4.5 ? ' · bajo' : '')) }
    ];
  }

  const Q = {
    admin: [
      { id: 'a1', q: '¿Qué territorio va más atrasado en captación?', keys: ['atrasad', 'retrasad', 'mas lento', 'peor territorio', 'captacion'], run: () => {
        if (!A().SAMPLE || !A().SAMPLE.terr || !A().SAMPLE.terr.length) return noDemo('captación por territorio');
        const T = A().SAMPLE.terr.map(([name, cap, goal, ex, r, rg]) => ({ name, cap, goal, ex, r, rg, pct: cap / goal * 100 })).sort((a, b) => a.pct - b.pct);
        const w = T[0], per = w.goal / w.ex, avgPer = meta / expertos;
        return { text: w.name + ' va más atrasado: ' + n0(w.cap) + ' de ' + n0(w.goal) + ' (' + Math.round(w.pct) + ' %). Tiene ' + w.ex + ' expertos para ' + n0(w.goal) + ' personas, ' + n0(per) + ' por experto, frente a ' + n0(avgPer) + ' en promedio del programa. También está bajo la cuota rural: ' + w.r + ' % de ' + w.rg + ' %.',
          charts: [{ type: 'hbar', labels: T.map(t => t.name), values: T.map(t => Math.round(t.pct)), unit: ' %', max: 100, hi: 0, ref: { value: 45 }, tips: T.map(t => n0(t.cap) + ' de ' + n0(t.goal) + ' · ' + n0(t.goal / t.ex) + ' por experto') }],
          chartNote: 'Captación por territorio · línea: promedio del programa (45 %)',
          suggestion: 'Recomiendo sumar un experto en ' + w.name + ': con ' + (w.ex + 1) + ' quedarían ' + n0(w.goal / (w.ex + 1)) + ' personas por experto.',
          basis: 'Basado en 6 territorios · personas evaluadas del programa QUINTIA · ' + PER, method: 'Captación = evaluadas ÷ meta del territorio. Personas por experto = meta ÷ expertos asignados. Promedio del programa = meta ÷ expertos del programa expertos.',
          detail: { target: 'terr', filter: w.name, label: 'Territorios · ' + w.name }, report: true };
      } },
      { id: 'a2', q: '¿Cuántos pacientes hay en el programa?', keys: ['cuantos pacientes', 'numero de pacientes', 'pacientes hay'], run: S => {
        const n = Object.keys((S.recursos && S.recursos.people) || {}).length || Object.keys(A().PATIENTS || {}).length;
        return { text: n ? ('Hay ' + n0(n) + ' pacientes con ficha en el programa.') : 'Consulte a TEJIVA: le dirá el total actual de pacientes del programa.',
          basis: 'Pacientes del programa', method: 'Conteo de fichas de paciente.', detail: { target: 'people', label: 'Personas' }, report: true };
      } },
      { id: 'a3', q: '¿En qué territorios hay más personas captadas?', keys: ['mas personas', 'captadas', 'donde hay mas'], run: () => {
        const T = A().SAMPLE.terr.map(([name, cap]) => ({ name, cap })).sort((a, b) => b.cap - a.cap);
        return { text: T[0].name + ' concentra más captación con ' + n0(T[0].cap) + ' personas. Le siguen ' + T.slice(1, 3).map(t => t.name + ' (' + n0(t.cap) + ')').join(' y ') + '.',
          charts: [{ type: 'hbar', labels: T.map(t => t.name), values: T.map(t => t.cap), hi: 0, tips: T.map(t => n0(t.cap) + ' personas') }],
          basis: 'Personas evaluadas por territorio · ' + PER, method: 'Suma de captación (cap) por territorio.', detail: { target: 'terr', label: 'Territorios' }, report: true };
      } },
      { id: 'a4', q: '¿Qué expertos están activos y en qué territorio?', keys: ['expertos activos', 'quien trabaja', 'equipo de campo'], run: S => {
        const E = (S.experts || A().SAMPLE.experts || []).slice();
        if (!E.length) return { text: 'Pregunte a TEJIVA: le lista los expertos activos y su territorio.', basis: 'Equipos de campo', method: 'Listado de expertos.' };
        return { text: E.filter(e => e.active !== false).map(e => e.name + ' · ' + (e.terr || 'sin territorio')).join('; ') + '.',
          basis: 'Expertos de campo', method: 'Expertos con estado activo.', detail: { target: 'team', label: 'Equipos de campo' }, report: true };
      } }
    ],
    clin: [
      { id: 'c1', q: 'Resúmeme a Gloria antes de la llamada.', keys: ['gloria'], run: () => {
        const P = A().PATIENTS.gloria;
        if (!P || !Array.isArray(P.phq) || !P.phq.length) return { text: 'Gloria aún no tiene ficha con mediciones en el programa.', basis: 'Carga de casos · store vacío', method: 'Sin datos de paciente.' };
        const sleep = Array.isArray(P.sleep) ? P.sleep : [];
        const l5 = sleep.length ? avg(sleep.slice(-5)) : null, pr = sleep.length > 5 ? avg(sleep.slice(0, -5)) : null;
        return { lines: [
          'PHQ-9: ' + (P.phq.length > 1 ? 'de ' + P.phq[0] + ' a ' + P.phq[P.phq.length - 1] : P.phq[P.phq.length - 1]) + (P.phqDates && P.phqDates[0] ? ' desde el ' + P.phqDates[0] : '') + '.',
          l5 != null ? 'Sueño: ' + d1(l5) + ' h en promedio las últimas noches' + (pr != null ? ', antes ' + d1(pr) + ' h' : '') + '.' : 'Sin datos de sueño.',
          'Check-ins: ' + (P.lastCheckin ? 'último el ' + P.lastCheckin : 'sin registro') + (P.adherence != null ? '. Adherencia ' + P.adherence + ' %' : '') + '.',
        ], aiNote: P.summary ? 'En sus audios (resumen IA · verifique): ' + P.summary : '',
          text: '', charts: sleep.length ? gloriaCharts(P) : [], basis: 'Ficha de ' + P.name, method: 'Datos de la ficha en el store.',
          detail: { target: 'file', pid: 'gloria', label: 'Ficha de Gloria' }, report: true };
      } },
      { id: 'c6', q: '¿Quiénes dejaron su curso a la mitad?', keys: ['dejaron su curso', 'a la mitad', 'curso a medias'], run: () => ({ text: 'Los cursos ya no se usan en QUINTIA.', list: [], basis: 'Función retirada', method: 'Cursos y cuentos fuera del producto.' }) },
      { id: 'c7', q: '¿Qué compartieron mis pacientes de los cuentos esta semana?', keys: ['compartieron', 'de los cuentos'], run: () => ({ text: 'Los cuentos ya no se usan en QUINTIA.', list: [], basis: 'Función retirada', method: 'Cursos y cuentos fuera del producto.' }) },
      { id: 'c2', q: '¿Quiénes empeoraron este mes?', keys: ['empeor', 'peor'], run: () => {
        const P = A().PATIENTS, out = [];
        Object.keys(P).forEach(id => {
          const p = P[id]; if (!p || !Array.isArray(p.phq) || p.phq.length < 2) return;
          if (p.phq[p.phq.length - 1] > p.phq[p.phq.length - 2]) out.push({ pid: id, name: p.name, meta: 'PHQ-9 ' + p.phq[p.phq.length - 2] + ' → ' + p.phq[p.phq.length - 1] + ' · ' + p.profile, spark: p.phq });
        });
        return { text: out.length ? out.map(o => o.name).join(', ') + (out.length === 1 ? ' empeoró' : ' empeoraron') + ' según sus últimas mediciones.' : 'Nadie empeoró con los datos disponibles.', list: out,
          basis: 'Carga de casos en el store', method: 'Compara las dos últimas mediciones PHQ-9.', detail: { target: 'patients', label: 'Mis pacientes' } };
      } },
      { id: 'c3', q: '¿Quién no ha respondido check-ins en 7 días?', keys: ['check', 'respondido'], run: () => {
        const P = A().PATIENTS, out = Object.keys(P).filter(id => P[id] && P[id].checkinDays != null && P[id].checkinDays >= 7).map(id => ({ pid: id, name: P[id].name, meta: 'Último check-in: ' + (P[id].lastCheckin || '—') + ' · hace ' + P[id].checkinDays + ' días', spark: P[id].phq || [] }));
        return { text: out.length ? out.map(o => o.name).join(', ') + ' no responde check-ins hace más de 7 días.' : 'Nadie con check-ins atrasados en el store.', list: out,
          basis: 'Pacientes con check-ins registrados', method: 'Días desde el último check-in respondido.', detail: { target: 'patients', label: 'Mis pacientes' } };
      } },
      { id: 'c4', q: '¿Qué pacientes tienen sueño bajo después de la réplica del 24 de septiembre?', keys: ['sueno', 'replica'], run: () => {
        const P = A().PATIENTS, ids = Object.keys(P).filter(id => P[id] && Array.isArray(P[id].sleep) && P[id].sleep.length);
        if (!ids.length) return { text: 'No hay pacientes con datos de sueño en el store.', basis: 'Datos de sueño', method: 'Sin series de sueño.' };
        const rows = ids.map(id => ({ id, v: avg(P[id].sleep.slice(-5)) }));
        const low = rows.filter(r => r.v < 4.5);
        return { text: low.length ? low.map(r => P[r.id].name + ' (' + d1(r.v) + ' h)').join(', ') + ' duerme menos de 4,5 horas en promedio.' : 'Ningún paciente con sueño bajo según los datos disponibles.',
          charts: [{ type: 'hbar', labels: rows.map(r => P[r.id].name), values: rows.map(r => +r.v.toFixed(1)), decimals: 1, unit: ' h', max: 8, ref: { value: 4.5 }, colors: rows.map(r => r.v < 4.5 ? '#D9692B' : '#A9D4FF') }],
          list: low.map(r => ({ pid: r.id, name: P[r.id].name, meta: 'Sueño ' + d1(r.v) + ' h' })),
          basis: ids.length + ' pacientes con sueño', method: 'Promedio de las últimas noches, comparado con 4,5 h.' };
      } },
      { id: 'c5', q: 'Redacta la carta de remisión de Gloria.', keys: ['carta', 'remision'], run: () => ({
        text: 'Borrador listo. Revíselo antes de usarlo.', draft: 'Remito a Gloria Patiño, 64 años, de la Vereda Palestina (Salento), perfil P11. Su PHQ-9 bajó de 17 a 13 desde agosto, pero desde la réplica del 24 de septiembre duerme 3,9 horas en promedio (antes 6,2). Solicito valoración por psiquiatría para el insomnio que no cede y considerar manejo farmacológico. La paciente autorizó compartir su caso.',
        draftAction: 'use-ref-gloria', basis: 'Ficha de Gloria Patiño · datos al 29 sep', method: 'El texto lo redacta la IA con datos de la ficha. Es un borrador hasta que usted lo confirme.' }) }
    ],
    fin: [
      { id: 'f9', q: '¿Mejoran más quienes terminan un curso?', keys: ['terminan un curso', 'mejoran mas'], run: () => { const ph = A().REC.STATS.phq; return { text: 'Quienes terminan un curso bajan en promedio ' + String(-ph.done[1]).replace('.', ',') + ' puntos en el PHQ-9; quienes no lo terminan, ' + String(-ph.notDone[1]).replace('.', ',') + '. Es una asociación, no una causa: quienes terminan pueden ser también quienes tenían más apoyo.', charts: [{ type: 'bar', labels: ['Terminan el curso', 'No lo terminan'], values: [-ph.done[1], -ph.notDone[1]], colors: ['#0F2D3B', '#A9D4FF'], yLabel: 'Puntos que baja el PHQ-9' }], chartNote: 'Asociación, no causa', basis: (ph.done[0] + ph.notDone[0]) + ' personas con curso y dos PHQ-9 · ' + ph.done[0] + ' terminaron', method: 'Diferencia entre el primer PHQ-9 y el más reciente, por grupo. No controla otras diferencias entre grupos.' }; } },
      { id: 'f1', q: '¿Cómo va el programa frente al plan?', keys: ['plan', 'como va'], run: () => ({
        text: 'El programa lleva el avance de captación del programa personas (45 %). La última semana se evaluaron 638, por debajo de las 669 semanales necesarias para terminar a tiempo: faltan 31 por semana.',
        charts: [{ type: 'bar', labels: ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'S9'], values: A().SAMPLE.weeks, ref: { value: 669, label: 'Ritmo necesario' }, hi: 8, yLabel: 'Personas', tips: A().SAMPLE.weeks.map((v, i) => 'Semana ' + (i + 1) + ': ' + n0(v)) }],
        basis: 'Personas evaluadas por semana · 9 semanas · ' + PER, method: 'Ritmo necesario = personas que faltan ÷ semanas que quedan en la fase 1.', report: true, extra: [{ label: 'Agregar al informe', action: 'add-board' }] }) },
      { id: 'f2', q: '¿Cuánto cuesta cada persona atendida?', keys: ['cuesta', 'costo'], run: () => {
        const B = A().SAMPLE.budget;
        return { text: 'Cerca de $1,0 millones por persona evaluada: el presupuesto ejecutado ejecutados para personas del programa. El rubro de equipos ya está ejecutado casi completo (1.498 de 1.500), así que el costo por persona bajará a medida que avance la captación.',
          charts: [{ type: 'hbar', labels: B.map(b => b[0]), values: B.map(b => +(b[3] / 3933).toFixed(2)), decimals: 2, unit: ' M', tips: B.map(b => n0(b[3]) + ' M ejecutados') }], chartNote: 'Costo por persona evaluada, por rubro (millones COP)',
          basis: 'Ejecución presupuestal al 29 sep · personas evaluadas del programa QUINTIA', method: 'Ejecutado por rubro ÷ personas evaluadas.', report: true, extra: [{ label: 'Agregar al informe', action: 'add-board' }] };
      } },
      { id: 'f3', q: '¿Está funcionando igual para quienes no usan la app?', keys: ['app', 'digital', 'igual'], run: () => {
        const D = A().SAMPLE.improveByDig;
        return { text: 'Funciona, aunque un poco menos. Mejoró el ' + D[0][1] + ' % de quienes tienen capacidad digital baja, frente al ' + D[2][1] + ' % de quienes usan la app (' + (D[2][1] - D[0][1]) + ' puntos de diferencia). El grupo de capacidad media está en ' + D[1][1] + ' %.',
          charts: [{ type: 'bar', labels: D.map(x => 'Digital ' + x[0].toLowerCase()), values: D.map(x => x[1]), unit: ' %', yMax: 60, colors: A().DIG.map(x => x.c), yLabel: '% mejoró', tips: D.map(x => x[1] + ' % · n = ' + n0(x[2])) }],
          basis: 'Basado en 1.860 personas con 2 o más mediciones · ' + PER, method: 'Proporción que bajó 5 o más puntos en PHQ-9 entre la primera y la última medición, por nivel digital de la línea base.', report: true, extra: [{ label: 'Agregar al informe', action: 'add-board' }] };
      } }
    ],
    inv: [
      { id: 'i1', q: '¿Cambia la mejoría según la capacidad digital?', keys: ['mejoria', 'capacidad digital'], run: () => {
        const D = A().SAMPLE.improveByDig;
        return { text: 'Un poco: mejoró el ' + D[0][1] + ' % con capacidad digital baja (n = ' + D[0][2] + '), el ' + D[1][1] + ' % con media (n = ' + D[1][2] + ') y el ' + D[2][1] + ' % con alta (n = ' + D[2][2] + '). La diferencia entre baja y alta es de ' + (D[2][1] - D[0][1]) + ' puntos.',
          charts: [{ type: 'bar', labels: D.map(x => x[0] + ' (n=' + x[2] + ')'), values: D.map(x => x[1]), unit: ' %', yMax: 60, colors: A().DIG.map(x => x.c), yLabel: '% mejoró' }],
          basis: 'n = 1.860 personas seudonimizadas con 2+ mediciones · ' + PER, method: 'Método: proporción que bajó 5+ puntos en PHQ-9 (primera vs. última medición), por nivel digital de la línea base. Descriptivo, sin prueba estadística.', report: true, extra: [{ label: 'Convertir en solicitud de datos', action: 'to-request' }] };
      } },
      { id: 'i2', q: '¿Qué relación hay entre sueño y PHQ-9?', keys: ['sueno', 'relacion'], run: () => {
        const B = A().SAMPLE.sleepBands, vis = B.filter(b => b[2] >= 10), hid = B.length - vis.length, n = vis.reduce((a, b) => a + b[2], 0);
        return { text: 'Quienes duermen menos tienen puntajes más altos: ' + d1(vis[0][1]) + ' en promedio con menos de 5 horas, frente a ' + d1(vis[vis.length - 1][1]) + ' con 7 a 8 horas. Es una asociación; no muestra que una cosa cause la otra.',
          charts: [{ type: 'bar', labels: vis.map(b => b[0]), values: vis.map(b => b[1]), decimals: 1, yMax: 20, yLabel: 'PHQ-9 promedio', tips: vis.map(b => d1(b[1]) + ' · n = ' + b[2]) }],
          privacy: hid ? 'Se oculta ' + hid + ' grupo con menos de 10 personas.' : '',
          basis: 'n = ' + n0(n) + ' personas con sueño y 2+ mediciones · sueño promedio de 14 noches · ' + PER, method: 'Método: PHQ-9 promedio de la última medición según el promedio de sueño. Descriptivo. Los grupos de menos de 10 personas se ocultan.', report: true, extra: [{ label: 'Convertir en solicitud de datos', action: 'to-request' }] };
      } }
    ],
    inst: [
      { id: 'n1', q: 'Resúmeme el caso de Beatriz antes de la cita', keys: ['beatriz'], run: S => {
        const r = S.referrals.find(x => x.pid === 'beatriz' && x.inst === 'hsal'); if (!r) return { text: 'Beatriz Salazar no tiene una remisión activa a esta institución.', basis: 'Casos remitidos a esta institución' };
        const P = A().PATIENTS.beatriz;
        return { text: 'Beatriz Salazar, 52 años, de Salento. Remitida el ' + r.date + ' por la ' + r.by + ': ' + r.reason + ' Su PHQ-9 subió tres veces seguidas, de ' + P.phq[0] + ' a ' + P.phq[P.phq.length - 1] + '. Estado: ' + r.status + '.',
          charts: [{ type: 'line', labels: P.phqDates, series: [{ values: P.phq, color: '#0F2D3B' }], yMax: 27, ticks: [0, 5, 10, 15, 20, 27], bands: A().RISK.map(x => ({ from: x.min, to: x.max === 27 ? 27 : x.max + 1, bg: x.bg })), yLabel: 'PHQ-9' }],
          basis: 'Solo el caso remitido · ' + P.phqDates[0] + ' – 29 sep · 1 paciente que autorizó compartir', method: 'Datos de la remisión y mediciones PHQ-9 del caso remitido.', detail: { target: 'casos', label: 'Casos remitidos' } };
      } },
      { id: 'n2', q: '¿Qué casos tengo pendientes de cita?', keys: ['pendiente'], run: S => {
        const L = S.referrals.filter(x => x.inst === 'hsal' && x.status === 'Pendiente de cita');
        return { text: L.length ? 'Tiene ' + L.length + (L.length === 1 ? ' caso pendiente de cita: ' : ' casos pendientes de cita: ') + L.map(x => x.name).join(', ') + '.' : 'No tiene casos pendientes de cita.', list: L.map(x => ({ name: x.name, meta: 'Remitido el ' + x.date + ' · ' + x.reason })),
          basis: 'Casos remitidos a esta institución · ' + S.referrals.filter(x => x.inst === 'hsal').length + ' casos', method: 'Remisiones con estado «Pendiente de cita».', detail: { target: 'casos', label: 'Casos remitidos' } };
      } }
    ]
  };

  // Filtros en texto libre: territorio, riesgo, nivel digital, perfil
  const TERRS = () => A().SAMPLE.terr.map(t => t[0]).concat((A().get().territories || []).map(t => t.name));
  function parseFilters(text) {
    const t = norm(text), f = {};
    TERRS().forEach(n => { if (t.includes(norm(n))) f.terr = n; });
    if (/moderado[ -]?severo|mod severo/.test(t)) f.risk = 3; else if (/severo|grave/.test(t)) f.risk = 4; else if (/moderado/.test(t)) f.risk = 2; else if (/\bleve/.test(t)) f.risk = 1; else if (/minimo/.test(t)) f.risk = 0;
    const dm = t.match(/digital (baja|media|alta)|(baja|media|alta) capacidad digital|capacidad digital (baja|media|alta)/); if (dm) f.dig = ['baja', 'media', 'alta'].indexOf(dm[1] || dm[2] || dm[3]);
    const pm = t.match(/\bp ?(\d{1,2})\b/); if (pm && +pm[1] >= 1 && +pm[1] <= 15) { const c = A().parseCode('P' + String(+pm[1]).padStart(2, '0')); f.risk = c.r; f.dig = c.d; f.profile = 'P' + String(+pm[1]).padStart(2, '0'); }
    return f;
  }
  const hasF = f => f.terr || f.risk != null || f.dig != null;
  function filterLabel(f) {
    const R = A().RISK, D = A().DIG, p = [];
    if (f.profile) p.push('perfil ' + f.profile); else { if (f.risk != null) p.push('riesgo ' + R[f.risk].k); if (f.dig != null) p.push('capacidad digital ' + D[f.dig].k.toLowerCase()); }
    return 'personas' + (p.length ? ' con ' + p.join(' y ') : '') + (f.terr ? ' en ' + f.terr : ' en todo el programa');
  }
  function countQuery(f) {
    const A_ = A(), R = A_.RISK, D = A_.DIG;
    const grid = f.terr ? (A_.territoryDist(f.terr) || [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]]) : A_.HEAT;
    const sum = (ri, di) => grid.reduce((a, row, r) => a + row.reduce((b, v, d) => b + ((ri == null || ri === r) && (di == null || di === d) ? v : 0), 0), 0);
    const n = sum(f.risk, f.dig), label = filterLabel(f), tot = sum(null, null);
    const bars = R.map((r, i) => sum(i, f.dig)), hidden = bars.filter(v => v > 0 && v < 10).length;
    const text = n === 0 ? 'No hay ' + label + '.' : n < 10 ? 'Hay menos de 10 ' + label + '. Para proteger su privacidad no se muestra el número exacto.' : 'Hay ' + n0(n) + ' ' + label + (f.risk != null || f.dig != null ? ': el ' + Math.round(n / tot * 100) + ' % de las ' + n0(tot) + ' evaluadas' + (f.terr ? ' en ' + f.terr : '') + '.' : '.');
    return { text, understoodLabel: 'Entendí: «¿Cuántas personas hay' + label.replace(/^personas/, '') + '?»',
      charts: n >= 10 ? [{ type: 'bar', labels: R.map(r => r.k === 'Moderado-severo' ? 'Mod-severo' : r.k), values: bars.map(v => v < 10 ? null : v), colors: R.map(r => r.c), yLabel: 'Personas', tips: bars.map((v, i) => R[i].k + ': ' + (v < 10 ? 'menos de 10' : n0(v))) }] : [],
      chartNote: 'Personas por nivel de riesgo' + (f.dig != null ? ' · capacidad digital ' + D[f.dig].k.toLowerCase() : '') + (f.terr ? ' · ' + f.terr : ''),
      privacy: hidden ? 'Se ocultan ' + hidden + (hidden === 1 ? ' grupo' : ' grupos') + ' con menos de 10 personas.' : '',
      basis: 'Basado en ' + n0(tot) + ' personas evaluadas' + (f.terr ? ' en ' + f.terr : ' en 6 territorios') + ' · ' + PER, method: 'Cuenta de personas por perfil en la evaluación inicial, con los filtros indicados. Los grupos de menos de 10 personas se ocultan.', report: true };
  }
  const COUNT = (id, q) => ({ id, q, param: 'count', keys: [], run: (S, f) => countQuery(f || parseFilters(q)) });
  function terrQuery(f) {
    const T = A().SAMPLE.terr.map(([name, cap, goal, ex, r, rg]) => ({ name, cap, goal, ex, r, rg })).concat((A().get().territories || []).map(t => ({ name: t.name, cap: t.cap, goal: t.goal, ex: 0, r: t.rural, rg: t.ruralG })));
    const t = T.find(x => x.name === (f.terr || 'Salento')); if (!t) return { text: 'No encuentro ese territorio.', basis: 'Territorios del programa' };
    return { understoodLabel: 'Entendí: «¿Cómo va la captación en ' + t.name + '?»', text: t.name + ' lleva ' + n0(t.cap) + ' de ' + n0(t.goal) + ' personas (' + Math.round(t.cap / t.goal * 100) + ' %). Rural: ' + (t.cap ? t.r + ' %' : '—') + ' frente a una meta de ' + t.rg + ' %.' + (t.cap && t.r < t.rg - 2 ? ' Está bajo la cuota rural.' : ''),
      charts: [{ type: 'hbar', labels: ['Captación', 'Rural'], values: [Math.round(t.cap / t.goal * 100), t.r], unit: ' %', max: 100, tips: [n0(t.cap) + ' de ' + n0(t.goal), 'meta ' + t.rg + ' %'] }],
      basis: 'Territorio ' + t.name + ' · ' + PER, method: 'Captación = evaluadas ÷ meta. Rural = proporción de evaluadas en veredas.', detail: { target: 'terr', filter: t.name, label: 'Territorios · ' + t.name }, report: true };
  }
  const TERRQ = (id, q) => ({ id, q, param: 'terr', keys: [], run: (S, f) => terrQuery(f || parseFilters(q)) });
  const P_ = () => A().PATIENTS;
  Q.admin.push(
    COUNT('a5', '¿Cuántas personas hay en Pereira con riesgo severo?'),
    TERRQ('a6', '¿Cómo va la captación en Salento?'),
    { id: 'a7', q: '¿Cuántas personas llevan más de 14 días sin contacto?', keys: ['sin contacto', '14 dias'], run: () => ({ text: '312 personas llevan más de 14 días sin contacto: el 8 % de la cohorte. Los expertos las reactivan con una llamada o una revisita.', basis: 'personas evaluadas del programa QUINTIA · hasta hoy 29 sep', method: 'Personas sin ningún contacto de su ruta en 14 días.', detail: { target: 'people', label: 'Personas' }, report: true }) },
    { id: 'a8', q: '¿Qué expertos van bajo la meta de la semana?', keys: ['bajo meta', 'bajo la meta', 'expertos'], run: S => { const L = [['Diego Alejandro Mesa', 'Armenia', 29], ['Jhon Fredy Castaño', 'Calarcá', 27], ['Mauricio Londoño', 'Pereira', 30], ['Carlos Mario Arias', 'Manizales', 22], ['Juliana Herrera', 'Manizales', 28]].concat([['Andrés Ocampo', 'Salento', A().quotas(S, 'andres').week], ['María José Vélez', 'Armenia', A().quotas(S, 'mj').week]]).filter(x => x[2] < 34).sort((a, b) => a[2] - b[2]); return { text: L.length + ' expertos van bajo la meta (menos de 34 de 45 a mitad de semana). El más atrasado es ' + L[0][0] + ' (' + L[0][1] + ') con ' + L[0][2] + '.', charts: [{ type: 'hbar', labels: L.map(x => x[0]), values: L.map(x => x[2]), max: 45, ref: { value: 34 }, tips: L.map(x => x[1] + ' · ' + x[2] + ' de 45') }], chartNote: 'Visitas validadas esta semana · línea: 34 (ritmo esperado a mitad de semana)', basis: '14 expertos · semana del 28 sep', method: 'Visitas validadas en la semana frente al ritmo esperado a mitad de semana.', detail: { target: 'team', label: 'Equipos de campo' }, report: true }; } },
    { id: 'a9', q: '¿Qué cambios de ruta están esperando aprobación?', keys: ['aprobacion', 'cambio de ruta', 'cambios de ruta'], run: S => { const L = S.pathRequests || []; return { text: L.length ? L.length + (L.length === 1 ? ' cambio espera' : ' cambios esperan') + ' la aprobación de la líder clínica: ' + L.map(x => x.code).join(', ') + '.' : 'No hay cambios de ruta esperando aprobación.', basis: 'Solicitudes enviadas desde el editor de rutas', method: 'Cambios enviados a aprobación clínica y todavía sin respuesta.', detail: { target: 'paths', label: 'Rutas' } }; } },
    { id: 'a15', q: '¿Qué vereda necesita más atención?', keys: ['necesita mas atencion', 'mas atencion'], run: S => { const T = window.__naraTerr || 'Salento', M = A().placeMap(S, T), sc = r => (r.pct < 30 ? 2 : 0) + r.alerts + (r.risk[4] > 0 && r.km > 20 ? 2 : 0) + (r.risk[3] + r.risk[4]) / Math.max(1, r.n) * 5; const L = M.rows.slice().sort((x, y) => sc(y) - sc(x)).slice(0, 5), top = L[0]; if (!top) return { text: T + ' todavía no tiene veredas ni barrios registrados.', basis: T }; const why = []; if (top.pct < 30) why.push('va en ' + top.pct + ' % de su meta de captación'); if (top.alerts) why.push('tiene ' + top.alerts + (top.alerts === 1 ? ' alerta abierta' : ' alertas abiertas')); if (top.risk[4] > 0 && top.km > 20) why.push('tiene personas en riesgo severo a ' + top.km + ' km del clínico presencial más cercano'); return { text: top.name + ' necesita más atención en ' + T + ': ' + (why.join(', ') || 'es la que tiene más personas en riesgo moderado-severo o severo') + '.', charts: [{ type: 'hbar', labels: L.map(r => r.name), values: L.map(r => r.pct), unit: ' %', max: 100, ref: { value: 30 }, hi: 0, tips: L.map(r => r.alerts + ' alertas · ' + r.km + ' km al clínico') }], chartNote: '% de la meta de captación · línea: 30 %', basis: M.rows.length + ' veredas y barrios de ' + T + ' · hoy', method: 'Suma captación bajo 30 %, alertas abiertas, riesgo severo a más de 20 km de un clínico y proporción de riesgo alto. Es un orden para revisar, no un juicio sobre el equipo.', detail: { target: 'terr', label: 'Territorio · mapa' } }; } },
    { id: 'a16', q: '¿Dónde hay personas en riesgo severo lejos de un clínico?', keys: ['lejos de un clinico', 'lejos del clinico', 'severo lejos'], run: S => { const T = window.__naraTerr || 'Salento', M = A().placeMap(S, T), L = M.farSev; return { text: L.length ? 'En ' + T + ', ' + L.length + (L.length === 1 ? ' vereda tiene' : ' veredas tienen') + ' personas en riesgo severo a más de 20 km del clínico presencial más cercano: ' + L.map(r => r.name + ' (' + r.km + ' km, ' + A().small(r.risk[4]).toLowerCase() + ' personas)').join(', ') + '.' : 'En ' + T + ' no hay personas en riesgo severo a más de 20 km de un clínico presencial.', charts: L.length ? [{ type: 'hbar', labels: L.map(r => r.name), values: L.map(r => r.km), unit: ' km', ref: { value: 20 } }] : [], chartNote: 'Distancia al clínico presencial más cercano · línea: 20 km', basis: 'Veredas y barrios de ' + T + ' · grupos de menos de 10 sin cifra exacta', method: 'Personas con PHQ-9 de 20 o más en la última evaluación, y distancia por carretera desde el centro de la vereda al clínico presencial más cercano.', detail: { target: 'terr', label: 'Territorio · mapa' } }; } },
    { id: 'a17', q: '¿Qué veredas van atrasadas en captación?', keys: ['atrasadas', 'atrasada', 'captacion por vereda'], run: S => { const T = window.__naraTerr || 'Salento', M = A().placeMap(S, T), L = M.rows.slice().sort((x, y) => x.pct - y.pct).slice(0, 6); return { text: M.low.length ? M.low.length + (M.low.length === 1 ? ' vereda o barrio de ' + T + ' va' : ' veredas o barrios de ' + T + ' van') + ' bajo el 30 % de su meta: ' + M.low.map(r => r.name + ' (' + r.pct + ' %)').join(', ') + '.' : 'Ninguna vereda ni barrio de ' + T + ' está bajo el 30 % de su meta.', charts: [{ type: 'hbar', labels: L.map(r => r.name), values: L.map(r => r.pct), unit: ' %', max: 100, ref: { value: 30 }, colors: L.map(r => r.pct < 30 ? '#D9692B' : '#A9D4FF') }], chartNote: '% de la meta de captación por vereda o barrio · línea: 30 %', basis: M.rows.length + ' veredas y barrios de ' + T, method: 'Personas evaluadas ÷ meta de la vereda o barrio.', detail: { target: 'terr', label: 'Territorio · mapa' } }; } },
    { id: 'a18', q: '¿Cómo va esta vereda?', keys: ['como va la vereda', 'como va el barrio', 'esta vereda'], run: (S, f, text) => { const T = window.__naraTerr || 'Salento', M = A().placeMap(S, T), nt = (text || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''), r = M.rows.find(x => nt.includes(x.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''))) || M.rows.find(x => x.name === window.__naraPlace); if (!r) return { text: 'Dígame el nombre de la vereda o barrio de ' + T + '.', basis: T }; const sm = A().small; return { text: r.name + ' (' + (r.rural ? 'rural' : 'urbana') + ') lleva ' + sm(r.n).toLowerCase() + ' personas evaluadas de una meta de ' + r.goal + ' (' + r.pct + ' %). Riesgo severo: ' + sm(r.risk[4]).toLowerCase() + '. ' + (r.alerts ? r.alerts + (r.alerts === 1 ? ' alerta abierta. ' : ' alertas abiertas. ') : 'Sin alertas abiertas. ') + 'Clínico presencial más cercano a ' + r.km + ' km. Experto asignado: ' + r.expert + '.', basis: r.name + ' · ' + T + ' · hoy · grupos de menos de 10 sin cifra exacta', method: 'Evaluaciones validadas en la vereda, alertas sin cerrar y distancia por carretera al clínico presencial más cercano.', detail: { target: 'terr', label: 'Territorio · mapa' } }; } },
    { id: 'a19', q: '¿Qué cursos terminan más las personas?', keys: ['cursos terminan', 'terminan mas', 'que cursos'], run: () => ({ text: 'Los cursos ya no se usan en QUINTIA.', basis: 'Función retirada', method: 'Cursos y cuentos fuera del producto.' }) },
    { id: 'a20', q: '¿Qué cuentos se usan más en los grupos de apoyo?', keys: ['cuentos se usan', 'cuentos en los grupos', 'cuentos mas usados'], run: () => ({ text: 'Los cuentos ya no se usan en QUINTIA.', basis: 'Función retirada', method: 'Cursos y cuentos fuera del producto.' }) },
    { id: 'a21', q: '¿Cuántos cuadernillos impresos faltan en Salento?', keys: ['cuadernillo'], param: 'terr', run: () => ({ text: 'Los cuadernillos de curso ya no se usan en QUINTIA.', basis: 'Función retirada', method: 'Cursos y cuentos fuera del producto.' }) },
    { id: 'a11', q: '¿Quién tiene la duración promedio más baja?', keys: ['duracion', 'mas baja', 'minutos'], run: S => { const P = A().teamPerf(S, '4w'), L = P.rows.slice().sort((x, y) => x.dur - y.dur).slice(0, 5), low = L.filter(r => r.dur < 20); return { text: L[0].name + ' (' + L[0].terr + ') tiene la duración promedio más baja: ' + L[0].dur + ' minutos por visita.' + (low.length ? ' ' + (low.length === 1 ? 'Es la única' : 'Hay ' + low.length) + ' por debajo del mínimo de 20 minutos.' : '') + ' El promedio del programa es ' + P.program.dur + ' minutos.', charts: [{ type: 'hbar', labels: L.map(r => r.name), values: L.map(r => r.dur), ref: { value: 20 }, colors: L.map(r => r.dur < 20 ? '#D9692B' : '#A9D4FF'), tips: L.map(r => r.terr + ' · ' + r.dur + ' min') }], chartNote: 'Minutos por visita · últimas 4 semanas · línea: mínimo de 20', basis: P.rows.length + ' expertos · últimas 4 semanas', method: 'Promedio de minutos entre el inicio y el cierre de cada visita validada o en revisión.', detail: { target: 'team', label: 'Equipos de campo · Desempeño' }, report: true }; } },
    { id: 'a12', q: '¿Qué expertos tienen problemas de GPS esta semana?', keys: ['gps'], run: S => { const P = A().teamPerf(S, 'week'), L = P.rows.filter(r => r.gps < 95).sort((x, y) => x.gps - y.gps); const fl = S.flags.filter(f => /GPS/.test(f.reasons.join(' ')) && f.status === 'pending'); return { text: L.length ? L.length + (L.length === 1 ? ' experto tiene' : ' expertos tienen') + ' menos del 95 % de visitas con GPS correcto esta semana. ' + L.slice(0, 3).map(r => r.name + ' (' + r.terr + ', ' + r.gps + ' %)').join(', ') + '.' + (fl.length ? ' Hay ' + fl.length + ' visita marcada por GPS en control de calidad.' : '') : 'Todos los expertos tienen 95 % o más de visitas con GPS correcto esta semana.', charts: L.length ? [{ type: 'hbar', labels: L.map(r => r.name), values: L.map(r => r.gps), unit: ' %', max: 100, ref: { value: 95 }, colors: L.map(r => r.gps < 90 ? '#D9692B' : '#A9D4FF') }] : [], chartNote: '% de visitas con inicio y cierre en el mismo lugar y dentro del territorio', basis: P.rows.length + ' expertos · esta semana', method: 'Una visita tiene GPS correcto si el inicio y el cierre están a menos de 200 m y dentro del territorio asignado.', detail: { target: 'team', label: 'Equipos de campo · Desempeño' }, report: true }; } },
    { id: 'a13', q: 'Compara Salento con Armenia', keys: ['compara', 'salento con armenia', 'armenia con salento'], run: S => { const T = ['Salento', 'Armenia'].map(n => { const t = A().terrInfo(S, n), P = A().teamPerf(S, '4w', n); return { n, t, p: P.program, k: P.rows.length }; }); const [s, a] = T; return { text: 'Salento lleva ' + Math.round(s.t.cap / s.t.goal * 100) + ' % de su meta y Armenia ' + Math.round(a.t.cap / a.t.goal * 100) + ' %. Salento tiene más mezcla rural (' + s.t.rural + ' % contra ' + a.t.rural + ' %) y visitas más largas (' + s.p.dur + ' contra ' + a.p.dur + ' min). Armenia hace más visitas por día (' + String(a.p.vpd).replace('.', ',') + ' contra ' + String(s.p.vpd).replace('.', ',') + ').', charts: [{ type: 'hbar', labels: ['Captación · Salento', 'Captación · Armenia', 'Rural · Salento', 'Rural · Armenia', 'GPS correcto · Salento', 'GPS correcto · Armenia'], values: [Math.round(s.t.cap / s.t.goal * 100), Math.round(a.t.cap / a.t.goal * 100), s.t.rural, a.t.rural, s.p.gps, a.p.gps], unit: ' %', max: 100, colors: ['#0F2D3B', '#A9D4FF', '#0F2D3B', '#A9D4FF', '#0F2D3B', '#A9D4FF'] }], chartNote: 'Tinta: Salento · celeste: Armenia', basis: 'Salento (' + s.k + ' expertos) y Armenia (' + a.k + ' expertos) · últimas 4 semanas', method: 'Captación = evaluadas ÷ meta. Rural = evaluadas en veredas. Duración, visitas por día y GPS: promedio de los expertos del territorio.', detail: { target: 'team', label: 'Equipos de campo · Desempeño' }, report: true }; } },
    { id: 'a14', q: '¿Cuántas personas tienen PM+ o grupo de apoyo en su ruta?', keys: ['pm+', 'pm ', 'grupo de apoyo', 'ayudas sociales'], run: () => ({ text: 'PM+ y grupos de apoyo ya no se usan en QUINTIA.', basis: 'Función retirada', method: 'PM+ y grupos fuera del producto.' }) },
    { id: 'a10', q: '¿Cuántas crisis hubo este mes y qué tan rápido se atendieron?', keys: ['crisis', 'rapido'], run: S => { const n = 27 + S.closedToday.filter(c => c.sev === 'crisis').length; return { text: n + ' alertas de crisis en septiembre. Todas se atendieron en menos de 30 minutos; la mediana fue de 14 minutos.', basis: 'Alertas de crisis · 1 – 29 sep', method: 'Tiempo desde la alerta hasta que un clínico toma el caso.', report: true }; } }
  );
  Q.clin.push(
      { id: 'c6', q: '¿Quiénes dejaron su curso a la mitad?', keys: ['dejaron su curso', 'a la mitad', 'curso a medias'], run: () => ({ text: 'Los cursos ya no se usan en QUINTIA.', list: [], basis: 'Función retirada', method: 'Cursos y cuentos fuera del producto.' }) },
      { id: 'c7', q: '¿Qué compartieron mis pacientes de los cuentos esta semana?', keys: ['compartieron', 'de los cuentos'], run: () => ({ text: 'Los cuentos ya no se usan en QUINTIA.', list: [], basis: 'Función retirada', method: 'Cursos y cuentos fuera del producto.' }) },
    { id: 'c8', q: '¿Quiénes tienen adherencia baja?', keys: ['adherencia'], run: () => { const L = A().CASE_IDS.map(id => P_()[id]).filter(p => p.adherence != null && p.adherence < 75).sort((a, b) => a.adherence - b.adherence); return { text: L.length + ' pacientes tienen adherencia menor al 75 %.', charts: [{ type: 'hbar', labels: L.map(p => p.name), values: L.map(p => p.adherence), unit: ' %', max: 100, ref: { value: 75 } }], list: L.map(p => ({ pid: p.id, name: p.name, meta: 'Adherencia ' + p.adherence + ' %' })), basis: 'Su carga de casos · ' + A().CASE_IDS.length + ' pacientes', method: 'Sesiones y check-ins cumplidos ÷ programados.' }; } },
    { id: 'c9', q: '¿Qué remisiones tengo abiertas?', keys: ['remisiones', 'remitid'], run: S => { const L = S.referrals.filter(r => r.by === 'Dra. Lucía Marín'); return { text: 'Tiene ' + L.length + ' remisiones abiertas.', list: L.map(r => ({ pid: r.pid, name: r.name, meta: r.status + (r.contra ? ' · contrarreferencia recibida' : '') })), basis: 'Remisiones hechas por usted', method: 'Remisiones activas y su estado en la institución.' }; } },
    { id: 'c10', q: '¿Quiénes no autorizaron compartir su caso?', keys: ['autoriz', 'consentimiento'], run: S => { const L = A().CASE_IDS.map(id => P_()[id]).filter(p => p.consentKey ? !S.consents[p.consentKey].remision : !p.consent); return { text: L.length + ' pacientes no autorizaron compartir su caso con otra institución. Para remitirlos hay que pedir el consentimiento.', list: L.map(p => ({ pid: p.id, name: p.name, meta: p.profile })), basis: 'Su carga de casos · consentimientos vigentes', method: 'Consentimiento de remisión de cada paciente.' }; } }
  );
  Q.fin.push(
    COUNT('f4', '¿Cuántas personas hay en Pereira con riesgo severo?'),
    TERRQ('f5', '¿Cómo va la captación en Manizales?'),
    { id: 'f6', q: '¿Qué tan rápido se atienden las crisis?', keys: ['crisis', 'rapido'], run: () => ({ text: 'Las 27 alertas de crisis de septiembre se atendieron en menos de 30 minutos. La mediana fue de 14 minutos.', charts: [{ type: 'bar', labels: ['0–10 min', '10–20 min', '20–30 min', 'Más de 30'], values: [11, 12, 4, 0], yLabel: 'Alertas' }], basis: '27 alertas de crisis · 1 – 29 sep', method: 'Tiempo desde la alerta hasta que un clínico toma el caso.', report: true, extra: [{ label: 'Agregar al informe', action: 'add-board' }] }) },
    { id: 'f7', q: '¿Cuánto cuesta la IA este mes?', keys: ['ia', 'inteligencia'], run: () => ({ text: 'La IA cuesta $3,9 millones este mes, de $4,5 millones presupuestados (87 %). Son unas 9.410 conversaciones con pacientes.', basis: 'Costos de septiembre · al 29 sep', method: 'Costo del servicio de IA facturado en el mes.', report: true, extra: [{ label: 'Agregar al informe', action: 'add-board' }] }) },
    { id: 'f8', q: '¿Qué territorios están bajo la cuota rural?', keys: ['rural'], run: () => { const T = A().SAMPLE.terr.filter(t => t[4] < t[5] - 2); return { text: T.map(t => t[0] + ' (' + t[4] + ' % de ' + t[5] + ' %)').join(', ') + ' están bajo la cuota rural.', charts: [{ type: 'hbar', labels: A().SAMPLE.terr.map(t => t[0]), values: A().SAMPLE.terr.map(t => t[4]), unit: ' %', colors: A().SAMPLE.terr.map(t => t[4] < t[5] - 2 ? '#D9692B' : '#A9D4FF'), tips: A().SAMPLE.terr.map(t => 'meta ' + t[5] + ' %') }], chartNote: 'Proporción rural por territorio · naranja: bajo la meta', basis: '6 territorios · ' + PER, method: 'Proporción de evaluadas en veredas frente a la meta del territorio.', report: true, extra: [{ label: 'Agregar al informe', action: 'add-board' }] }; } },
    { id: 'f9', q: '¿Qué servicios se entregaron este mes?', keys: ['servicios'], run: () => ({ text: 'Consulte a TEJIVA con los datos vivos (ánimo, clínica, TEJIVA, juegos). PM+ y grupos ya no se reportan.', basis: 'Programa QUINTIA', method: 'Sin cohorte demo.' }) },
    { id: 'f10', q: '¿Cuántas manillas están en uso?', keys: ['manilla'], run: () => ({ text: 'Las manillas ya no se usan en QUINTIA.', basis: 'Función retirada', method: 'Manillas fuera del producto.' }) }
  );
  Q.inv.push(
    COUNT('i3', '¿Cuántas personas hay con capacidad digital baja y riesgo severo?'),
    { id: 'i4', q: '¿Cómo cambia la mejoría por territorio?', keys: ['territorio'], run: () => { const L = [['Salento', 41, 214], ['Armenia', 45, 702], ['Calarcá', 43, 251], ['Pereira', 44, 388], ['Manizales', 40, 212], ['Chinchiná', 46, 93]]; return { text: 'La mejoría va del ' + 40 + ' % en Manizales al 46 % en Chinchiná. Las diferencias son pequeñas y los grupos tienen tamaños distintos.', charts: [{ type: 'hbar', labels: L.map(x => x[0] + ' (n=' + x[2] + ')'), values: L.map(x => x[1]), unit: ' %', max: 60 }], basis: 'n = 1.860 con 2+ mediciones · ' + PER, method: 'Proporción que bajó 5+ puntos en PHQ-9, por territorio. Descriptivo.', report: true, extra: [{ label: 'Convertir en solicitud de datos', action: 'to-request' }] }; } },
    { id: 'i5', q: '¿Cómo se distribuye la cohorte por perfil?', keys: ['perfil', 'distribu'], run: () => { const H = A().HEAT, L = []; H.forEach((row, ri) => row.forEach((v, di) => L.push([A().code(ri, di), v]))); return { text: 'Los perfiles más comunes son P01 (620), P02 (540) y P04 (410). Los de riesgo Severo suman 193 personas.', charts: [{ type: 'bar', labels: L.map(x => x[0]), values: L.map(x => x[1]), valueLabels: false, colors: L.map(x => A().RISK[A().parseCode(x[0]).r].c), yLabel: 'Personas' }], basis: 'n = personas del programa evaluadas · ' + PER, method: 'Personas por perfil en la evaluación inicial.', report: true }; } },
    { id: 'i6', q: '¿Cuál es el abandono por nivel digital?', keys: ['abandon'], run: () => ({ text: 'El abandono es mayor con capacidad digital baja: 14 %, frente a 8 % con media y 6 % con alta.', charts: [{ type: 'bar', labels: ['Baja', 'Media', 'Alta'], values: [14, 8, 6], unit: ' %', colors: A().DIG.map(x => x.c), yLabel: '% abandono' }], basis: 'n = personas del programa evaluadas · ' + PER, method: 'Personas sin contacto de su ruta en 30 días, por nivel digital de la línea base.', report: true, extra: [{ label: 'Convertir en solicitud de datos', action: 'to-request' }] }) },
    { id: 'i7', q: '¿Cuánto bajó el PHQ-9 promedio?', keys: ['promedio', 'bajo el phq'], run: () => ({ text: 'El PHQ-9 promedio bajó de 11,8 en la línea base a 9,1 en la última medición (2,7 puntos).', charts: [{ type: 'bar', labels: ['Línea base', 'Última medición'], values: [11.8, 9.1], decimals: 1, yMax: 15, yLabel: 'PHQ-9 promedio' }], basis: 'n = 1.860 con 2+ mediciones · ' + PER, method: 'Promedio de PHQ-9 en la primera y la última medición de cada persona.', report: true }) },
    { id: 'i8', q: '¿Qué datos puedo solicitar?', keys: ['solicitar', 'datos'], run: () => ({ text: 'Puede solicitar datos agregados del programa QUINTIA. Las manillas ya no aplican.', basis: 'Catálogo QUINTIA', method: 'Catálogo vigente.' }) }
  );
  Q.inst.push(
    { id: 'n3', q: '¿A qué casos ya les envié contrarreferencia?', keys: ['contrarreferencia'], run: S => { const L = S.referrals.filter(x => x.inst === 'hsal' && x.contra); return { text: L.length ? 'Envió contrarreferencia de ' + L.map(x => x.name).join(', ') + '.' : 'Todavía no ha enviado contrarreferencias.', basis: 'Casos remitidos a esta institución', method: 'Casos con contrarreferencia registrada.', detail: { target: 'casos', label: 'Casos remitidos' } }; } },
    { id: 'n4', q: '¿Cuántos casos tengo en tratamiento?', keys: ['tratamiento'], run: S => { const L = S.referrals.filter(x => x.inst === 'hsal' && x.status === 'En tratamiento'); return { text: 'Tiene ' + L.length + (L.length === 1 ? ' caso' : ' casos') + ' en tratamiento' + (L.length ? ': ' + L.map(x => x.name).join(', ') : '') + '.', basis: 'Casos remitidos a esta institución', method: 'Casos con estado «En tratamiento».' }; } },
    { id: 'n5', q: 'Resúmame el caso de Wilson', keys: ['wilson'], run: S => { const r = S.referrals.find(x => x.pid === 'wilson' && x.inst === 'hsal'); return r ? { text: 'Wilson Arango, 47 años, de Salento. Remitido el ' + r.date + ' por la ' + r.by + ': ' + r.reason + ' PHQ-9: ' + r.phq + '. Estado: ' + r.status + '.', basis: 'Solo el caso remitido · 1 paciente que autorizó compartir', method: 'Datos de la remisión.' } : { text: 'Wilson Arango no tiene una remisión activa a esta institución.', basis: 'Casos remitidos' }; } },
    { id: 'n6', q: '¿Cuántos casos me han remitido en total?', keys: ['total', 'cuantos casos'], run: S => { const L = S.referrals.filter(x => x.inst === 'hsal'); return { text: 'El programa le ha remitido ' + L.length + (L.length === 1 ? ' caso.' : ' casos.'), list: L.map(x => ({ name: x.name, meta: x.date + ' · ' + x.status })), basis: 'Casos remitidos a esta institución', method: 'Remisiones con autorización del paciente.' }; } },
    { id: 'n7', q: '¿Cuáles son mis próximas citas?', keys: ['cita'], run: S => { const L = S.referrals.filter(x => x.inst === 'hsal' && /^Cita/.test(x.status)); return { text: L.length ? L.map(x => x.name + ': ' + x.status.toLowerCase()).join('. ') + '.' : 'No tiene citas fijadas.', basis: 'Casos remitidos a esta institución', method: 'Casos con cita fijada.' }; } }
  );

  function expertQ(ex) {
    const mineT = ex === 'mj' ? 'Armenia' : 'Salento';
    return [
      { id: 'e4', q: '¿En qué vereda o barrio tengo más visitas pendientes?', keys: ['vereda', 'barrio', 'pendientes'], run: S => {
        const L = S.worklists[ex].filter(w => ['siguiente', 'programada', 'curso', 'ausente'].includes(w.status)), c = {}; L.forEach(w => { c[w.place] = (c[w.place] || 0) + 1; });
        const k = Object.keys(c).sort((a, b) => c[b] - c[a]);
        return { text: k.length ? k[0] + ' tiene ' + c[k[0]] + (c[k[0]] === 1 ? ' visita pendiente.' : ' visitas pendientes.') : 'No tiene visitas pendientes.', charts: k.length ? [{ type: 'hbar', labels: k, values: k.map(x => c[x]) }] : [], basis: basisEx(ex), method: 'Visitas de hoy no validadas, agrupadas por lugar.' };
      } },
      { id: 'e5', q: '¿Cuántas manillas hay disponibles en mi territorio?', keys: ['manilla'], run: () => ({ text: 'Las manillas ya no se usan en QUINTIA.', basis: 'Función retirada', method: 'Manillas fuera del producto.' }) },
      { id: 'e6', q: '¿Cuántas visitas me rechazaron esta semana?', keys: ['rechaz'], run: S => { const n = S.rejected[ex], p = S.flags.filter(f => f.expert === ex && f.status === 'pending').length; return { text: 'Esta semana le rechazaron ' + n + (n === 1 ? ' visita' : ' visitas') + ' en control de calidad.' + (p ? ' Tiene ' + p + ' en revisión.' : ''), basis: basisEx(ex), method: 'Visitas marcadas y rechazadas por la administración esta semana.' }; } },
      { id: 'e7', q: '¿Cuántas personas de 60 años o más me faltan hoy?', keys: ['60', 'mayores'], run: S => { const q = A().quotas(S, ex), L = S.worklists[ex].filter(w => w.age >= 60 && ['siguiente', 'programada', 'curso'].includes(w.status)); return { text: 'Lleva ' + q.sixty + ' de ' + q.sixtyT + ' personas de 60 o más hoy. En su lista quedan ' + L.length + '.', list: L.map(w => ({ name: w.time + ' · ' + w.name, meta: w.age + ' años · ' + w.place })), basis: basisEx(ex), method: 'Cuota 60+ del día y visitas pendientes de personas de 60 o más.' }; } },
      { id: 'e8', q: '¿Tengo alguna crisis abierta?', keys: ['crisis', 'alerta'], run: S => { const L = S.alerts.filter(a => a.expert === ex && a.sev === 'crisis'); return { text: L.length ? 'Tiene ' + L.length + ' crisis abierta: ' + L.map(a => a.name + ' (' + (a.status === 'new' ? 'esperando a la clínica' : 'la clínica está llamando') + ')').join(', ') + '.' : 'No tiene crisis abiertas.', basis: basisEx(ex), method: 'Alertas de crisis que usted levantó y siguen abiertas.' }; } },
      { id: 'e9', q: '¿Cuántas personas de mi lista de hoy son rurales?', keys: ['rural'], run: S => { const L = S.worklists[ex], r = L.filter(w => w.rural); const q = A().quotas(S, ex); return { text: r.length + ' de sus ' + L.length + ' visitas de hoy son rurales. Lleva ' + q.rural + ' de ' + q.ruralT + ' en la cuota rural.', basis: basisEx(ex), method: 'Visitas de hoy en veredas.' }; } },
      { id: 'e10', q: '¿A qué hora es mi próxima visita?', keys: ['proxima', 'hora', 'siguiente'], run: S => { const w = S.worklists[ex].find(x => ['siguiente', 'curso'].includes(x.status)) || S.worklists[ex].find(x => x.status === 'programada'); return { text: w ? 'Su próxima visita es a las ' + w.time + ' con ' + w.name + ', en ' + w.place + '.' : 'No tiene más visitas hoy.', basis: basisEx(ex), method: 'Primera visita pendiente de su lista.' }; } },
      { id: 'e11', q: '¿Qué sesiones PM+ y grupos de apoyo tengo hoy?', keys: ['pm+', 'grupo', 'sesion'], run: () => ({ text: 'PM+ y grupos de apoyo ya no se usan en QUINTIA.', basis: 'Función retirada', method: 'PM+ y grupos fuera del producto.' }) },
      { id: 'e1', q: '¿Quién me falta hoy?', keys: ['falta', 'faltan'], run: S => {
        const L = S.worklists[ex].filter(w => ['siguiente', 'programada', 'ausente', 'curso'].includes(w.status));
        return { text: 'Le faltan ' + L.length + ' visitas hoy.', list: L.map(w => ({ name: w.time + ' · ' + w.name, meta: w.place + ' · ' + (w.rural ? 'rural' : 'urbano') + (w.age >= 60 ? ' · 60+' : '') + (w.status === 'ausente' ? ' · reprogramar' : '') })), basis: basisEx(ex), method: 'Visitas de hoy que no están validadas.' };
      } },
      { id: 'e2', q: '¿Cómo voy en la cuota de la semana?', keys: ['cuota', 'semana'], run: S => {
        const q = A().quotas(S, ex), left = 45 - q.week;
        return { text: 'Lleva ' + q.week + ' de 45 visitas validadas esta semana. Le faltan ' + left + ': unas ' + Math.ceil(left / 4) + ' por día de aquí al viernes.', charts: [{ type: 'hbar', labels: ['Semana', 'Hoy', 'Rural hoy', '60+ hoy'], values: [q.week, q.today, q.rural, q.sixty], tips: ['de 45', 'de ' + q.todayT, 'de ' + q.ruralT, 'de ' + q.sixtyT], max: 45 }], basis: basisEx(ex), method: 'Solo cuentan las visitas validadas. Días restantes: hoy a viernes.' };
      } },
      { id: 'e3', q: '¿Qué pacientes míos tienen revisita esta semana?', keys: ['revisita'], run: S => {
        const L = S.revisits[ex] || [];
        return { text: L.length ? 'Tiene ' + L.length + ' revisitas esta semana.' : 'No tiene revisitas esta semana.', list: L.map(r => ({ name: r.when + ' · ' + r.name, meta: r.place + ' · ' + r.why })), basis: basisEx(ex), method: 'Revisitas de las rutas de sus pacientes con fecha de esta semana.' };
      } }
    ];
  }
  const basisEx = ex => (ex === 'andres' ? 'Con los datos de la última sincronización · hoy 7:05 · ' : 'Datos al momento · ') + 'su lista de hoy';

  function briefing(ex, S) {
    const q = A().quotas(S, ex), wl = S.worklists[ex] || [];
    const pend = wl.filter(w => ['siguiente', 'programada', 'curso', 'sin_evaluacion', 'rechazada', 'cierre', 'asignada', 'ausente'].includes(w.status));
    const pendR = pend.filter(w => w.rural);
    const byPlace = {}; pendR.forEach(w => { byPlace[w.place] = (byPlace[w.place] || 0) + 1; });
    const best = Object.keys(byPlace).sort((a, b) => byPlace[b] - byPlace[a])[0];
    const r = Math.max(0, q.ruralT - q.rural), s6 = Math.max(0, q.sixtyT - q.sixty);
    let t = 'Hoy lleva ' + q.today + ' de ' + q.todayT + ' visitas validadas';
    if (pend.length) t += ' · ' + pend.length + (pend.length === 1 ? ' pendiente' : ' pendientes');
    t += '. ';
    if (r || s6) t += 'Le faltan ' + [r ? r + (r === 1 ? ' rural' : ' rurales') : '', s6 ? s6 + ' de 60+' : ''].filter(Boolean).join(' y ') + ' para la cuota. ';
    if (best && byPlace[best] > 1) t += 'Empiece por la ' + best + ': ahí están ' + byPlace[best] + ' de las rurales.';
    return { text: t.trim(), dots: wl.map(w => ({ ok: w.status === 'validada' || w.status === 'por_aprobar' || w.status === 'crisis' })), revisits: S.revisits[ex] || [], crisis: (S.notices[ex] || []).filter(n => n.kind === 'crisis') };
  }

  // El saludo con nombre lo arma AgentPanel desde store.session() (login).
  const ROLE = {
    admin: { name: 'TEJIVA', greet: '', sub: 'Pregúnteme lo que necesite del programa: captación, personas, rutas, crisis, equipos o activos.' },
    clin: { name: 'TEJIVA', greet: '', sub: 'Le oriento con aprobaciones, caseload, crisis e inactividad. No doy diagnósticos ni cambio rutas.' },
    fin: { name: 'TEJIVA', greet: '', sub: 'Respondo con datos agregados del programa, sin datos personales.' },
    inv: { name: 'TEJIVA', greet: '', sub: 'Respondo sobre datos seudonimizados del programa.' },
    inst: { name: 'TEJIVA', greet: '', sub: 'Solo conozco los casos remitidos a esta institución.' },
    expert: { name: 'TEJIVA', greet: '', sub: 'Pregúnteme por su territorio, visitas, alertas o el avance del programa.' },
    obs: { name: 'TEJIVA', greet: '', sub: 'Le cuento el avance del programa con datos agregados, sin nombres ni datos personales.' },
    observador: { name: 'TEJIVA', greet: '', sub: 'Le cuento el avance del programa con datos agregados, sin nombres ni datos personales.' },
  };
  const list = role => {
    const key = role.split(':')[0];
    if (role.indexOf('expert') === 0) return expertQ(role.split(':')[1]);
    // Observador: mismas consultas agregadas que finanzas (sin datos personales).
    if (key === 'obs' || key === 'observador') return Q.fin || [];
    return Q[key] || Q.admin || [];
  };

  async function ask(role, text) {
    const S = A().get(), L = list(role), t = norm(text), f = parseFilters(text);
    let q = L.find(x => norm(x.q) === t), params = null;
    if (!q && hasF(f)) {
      if (/cuant|numero|how many/.test(t)) q = L.find(x => x.param === 'count') || (f.risk != null ? L.find(x => x.param === 'caseRisk') : null);
      if (!q && f.terr && /captaci|como va|avance/.test(t)) q = L.find(x => x.param === 'terr');
      if (!q && f.risk != null) q = L.find(x => x.param === 'caseRisk');
      if (q) params = f;
    }
    if (!q) q = L.find(x => x.keys.some(k => t.includes(k)));
    if (!q && window.claude) {
      try {
        const out = await window.claude.complete('Eres el enrutador del asistente de datos de QUINTIA. Solo eliges una consulta fija; nunca respondes con cifras. Consultas disponibles:\n' + L.map(x => x.id + ': ' + x.q + (x.param ? ' [acepta filtros]' : '')).join('\n') + '\nTerritorios: ' + TERRS().join(', ') + '. Riesgo: Mínimo, Leve, Moderado, Moderado-severo, Severo. Digital: baja, media, alta.\nPregunta del usuario: "' + text + '"\nResponde SOLO con JSON {"id":"<id o none>","territorio":null,"riesgo":null,"digital":null}. Usa none si ninguna consulta responde exactamente la pregunta.');
        const j = JSON.parse(out.slice(out.indexOf('{'), out.lastIndexOf('}') + 1));
        q = L.find(x => x.id === j.id) || null;
        if (q && q.param) { params = Object.assign({}, f); if (j.territorio && TERRS().includes(j.territorio)) params.terr = j.territorio; const ri = A().RISK.findIndex(r => r.k === j.riesgo); if (ri > -1) params.risk = ri; const di = ['baja', 'media', 'alta'].indexOf(j.digital); if (di > -1) params.dig = di; }
      } catch (e) { }
    }
    let ans;
    if (!q) ans = { none: true, understood: 'No tengo una consulta para esa pregunta.', text: role === 'inst' ? 'Solo conozco los casos remitidos a esta institución y no puedo responder sobre el resto de la cohorte. Puedo responder:' : 'Todavía no puedo responder eso con los datos del programa. Puedo responder:' };
    else {
      ans = q.run(S, params || (q.param ? f : undefined), text); ans.qid = q.id; ans.params = params;
      const exact = norm(q.q) === t && !params;
      ans.understood = exact ? null : (ans.understoodLabel || 'Entendí: «' + q.q + '»');
    }
    ans.q = text; ans.at = Date.now();
    A().logAgent(role, text, (ans.understood ? ans.understood + ' · ' : '') + (ans.text || (ans.lines || []).join(' ')));
    return ans;
  }
  function runById(role, id, params) { const q = list(role).find(x => x.id === id); if (!q) return null; const a = q.run(A().get(), params || undefined); a.qid = id; a.q = q.q; return a; }

  const AlientoAgent = { ROLE, list, ask, runById, briefing, gloriaCharts };
if (typeof window !== 'undefined') {
  window.AlientoAgent = AlientoAgent;
}
export default AlientoAgent;
