(function (root) {
  const Tablero = root.QuintiaTablero;
  const EMBED =
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("embed");
  let nodo = null;
  let acciones = null;
  let gesto = null;
  let suprimirClick = false;

  function el(tag, attrs, hijos) {
    const elemento = document.createElement(tag);
    const datos = attrs || {};
    Object.keys(datos).forEach(function (clave) {
      const valor = datos[clave];
      if (valor === null || valor === undefined || valor === false) return;
      if (clave === "class") elemento.className = valor;
      else if (clave === "text") elemento.textContent = valor;
      else if (clave === "style") elemento.setAttribute("style", valor);
      else if (clave.indexOf("on") === 0 && typeof valor === "function") {
        elemento.addEventListener(clave.slice(2).toLowerCase(), valor);
      } else elemento.setAttribute(clave, valor === true ? "true" : String(valor));
    });
    (hijos || []).forEach(function (hijo) {
      if (hijo) elemento.append(hijo);
    });
    return elemento;
  }

  function iconoFruta(fruta, clase) {
    return el("img", {
      src: "fruits/" + fruta.archivo,
      alt: "",
      draggable: "false",
      class: clase
    });
  }

  function pieza(tipo) {
    const caja = el("span", { class: "pieza pointer-events-none flex h-full w-full" });
    caja.append(iconoFruta(Tablero.FRUTAS[tipo], "h-full w-full object-contain"));
    return caja;
  }

  function marca(corta) {
    return el("header", { class: corta ? "flex items-center gap-3" : "flex flex-col gap-2" }, [
      el("span", {
        class: corta
          ? "arco block h-2.5 w-20 shrink-0 rounded-full bg-linear-to-r from-aqua via-cian to-violeta"
          : "arco block h-3 w-28 rounded-full bg-linear-to-r from-aqua via-cian to-violeta",
        "aria-hidden": "true"
      }),
      el("p", {
        class: corta
          ? "m-0 font-titulo text-lg leading-none font-bold"
          : "m-0 font-titulo text-[1.5rem] leading-none font-bold",
        text: "Quintia"
      }),
      corta ? null : el("p", { class: "m-0 text-lg font-semibold text-violeta", text: "Explorar" })
    ]);
  }

  function frases(movimientos) {
    return [
      "Toque dos frutas vecinas o deslice una hacia la otra. Junte 3 o más iguales en fila.",
      "Empieza con manzana, limón y uva. Cada nivel abre frutas nuevas y agranda el tablero.",
      "Tiene " + movimientos + " movimientos."
    ];
  }

  function boton(primario, texto, alClick) {
    const alto = EMBED ? "min-h-12 text-[1.05rem]" : "min-h-16 text-[1.375rem]";
    const clase = primario
      ? "flex " + alto + " w-full cursor-pointer items-center justify-center rounded-2xl border-0 bg-violeta px-4 font-semibold text-white shadow-[0_14px_28px_rgb(108_4_201/28%)] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-violeta"
      : "flex " + alto + " w-full cursor-pointer items-center justify-center rounded-2xl border-2 border-violeta bg-white/80 px-4 font-semibold text-violeta backdrop-blur-sm focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-violeta";
    return el("button", { type: "button", class: clase, onclick: alClick }, [
      el("span", { text: texto })
    ]);
  }

  function muestraInicio() {
    if (EMBED) {
      return el("div", { class: "frutas-inicio-frutas", "aria-hidden": "true" },
        Tablero.FRUTAS.slice(0, 3).map(function (fruta) {
          return iconoFruta(fruta, "frutas-inicio-fruta");
        })
      );
    }
    return el("div", {
      class: "flex items-center justify-center gap-3 rounded-[1.75rem] bg-white/75 px-4 py-4 shadow-[0_18px_36px_rgb(15_45_59/8%)]",
      "aria-hidden": "true"
    }, Tablero.FRUTAS.slice(0, 3).map(function (fruta) {
      return iconoFruta(fruta, "h-20 w-20 object-contain sm:h-24 sm:w-24");
    }));
  }

  function instruccion(estado) {
    const lineas = frases(estado.movimientos);
    const jugarTexto = estado.abierto > 0 ? "Jugar nivel " + (estado.abierto + 1) : "Jugar";
    if (EMBED) {
      return el("section", { class: "frutas-inicio" }, [
        el("div", { class: "frutas-inicio-card" }, [
          el("span", { class: "frutas-decision-arco", "aria-hidden": "true" }),
          el("div", { class: "frutas-inicio-body" }, [
            muestraInicio(),
            el("p", { class: "frutas-inicio-title", text: "Junte 3 o más iguales" }),
            el("p", {
              class: "frutas-inicio-copy",
              id: "instruccion",
              text: "Toque o deslice frutas vecinas. " + lineas[2]
            }),
            el("div", { class: "frutas-decision-actions" }, [
              el("button", {
                type: "button",
                class: "frutas-btn frutas-btn-primario",
                onclick: acciones.jugar
              }, [el("span", { text: jugarTexto })]),
              el("button", {
                type: "button",
                class: "frutas-btn frutas-btn-secundario",
                onclick: acciones.verNiveles
              }, [el("span", { text: "Ver niveles" })])
            ])
          ])
        ])
      ]);
    }
    return el("section", { class: "flex flex-col gap-5 md:mx-auto md:max-w-xl md:pt-4" }, [
      marca(false),
      el("p", { class: "m-0 max-w-[36ch] text-lg text-texto/80", text: "Cinco fuerzas. Infinitas posibilidades." }),
      el("h1", { class: "m-0 font-titulo text-[2.5rem] leading-[1.05] font-bold md:text-[3.25rem]", text: "Frutas" }),
      muestraInicio(),
      el("p", { class: "m-0 max-w-[40ch] text-xl leading-snug", text: lineas[0] }),
      el("p", { class: "m-0 max-w-[40ch] text-xl leading-snug", text: lineas[1] }),
      el("p", { class: "m-0 max-w-[40ch] text-xl leading-snug font-semibold text-violeta", id: "instruccion", text: lineas[2] }),
      boton(true, jugarTexto, acciones.jugar),
      boton(false, "Ver niveles", acciones.verNiveles),
      el("button", {
        type: "button",
        class: "min-h-12 self-start text-left text-lg font-semibold text-violeta underline decoration-2 underline-offset-4 focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-violeta",
        onclick: function () { acciones.escuchar(lineas.join(" ")); }
      }, [el("span", { text: "Escuchar las instrucciones" })])
    ]);
  }

  function botonEn(indice) {
    return nodo.querySelector('.celda[data-indice="' + indice + '"]');
  }

  function piezaEn(indice) {
    return botonEn(indice).querySelector(".pieza");
  }

  function deltaEntre(a, b) {
    const origen = botonEn(a).getBoundingClientRect();
    const destino = botonEn(b).getBoundingClientRect();
    return { x: destino.left - origen.left, y: destino.top - origen.top };
  }

  function espera(ms) {
    return new Promise(function (resolver) {
      root.setTimeout(resolver, ms);
    });
  }

  function reducir() {
    return root.matchMedia && root.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function trasladar(indice, x, y, transicion) {
    const caja = piezaEn(indice);
    caja.style.transition = transicion || "none";
    caja.style.transform = "translate(" + x + "px, " + y + "px)";
  }

  function reposarPiezas(ms) {
    nodo.querySelectorAll(".pieza").forEach(function (caja) {
      caja.style.transition = "transform " + ms + "ms ease";
      caja.style.transform = "";
      root.setTimeout(function () {
        if (caja.style.transform === "") caja.style.transition = "";
      }, ms + 20);
    });
    nodo.querySelectorAll(".celda.arrastrando").forEach(function (celda) {
      celda.classList.remove("arrastrando");
    });
  }

  function vecinoArrastre(indice, mx, my) {
    if (Math.abs(mx) < 8 && Math.abs(my) < 8) return null;
    let destino = null;
    if (Math.abs(mx) > Math.abs(my)) destino = mx > 0 ? indice + 1 : indice - 1;
    else destino = my > 0 ? indice + Tablero.COLUMNAS : indice - Tablero.COLUMNAS;
    if (!Tablero.sonVecinos(indice, destino)) return null;
    return destino;
  }

  function soltar(botonCelda, indice) {
    if (!gesto || gesto.indice !== indice) return;
    const arrastre = gesto.arrastre;
    const mx = gesto.mx || 0;
    const my = gesto.my || 0;
    const limite = botonCelda.getBoundingClientRect().width * 0.34;
    const destino = vecinoArrastre(indice, mx, my);
    const confirma = arrastre && destino !== null && Math.hypot(mx, my) >= limite;
    gesto = null;
    if (!confirma) {
      reposarPiezas(140);
      if (arrastre) suprimirClick = true;
      return;
    }
    suprimirClick = true;
    acciones.deslizar(indice, destino);
  }

  function enlazar(botonCelda, indice) {
    botonCelda.addEventListener("pointerdown", function (evento) {
      if (evento.button !== undefined && evento.button !== 0) return;
      if (nodo.querySelector(".tablero.ocupado")) return;
      botonCelda.setPointerCapture(evento.pointerId);
      gesto = { indice: indice, x: evento.clientX, y: evento.clientY, id: evento.pointerId, arrastre: false, mx: 0, my: 0 };
      botonCelda.classList.add("arrastrando");
    });
    botonCelda.addEventListener("pointermove", function (evento) {
      if (!gesto || gesto.indice !== indice || gesto.id !== evento.pointerId) return;
      const dx = evento.clientX - gesto.x;
      const dy = evento.clientY - gesto.y;
      if (Math.hypot(dx, dy) > 12) gesto.arrastre = true;
      const caja = botonCelda.getBoundingClientRect();
      let mx = dx;
      let my = dy;
      if (Math.abs(dx) > Math.abs(dy)) my = 0;
      else mx = 0;
      mx = Math.max(-caja.width, Math.min(caja.width, mx));
      my = Math.max(-caja.height, Math.min(caja.height, my));
      gesto.mx = mx;
      gesto.my = my;
      trasladar(indice, mx, my, "none");
      nodo.querySelectorAll(".pieza").forEach(function (otra, i) {
        if (i === indice) return;
        otra.style.transition = "none";
        otra.style.transform = "";
      });
      const vecino = vecinoArrastre(indice, mx, my);
      if (vecino !== null) trasladar(vecino, -mx * 0.28, -my * 0.28, "none");
    });
    botonCelda.addEventListener("pointerup", function () { soltar(botonCelda, indice); });
    botonCelda.addEventListener("pointercancel", function () { soltar(botonCelda, indice); });
    botonCelda.addEventListener("click", function () {
      if (suprimirClick) {
        suprimirClick = false;
        return;
      }
      acciones.tocar(indice);
    });
  }

  function moverFoco(evento) {
    const actual = evento.target;
    if (!actual.classList || !actual.classList.contains("celda")) return;
    const indice = Number(actual.getAttribute("data-indice"));
    const lado = Tablero.COLUMNAS;
    let siguiente = null;
    if (evento.key === "ArrowRight" && indice % lado < lado - 1) siguiente = indice + 1;
    else if (evento.key === "ArrowLeft" && indice % lado > 0) siguiente = indice - 1;
    else if (evento.key === "ArrowDown") siguiente = indice + lado;
    else if (evento.key === "ArrowUp") siguiente = indice - lado;
    if (siguiente === null) return;
    const destino = botonEn(siguiente);
    if (!destino) return;
    evento.preventDefault();
    destino.focus();
  }

  function chispas() {
    const capa = el("div", { class: "pointer-events-none absolute inset-0 z-10", "aria-hidden": "true" });
    capa.classList.add("chispas");
    for (let i = 0; i < 8; i += 1) {
      capa.append(el("span", { class: "chispa absolute top-1/2 left-1/2 size-3 -mt-1.5 -ml-1.5 rounded-full opacity-0" }));
    }
    return capa;
  }

  function juego(estado) {
    const lado = estado.fase.lado;
    const celdas = estado.tablero.map(function (tipo, i) {
      const fruta = Tablero.FRUTAS[tipo];
      const botonCelda = el("button", {
        type: "button",
        class: "celda relative flex aspect-square cursor-grab touch-none items-center justify-center rounded-full border-0 bg-transparent p-0 focus-visible:outline-3 focus-visible:outline-offset-[6px] focus-visible:outline-violeta" + (estado.seleccion === i ? " seleccionada" : ""),
        "aria-label": fruta.nombre,
        "aria-pressed": estado.seleccion === i ? "true" : "false",
        "data-indice": String(i),
        "data-fruta": fruta.nombre
      }, [pieza(tipo)]);
      enlazar(botonCelda, i);
      return botonCelda;
    });
    const tableroClass = EMBED
      ? "tablero relative mx-auto grid touch-none gap-2 bg-transparent select-none"
      : "tablero relative mx-auto grid w-[min(100%,calc(100dvh-14rem))] touch-none gap-3 bg-transparent select-none md:w-[min(38rem,calc(100dvh-12rem))] md:gap-4 xl:w-[min(100%,calc(100dvh-5rem))]";
    const tablero = el("div", {
      class: tableroClass + (estado.ocupado ? " ocupado" : "") + (estado.nace ? " nace" : ""),
      role: "group",
      "aria-label": "Tablero de " + lado + " por " + lado,
      style: "grid-template-columns: repeat(" + lado + ", minmax(0, 1fr))"
    }, celdas.concat([
      el("p", { class: "insignia pointer-events-none absolute top-[46%] left-1/2 z-10 m-0 font-titulo leading-none font-bold text-violeta", "aria-hidden": "true" }),
      chispas()
    ]));
    tablero.addEventListener("keydown", moverFoco);
    const meta = estado.fase.meta;
    const ahora = meta === null ? 0 : Math.min(estado.fase.puntos, meta);
    const chipCls = "m-0 rounded-full px-3 py-1.5 text-lg";

    if (EMBED) {
      const hud = el("div", { class: "frutas-hud" }, [
        el("p", {
          class: "mensaje",
          id: "mensaje",
          "aria-live": "polite",
          text: estado.mensaje
        }),
        el("div", { class: "frutas-chips", role: "group", "aria-label": "Estado de la partida" }, [
          el("span", { class: "chip chip-nivel", text: "Nv. " + estado.fase.numero }),
          el("span", { class: "chip chip-mov" }, [
            el("span", { class: "chip-num", text: String(estado.movimientos) }),
            el("span", { text: " mov" })
          ]),
          el("span", { class: "chip chip-puntos" }, [
            el("span", { class: "chip-num", text: String(estado.puntaje) }),
            el("span", { text: " XP" })
          ])
        ]),
        el("div", { class: "frutas-meta" }, [
          el("div", {
            class: "meta",
            role: "progressbar",
            "aria-valuemin": "0",
            "aria-valuemax": meta === null ? "1" : String(meta),
            "aria-valuenow": String(ahora),
            "aria-label": "XP de este nivel",
            hidden: meta === null
          }, [
            el("span", { class: "meta-relleno", style: "width: " + (meta ? Math.round((ahora / meta) * 100) : 0) + "%" })
          ]),
          el("div", { class: "frutas-meta-row" }, [
            el("p", {
              class: "meta-texto",
              text: meta === null
                ? lado + "×" + lado
                : "Faltan " + (meta - ahora) + " XP"
            }),
            el("button", {
              type: "button",
              class: "frutas-niveles",
              onclick: acciones.verNiveles
            }, [el("span", { text: "Niveles" })])
          ])
        ])
      ]);
      const stage = el("div", { class: "frutas-stage" }, [tablero]);
      const seccion = el("section", { class: "frutas-play" }, [hud, stage]);
      return el("div", { class: "contents" }, [seccion, capaDecision(estado)]);
    }

    const panel = el("div", { class: "flex flex-col gap-4 xl:gap-5" }, [
      marca(true),
      el("h1", { class: "m-0 font-titulo text-[2rem] leading-[1.1] font-bold md:text-[2.5rem]", text: "Frutas" }),
      el("p", {
        class: "mensaje m-0 rounded-2xl bg-white/80 px-4 py-3 text-center text-[1.375rem] leading-snug font-semibold text-texto shadow-[0_12px_28px_rgb(15_45_59/8%)] xl:text-left",
        id: "mensaje",
        "aria-live": "polite",
        text: estado.mensaje
      }),
      el("div", { class: "flex flex-wrap gap-2" }, [
        el("p", { class: "chip-nivel " + chipCls + " bg-eco font-semibold text-texto", text: "Nivel " + estado.fase.numero }),
        el("p", { class: "chip-mov " + chipCls + " bg-chip" }, [
          el("span", { class: "chip-num font-semibold", text: String(estado.movimientos) }),
          el("span", { text: " movimientos" })
        ]),
        el("p", { class: "chip-puntos " + chipCls + " bg-chip-puntos" }, [
          el("span", { class: "chip-num font-semibold", text: String(estado.puntaje) }),
          el("span", { text: " XP" })
        ])
      ]),
      el("div", {}, [
        el("p", {
          class: "meta-texto m-0 max-w-[40ch] text-lg",
          text: meta === null
            ? "Tablero " + lado + "×" + lado + "."
            : "Faltan " + (meta - ahora) + " XP para agrandar."
        }),
        el("div", {
          class: "meta mt-2 h-3.5 w-full overflow-hidden rounded-full bg-white/70",
          role: "progressbar",
          "aria-valuemin": "0",
          "aria-valuemax": meta === null ? "1" : String(meta),
          "aria-valuenow": String(ahora),
          "aria-label": "XP de este nivel",
          hidden: meta === null
        }, [
          el("span", { class: "meta-relleno block h-full", style: "width: " + (meta ? Math.round((ahora / meta) * 100) : 0) + "%" })
        ])
      ]),
      el("button", {
        type: "button",
        class: "min-h-11 self-start text-left text-lg font-semibold text-violeta underline decoration-2 underline-offset-4 focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-violeta",
        onclick: acciones.verNiveles
      }, [el("span", { text: "Ver niveles" })])
    ]);
    const seccion = el("section", {
      class: "flex flex-col gap-4 xl:grid xl:min-h-[calc(100dvh-4.5rem)] xl:grid-cols-[minmax(18rem,1fr)_minmax(30rem,42rem)] xl:items-center xl:gap-10"
    }, [panel, tablero]);
    return el("div", { class: "contents" }, [seccion, capaDecision(estado)]);
  }

  function atraparDialogo(evento) {
    if (evento.key !== "Tab") return;
    const dialogo = nodo.querySelector("[role='dialog']");
    if (!dialogo) return;
    const lista = dialogo.querySelectorAll("button");
    if (!lista.length) return;
    const primero = lista[0];
    const ultimo = lista[lista.length - 1];
    if (evento.shiftKey && document.activeElement === primero) {
      evento.preventDefault();
      ultimo.focus();
    } else if (!evento.shiftKey && document.activeElement === ultimo) {
      evento.preventDefault();
      primero.focus();
    }
  }

  function capaDecision(estado) {
    const decision = estado.decision;
    if (!decision) return null;

    if (EMBED) {
      const avanzar = el("button", {
        type: "button",
        class: "frutas-btn frutas-btn-primario",
        "data-accion": "avanzar",
        onclick: acciones.avanzar
      }, [el("span", { text: "Avanzar al nivel " + decision.siguiente })]);
      const repetir = el("button", {
        type: "button",
        class: "frutas-btn frutas-btn-secundario",
        onclick: acciones.repetir
      }, [el("span", { text: "Repetir este nivel" })]);
      const capa = el("div", {
        class: "decision frutas-decision",
        role: "presentation"
      }, [
        el("div", {
          role: "dialog",
          "aria-modal": "true",
          "aria-labelledby": "felicitacion",
          class: "frutas-decision-card"
        }, [
          el("span", { class: "frutas-decision-arco", "aria-hidden": "true" }),
          el("div", { class: "frutas-decision-body" }, [
            el("p", { class: "frutas-decision-eyebrow", text: "Nivel " + decision.completado }),
            el("h2", { id: "felicitacion", class: "frutas-decision-title", text: "¡Muy bien!" }),
            el("p", {
              class: "frutas-decision-copy",
              text: "Siguiente tablero: " + decision.lado + "×" + decision.lado
            }),
            el("div", { class: "frutas-decision-actions" }, [avanzar, repetir])
          ])
        ])
      ]);
      capa.addEventListener("keydown", atraparDialogo);
      return capa;
    }

    const avanzar = boton(true, "Avanzar al nivel " + decision.siguiente, acciones.avanzar);
    const repetir = boton(false, "Repetir este nivel", acciones.repetir);
    avanzar.setAttribute("data-accion", "avanzar");
    const capa = el("div", {
      class: "decision fixed inset-0 z-30 flex items-end justify-center bg-[rgb(15_45_59/45%)] p-4 md:items-center"
    }, [
      el("div", {
        role: "dialog",
        "aria-modal": "true",
        "aria-labelledby": "felicitacion",
        class: "flex w-full max-w-lg flex-col gap-4 overflow-hidden bg-white shadow-[0_20px_48px_rgb(15_45_59/18%)] md:rounded-3xl"
      }, [
        el("span", { class: "block h-2.5 w-full bg-linear-to-r from-aqua via-cian to-violeta", "aria-hidden": "true" }),
        el("div", { class: "flex flex-col gap-4 px-6 pb-6 pt-5" }, [
          el("h2", {
            id: "felicitacion",
            class: "m-0 font-titulo text-[2rem] leading-tight font-bold",
            text: "Felicitaciones"
          }),
          el("p", {
            class: "m-0 max-w-[40ch] text-xl",
            text: "Completó el nivel de experiencia " + decision.completado + "."
          }),
          el("p", {
            class: "m-0 max-w-[40ch] text-lg",
            text: "El siguiente tablero es de " + decision.lado + " × " + decision.lado + "."
          }),
          avanzar,
          repetir
        ])
      ])
    ]);
    capa.addEventListener("keydown", atraparDialogo);
    return capa;
  }

  function abrirDecision(estado) {
    const previa = nodo.querySelector(".decision");
    if (previa) previa.remove();
    const capa = capaDecision(estado);
    if (!capa) return;
    if (EMBED) document.documentElement.classList.add("frutas-modal-abierto");
    nodo.append(capa);
    const primero = capa.querySelector("[data-accion='avanzar']");
    if (primero) primero.focus();
  }

  function frutasDe(nivel, grande) {
    const clase = grande ? "h-[4.5rem] w-[4.5rem] object-contain" : "h-10 w-10 object-contain";
    return el("span", { class: "flex flex-wrap gap-1.5", "aria-hidden": "true" }, nivel.frutas.map(function (fruta) {
      return iconoFruta(fruta, clase);
    }));
  }

  function tarjetaAbierta(nivel, enPartida) {
    const titulo = "Nivel de experiencia " + nivel.numero;
    const medida = "Tablero de " + nivel.lado + " × " + nivel.lado + ".";
    const detalle = nivel.actual
      ? medida + " Está aquí."
      : enPartida
        ? medida + " Abierto."
        : medida + " Jugar este nivel.";
    const cara = "flex h-full w-full flex-col overflow-hidden rounded-[1.75rem] border-0 bg-white p-0 text-left text-texto shadow-[0_22px_44px_rgb(15_45_59/12%)]"
      + (nivel.actual ? " ring-2 ring-violeta" : "");
    const cuerpo = [
      el("span", { class: "block h-2.5 w-full bg-linear-to-r from-aqua via-cian to-violeta", "aria-hidden": "true" }),
      el("span", { class: "flex flex-col gap-3 p-5" }, [
        frutasDe(nivel, true),
        el("span", { class: "font-titulo text-[1.875rem] leading-none font-bold", text: titulo }),
        el("span", { class: "text-lg leading-snug font-semibold text-violeta", text: detalle })
      ])
    ];
    if (enPartida) {
      return el("li", { class: "min-w-0 sm:col-span-2" }, [el("article", { class: cara }, cuerpo)]);
    }
    return el("li", { class: "min-w-0 sm:col-span-2" }, [
      el("button", {
        type: "button",
        class: cara + " cursor-pointer focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-violeta",
        onclick: function () { acciones.jugarNivel(nivel.numero - 1); }
      }, cuerpo)
    ]);
  }

  function filaCerrada(nivel) {
    return el("li", { class: "nivel-cerrado min-w-0" }, [
      el("article", {
        class: "flex items-center gap-3 rounded-2xl border border-white/70 bg-white/55 px-4 py-3 text-texto"
      }, [
        el("span", {
          class: "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-riel/35 font-titulo text-lg font-bold",
          text: String(nivel.numero)
        }),
        el("span", { class: "flex min-w-0 flex-col gap-0.5" }, [
          el("span", { class: "font-titulo text-xl leading-tight font-bold", text: "Nivel de experiencia " + nivel.numero }),
          el("span", { class: "text-lg leading-snug", text: "Cerrado. Se abre al completar el anterior." })
        ])
      ])
    ]);
  }

  function niveles(estado) {
    const enPartida = estado.hayPartida && estado.antes === "juego";
    const abiertos = [];
    const cerrados = [];
    (estado.recorrido || []).forEach(function (nivel) {
      if (nivel.abierto) abiertos.push(tarjetaAbierta(nivel, enPartida));
      else cerrados.push(filaCerrada(nivel));
    });
    const volver = estado.antes === "fin" ? "Volver al resultado" : estado.antes === "juego" ? "Volver a la partida" : null;
    if (EMBED) {
      return el("section", { class: "frutas-niveles-vista" }, [
        el("h1", { class: "frutas-niveles-title", text: "Niveles" }),
        el("p", {
          class: "frutas-niveles-copy",
          text: "Toque un nivel abierto. Los cerrados se revelan al completar el anterior."
        }),
        el("ul", { class: "frutas-niveles-lista" }, abiertos),
        cerrados.length
          ? el("div", { class: "frutas-niveles-cerrados" }, [
            el("p", { class: "frutas-niveles-label", text: "Más adelante" }),
            el("ul", { class: "frutas-niveles-lista" }, cerrados)
          ])
          : null,
        volver
          ? el("button", {
            type: "button",
            class: "frutas-btn frutas-btn-primario",
            onclick: acciones.volver
          }, [el("span", { text: volver })])
          : null
      ]);
    }
    return el("section", { class: "flex flex-col gap-5 md:mx-auto md:max-w-3xl md:pt-4" }, [
      marca(false),
      el("h1", { class: "m-0 font-titulo text-[2.5rem] leading-[1.05] font-bold md:text-[3rem]", text: "Niveles" }),
      el("p", { class: "m-0 max-w-[34ch] text-xl", text: "Toque un nivel abierto. Los cerrados se revelan al completar el anterior." }),
      el("ul", { class: "m-0 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2" }, abiertos),
      cerrados.length
        ? el("div", { class: "flex flex-col gap-2" }, [
          el("p", { class: "m-0 text-lg font-semibold text-texto/70", text: "Más adelante" }),
          el("ul", { class: "m-0 flex list-none flex-col gap-2 p-0" }, cerrados)
        ])
        : null,
      volver ? boton(true, volver, acciones.volver) : null,
      el("button", {
        type: "button",
        class: "min-h-11 self-start text-left text-lg font-semibold text-violeta underline decoration-2 underline-offset-4 focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-violeta",
        onclick: acciones.comoJugar
      }, [el("span", { text: "Cómo jugar" })])
    ]);
  }

  function fin(estado) {
    const cierre = estado.cierre;
    if (EMBED) {
      return el("section", { class: "frutas-fin" }, [
        el("div", { class: "frutas-fin-card" }, [
          el("span", { class: "frutas-decision-arco", "aria-hidden": "true" }),
          el("div", { class: "frutas-fin-body" }, [
            el("p", { class: "frutas-decision-eyebrow", text: "Partida terminada" }),
            el("h1", { class: "frutas-fin-title", text: "¡Buena partida!" }),
            el("p", { class: "frutas-fin-score", text: cierre.valor + " XP" }),
            el("p", {
              class: "frutas-fin-copy",
              text: "Nivel " + cierre.nivel + " de " + cierre.total
            }),
            cierre.nota
              ? el("p", { class: "frutas-fin-nota", text: cierre.nota })
              : null,
            el("div", { class: "frutas-decision-actions" }, [
              el("button", {
                type: "button",
                class: "frutas-btn frutas-btn-primario",
                onclick: acciones.verNiveles
              }, [el("span", { text: "Elegir nivel" })]),
              el("button", {
                type: "button",
                class: "frutas-btn frutas-btn-secundario",
                onclick: acciones.jugar
              }, [el("span", { text: "Jugar de nuevo" })])
            ])
          ])
        ])
      ]);
    }
    return el("section", { class: "flex flex-col gap-5 md:mx-auto md:max-w-xl md:pt-4" }, [
      marca(false),
      el("h1", { class: "m-0 font-titulo text-[2.5rem] leading-[1.05] font-bold md:text-[3.25rem]", text: "¡Buena partida!" }),
      el("p", { class: "resultado m-0 font-titulo leading-[1.05] font-bold text-violeta", text: cierre.valor + " XP" }),
      el("p", { class: "m-0 max-w-[40ch] text-xl", text: "Nivel de experiencia " + cierre.nivel + " de " + cierre.total + "." }),
      cierre.nota ? el("p", { class: "m-0 max-w-[40ch] text-lg", text: cierre.nota }) : null,
      boton(true, "Elegir nivel", acciones.verNiveles),
      boton(false, "Jugar de nuevo", acciones.jugar)
    ]);
  }

  function pintar(estado) {
    const pantalla = estado.pantalla === "juego" ? juego(estado) : estado.pantalla === "fin" ? fin(estado) : estado.pantalla === "niveles" ? niveles(estado) : instruccion(estado);
    nodo.replaceChildren(pantalla);
    if (EMBED) {
      document.documentElement.classList.toggle(
        "frutas-modal-abierto",
        !!(estado.decision && estado.pantalla === "juego")
      );
    }
    const primero = nodo.querySelector("[data-accion='avanzar']");
    if (primero) primero.focus();
  }

  function textos(estado) {
    const mov = nodo.querySelector(".chip-mov .chip-num");
    if (mov) mov.textContent = String(estado.movimientos);
    const pts = nodo.querySelector(".chip-puntos .chip-num");
    if (pts) pts.textContent = String(estado.puntaje);
    const mensaje = nodo.querySelector(".mensaje");
    if (mensaje) mensaje.textContent = estado.mensaje;
    const tablero = nodo.querySelector(".tablero");
    if (tablero) tablero.classList.toggle("ocupado", estado.ocupado);
    const fase = estado.fase;
    if (!fase) return;
    const nivel = nodo.querySelector(".chip-nivel");
    if (nivel) nivel.textContent = (EMBED ? "Nv. " : "Nivel ") + fase.numero;
    const ayuda = nodo.querySelector(".meta-texto");
    const medidor = nodo.querySelector(".meta");
    const relleno = nodo.querySelector(".meta-relleno");
    if (!ayuda || !medidor) return;
    if (fase.meta === null) {
      medidor.hidden = true;
      ayuda.textContent = EMBED
        ? fase.lado + "×" + fase.lado
        : "Tablero de " + fase.lado + " × " + fase.lado + ". Siga hasta acabar los movimientos.";
      return;
    }
    const ahora = Math.min(fase.puntos, fase.meta);
    const faltan = Math.max(0, fase.meta - fase.puntos);
    medidor.hidden = false;
    medidor.setAttribute("aria-valuenow", String(ahora));
    medidor.setAttribute("aria-valuemax", String(fase.meta));
    if (relleno) relleno.style.width = Math.round((ahora / fase.meta) * 100) + "%";
    ayuda.textContent = EMBED
      ? "Faltan " + faltan + " XP"
      : "Faltan " + faltan + " XP para un tablero más grande.";
  }

  function parchar(estado) {
    if (estado.pantalla !== "juego" || !nodo.querySelector(".tablero")) {
      pintar(estado);
      return;
    }
    textos(estado);
    nodo.querySelectorAll(".celda").forEach(function (botonCelda) {
      const indice = Number(botonCelda.getAttribute("data-indice"));
      const activa = estado.seleccion === indice;
      botonCelda.classList.toggle("seleccionada", activa);
      botonCelda.setAttribute("aria-pressed", activa ? "true" : "false");
    });
  }

  function fijar(estado) {
    nodo.querySelectorAll(".celda").forEach(function (botonCelda) {
      const indice = Number(botonCelda.getAttribute("data-indice"));
      const fruta = Tablero.FRUTAS[estado.tablero[indice]];
      const caja = botonCelda.querySelector(".pieza");
      caja.style.transition = "";
      caja.style.transform = "";
      botonCelda.classList.remove("arrastrando");
      if (botonCelda.getAttribute("data-fruta") !== fruta.nombre) {
        caja.replaceChildren(iconoFruta(fruta, "h-full w-full object-contain"));
        botonCelda.setAttribute("data-fruta", fruta.nombre);
        botonCelda.setAttribute("aria-label", fruta.nombre);
      }
    });
  }

  function animarDesliz(a, b) {
    if (reducir()) return espera(0);
    const delta = deltaEntre(a, b);
    botonEn(a).classList.add("en-vuelo");
    botonEn(b).classList.add("en-vuelo");
    trasladar(a, delta.x, delta.y, "transform 180ms ease");
    trasladar(b, -delta.x, -delta.y, "transform 180ms ease");
    return espera(190);
  }

  function animarRebote(a, b) {
    return animarDesliz(a, b).then(function () {
      if (reducir()) return espera(0);
      trasladar(a, 0, 0, "transform 180ms ease");
      trasladar(b, 0, 0, "transform 180ms ease");
      botonEn(a).classList.remove("en-vuelo");
      botonEn(b).classList.remove("en-vuelo");
      return espera(190);
    });
  }

  function claseLinea(largo) {
    if (largo >= 5) return "linea-5";
    if (largo === 4) return "linea-4";
    return "linea-3";
  }

  function msLinea(largo) {
    if (reducir()) return 0;
    if (largo >= 5) return 720;
    if (largo === 4) return 540;
    return 400;
  }

  function celebrar(grupos, coinciden) {
    const marcas = coinciden instanceof Set ? coinciden : new Set(coinciden);
    let mejor = 3;
    nodo.querySelectorAll(".celda").forEach(function (botonCelda) {
      botonCelda.classList.remove("linea-3", "linea-4", "linea-5", "en-vuelo");
    });
    marcas.forEach(function (indice) {
      let largo = 3;
      grupos.forEach(function (grupo) {
        if (grupo.indices.indexOf(indice) >= 0 && grupo.largo > largo) largo = grupo.largo;
      });
      if (largo > mejor) mejor = largo;
      botonEn(indice).classList.add(claseLinea(largo));
    });
    const tablero = nodo.querySelector(".tablero");
    const insignia = nodo.querySelector(".insignia");
    tablero.classList.remove("celebra-4", "celebra-5");
    insignia.textContent = "";
    if (mejor >= 4) {
      insignia.textContent = "¡" + mejor + "!";
      tablero.classList.add(mejor >= 5 ? "celebra-5" : "celebra-4");
    }
    return espera(msLinea(mejor));
  }

  function aplicarTablero(estado, distancias, remezcla) {
    const paso = botonEn(0).getBoundingClientRect().height + 6;
    nodo.querySelector(".tablero").classList.remove("celebra-4", "celebra-5");
    nodo.querySelector(".insignia").textContent = "";
    nodo.querySelectorAll(".celda").forEach(function (botonCelda) {
      const indice = Number(botonCelda.getAttribute("data-indice"));
      const fruta = Tablero.FRUTAS[estado.tablero[indice]];
      const caja = botonCelda.querySelector(".pieza");
      botonCelda.classList.remove("linea-3", "linea-4", "linea-5", "en-vuelo", "seleccionada");
      caja.style.transition = "";
      caja.style.transform = "";
      caja.classList.remove("cae", "aparece");
      if (botonCelda.getAttribute("data-fruta") !== fruta.nombre) {
        caja.replaceChildren(iconoFruta(fruta, "h-full w-full object-contain"));
        botonCelda.setAttribute("data-fruta", fruta.nombre);
        botonCelda.setAttribute("aria-label", fruta.nombre);
      }
      const filas = distancias ? distancias[indice] : 0;
      if (!reducir() && filas > 0) {
        caja.style.setProperty("--caida", (filas * paso) + "px");
        caja.classList.add("cae");
      } else if (!reducir() && remezcla) {
        caja.classList.add("aparece");
      }
    });
    textos(estado);
  }

  function montar(raiz, nuevasAcciones) {
    nodo = raiz;
    acciones = nuevasAcciones;
  }

  root.QuintiaVista = {
    montar: montar,
    pintar: pintar,
    parchar: parchar,
    fijar: fijar,
    animarDesliz: animarDesliz,
    animarRebote: animarRebote,
    celebrar: celebrar,
    aplicarTablero: aplicarTablero,
    abrirDecision: abrirDecision
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
