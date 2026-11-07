// QUINTIA · asistente de IA.
// Usa el servicio de IA cuando está disponible; si no, responde con el motor local
// (reglas y frases), para que la plataforma funcione abriéndola con doble clic.
// En la prueba de concepto, los desarrolladores reemplazan complete() por la función /ai del servidor.
var norm = function (t) { return String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); };
  var has = function (t, list) { return list.some(function (k) { return t.indexOf(k) > -1; }); };
  var pick = function (arr, seed) { return arr[Math.abs(seed) % arr.length]; };
  var seedOf = function (t) { var h = 0; for (var i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) | 0; return h; };

  // ---------- Evaluación del experto: nota en lenguaje natural → borradores ----------
  var FREQ = [
    [3, ['casi todos los dias', 'todos los dias', 'todas las noches', 'casi todas las noches', 'siempre', 'a diario', 'cada dia', 'todo el tiempo', 'casi no duerme', 'no duerme nada', 'no come nada']],
    [2, ['mas de la mitad', 'muchos dias', 'la mayoria', 'seguido', 'casi siempre', 'bastante', 'muy seguido', 'con frecuencia']],
    [0, ['nunca', 'para nada', 'no ha tenido', 'no tiene problema', 'bien de', 'normal', 'no le pasa', 'dice que no', 'respondio que no', 'nada de eso']],
    [1, ['varios dias', 'algunos dias', 'a veces', 'de vez en cuando', 'un poco', 'ratos', 'algunas veces', 'poco']]
  ];
  var PHQ_TOPICS = [
    ['interes', 'disfruta', 'gusta', 'ganas de hacer', 'dejo de ir', 'ya no va', 'no le provoca', 'placer', 'animo para hacer'],
    ['triste', 'decaid', 'deprimid', 'sin esperanza', 'desanimad', 'llora', 'aburrid'],
    ['duerm', 'sueno', 'despiert', 'insomnio', 'de noche'],
    ['cansad', 'energia', 'agotad', 'fatiga', 'sin fuerzas'],
    ['come', 'apetito', 'hambre', 'comida'],
    ['carga', 'culpa', 'fracas', 'mal consigo', 'no sirve', 'estorbo'],
    ['concentr', 'olvid', 'distrai', 'memoria', 'se le va la idea'],
    ['lent', 'inquiet', 'no se queda quiet', 'nervios'],
    ['muert', 'morir', 'hacerse dano', 'quitarse la vida', 'no quiere vivir', 'mejor sin ella', 'mejor sin el', 'pregunta 9']
  ];
  var PHQ_ASK = [
    '¿Ha podido seguir haciendo las cosas que le gustan?',
    '¿Se ha sentido triste, decaído o sin esperanza?',
    '¿Cómo ha dormido estas dos semanas?',
    '¿Cómo está de energía? ¿Se cansa fácil?',
    '¿Cómo va el apetito?',
    '¿Se ha sentido mal consigo mismo o una carga para su familia?',
    '¿Le ha costado concentrarse, por ejemplo en la radio o en una conversación?',
    '¿Se ha sentido muy lento o, al contrario, muy inquieto?',
    null
  ];
  var DIG_ASK = [
    '¿Tiene celular propio o usa el de alguien de la familia?',
    '¿Cómo es la señal o el internet en la casa?',
    '¿Para qué usa el celular: llamadas, WhatsApp, videollamadas?',
    '¿Le queda más fácil leer mensajes o escuchar audios?',
    '¿Le gustaría conversar con una aplicación sobre cómo se siente?',
    '¿Alguien en la casa le ayuda con el celular?'
  ];
  function freqOf(s) {
    for (var i = 0; i < FREQ.length; i++) if (has(s, FREQ[i][1])) return FREQ[i][0];
    return null;
  }
  function interpretNote(text, cur, q9) {
    var t = norm(text), drafts = [], names = [], q9seen = false;
    var sentences = t.split(/[.;!?\n]+| y (?=[a-z]+ (?:casi|varios|algunos|mas|todos|a veces|nunca|poco))/).filter(Boolean);
    var PHQ = window.AlientoStore ? window.AlientoStore.PHQ : [];
    sentences.forEach(function (s) {
      PHQ_TOPICS.forEach(function (keys, i) {
        if (!has(s, keys)) return;
        // Pregunta 9: nunca se llena como borrador; siempre la hace y la marca el experto.
        if (i === 8) { q9seen = true; return; }
        var v = freqOf(s);
        // Negación: "no", "ni", "nunca" sin frecuencia explícita = 0.
        if (v == null && /(^|\s)(no|ni|nunca)\s/.test(' ' + s + ' ')) v = 0;
        if (i === 2 && v == null && has(s, ['despiert', 'casi no duerme', 'no duerme'])) v = 2;
        if (v == null) v = 1;
        if (!drafts.some(function (d) { return d[0] === 'phq' && d[1] === i; })) { drafts.push(['phq', i, v]); names.push((PHQ[i] || 'pregunta ' + (i + 1)).toLowerCase() + ' (' + v + ')'); }
      });
    });
    var add = function (sec, i, v, label) { if (!drafts.some(function (d) { return d[0] === sec && d[1] === i; })) { drafts.push([sec, i, v]); names.push(label); } };
    if (has(t, ['no tiene celular', 'sin celular', 'no usa celular'])) add('dig', 0, 0, 'teléfono: ninguno');
    else if (has(t, ['celular de la hija', 'celular del hijo', 'celular de su hija', 'celular de su hijo', 'prestado', 'compartido', 'de la nieta', 'del nieto', 'del esposo', 'de la esposa'])) add('dig', 0, 1, 'teléfono: compartido');
    else if (has(t, ['celular propio', 'smartphone', 'tiene celular', 'su celular'])) add('dig', 0, 2, 'teléfono: propio');
    if (has(t, ['sin senal', 'no hay senal', 'no entra senal', 'no llega senal'])) add('dig', 1, 0, 'conexión: sin señal');
    else if (has(t, ['datos', 'recarga', 'a veces hay senal', 'senal a ratos', 'poca senal'])) add('dig', 1, 1, 'conexión: datos limitados');
    else if (has(t, ['wifi', 'internet en la casa', 'buen internet', 'buena senal'])) add('dig', 1, 2, 'conexión: estable');
    if (has(t, ['videollamada', 'facebook', 'youtube', 'aplicaciones', 'apps', 'tiktok', 'instagram'])) add('dig', 2, 2, 'uso: apps y videollamadas');
    else if (has(t, ['whatsapp', 'audios', 'mensajes'])) add('dig', 2, 1, 'uso: WhatsApp y audios');
    else if (has(t, ['solo llamadas', 'solo para llamar', 'solo contesta'])) add('dig', 2, 0, 'uso: solo llamadas');
    if (has(t, ['no sabe leer', 'no lee', 'no escribe', 'casi no escribe', 'prefiere audios', 'prefiere voz'])) add('dig', 3, 0, 'lectura: prefiere voz');
    else if (has(t, ['lee poco', 'lectura basica', 'escribe poco', 'le cuesta leer'])) add('dig', 3, 1, 'lectura: básica');
    else if (has(t, ['lee bien', 'escribe bien', 'lee sin problema'])) add('dig', 3, 2, 'lectura: cómoda');
    if (has(t, ['no le interesa', 'no quiere app', 'no usaria', 'no hablaria'])) add('dig', 4, 0, 'app: no');
    else if (has(t, ['tal vez', 'si le ayudan', 'podria ser', 'lo pensaria'])) add('dig', 4, 1, 'app: tal vez');
    else if (has(t, ['si usaria', 'le gustaria la app', 'hablaria con la app', 'si hablaria'])) add('dig', 4, 2, 'app: sí');
    if (has(t, ['vive sola', 'vive solo', 'nadie le ayuda', 'no tiene quien'])) add('dig', 5, 0, 'ayuda en casa: no');
    else if (has(t, ['le ayuda', 'hija vive con', 'hijo vive con', 'vive con la hija', 'vive con el hijo', 'nieta le', 'nieto le'])) add('dig', 5, 1, 'ayuda en casa: sí');
    if (has(t, ['vive sola', 'vive solo', 'casi siempre sola', 'casi siempre solo', 'sin compania', 'nadie vive con'])) add('ctx', 0, 2, 'convivencia: solo/a casi siempre');
    else if (has(t, ['a ratos sola', 'a ratos solo', 'a veces sola', 'a veces solo', 'cuando la hija trabaja', 'cuando el hijo trabaja'])) add('ctx', 0, 1, 'convivencia: a ratos solo/a');
    else if (has(t, ['vive con', 'cuidador', 'cuidadora', 'con la hija', 'con el hijo', 'con la familia', 'no vive sola', 'no vive solo'])) add('ctx', 0, 0, 'convivencia: con familia o cuidador');
    if (has(t, ['fallecio', 'murio', 'duelo', 'perdio a su', 'perdio al', 'perdio a la', 'perdida reciente', 'viudo', 'viuda'])) add('ctx', 1, 1, 'duelo o pérdida: sí');

    var after = { phq: cur.phq.slice(), dig: cur.dig.slice() };
    drafts.forEach(function (d) { if (after[d[0]]) after[d[0]][d[1]] = d[2]; });
    var next = null, n;
    for (n = 0; n < 8; n++) if (after.phq[n] == null) { next = PHQ_ASK[n]; break; }
    if (!next && after.phq[8] == null) next = 'Ahora la pregunta 9. Hágala usted con esta redacción exacta y marque la respuesta en el cuestionario: «' + q9 + '»';
    if (!next) for (n = 0; n < 6; n++) if (after.dig[n] == null) { next = DIG_ASK[n]; break; }
    var pre = q9seen ? 'La pregunta 9 la hace usted, con la redacción exacta, y marca la respuesta. ' : '';
    var reply = pre + (drafts.length
      ? 'Dejé como borrador: ' + names.join(', ') + '. Revíselos con la persona y confírmelos.'
      : (q9seen ? '' : 'No encontré respuestas claras en esa nota. Anote cómo se ha sentido y con qué frecuencia (por ejemplo, "varios días" o "casi todos los días").'));
    reply = reply.trim();
    if (next) reply += ' Siguiente: ' + next;
    else reply += ' Ya están todas las preguntas. Revise los borradores y calcule el resultado.';
    return { reply: reply, drafts: drafts.map(function (d) { return { sec: d[0], i: d[1], v: d[2] }; }) };
  }

  // ---------- Acompañante del paciente (app y WhatsApp) ----------
  // Voz de TEJIVA (QUINTIA): usted, frases cortas, una idea y una sola pregunta por mensaje,
  // sin diagnósticos, promesas ni exclamaciones. App: hasta 3 frases. WhatsApp: hasta 2.
  var TOPICS = [
    [['hola', 'buenas', 'buenos dias', 'buenas tardes', 'buenas noches', 'hey'], [
      'Hola. Aquí estoy con usted. ¿Cómo se siente hoy?',
      'Hola. Gracias por escribir. ¿Quiere contarme cómo va el día, o preferimos una respiración corta?'
    ]],
    [['replica', 'temblo', 'sismo', 'terremoto', 'susto', 'miedo', 'asust'], [
      'Tiene sentido que el cuerpo se asuste con cada réplica. ¿Hacemos juntos la respiración 4-6 por dos minutos?',
      'Después del sismo, el miedo puede volver sin aviso. Le pasa a mucha gente. ¿Quiere que lo anotemos para hablarlo con su psicóloga?'
    ]],
    [['dormi', 'duerm', 'sueno', 'desvel', 'insomnio', 'noche'], [
      'Dormir mal después del sismo es muy común. Antes de acostarse puede probar el audio «Respiración para dormir» de Mi ruta.',
      'Gracias por contarme cómo durmió. ¿Lo anoto para su próxima sesión?'
    ]],
    [['cansad', 'agotad', 'sin energia', 'sin fuerzas'], [
      'Se nota que ha sido un día pesado. Descansar también es cuidarse. ¿Hay algo pequeño que le dé un respiro hoy?',
      'Sentir cansancio después de todo lo que ha vivido tiene sentido. Vaya a su ritmo.'
    ]],
    [['triste', 'llor', 'sola', 'desanim', 'mal'], [
      'Gracias por decírmelo. Lo que siente es importante. ¿Qué fue lo más difícil de hoy?',
      'Hay días más duros que otros, y está bien decirlo. ¿Quiere que lo anotemos para hablarlo con su psicóloga?'
    ]],
    [['corazon', 'ansied', 'nervios', 'angusti', 'no puedo respirar'], [
      'Vamos despacio. Inhale contando hasta 4. Suelte el aire contando hasta 6.',
      'Esa sensación en el pecho suele bajar con la respiración 4-6. Vamos despacio. ¿La hacemos juntos ahora?'
    ]],
    [['hija', 'hijo', 'familia', 'mama', 'esposo', 'nieto', 'nieta'], [
      'La familia pesa mucho en cómo nos sentimos. ¿Cómo ha estado con ellos estos días?',
      'Gracias por contarme de su familia. ¿Lo anotamos como tema para su sesión?'
    ]],
    [['trabajo', 'jefe', 'oficina', 'edificio'], [
      'Volver a un edificio después del sismo puede ser muy difícil. ¿Qué fue lo más duro hoy?',
      'Gracias por contarme. ¿Anotamos lo del trabajo para su próxima sesión?'
    ]],
    [['bien', 'mejor', 'tranquil', 'contenta', 'content'], [
      'Gracias por contarme. ¿Qué cree que le ayudó hoy?',
      'Vale la pena notar lo que funcionó. ¿Qué fue lo que más le sirvió?'
    ]]
  ];
  var GENERIC = [
    'Gracias por contármelo. ¿Quiere contarme un poco más?',
    'Gracias por escribir. ¿Prefiere hablarlo un poco más, hacer una respiración o anotarlo para su sesión?',
    'Gracias por escribir. Aquí sigo cuando quiera conversar.'
  ];
  function short(r, n) { var parts = r.match(/[^.?]+[.?]/g) || [r]; return parts.slice(0, n).join('').trim(); }
  function companion(text, whatsapp) {
    var t = norm(text), s = seedOf(t);
    for (var i = 0; i < TOPICS.length; i++) if (has(t, TOPICS[i][0])) {
      var r = pick(TOPICS[i][1], s);
      return whatsapp ? short(r, 2) : short(r, 3);
    }
    return whatsapp ? 'Gracias, doña Rosalba. Su psicóloga va a ver su mensaje.' : pick(GENERIC, s);
  }
  // Mensaje de crisis: texto fijo, nunca generado
  function crisisText(name, fem) {
    return name + ', gracias por contármelo. Lo que siente es importante y no tiene que pasarlo ' + (fem === false ? 'solo' : 'sola') + '. Voy a pausar esta conversación para que una persona del equipo le llame en menos de 30 minutos. Si está en peligro ahora, llame al 123. Si necesita hablar con alguien, marque la Línea 192, opción 4.';
  }

  // ---------- Punto único de entrada ----------
  function local(prompt) {
    var p = String(prompt);
    if (p.indexOf('asistente de evaluación de QUINTIA') > -1) {
      var note = (p.match(/Nota del experto: "([\s\S]*?)"\nResponde/) || [])[1] || '';
      var cur = { phq: [], dig: [] };
      try { cur = JSON.parse((p.match(/Valores actuales \(null = sin respuesta\): (\{[\s\S]*?\})\.\n/) || [])[1]); } catch (e) { }
      var q9 = (p.match(/«([^»]+)»/) || [])[1] || '';
      return JSON.stringify(interpretNote(note, cur, q9));
    }
    if (p.indexOf('acompañante por WhatsApp') > -1) {
      return companion((p.match(/Doña Rosalba: ([\s\S]*?)\nTEJIVA:/) || p.match(/Doña Rosalba: ([\s\S]*?)\nTEO:/) || [])[1] || '', true);
    }
    if (p.indexOf('Eres TEJIVA, acompañante con IA') > -1 || p.indexOf('Eres TEO, acompañante con IA') > -1) {
      // Última línea del paciente: «Nombre: mensaje» antes de «TEJIVA:»
      var m = p.match(/\n([^:\n]+):\s*([^\n]*)\nTEJIVA:\s*$/) || p.match(/\n([^:\n]+):\s*([^\n]*)\nTEO:\s*$/);
      return companion(m ? m[2] : '', false);
    }
    throw new Error('sin respuesta local');
  }
  async function complete(prompt) {
    if (typeof window !== 'undefined' && window.claude && typeof window.claude.complete === 'function') {
      try { return await window.claude.complete(prompt); } catch (e) { }
    }
    return local(prompt);
  }
  const AlientoAI = { complete: complete, interpretNote: interpretNote, companion: companion, crisisText: crisisText };
  if (typeof window !== 'undefined') {
    window.AlientoAI = AlientoAI;
  }
  export default AlientoAI;
