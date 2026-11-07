/**
 * Datos del prototipo Consciente-entrega/consciente-data.js
 * portados a QUINTIA (TEJIVA). Fuente: entrega Claude Design.
 * No usa localStorage; memoria en proceso o snapshot para seed/Mongo.
 */
export function buildPrototypeCohort() {
  const KEY = 'quintia-demo-v1';

  const GAMES = {
    frutas: { id: 'frutas', nombre: 'Frutas', hab: 'Atención visual y planificación', medida: 'Puntaje por partida', corta: 'Puntaje', unidad: 'pts', cod: 'FRU' },
    simon: { id: 'simon', nombre: 'Simón dice', hab: 'Memoria de trabajo y atención', medida: 'Secuencia más larga', corta: 'Secuencia', unidad: 'pasos', cod: 'SIM' },
    duelo: { id: 'duelo', nombre: 'Duelo de cartas', hab: 'Flexibilidad y decisiones', medida: 'Jugadas dentro de la regla', corta: 'Dentro de la regla', unidad: '%', cod: 'DUE' },
    sudoku: { id: 'sudoku', nombre: 'Sudoku', hab: 'Lógica y planificación', medida: 'Tiempo total', corta: 'Tiempo', unidad: 'min', cod: 'SDK' }
  };
  const GAME_IDS = ['frutas', 'simon', 'duelo', 'sudoku'];

  const MEDIDAS = {
    frutas: ['Tiempo hasta cada movimiento', 'Movimientos inválidos', 'Combinaciones por movimiento', 'Movimientos sin usar', 'Puntaje', 'Nivel'],
    simon: ['Secuencia más larga', 'Posición del error', 'Tiempo entre toques', 'Rondas', 'Nivel'],
    duelo: ['Tiempo por jugada', 'Jugadas fuera de la regla', 'Errores justo después de un cambio de regla', 'Resultado'],
    sudoku: ['Tiempo total', 'Casillas borradas', 'Errores', 'Terminado o no']
  };

  const ESTADOS_AN = {
    base: { label: 'Construyendo línea base', fg: '#4F4868', bg: '#ECE9F2', icon: '◔' },
    estable: { label: 'Estable', fg: '#24566A', bg: '#E1EDF1', icon: '●' },
    mejorando: { label: 'Mejorando', fg: '#2C6247', bg: '#E0EFE5', icon: '▲' },
    cambio: { label: 'Cambio a revisar', fg: '#6E4705', bg: '#FAE7BF', icon: '◆' }
  };

  // series semanales de la medida principal (más antigua → más reciente)
  const PATIENTS = {
    hernan: {
      id: 'hernan', nombre: 'Hernán Quintero', trato: 'Don Hernán', iniciales: 'HQ', edad: 71, perfil: 'P05', riesgo: 'Leve', digital: 'Media',
      territorio: 'Valle Alto', estado: 'Activo', semanas: 12, analizador: 'mejorando', remision: false,
      juegos: ['frutas', 'simon', 'duelo'],
      freq: { frutas: 'Diario · 1 partida', simon: 'Diario · 1 partida', duelo: '5 días por semana · 1 partida' },
      hab: { frutas: 'estable', simon: 'mejorando', duelo: 'estable' },
      series: { frutas: [612, 640, 598, 655, 630, 662, 641, 618, 650, 672, 644, 660], simon: [4, 4, 4, 5, 4, 5, 5, 5, 6, 5, 6, 6], duelo: [88, 90, 86, 91, 89, 92, 90, 88, 91, 90, 92, 91] },
      band: { frutas: [590, 680], simon: [4, 5], duelo: [85, 93] },
      constancia: [[19, 19], [19, 18], [19, 19], [19, 19], [19, 18], [19, 19]], libres: [3, 2, 4, 3, 5, 4], semana: [7, 7],
      phq: [9, 8, 7, 6], proxima: 'Martes · 10:00 a. m. · por teléfono', ultima: 'Jugó Simón dice',
      monedas: 1240, records: { frutas: 690, simon: 6, duelo: 80 }, recordPrev: { simon: 5 },
      lectura: 'En Simón dice la secuencia más larga subió de 4 a 6 frente a su línea base (4 a 5). Frutas y Duelo de cartas siguen en su rango habitual. Constancia alta: 7 de 7.',
      sugerencia: 'Conversar en la próxima sesión'
    },
    rosa: {
      id: 'rosa', nombre: 'Rosa Elena Pardo', trato: 'Doña Rosa', iniciales: 'RP', edad: 76, perfil: 'P08', riesgo: 'Moderado', digital: 'Media',
      territorio: 'Valle Alto', estado: 'Activo', semanas: 10, analizador: 'estable', remision: true,
      juegos: ['frutas', 'simon', 'duelo', 'sudoku'],
      freq: { frutas: 'Diario · 1 partida', simon: '5 días por semana · 1 partida', duelo: '3 días por semana · 1 partida', sudoku: 'Diario' },
      hab: { frutas: 'estable', simon: 'estable', duelo: 'estable', sudoku: 'estable' },
      series: { frutas: [540, 575, 552, 590, 561, 548, 580, 566, 571, 558], simon: [5, 5, 4, 5, 5, 6, 5, 5, 4, 5], duelo: [84, 86, 83, 88, 85, 82, 86, 87, 84, 85], sudoku: [24, 22, 25, 21, 23, 22, 24, 22, 23, 22] },
      band: { frutas: [530, 600], simon: [4, 6], duelo: [80, 89], sudoku: [20, 26] },
      constancia: [[22, 15], [22, 14], [22, 16], [22, 13], [22, 15], [22, 14]], libres: [1, 0, 2, 1, 0, 1], semana: [4, 7],
      phq: [14, 12, 12, 11], proxima: 'Jueves · 3:00 p. m. · videollamada', ultima: 'Jugó Frutas',
      monedas: 860, records: { frutas: 610, simon: 6, duelo: 70, sudoku: 20 }, recordPrev: {},
      lectura: 'Las cuatro habilidades están dentro de su rango habitual, con variaciones normales de semana a semana. Constancia media: 4 de 7 días esta semana.',
      sugerencia: 'Conversar en la próxima sesión'
    },
    ernesto: {
      id: 'ernesto', nombre: 'Ernesto Villamil', trato: 'Don Ernesto', iniciales: 'EV', edad: 79, perfil: 'P08', riesgo: 'Moderado', digital: 'Media',
      territorio: 'Valle Alto', estado: 'Activo', semanas: 14, analizador: 'cambio', remision: true,
      juegos: ['frutas', 'simon', 'duelo', 'sudoku'],
      freq: { frutas: 'Diario · 1 partida', simon: 'Diario · 1 partida', duelo: '5 días por semana · 1 partida', sudoku: 'Diario' },
      hab: { frutas: 'estable', simon: 'cambio', duelo: 'estable', sudoku: 'estable' },
      series: { frutas: [598, 615, 590, 622, 604, 611, 596, 620, 608, 615, 601, 612, 606, 610], simon: [6, 6, 7, 6, 6, 7, 6, 6, 6, 6, 6, 5, 4, 4], duelo: [90, 89, 91, 88, 90, 92, 89, 90, 91, 89, 90, 88, 90, 89], sudoku: [19, 18, 20, 19, 18, 19, 20, 18, 19, 19, 18, 20, 19, 19] },
      band: { frutas: [585, 630], simon: [5, 7], duelo: [86, 93], sudoku: [17, 21] },
      constancia: [[26, 25], [26, 24], [26, 26], [26, 25], [26, 24], [26, 25]], libres: [2, 1, 3, 2, 2, 1], semana: [6, 7],
      phq: [12, 11, 10, 10], proxima: 'Mañana · 9:30 a. m. · por teléfono', ultima: 'Jugó Simón dice',
      monedas: 1520, records: { frutas: 640, simon: 7, duelo: 90, sudoku: 17 }, recordPrev: {},
      lectura: 'En Simón dice la secuencia más larga pasó de 6 a 4 en las últimas 3 semanas, por debajo de su rango habitual (5 a 7). Frutas, Duelo de cartas y Sudoku siguen en su rango. La constancia se mantiene: 6 de 7 días.',
      sugerencia: 'Repetir la medición en 2 semanas'
    },
    elvia: {
      id: 'elvia', nombre: 'Elvia Rendón', trato: 'Doña Elvia', iniciales: 'ER', edad: 73, perfil: 'P04', riesgo: 'Leve', digital: 'Baja',
      territorio: 'Valle Alto', estado: 'Activo', semanas: 2, analizador: 'base', remision: false, baseN: 6, baseDias: 9,
      juegos: ['frutas', 'simon', 'duelo'],
      freq: { frutas: '5 días por semana · 1 partida', simon: '3 días por semana · 1 partida', duelo: '3 días por semana · 1 partida' },
      hab: { frutas: 'base', simon: 'base', duelo: 'base' },
      series: { frutas: [480, 512], simon: [4, 4], duelo: [78, 82] },
      band: {},
      constancia: [[0, 0], [0, 0], [0, 0], [0, 0], [11, 3], [11, 3]], libres: [0, 0, 0, 0, 0, 0], semana: [3, 7],
      phq: [8], proxima: 'Primera llamada dentro de 7 días', ultima: 'Jugó Frutas',
      monedas: 180, records: { frutas: 512, simon: 4, duelo: 50 }, recordPrev: {},
      lectura: 'Todavía no hay suficientes partidas para comparar: 6 de 10 partidas en 9 de 14 días. El analizador empezará a leer cambios cuando complete su línea base.',
      sugerencia: 'Seguir observando'
    }
  };
  const OTHERS = [
    { id: 'luis', nombre: 'Luis Alberto Mesa', edad: 68, perfil: '—', territorio: 'Río Claro', estado: 'Por aprobar', proxima: 'Primera llamada', ultima: 'Evaluación enviada' },
    { id: 'marta', nombre: 'Marta Lucía Ospina', edad: 81, perfil: '—', territorio: 'Sierra Norte', estado: 'Sin evaluación', proxima: 'Primera llamada', ultima: '—' }
  ];
  const ORDER = ['ernesto', 'rosa', 'hernan', 'elvia'];

  const USERS = {
    admin: { nombre: 'Marcela Ríos', rol: 'Administradora', ini: 'MR', file: 'Administrador.dc.html' },
    experto: { nombre: 'Andrés Molina', rol: 'Experto de campo', ini: 'AM', file: 'Experto.dc.html' },
    clinico: { nombre: 'Dra. Lucía Paredes', rol: 'Clínica', ini: 'LP', file: 'Clinico.dc.html' },
    cuidador: { nombre: 'Gloria Pardo', rol: 'Cuidadora', ini: 'GP', file: 'Cuidador.dc.html' },
    observador: { nombre: 'Tomás Vega', rol: 'Observador', ini: 'TV', file: 'Observador.dc.html' }
  };

  const TERRITORIOS = ['Valle Alto', 'Río Claro', 'Sierra Norte'];
  const RIESGOS_IDX = { 'Mínimo': 0, 'Leve': 1, 'Moderado': 2, 'Moderado-severo': 3, 'Severo': 4 };

  function defaultsMatrix() {
    const base = (n) => ({ animo: { on: false, freq: '2 veces al día' }, psico: { on: true, freq: n > 6 ? 'Quincenal' : 'Mensual' }, acomp: { on: true }, frutas: { on: true, freq: 'Diario', partidas: '1 partida' }, simon: { on: true, freq: 'Diario', partidas: '1 partida' }, duelo: { on: true, freq: '5 días por semana', partidas: '1 partida' }, sudoku: { on: n >= 7, freq: 'Diario' }, analizador: { on: true } });
    const m = {};
    ['Valle Alto', 'Sierra Norte'].forEach(t => { m[t] = {}; for (let i = 1; i <= 15; i++) m[t]['P' + String(i).padStart(2, '0')] = base(i); });
    m['Río Claro'] = {};
    for (let i = 1; i <= 15; i++) {
      const p = 'P' + String(i).padStart(2, '0');
      m['Río Claro'][p] = { animo: { on: false, freq: '2 veces al día' }, psico: { on: true, freq: 'Mensual' }, acomp: { on: true }, frutas: { on: false, freq: 'Diario', partidas: '1 partida' }, simon: { on: false, freq: 'Diario', partidas: '1 partida' }, duelo: { on: false, freq: '5 días por semana', partidas: '1 partida' }, sudoku: { on: true, freq: 'Diario' }, analizador: { on: false } };
    }
    return m;
  }

  function defaults() {
    return {
      offline: false,
      partidas: [], // partidas nuevas jugadas en la app
      hechos: {}, // pid:game → true
      monedas: {}, records: {},
      ocultos: {}, // pid → {game:true}
      decisiones: { ernesto: [], hernan: [], rosa: [], elvia: [] },
      notas: {},
      avisos: [{ id: 'av1', pid: 'ernesto', game: 'simon', texto: 'Simón dice: secuencia más larga de 6 a 4 en las últimas 3 semanas', desde: 4, plazo: 7, estado: 'abierto' }],
      aprobaciones: [{ id: 'ap1', tipo: 'Evaluaciones', titulo: 'Evaluación de campo · Luis Alberto Mesa', detalle: 'Río Claro · Andrés Molina · perfil sugerido P07', hace: 'Hace 2 días', estado: 'pendiente' }],
      crisis: [],
      matrix: defaultsMatrix(),
      gameCfg: {
        frutas: { nivel: 1, sube: 'Automático según desempeño', mov: 18, sonido: true, version: 3, historial: [{ v: 3, cuando: 'Hace 3 semanas', quien: 'Marcela Ríos', cambio: 'Movimientos por partida: 20 → 18' }, { v: 2, cuando: 'Hace 2 meses', quien: 'Marcela Ríos', cambio: 'Sonido activado' }, { v: 1, cuando: 'Hace 4 meses', quien: 'Marcela Ríos', cambio: 'Versión inicial' }] },
        simon: { nivel: 2, sube: 'Automático según desempeño', corazones: 2, sonido: true, version: 3, historial: [{ v: 3, cuando: 'Hace 5 semanas', quien: 'Marcela Ríos', cambio: 'Corazones: 3 → 2' }, { v: 2, cuando: 'Hace 3 meses', quien: 'Marcela Ríos', cambio: 'Velocidad de la secuencia más lenta' }, { v: 1, cuando: 'Hace 4 meses', quien: 'Marcela Ríos', cambio: 'Versión inicial' }] },
        duelo: { nivel: 1, sube: 'Fijo', cartas: 5, sonido: false, version: 2, historial: [{ v: 2, cuando: 'Hace 2 meses', quien: 'Marcela Ríos', cambio: 'La regla cambia cada 4 jugadas' }, { v: 1, cuando: 'Hace 4 meses', quien: 'Marcela Ríos', cambio: 'Versión inicial' }] },
        sudoku: { nivel: 1, sube: 'Fijo', sonido: false, version: 1, historial: [{ v: 1, cuando: 'Hace 6 meses', quien: 'Marcela Ríos', cambio: 'Versión inicial' }] }
      },
      anCfg: {
        fuentes: { frutas: true, simon: true, duelo: true, sudoku: true },
        partidas: 10, dias: 14, descarta: 3, sens: 'Media', plazo: 7,
        sugerencias: ['Repetir la medición en 2 semanas', 'Conversar en la próxima sesión', 'Seguir observando', 'Revisar la constancia con la persona'],
        version: 2, historial: [{ v: 2, cuando: 'Hace 1 mes', quien: 'Marcela Ríos', cambio: 'Sensibilidad: Alta → Media' }, { v: 1, cuando: 'Hace 4 meses', quien: 'Marcela Ríos', cambio: 'Versión inicial' }]
      },
      envioVersion: { 'Valle Alto': 3, 'Río Claro': 1, 'Sierra Norte': 2 },
      consentimiento: {}, visitas: []
    };
  }

  let _mem = null;
  function load() {
    const d = defaults();
    if (!_mem) { _mem = JSON.parse(JSON.stringify(d)); return _mem; }
    Object.keys(d).forEach(k => { if (_mem[k] === undefined) _mem[k] = d[k]; });
    return _mem;
  }
  function save(s) { _mem = s; }
  function update(fn) { const s = load(); fn(s); save(s); return s; }
  function reset() { _mem = null; return load(); }

  function rel(d) {
    if (d <= 0) return 'Hoy';
    if (d === 1) return 'Ayer';
    if (d < 14) return 'Hace ' + d + ' días';
    if (d < 60) return 'Hace ' + Math.round(d / 7) + ' semanas';
    return 'Hace ' + Math.round(d / 30) + ' meses';
  }
  function hora(i) { const h = [9, 10, 11, 4, 5, 8][i % 6]; const m = ['05', '20', '40', '10', '35', '50'][i % 6]; return h + ':' + m + (h >= 8 && h <= 11 ? ' a. m.' : ' p. m.'); }
  function fmtDur(sec) { const m = Math.floor(sec / 60), s = Math.round(sec % 60); return m + ' min ' + String(s).padStart(2, '0') + ' s'; }

  // historial de partidas sembrado + partidas nuevas sincronizadas
  function partidas(pid, game, store) {
    const p = PATIENTS[pid]; if (!p || !p.series[game]) return [];
    const ser = p.series[game];
    const out = [];
    const n = 8;
    for (let i = 0; i < n; i++) {
      const wk = ser[Math.max(0, ser.length - 1 - Math.floor(i / 3))];
      const jitter = [0, 1, -1, 0, 1, -1, 0, 0][i];
      let val = game === 'simon' ? Math.max(2, wk + (i % 3 === 1 ? jitter : 0)) : game === 'frutas' ? wk + jitter * 14 : game === 'duelo' ? Math.min(100, wk + jitter * 2) : wk + jitter;
      const dur = game === 'sudoku' ? val * 60 + 12 : game === 'frutas' ? 200 + (i * 17) % 60 : game === 'simon' ? 140 + (i * 23) % 50 : 230 + (i * 19) % 70;
      out.push({ codigo: GAMES[game].cod + '-' + (pid.slice(0, 1).toUpperCase()) + '-' + String(300 - i * 2 - (pid.length)).padStart(3, '0'), dias: Math.floor(i * 0.9) + (pid === 'rosa' ? i : 0), hora: hora(i), tipo: i % 4 === 2 ? 'Libre' : 'Programada', valor: val, dur, terminada: !(game === 'sudoku' && i === 3) });
    }
    const st = store || load();
    const nuevas = (st.partidas || []).filter(x => x.pid === pid && x.game === game && x.sync).map(x => ({ codigo: x.codigo, dias: 0, hora: x.hora, tipo: x.tipo, valor: x.valor, dur: x.dur, terminada: true, nueva: true, offline: x.offline }));
    return nuevas.reverse().concat(out);
  }
  function stats(pid, game, store) {
    const p = PATIENTS[pid]; const list = partidas(pid, game, store);
    const weeks = p.semanas; const perWeek = { 'Diario': 7, 'Diario · 1 partida': 7, '5 días por semana · 1 partida': 5, '3 días por semana · 1 partida': 3 }[p.freq[game]] || 7;
    const asignados = p.analizador === 'base' ? (game === 'frutas' ? weeks * 5 + 1 : weeks * 3) : weeks * perWeek;
    const extra = list.filter(x => x.nueva).length;
    const ratio = { hernan: 0.98, rosa: 0.66, ernesto: 0.95, elvia: 0.6 }[pid] || (p.semana[0] / p.semana[1]);
    const jugados = Math.round(asignados * ratio) + extra + (pid === 'elvia' ? 0 : 0);
    const terminados = jugados - (game === 'sudoku' ? 3 : 0);
    const durs = list.map(x => x.dur);
    return { asignados, jugados, terminados, tmin: fmtDur(Math.min(...durs)), tmax: fmtDur(Math.max(...durs)), prom: fmtDur(durs.reduce((a, b) => a + b, 0) / durs.length), lista: list };
  }

  function fmtVal(game, v) { const g = GAMES[game]; return g.unidad === '%' ? v + ' %' : v + ' ' + g.unidad; }
  function rangoTxt(pid, game) { const b = PATIENTS[pid].band[game]; if (!b) return 'en construcción'; return fmtVal(game, b[0]).replace(/ \S+$/, '') + ' a ' + fmtVal(game, b[1]); }

  // gráfico de tendencia frente a la línea base
  function chart(pid, game, w, h) {
    w = w || 560; h = h || 150;
    const p = PATIENTS[pid]; const ser = p.series[game] || []; const band = p.band[game];
    const all = ser.concat(band || []);
    let lo = Math.min(...all), hi = Math.max(...all); const pad = (hi - lo) * 0.25 || 1; lo -= pad; hi += pad;
    const L = 8, R = 8, T = 10, B = 22; const iw = w - L - R, ih = h - T - B;
    const x = i => L + (ser.length < 2 ? iw / 2 : i * iw / (ser.length - 1));
    const y = v => T + ih - (v - lo) / (hi - lo) * ih;
    const pts = ser.map((v, i) => ({ cx: x(i).toFixed(1), cy: y(v).toFixed(1), v }));
    const path = pts.map((q, i) => (i ? 'L' : 'M') + q.cx + ' ' + q.cy).join(' ');
    const by = band ? y(band[1]).toFixed(1) : 0, bh = band ? (y(band[0]) - y(band[1])).toFixed(1) : 0;
    const last = pts[pts.length - 1] || { cx: 0, cy: 0 };
    return { w, h, vb: '0 0 ' + w + ' ' + h, path, pts, hasBand: !!band, by, bh, bx: L, bw: iw, axisY: h - 6, lastX: last.cx, lastY: last.cy, startLbl: 'Hace ' + (ser.length - 1) + ' sem.', endLbl: 'Esta semana', endX: w - R };
  }

  function monedas(pid, s) { s = s || load(); return (PATIENTS[pid] ? PATIENTS[pid].monedas : 0) + ((s.monedas || {})[pid] || 0); }
  function record(pid, game, s) { s = s || load(); const r = (s.records || {})[pid + ':' + game]; const b = PATIENTS[pid] ? PATIENTS[pid].records[game] : 0; return r != null ? Math.max(r, b || 0) : b; }

  function totales(s) {
    s = s || load();
    const c = { base: 0, estable: 0, mejorando: 0, cambio: 0, bajaConst: 0 };
    ORDER.forEach(id => { c[PATIENTS[id].analizador]++; const sem = PATIENTS[id].semana; if (sem[0] / sem[1] < 0.5 && PATIENTS[id].analizador !== 'base') c.bajaConst++; });
    return c;
  }
  function avisosAbiertos(s) { s = s || load(); return (s.avisos || []).filter(a => a.estado === 'abierto'); }

  // --- TEJIVA · motor local de respaldo ---
  function norm(t) { return (t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
  const CS_EST = id => ESTADOS_AN[PATIENTS[id].analizador].label;
  function asistente(rol, q, s) {
    s = s || load(); const t = norm(q);
    const refuse = /diagnos|demencia|alzheimer|deterior|cambia(r)? (la )?ruta/.test(t);
    if (refuse) return { texto: 'No hago valoraciones clínicas ni cambio rutas. Le muestro los datos del analizador y lo que sugiere; usted decide.' };
    if (rol === 'clinico') {
      if (/ernesto/.test(t)) return { texto: 'Don Ernesto · 79 años · P08 · 14 semanas jugando.', puntos: ['Simón dice: la secuencia más larga pasó de 6 a 4 en las últimas 3 semanas; su rango habitual es 5 a 7.', 'Frutas, Duelo de cartas y Sudoku siguen dentro de su rango habitual.', 'Constancia: 6 de 7 días esta semana. Aviso abierto hace 4 días, plazo de revisión 7 días.', 'El analizador sugiere: «Repetir la medición en 2 semanas». Usted decide.'], chart: { pid: 'ernesto', game: 'simon' } };
      const NM = id => PATIENTS[id].trato + ' (' + PATIENTS[id].nombre.split(' ').slice(-1)[0] + ')';
      const byA = k => ORDER.filter(id => PATIENTS[id].analizador === k);
      if (/cambio a revisar|cambio/.test(t)) return { texto: 'Esta semana hay ' + byA('cambio').length + ' persona con cambio a revisar.', puntos: ['Don Ernesto · Simón dice · Memoria de trabajo y atención: de 6 a 4 en las últimas 3 semanas. Aviso abierto hace 4 días.', 'Mejorando: ' + byA('mejorando').map(NM).join(', ') + '.', 'Estables: ' + byA('estable').length + ' · en línea base: ' + byA('base').length + '.'] };
      if (/mitad|menos/.test(t)) { const low = ORDER.filter(id => PATIENTS[id].analizador !== 'base' && PATIENTS[id].semana[0] / PATIENTS[id].semana[1] < 0.5); return { texto: low.length ? (low.length === 1 ? '1 persona jugó' : low.length + ' personas jugaron') + ' menos de la mitad de lo programado en los últimos 7 días.' : 'Nadie jugó menos de la mitad de lo programado.', puntos: low.map(id => NM(id) + ': ' + PATIENTS[id].semana[0] + ' de ' + PATIENTS[id].semana[1] + ' días · ' + CS_EST(id)).concat(['Las personas en línea base no se cuentan aquí: su programa recién empieza.']) }; }
      if (/linea base|base/.test(t)) { const b = byA('base'); return { texto: b.length + ' personas están todavía en línea base.', puntos: b.map(id => NM(id) + ' · ' + PATIENTS[id].perfil + ' · ' + PATIENTS[id].baseN + ' de 10 partidas') }; }
      if (/caseload|carga|tres puntos|resum/.test(t)) return { texto: 'Su carga en tres puntos:', puntos: [(ORDER.length + OTHERS.length) + ' personas: ' + ORDER.length + ' activas con juegos, 1 por aprobar y 1 sin evaluación. Sin crisis pendientes.', 'Analizador: ' + byA('cambio').length + ' cambio a revisar (don Ernesto), ' + byA('mejorando').length + ' mejorando, ' + byA('estable').length + ' estables y ' + byA('base').length + ' en línea base.', 'Próxima sesión: don Ernesto, mañana a las 9:30 a. m.'] };
      if (/aprob/.test(t)) { const n = (s.aprobaciones || []).filter(a => a.estado === 'pendiente').length; return { texto: 'Tiene ' + n + (n === 1 ? ' aprobación pendiente.' : ' aprobaciones pendientes.') }; }
      return { texto: 'Puedo resumirle el analizador de una persona, decirle quién tiene un cambio a revisar, quién está en línea base o cómo va la constancia. ¿Sobre quién le cuento?' };
    }
    if (rol === 'observador') {
      const A = agregados();
      if (/analizador|estado/.test(t)) return { texto: 'Por analizador, entre las ' + A.conJuegos + ' personas con juegos: estables ' + bucket(A.analizador.estable || 0) + ', mejorando ' + bucket(A.analizador.mejorando || 0) + ', construyendo línea base ' + bucket(A.analizador.base || 0) + ' y con cambio a revisar ' + bucket(A.analizador.cambio || 0) + '. No muestro nombres.' };
      if (/constancia|jug/.test(t)) return { texto: 'Constancia promedio de los últimos 7 días: ' + A.constProm + ' % de las partidas programadas. Esta semana se jugaron unas ' + A.partidas + ' partidas, ' + A.libres + ' de ellas libres.' };
      if (/aviso/.test(t)) return { texto: 'En las últimas 4 semanas el analizador generó menos de 5 avisos; los revisados fueron atendidos dentro del plazo y el resto sigue en plazo.' };
      return { texto: 'El programa tiene ' + A.total + ' personas en 3 territorios: Valle Alto ' + bucket(A.territorio['Valle Alto']) + ', Río Claro ' + bucket(A.territorio['Río Claro']) + ' y Sierra Norte ' + bucket(A.territorio['Sierra Norte']) + '. Activas: ' + bucket(A.estado['Activo']) + '. Le cuento el avance con datos agregados, sin nombres ni datos personales.' };
    }
    if (rol === 'paciente') {
      if (/bien|feliz|content/.test(t)) return { texto: '¡Qué bueno saberlo! Lo anoto en su día. ¿Quiere jugar algo de lo que le toca hoy?' };
      if (/mal|triste|sol[oa]/.test(t)) return { texto: 'Gracias por contarme. Lo anoto para su clínica. Si en algún momento siente que su vida está en riesgo, toque «Estoy en crisis» arriba. ¿Quiere que hablemos un rato?' };
      if (/regular|cansad/.test(t)) return { texto: 'Entiendo. Hay días así. Lo anoto. Si le provoca, una partida corta de Frutas puede ser un buen descanso.' };
      if (/jueg|jugar/.test(t)) return { texto: 'Hoy le tocan sus juegos en la tarjeta «Hoy» del inicio. Cada partida le da monedas, gane o no.' };
      return { texto: 'Le escucho. Cuénteme con calma; si prefiere, en cualquier momento puede hablar con una persona del equipo.' };
    }
    return { texto: 'Le oriento con lo que necesite del programa.' };
  }

  // ---- carga ampliada de la clínica (9 personas más, todas inventadas) ----
  const MAIN = ['hernan', 'rosa', 'ernesto', 'elvia'];
  function rng(seed) { let s = seed; return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; }
  const EXTRA = [
    ['gilberto', 'Gilberto Arias', 'Don Gilberto', 74, 'P05', 'Leve', 'Media', 9, 'estable', null, [3, 7]],
    ['carmen', 'Carmen Julia Rojas', 'Doña Carmen', 70, 'P04', 'Leve', 'Baja', 11, 'estable', null, [6, 7]],
    ['octavio', 'Octavio Salcedo', 'Don Octavio', 77, 'P08', 'Moderado', 'Media', 8, 'mejorando', 'frutas', [5, 7]],
    ['blanca', 'Blanca Nieves Toro', 'Doña Blanca', 72, 'P05', 'Leve', 'Media', 13, 'estable', null, [7, 7]],
    ['rafael', 'Rafael Ángel Duque', 'Don Rafael', 80, 'P07', 'Moderado', 'Baja', 10, 'estable', null, [5, 7]],
    ['ines', 'Inés Cárdenas', 'Doña Inés', 75, 'P06', 'Leve', 'Alta', 7, 'mejorando', 'duelo', [6, 7]],
    ['jorge', 'Jorge Eliécer Mora', 'Don Jorge', 69, 'P04', 'Leve', 'Baja', 1, 'base', null, [3, 5], 3],
    ['lucila', 'Lucila Benavides', 'Doña Lucila', 78, 'P08', 'Moderado', 'Media', 6, 'estable', null, [4, 7]],
    ['ramiro', 'Ramiro Galvis', 'Don Ramiro', 73, 'P05', 'Leve', 'Media', 2, 'base', null, [4, 5], 5]
  ];
  const BASEV = { frutas: 590, simon: 5, duelo: 87, sudoku: 21 };
  const PROX = ['Lunes · 9:00 a. m. · por teléfono', 'Martes · 2:30 p. m. · videollamada', 'Miércoles · 11:00 a. m. · por teléfono', 'Jueves · 10:30 a. m. · en persona', 'Viernes · 3:00 p. m. · por teléfono'];
  EXTRA.forEach((e, k) => {
    const [id, nombre, trato, edad, perfil, riesgo, digital, semanas, an, mejor, semana, baseN] = e;
    const r = rng(k * 131 + 7);
    const juegos = Number(perfil.slice(1)) >= 7 ? ['frutas', 'simon', 'duelo', 'sudoku'] : ['frutas', 'simon', 'duelo'];
    const n = Math.max(2, semanas);
    const series = {}, band = {}, hab = {}, freq = {}, records = {};
    juegos.forEach(g => {
      const off = g === 'simon' ? Math.round(r() * 2 - 1) : g === 'frutas' ? Math.round(r() * 80 - 40) : g === 'duelo' ? Math.round(r() * 6 - 3) : Math.round(r() * 4 - 2);
      const b = BASEV[g] + off; const amp = { frutas: 22, simon: 0.6, duelo: 2.5, sudoku: 1.2 }[g];
      series[g] = Array.from({ length: n }, (_, i) => { let v = b + (r() * 2 - 1) * amp; if (an === 'mejorando' && g === mejor && i >= n - 4) v += (i - (n - 5)) * amp * 1.3; return g === 'simon' || g === 'sudoku' ? Math.round(v) : Math.round(v); });
      if (an !== 'base') band[g] = g === 'simon' ? [b - 1, b + 1] : [Math.round(b - amp * 1.6), Math.round(b + amp * 1.6)];
      hab[g] = an === 'mejorando' ? (g === mejor ? 'mejorando' : 'estable') : an;
      freq[g] = g === 'sudoku' ? 'Diario' : g === 'duelo' ? '5 días por semana · 1 partida' : 'Diario · 1 partida';
      records[g] = g === 'sudoku' ? Math.min(...series[g]) - 1 : Math.max(...series[g]) + (g === 'simon' ? 0 : 10);
    });
    const w = Math.min(6, semanas); const prog = juegos.length * 6;
    const constancia = Array.from({ length: 6 }, (_, i) => i < 6 - w ? [0, 0] : [prog, Math.round(prog * (semana[0] / semana[1]) * (0.9 + r() * 0.15))]);
    const mj = mejor ? GAMES[mejor] : null;
    PATIENTS[id] = { id, nombre, trato, iniciales: nombre.split(' ').map(x => x[0]).filter((_, i, a) => i === 0 || i === a.length - 1).join(''), edad, perfil, riesgo, digital, territorio: 'Valle Alto', estado: 'Activo', semanas, analizador: an, remision: r() > 0.5, baseN, baseDias: baseN ? baseN + 3 : undefined, juegos, freq, hab, series, band, constancia, libres: constancia.map(() => Math.round(r() * 3)), semana, phq: an === 'base' ? [7 + Math.round(r() * 4)] : [11, 10, 9, 9].map(v => v + Math.round(r() * 3 - 1)), proxima: PROX[k % 5], ultima: 'Jugó ' + GAMES[juegos[k % juegos.length]].nombre, monedas: semanas * 95 + Math.round(r() * 80), records, recordPrev: {},
      lectura: an === 'base' ? 'Todavía no hay suficientes partidas para comparar: ' + baseN + ' de 10 partidas. El analizador empezará a leer cambios cuando complete su línea base.' : an === 'mejorando' ? 'En ' + mj.nombre + ' la ' + mj.medida.toLowerCase() + ' subió en las últimas 4 semanas, por encima de su rango habitual. Los demás juegos siguen en su rango. Constancia: ' + semana[0] + ' de ' + semana[1] + ' días.' : 'Todas las habilidades están dentro de su rango habitual. Constancia: ' + semana[0] + ' de ' + semana[1] + ' días' + (semana[0] / semana[1] < 0.5 ? ', por debajo de la mitad de lo programado.' : '.'),
      sugerencia: an === 'estable' && semana[0] / semana[1] < 0.5 ? 'Revisar la constancia con la persona' : an === 'base' ? 'Seguir observando' : 'Conversar en la próxima sesión' };
  });
  ORDER.push(...EXTRA.map(e => e[0]));

  // ---- población del programa (para observador, administración y experto) ----
  const NOM = ['Ana Lucía', 'Aníbal', 'Beatriz', 'Bernardo', 'Cecilia', 'Clemente', 'Dora', 'Efraín', 'Esperanza', 'Fabio', 'Gladys', 'Gustavo', 'Hilda', 'Humberto', 'Isabel', 'Jaime', 'Judith', 'León', 'Lilia', 'Manuel', 'Mercedes', 'Nelson', 'Nohora', 'Óscar', 'Pastora', 'Pedro Pablo', 'Rebeca', 'Rubén', 'Socorro', 'Teodoro', 'Teresa', 'Uriel', 'Virginia', 'Wilson', 'Yolanda', 'Álvaro', 'Amparo', 'Benjamín', 'Consuelo', 'Darío', 'Estela', 'Fernando', 'Graciela', 'Hernando', 'Inés María', 'Jesús', 'Leonor', 'Marco Tulio', 'Olga', 'Ricardo', 'Sofía', 'Tulio', 'Zoraida', 'Alcira', 'Bertilda', 'Ciro', 'Delfina'];
  const APE = ['Agudelo', 'Bermúdez', 'Cifuentes', 'Durango', 'Escobar', 'Franco', 'Giraldo', 'Henao', 'Isaza', 'Jaramillo', 'Londoño', 'Montoya', 'Naranjo', 'Ocampo', 'Patiño', 'Quiceno', 'Restrepo', 'Sierra', 'Tabares', 'Urrego', 'Valencia', 'Zuluaga', 'Arango', 'Betancur', 'Castaño', 'Correa'];
  const POBLACION = ORDER.map(id => { const p = PATIENTS[id]; return { id, nombre: p.nombre, edad: p.edad, territorio: p.territorio, estado: p.estado, riesgo: p.riesgo, perfil: p.perfil, analizador: p.analizador, constancia: p.semana[0] / p.semana[1], juegosSem: p.semana[0] * p.juegos.length / 2, clinica: 'Dra. Lucía Paredes' }; })
    .concat(OTHERS.map(o => ({ ...o, riesgo: 'Sin evaluación', analizador: null, constancia: null, clinica: 'Dra. Lucía Paredes' })));
  (function () {
    const r = rng(4242);
    const plan = [['Valle Alto', 37], ['Río Claro', 9], ['Sierra Norte', 9]];
    const RIES = ['Mínimo', 'Leve', 'Leve', 'Moderado', 'Moderado', 'Moderado-severo'];
    let k = 0;
    plan.forEach(([terr, n]) => {
      for (let i = 0; i < n; i++, k++) {
        const x = r();
        const estado = x < 0.66 ? 'Activo' : x < 0.76 ? 'Inactivo' : x < 0.86 ? 'Por aprobar' : x < 0.94 ? 'Sin evaluación' : 'Terminado';
        const evaluado = estado !== 'Sin evaluación';
        const riesgo = evaluado ? RIES[Math.floor(r() * RIES.length)] : 'Sin evaluación';
        const y = r();
        const analizador = estado === 'Activo' ? (y < 0.6 ? 'estable' : y < 0.78 ? 'mejorando' : 'base') : null;
        const ri = RIESGOS_IDX[riesgo]; const di = Math.floor(r() * 3);
        POBLACION.push({ id: 'g' + k, nombre: NOM[k % NOM.length] + ' ' + APE[(k * 7) % APE.length] + ' ' + APE[(k * 3 + 5) % APE.length], edad: 62 + Math.floor(r() * 24), territorio: terr, estado, riesgo, perfil: evaluado && ri != null ? 'P' + String(ri * 3 + di + 1).padStart(2, '0') : '—', analizador, constancia: analizador ? 0.45 + r() * 0.55 : null, juegosSem: analizador ? Math.round(6 + r() * 10) : 0, clinica: terr === 'Valle Alto' ? 'Dr. Mauricio Lenis' : terr === 'Río Claro' ? 'Dra. Patricia Cano' : 'Dr. Iván Restrepo' });
      }
    });
  })();
  function agregados() {
    const cnt = (key) => { const m = {}; POBLACION.forEach(p => { const v = p[key]; if (v == null) return; m[v] = (m[v] || 0) + 1; }); return m; };
    const conA = POBLACION.filter(p => p.analizador);
    const constProm = Math.round(conA.reduce((a, p) => a + Math.min(1, p.constancia), 0) / conA.length * 100);
    const partidas = Math.round(conA.reduce((a, p) => a + p.juegosSem, 0));
    return { total: POBLACION.length, territorio: cnt('territorio'), estado: cnt('estado'), riesgo: cnt('riesgo'), analizador: cnt('analizador'), conJuegos: conA.length, constProm, partidas, porJuego: { frutas: Math.round(partidas * 0.34), simon: Math.round(partidas * 0.29), duelo: Math.round(partidas * 0.21), sudoku: Math.round(partidas * 0.16) }, libres: Math.round(partidas * 0.09), avisosGen: 3, avisosRev: 2 };
  }
  const bucket = n => n >= 5 ? String(n) : 'menos de 5';

  // ---- usuarios del ingreso ----
  const LOGIN = [
    { usuario: 'marcela.rios', nombre: 'Marcela Ríos', rol: 'Administradora', terr: 'Todos los territorios', clave: 'admin', file: 'Administrador.dc.html' },
    { usuario: 'andres.molina', nombre: 'Andrés Molina', rol: 'Experto de campo', terr: 'Valle Alto · Río Claro', clave: 'experto', file: 'Experto.dc.html' },
    { usuario: 'lucia.paredes', nombre: 'Dra. Lucía Paredes', rol: 'Clínica', terr: 'Valle Alto', clave: 'clinico', file: 'Clinico.dc.html' },
    { usuario: 'gloria.pardo', nombre: 'Gloria Pardo', rol: 'Cuidadora', terr: 'Valle Alto', clave: 'cuidador', file: 'Cuidador.dc.html' },
    { usuario: 'tomas.vega', nombre: 'Tomás Vega', rol: 'Observador', terr: 'Todos los territorios', clave: 'observador', file: 'Observador.dc.html' }
  ].concat(MAIN.map(id => ({ usuario: PATIENTS[id].nombre.split(' ')[0].toLowerCase() + '.' + PATIENTS[id].nombre.split(' ').slice(-1)[0].toLowerCase(), nombre: PATIENTS[id].trato + ' · ' + PATIENTS[id].nombre, rol: 'Persona acompañada', terr: PATIENTS[id].territorio, clave: 'paciente', pid: id, file: 'Paciente.dc.html?p=' + id })));
  LOGIN.forEach(u => { u.usuario = u.usuario.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); });
  LOGIN.forEach(u => { u.contrasena = 'Consciente·' + u.usuario.split('.')[0].slice(0, 3) + '26'; });

  // Cuentas Núcleo: mismo rol, correo {rol}+prueba@quintia.com
  const TRIAL_LOGIN = [
    { email: 'admin+prueba@quintia.com', roleId: 'admin', usuario: 'marcela.rios', nombre: 'Marcela Ríos', terr: 'Todos los territorios' },
    { email: 'experto+prueba@quintia.com', roleId: 'experto', usuario: 'andres.molina', nombre: 'Andrés Molina', terr: 'Valle Alto · Río Claro' },
    { email: 'clinico+prueba@quintia.com', roleId: 'clinico', usuario: 'lucia.paredes', nombre: 'Dra. Lucía Paredes', terr: 'Valle Alto' },
    { email: 'cuidador+prueba@quintia.com', roleId: 'cuidador', usuario: 'gloria.pardo', nombre: 'Gloria Pardo', terr: 'Valle Alto', patientSlug: 'rosa' },
    { email: 'observador+prueba@quintia.com', roleId: 'observador', usuario: 'tomas.vega', nombre: 'Tomás Vega', terr: 'Todos los territorios' },
    { email: 'paciente+prueba@quintia.com', roleId: 'paciente', usuario: 'hernan.quintero', nombre: 'Don Hernán · Hernán Quintero', terr: 'Valle Alto', patientSlug: 'hernan' },
    { email: 'paciente2+prueba@quintia.com', roleId: 'paciente', usuario: 'ernesto.villamil', nombre: 'Don Ernesto · Ernesto Villamil', terr: 'Valle Alto', patientSlug: 'ernesto' },
    { email: 'paciente3+prueba@quintia.com', roleId: 'paciente', usuario: 'rosa.pardo', nombre: 'Doña Rosa · Rosa Elena Pardo', terr: 'Valle Alto', patientSlug: 'rosa' },
    { email: 'paciente4+prueba@quintia.com', roleId: 'paciente', usuario: 'elvia.rendon', nombre: 'Doña Elvia · Elvia Rendón', terr: 'Valle Alto', patientSlug: 'elvia' },
  ];

  LOGIN.forEach(u => { u.contrasena = 'Quintia·' + u.usuario.split('.')[0].slice(0, 3) + '26'; });



  return {
    KEY, GAMES, GAME_IDS, MEDIDAS, ESTADOS_AN, PATIENTS, OTHERS, ORDER, MAIN, USERS, TERRITORIOS,
    POBLACION, LOGIN, TRIAL_LOGIN, agregados, bucket, defaults, load, save, update, reset,
    rel, hora, fmtDur, partidas, stats, chart, fmtVal, rangoTxt, monedas, record, totales,
    avisosAbiertos, asistente,
  };
}

/** Snapshot serializable para Mongo app_state.quintiaDemo */
export function prototypeSnapshot() {
  const cs = buildPrototypeCohort();
  const s = cs.defaults();
  return {
    version: 1,
    source: 'consciente-data.js',
    games: cs.GAMES,
    gameIds: cs.GAME_IDS,
    medidas: cs.MEDIDAS,
    estadosAnalizador: cs.ESTADOS_AN,
    patients: cs.PATIENTS,
    order: cs.ORDER,
    main: cs.MAIN,
    others: cs.OTHERS,
    territorios: cs.TERRITORIOS,
    users: cs.USERS,
    login: cs.LOGIN,
    trialLogin: cs.TRIAL_LOGIN,
    poblacion: cs.POBLACION,
    agregados: cs.agregados(s),
    storeDefaults: s,
  };
}

export function featuredPeopleFromPrototype() {
  const cs = buildPrototypeCohort();
  return cs.MAIN.map((slug) => {
    const p = cs.PATIENTS[slug];
    return {
      id: `qdemo-p-${slug}`,
      slug,
      code: `QVA-${p.iniciales}01`,
      name: p.nombre,
      firstName: p.nombre.split(' ')[0],
      lastName: p.nombre.split(' ').slice(1).join(' '),
      trato: p.trato,
      iniciales: p.iniciales,
      age: p.edad,
      terr: p.territorio,
      profile: p.perfil,
      status: p.estado,
      riskLabel: p.riesgo,
      digital: p.digital,
      place: p.territorio === 'Valle Alto' ? 'Valle Alto' : p.territorio,
      rural: true,
      prototype: p,
    };
  });
}
