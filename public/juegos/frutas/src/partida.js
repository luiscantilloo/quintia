(function (root) {
  const Tablero = root.QuintiaTablero;
  const Vista = root.QuintiaVista;
  const MOVIMIENTOS = [12, 18, 24];
  const NIVELES = [
    { lado: 4, tipos: 3, meta: 200 },
    { lado: 5, tipos: 5, meta: 280 },
    { lado: 6, tipos: 7, meta: 380 },
    { lado: 7, tipos: 10, meta: 500 },
    { lado: 8, tipos: 12, meta: null }
  ];
  const PAUSA = root.matchMedia && root.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const estado = {
    pantalla: "instr",
    tablero: [],
    seleccion: null,
    movimientos: 18,
    puntaje: 0,
    puntosFase: 0,
    indiceFase: 0,
    fase: null,
    nace: false,
    decision: null,
    abierto: 0,
    hayPartida: false,
    regreso: "instr",
    recorrido: [],
    antes: "instr",
    mensaje: "Toque una fruta o deslícela hacia una vecina.",
    ocupado: false,
    invalidos: 0,
    combos: [],
    tiempos: [],
    ultimo: 0,
    inicio: 0,
    cierre: null
  };

  let config = null;
  let timers = [];
  let audio = null;
  let cerrada = false;
  let generacion = 0;

  function luego(fn, ms) {
    timers.push(root.setTimeout(fn, PAUSA ? 0 : ms));
  }

  function limpiarTimers() {
    timers.forEach(function (id) { root.clearTimeout(id); });
    timers = [];
  }

  function leerConfig() {
    const params = new URLSearchParams(root.location.search);
    const mov = Number(params.get("mov"));
    const version = Number(params.get("version"));
    const nivelRaw = Number(params.get("nivel"));
    const pid = params.get("pid");
    const sube = String(params.get("sube") || "auto").toLowerCase();
    return {
      pid: pid ? pid : null,
      tipo: params.get("tipo") === "Programada" ? "Programada" : "Libre",
      version: Number.isFinite(version) && version > 0 ? version : 3,
      sync: params.get("sync") !== "0",
      mov: MOVIMIENTOS.indexOf(mov) >= 0 ? mov : 18,
      sonido: params.get("sonido") !== "0",
      nivel:
        Number.isFinite(nivelRaw) && nivelRaw >= 1 && nivelRaw <= NIVELES.length
          ? Math.floor(nivelRaw)
          : 1,
      subeAuto: sube !== "fijo" && sube !== "fixed" && sube !== "0"
    };
  }

  function escuchar(texto) {
    try {
      const frase = new SpeechSynthesisUtterance(texto);
      frase.lang = "es-ES";
      frase.rate = 0.92;
      speechSynthesis.cancel();
      speechSynthesis.speak(frase);
    } catch (error) {
      return error;
    }
  }

  function prepararAudio() {
    if (!config.sonido) return;
    try {
      audio = audio || new (root.AudioContext || root.webkitAudioContext)();
      if (audio.state === "suspended") audio.resume();
    } catch (error) {
      return error;
    }
  }

  function tono(largo) {
    if (!config.sonido) return;
    try {
      prepararAudio();
      const osc = audio.createOscillator();
      const ganancia = audio.createGain();
      osc.type = "sine";
      osc.frequency.value = largo >= 5 ? 659 : largo === 4 ? 587 : 523;
      ganancia.gain.value = largo >= 5 ? 0.06 : 0.04;
      osc.connect(ganancia);
      ganancia.connect(audio.destination);
      osc.start();
      const duracion = largo >= 5 ? 0.34 : largo === 4 ? 0.26 : 0.18;
      ganancia.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + duracion);
      osc.stop(audio.currentTime + duracion + 0.02);
    } catch (error) {
      return error;
    }
  }

  function sincronizarFase() {
    const nivel = NIVELES[estado.indiceFase];
    estado.fase = {
      numero: estado.indiceFase + 1,
      total: NIVELES.length,
      lado: nivel.lado,
      tipos: nivel.tipos,
      meta: nivel.meta,
      puntos: estado.puntosFase
    };
    estado.recorrido = NIVELES.map(function (paso, i) {
      return {
        numero: i + 1,
        lado: paso.lado,
        tipos: paso.tipos,
        frutas: Tablero.FRUTAS.slice(0, paso.tipos),
        abierto: i <= estado.abierto,
        actual: i === estado.indiceFase && (estado.pantalla === "juego" || estado.pantalla === "fin")
      };
    });
  }

  function aplicarForma(indice) {
    const nivel = NIVELES[indice];
    estado.indiceFase = indice;
    Tablero.usarForma({ columnas: nivel.lado, filas: nivel.lado, tipos: nivel.tipos });
    sincronizarFase();
  }

  function mensajeLinea(largo, nivel) {
    const base = largo >= 6 ? "¡Seis en línea!" : largo >= 5 ? "¡Cinco en línea!" : largo === 4 ? "¡Cuatro en línea!" : "¡Bien!";
    return nivel > 1 ? base + " XP extra." : base;
  }

  function mejorLargo(grupos, coinciden) {
    const marcas = coinciden instanceof Set ? coinciden : new Set(coinciden);
    let mejor = 3;
    grupos.forEach(function (grupo) {
      const toca = grupo.indices.some(function (indice) { return marcas.has(indice); });
      if (toca && grupo.largo > mejor) mejor = grupo.largo;
    });
    return mejor;
  }

  /**
   * Arma el detalle de quintia:partida. El núcleo clínico interpreta la medida.
   * @returns {object}
   */
  function detallePartida() {
    return {
      pid: config.pid,
      game: "frutas",
      version: config.version,
      codigo: "FRU",
      valor: estado.puntaje,
      dur: Math.max(1, Math.round((Date.now() - estado.inicio) / 1000)),
      tipo: config.tipo,
      sync: config.sync,
      metr: {
        invalidos: estado.invalidos,
        combos: estado.combos.slice(),
        tiempos: estado.tiempos.slice(),
        sinUsar: estado.movimientos
      }
    };
  }

  function cerrar() {
    if (cerrada) return;
    cerrada = true;
    const detail = detallePartida();
    root.QuintiaFrutas.ultimaPartida = detail;
    root.dispatchEvent(new CustomEvent("quintia:partida", { detail: detail }));
    // Bridge hacia el shell React (iframe → parent).
    try {
      if (root.parent && root.parent !== root) {
        root.parent.postMessage({ type: "quintia:partida", detail: detail }, "*");
      }
    } catch (error) {
      /* el juego sigue aunque el padre no escuche */
    }
    estado.pantalla = "fin";
    estado.hayPartida = false;
    estado.ocupado = false;
    estado.seleccion = null;
    estado.cierre = {
      valor: detail.valor,
      nota: config.sync ? "" : "Su partida se guardará cuando haya señal.",
      nivel: estado.fase.numero,
      total: estado.fase.total,
      lado: estado.fase.lado
    };
    Vista.pintar(estado);
  }

  function resolver(tablero, coinciden, nivel, encadenadas, gen) {
    const grupos = Tablero.grupos(tablero);
    const largo = mejorLargo(grupos, coinciden);
    const paso = Tablero.caer(tablero, coinciden, nivel);
    estado.puntaje += paso.puntos;
    estado.puntosFase += paso.puntos;
    sincronizarFase();
    estado.mensaje = mensajeLinea(largo, nivel);
    Vista.parchar(estado);
    tono(largo);
    Vista.celebrar(grupos, coinciden).then(function () {
      if (gen !== generacion) return;
      if (paso.siguientes.size > 0) {
        estado.tablero = paso.tablero;
        Vista.aplicarTablero(estado, Tablero.caida(coinciden), false);
        luego(function () {
          if (gen !== generacion) return;
          resolver(paso.tablero, paso.siguientes, nivel + 1, encadenadas + 1, gen);
        }, 280);
        return;
      }
      let tableroFinal = paso.tablero;
      let mensaje = nivel > 1 ? "¡Cascada! Ganó XP extra." : "Siga así.";
      let remezcla = false;
      if (!Tablero.hayJugada(tableroFinal)) {
        tableroFinal = Tablero.crearTablero();
        mensaje = "Mezclamos las frutas para seguir.";
        remezcla = true;
      }
      estado.combos.push(encadenadas + 1);
      const meta = NIVELES[estado.indiceFase].meta;
      const sube = estado.movimientos > 0 && meta !== null && estado.puntosFase >= meta;
      if (sube && config.subeAuto && estado.indiceFase < NIVELES.length - 1) {
        estado.tablero = tableroFinal;
        estado.seleccion = null;
        estado.ocupado = true;
        estado.abierto = Math.min(NIVELES.length - 1, Math.max(estado.abierto, estado.indiceFase + 1));
        estado.mensaje = "Completó el nivel de experiencia " + estado.fase.numero + ".";
        estado.decision = {
          completado: estado.fase.numero,
          siguiente: estado.fase.numero + 1,
          lado: NIVELES[estado.indiceFase + 1].lado
        };
        Vista.aplicarTablero(estado, remezcla ? null : Tablero.caida(coinciden), remezcla);
        Vista.abrirDecision(estado);
        return;
      }
      if (sube && !config.subeAuto) {
        estado.mensaje = "Meta alcanzada. Este nivel está fijo: siga con los movimientos.";
      }
      estado.tablero = tableroFinal;
      estado.ocupado = false;
      estado.mensaje = mensaje;
      Vista.aplicarTablero(estado, remezcla ? null : Tablero.caida(coinciden), remezcla);
      if (estado.movimientos <= 0) luego(cerrar, 700);
    });
  }

  function intentar(origen, destino) {
    if (estado.pantalla !== "juego" || estado.ocupado || estado.decision || estado.movimientos <= 0) return;
    if (!Tablero.sonVecinos(origen, destino)) return;
    const gen = generacion;
    const ahora = Date.now();
    estado.tiempos.push(ahora - estado.ultimo);
    estado.ultimo = ahora;
    estado.seleccion = null;
    estado.ocupado = true;
    const cambiado = Tablero.intercambiar(estado.tablero, origen, destino);
    const coinciden = Tablero.lineas(cambiado);
    Vista.parchar(estado);

    if (coinciden.size === 0) {
      estado.invalidos += 1;
      estado.mensaje = "Esas no forman fila. Pruebe con otra.";
      Vista.parchar(estado);
      Vista.animarRebote(origen, destino).then(function () {
        if (gen !== generacion) return;
        estado.ocupado = false;
        estado.mensaje = "Esas no forman fila. Pruebe con otra.";
        Vista.parchar(estado);
      });
      return;
    }

    estado.movimientos -= 1;
    prepararAudio();
    Vista.parchar(estado);
    Vista.animarDesliz(origen, destino).then(function () {
      if (gen !== generacion) return;
      estado.tablero = cambiado;
      Vista.fijar(estado);
      resolver(cambiado, coinciden, 1, 0, gen);
    });
  }

  function tocar(indice) {
    if (estado.pantalla !== "juego" || estado.ocupado || estado.decision || estado.movimientos <= 0) return;
    if (estado.seleccion === null) {
      estado.seleccion = indice;
      estado.mensaje = "Ahora toque una fruta vecina.";
      Vista.parchar(estado);
      return;
    }
    if (estado.seleccion === indice) {
      estado.seleccion = null;
      estado.mensaje = "Toque una fruta o deslícela hacia una vecina.";
      Vista.parchar(estado);
      return;
    }
    const origen = estado.seleccion;
    if (!Tablero.sonVecinos(origen, indice)) {
      estado.seleccion = indice;
      Vista.parchar(estado);
      return;
    }
    intentar(origen, indice);
  }

  function avanzarNivel() {
    if (!estado.decision) return;
    estado.decision = null;
    estado.puntosFase = 0;
    estado.nace = true;
    aplicarForma(estado.indiceFase + 1);
    estado.tablero = Tablero.crearTablero();
    estado.seleccion = null;
    estado.ocupado = false;
    estado.pantalla = "juego";
    estado.mensaje = "Nivel de experiencia " + estado.fase.numero + ". El tablero es más grande.";
    Vista.pintar(estado);
    estado.nace = false;
  }

  function repetirNivel() {
    if (!estado.decision) return;
    estado.decision = null;
    estado.puntosFase = 0;
    sincronizarFase();
    estado.tablero = Tablero.crearTablero();
    estado.seleccion = null;
    estado.ocupado = false;
    estado.nace = true;
    estado.pantalla = "juego";
    estado.mensaje = "Repite el nivel de experiencia " + estado.fase.numero + ".";
    Vista.pintar(estado);
    estado.nace = false;
  }

  function jugarNivel(indice) {
    if (indice > estado.abierto || indice < 0) return;
    limpiarTimers();
    generacion += 1;
    cerrada = false;
    try { speechSynthesis.cancel(); } catch (error) { /* la voz es opcional */ }
    estado.pantalla = "juego";
    estado.puntosFase = 0;
    estado.decision = null;
    estado.nace = false;
    estado.hayPartida = true;
    aplicarForma(indice);
    estado.tablero = Tablero.crearTablero();
    estado.seleccion = null;
    estado.movimientos = config.mov;
    estado.puntaje = 0;
    estado.mensaje = "Toque una fruta o deslícela hacia una vecina.";
    estado.ocupado = false;
    estado.invalidos = 0;
    estado.combos = [];
    estado.tiempos = [];
    estado.ultimo = Date.now();
    estado.inicio = estado.ultimo;
    estado.cierre = null;
    Vista.pintar(estado);
  }

  function verNiveles() {
    if (estado.pantalla === "niveles") return;
    sincronizarFase();
    estado.antes = estado.pantalla;
    estado.pantalla = "niveles";
    Vista.pintar(estado);
  }

  function volverVista() {
    const destino = estado.antes === "juego" || estado.antes === "fin" || estado.antes === "instr" ? estado.antes : "instr";
    estado.pantalla = destino;
    Vista.pintar(estado);
  }

  function comoJugar() {
    estado.pantalla = "instr";
    Vista.pintar(estado);
  }

  function mostrarInicio() {
    limpiarTimers();
    generacion += 1;
    estado.pantalla = "instr";
    estado.movimientos = config.mov;
    estado.seleccion = null;
    estado.cierre = null;
    Vista.pintar(estado);
  }

  function iniciar() {
    config = leerConfig();
    const idx = Math.max(0, Math.min(NIVELES.length - 1, config.nivel - 1));
    estado.abierto = idx;
    estado.indiceFase = idx;
    root.QuintiaFrutas = { ultimaPartida: null };
    Vista.montar(document.getElementById("app"), {
      jugar: function () { jugarNivel(estado.abierto); },
      jugarNivel: jugarNivel,
      otra: verNiveles,
      tocar: tocar,
      deslizar: intentar,
      escuchar: escuchar,
      avanzar: avanzarNivel,
      repetir: repetirNivel,
      verNiveles: verNiveles,
      volver: volverVista,
      comoJugar: comoJugar
    });
    mostrarInicio();
  }

  iniciar();
})(window);
