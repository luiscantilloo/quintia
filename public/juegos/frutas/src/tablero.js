(function (root) {
  let columnas = 6;
  let filas = 6;
  let tipos = 5;

  const FRUTAS = [
    { id: "manzana", nombre: "Manzana", archivo: "fruit_food_apples_icon_218720.svg" },
    { id: "limon", nombre: "Limón", archivo: "fruit_food_fresh_lemon_icon_218722.svg" },
    { id: "uva", nombre: "Uva", archivo: "fruit_blueberry_grape_food_icon_218715.svg" },
    { id: "naranja", nombre: "Naranja", archivo: "food_orange_fruit_icon_218713.svg" },
    { id: "fresa", nombre: "Fresa", archivo: "strawberry_food_fruit_icon_218718.svg" },
    { id: "sandia", nombre: "Sandía", archivo: "fruit_watermelon_food_icon_218717.svg" },
    { id: "pina", nombre: "Piña", archivo: "food_fresh_pinapple_fruit_icon_218721.svg" },
    { id: "pera", nombre: "Pera", archivo: "guava_food_fruit_icon_218724.svg" },
    { id: "manzana-verde", nombre: "Manzana verde", archivo: "fruit_apples_food_icon_218716.svg" },
    { id: "uva-verde", nombre: "Uva verde", archivo: "fruit_grape_food_icon_218714.svg" },
    { id: "mora", nombre: "Mora", archivo: "berry_blackberry_fruit_food_icon_218712.svg" },
    { id: "frambuesa", nombre: "Frambuesa", archivo: "berry_fruit_food_icon_218719.svg" }
  ];

  function celdas() {
    return columnas * filas;
  }

  function usarForma(forma) {
    columnas = forma.columnas;
    filas = forma.filas;
    tipos = forma.tipos;
    root.QuintiaTablero.COLUMNAS = columnas;
    root.QuintiaTablero.FILAS = filas;
    root.QuintiaTablero.TIPOS = tipos;
  }

  function entero(azar, total) {
    return Math.floor(azar() * total);
  }

  function idx(fila, columna) {
    return fila * columnas + columna;
  }

  function lineas(tablero) {
    const coinciden = new Set();
    for (let fila = 0; fila < filas; fila += 1) {
      for (let columna = 0; columna < columnas; columna += 1) {
        const i = idx(fila, columna);
        const tipo = tablero[i];
        if (tipo < 0) continue;
        if (columna <= columnas - 3 && tablero[i + 1] === tipo && tablero[i + 2] === tipo) {
          let k = columna;
          while (k < columnas && tablero[idx(fila, k)] === tipo) {
            coinciden.add(idx(fila, k));
            k += 1;
          }
        }
        if (fila <= filas - 3 && tablero[i + columnas] === tipo && tablero[i + 2 * columnas] === tipo) {
          let k = fila;
          while (k < filas && tablero[idx(k, columna)] === tipo) {
            coinciden.add(idx(k, columna));
            k += 1;
          }
        }
      }
    }
    return coinciden;
  }

  function intercambiar(tablero, origen, destino) {
    const siguiente = tablero.slice();
    const tipo = siguiente[origen];
    siguiente[origen] = siguiente[destino];
    siguiente[destino] = tipo;
    return siguiente;
  }

  function sonVecinos(origen, destino) {
    const mismaFila = Math.floor(origen / columnas) === Math.floor(destino / columnas);
    const distancia = Math.abs(origen - destino);
    return (distancia === 1 && mismaFila) || distancia === columnas;
  }

  function hayJugada(tablero) {
    const total = celdas();
    for (let i = 0; i < total; i += 1) {
      const destinos = [i + 1, i + columnas];
      for (let d = 0; d < destinos.length; d += 1) {
        const j = destinos[d];
        if (j >= total) continue;
        if (j === i + 1 && i % columnas === columnas - 1) continue;
        if (lineas(intercambiar(tablero, i, j)).size > 0) return true;
      }
    }
    return false;
  }

  function tipoInicial(tablero, i, azar) {
    const columna = i % columnas;
    const primero = entero(azar, tipos);
    for (let paso = 0; paso < tipos; paso += 1) {
      const candidato = (primero + paso) % tipos;
      const horizontal = columna >= 2 && tablero[i - 1] === candidato && tablero[i - 2] === candidato;
      const vertical = i >= 2 * columnas && tablero[i - columnas] === candidato && tablero[i - 2 * columnas] === candidato;
      if (!horizontal && !vertical) return candidato;
    }
    return primero;
  }

  function sembrar(tablero) {
    tablero[0] = 0;
    tablero[1] = 0;
    tablero[2] = 1;
    tablero[columnas + 2] = 0;
    return tablero;
  }

  function crearTablero(azar) {
    const aleatorio = azar || Math.random;
    for (let intento = 0; intento < 80; intento += 1) {
      const tablero = [];
      for (let i = 0; i < celdas(); i += 1) tablero.push(tipoInicial(tablero, i, aleatorio));
      if (lineas(tablero).size === 0 && hayJugada(tablero)) return tablero;
    }
    const fijo = [];
    for (let fila = 0; fila < filas; fila += 1) {
      for (let columna = 0; columna < columnas; columna += 1) {
        fijo.push((fila + columna) % tipos);
      }
    }
    sembrar(fijo);
    return fijo;
  }

  function formaLinea(tablero, i, tipo) {
    const fila = Math.floor(i / columnas);
    const columna = i % columnas;
    let izquierda = 0;
    for (let c = columna - 1; c >= 0 && tablero[idx(fila, c)] === tipo; c -= 1) izquierda += 1;
    let derecha = 0;
    for (let c = columna + 1; c < columnas && tablero[idx(fila, c)] === tipo; c += 1) derecha += 1;
    if (izquierda + derecha >= 2) return true;
    let arriba = 0;
    for (let r = fila - 1; r >= 0 && tablero[idx(r, columna)] === tipo; r -= 1) arriba += 1;
    let abajo = 0;
    for (let r = fila + 1; r < filas && tablero[idx(r, columna)] === tipo; r += 1) abajo += 1;
    return arriba + abajo >= 2;
  }

  function frutaNueva(tablero, i, azar) {
    const primero = entero(azar, tipos);
    for (let paso = 0; paso < tipos; paso += 1) {
      const candidato = (primero + paso) % tipos;
      if (!formaLinea(tablero, i, candidato)) return candidato;
    }
    return primero;
  }

  function gravedad(tablero, coinciden, azar) {
    const aleatorio = azar || Math.random;
    const siguiente = new Array(celdas()).fill(-1);
    const marcas = coinciden instanceof Set ? coinciden : new Set(coinciden);
    for (let columna = 0; columna < columnas; columna += 1) {
      const vivas = [];
      for (let fila = filas - 1; fila >= 0; fila -= 1) {
        const i = idx(fila, columna);
        if (!marcas.has(i)) vivas.push(tablero[i]);
      }
      for (let k = 0; k < vivas.length; k += 1) siguiente[idx(filas - 1 - k, columna)] = vivas[k];
    }
    for (let fila = filas - 1; fila >= 0; fila -= 1) {
      for (let columna = 0; columna < columnas; columna += 1) {
        const i = idx(fila, columna);
        if (siguiente[i] === -1) siguiente[i] = frutaNueva(siguiente, i, aleatorio);
      }
    }
    return siguiente;
  }

  function grupos(tablero) {
    const lista = [];
    for (let fila = 0; fila < filas; fila += 1) {
      let columna = 0;
      while (columna < columnas) {
        const tipo = tablero[idx(fila, columna)];
        let fin = columna + 1;
        while (fin < columnas && tablero[idx(fila, fin)] === tipo && tipo >= 0) fin += 1;
        if (fin - columna >= 3) {
          const indices = [];
          for (let c = columna; c < fin; c += 1) indices.push(idx(fila, c));
          lista.push({ indices: indices, largo: fin - columna });
        }
        columna = Math.max(fin, columna + 1);
      }
    }
    for (let columna = 0; columna < columnas; columna += 1) {
      let fila = 0;
      while (fila < filas) {
        const tipo = tablero[idx(fila, columna)];
        let fin = fila + 1;
        while (fin < filas && tablero[idx(fin, columna)] === tipo && tipo >= 0) fin += 1;
        if (fin - fila >= 3) {
          const indices = [];
          for (let r = fila; r < fin; r += 1) indices.push(idx(r, columna));
          lista.push({ indices: indices, largo: fin - fila });
        }
        fila = Math.max(fin, fila + 1);
      }
    }
    return lista;
  }

  function caida(coinciden) {
    const marcas = coinciden instanceof Set ? coinciden : new Set(coinciden);
    const dist = new Array(celdas()).fill(0);
    for (let columna = 0; columna < columnas; columna += 1) {
      let huecos = 0;
      for (let fila = filas - 1; fila >= 0; fila -= 1) {
        const i = idx(fila, columna);
        if (marcas.has(i)) huecos += 1;
        else if (huecos > 0) dist[idx(fila + huecos, columna)] = huecos;
      }
      for (let fila = 0; fila < huecos; fila += 1) dist[idx(fila, columna)] = huecos + 1;
    }
    return dist;
  }

  function caer(tablero, coinciden, nivel, azar) {
    const puntos = coinciden.size * 10 * nivel;
    const siguiente = gravedad(tablero, coinciden, azar);
    return {
      puntos: puntos,
      tablero: siguiente,
      siguientes: lineas(siguiente)
    };
  }

  root.QuintiaTablero = {
    COLUMNAS: columnas,
    FILAS: filas,
    TIPOS: tipos,
    FRUTAS: FRUTAS,
    usarForma: usarForma,
    lineas: lineas,
    intercambiar: intercambiar,
    sonVecinos: sonVecinos,
    hayJugada: hayJugada,
    crearTablero: crearTablero,
    gravedad: gravedad,
    caer: caer,
    grupos: grupos,
    caida: caida
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
