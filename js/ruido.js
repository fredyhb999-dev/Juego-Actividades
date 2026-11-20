(function () {
  const script = document.currentScript;
  const ARCHIVO = (script && script.getAttribute("data-archivo")) || "Comportamiento.json";

  let audioCtx = null;
  let analyser = null;
  let dataArray = null;
  let micStream = null;
  let rafId = null;

  let activo = false;
  let calibrando = false;
  let ocupado = false;
  let frases = [];
  let umbral = 40;
  let espera = 10;
  let nivelSuave = null;
  let sobreDesde = 0;
  let ultimoDisparo = 0;
  let ultimaFrase = -1;
  let silencioHasta = 0;
  let avisoTimer = null;

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function hablar(texto, alTerminar) {
    if (window.Voz) {
      Voz.hablar(texto, alTerminar);
      return;
    }
    if (alTerminar) alTerminar();
  }

  // ===== Estilos y controles =====
  function crearInterfaz() {
    if (document.getElementById("rv-boton")) return;

    const style = document.createElement("style");
    style.textContent = [
      ".rv-boton{",
      "  position:fixed;",
      "  top:calc(max(14px, env(safe-area-inset-top)) + 52px);",
      "  right:max(14px, env(safe-area-inset-right));",
      "  z-index:9998;",
      "  width:44px; height:44px;",
      "  display:flex; align-items:center; justify-content:center;",
      "  font-size:1.05rem; line-height:1;",
      "  background:rgba(20,16,32,.72);",
      "  color:var(--fg, #f4f1fb);",
      "  border:1px solid rgba(255,255,255,.22);",
      "  border-radius:999px;",
      "  cursor:pointer;",
      "  -webkit-backdrop-filter:blur(6px);",
      "  backdrop-filter:blur(6px);",
      "  transition:transform .15s, border-color .2s, box-shadow .2s;",
      "}",
      ".rv-boton:active{ transform:scale(.94); }",
      ".rv-boton[aria-pressed='true']{",
      "  border-color:var(--teal, #2fd9c7);",
      "  box-shadow:0 0 0 3px rgba(47,217,199,.18);",
      "}",
      ".rv-panel{",
      "  position:fixed;",
      "  top:calc(max(14px, env(safe-area-inset-top)) + 104px);",
      "  right:max(14px, env(safe-area-inset-right));",
      "  z-index:9998;",
      "  width:230px; max-width:calc(100vw - 28px);",
      "  padding:12px;",
      "  background:var(--card, #201933);",
      "  border:1px solid var(--card-border, #322a4a);",
      "  border-radius:14px;",
      "  color:var(--fg, #f4f1fb);",
      "  font-family:'Inter', system-ui, sans-serif;",
      "  font-size:.8rem;",
      "  text-align:left;",
      "  box-shadow:0 16px 40px -18px rgba(0,0,0,.8);",
      "}",
      ".rv-panel.hidden{ display:none; }",
      ".rv-fila{ display:flex; justify-content:space-between; color:var(--fg-muted, #a599c7); margin-bottom:4px; }",
      ".rv-fila strong{ color:var(--teal, #2fd9c7); }",
      ".rv-panel input[type=range]{ width:100%; accent-color:var(--teal, #2fd9c7); margin-bottom:8px; }",
      ".rv-estado{ font-size:.72rem; color:var(--fg-muted, #a599c7); margin:2px 0 8px; }",
      ".rv-detener{",
      "  width:100%; padding:8px;",
      "  background:transparent; color:var(--fg, #f4f1fb);",
      "  border:1px solid var(--card-border, #322a4a);",
      "  border-radius:10px; cursor:pointer;",
      "  font-family:inherit; font-size:.8rem;",
      "}",
      ".rv-detener:active{ transform:scale(.97); }",
      ".rv-aviso{",
      "  position:fixed; left:50%; bottom:calc(90px + env(safe-area-inset-bottom));",
      "  transform:translateX(-50%) translateY(8px);",
      "  z-index:9999;",
      "  max-width:calc(100vw - 40px);",
      "  padding:10px 16px;",
      "  background:var(--card, #201933);",
      "  border:1px solid var(--coral, #ff6a5c);",
      "  border-radius:12px;",
      "  color:var(--fg, #f4f1fb);",
      "  font-family:'Inter', system-ui, sans-serif;",
      "  font-size:.9rem;",
      "  text-align:center;",
      "  opacity:0; pointer-events:none;",
      "  transition:opacity .2s, transform .2s;",
      "}",
      ".rv-aviso.visible{ opacity:1; transform:translateX(-50%) translateY(0); }"
    ].join("");
    document.head.appendChild(style);

    const boton = document.createElement("button");
    boton.type = "button";
    boton.id = "rv-boton";
    boton.className = "rv-boton";
    boton.textContent = "\uD83C\uDF99\uFE0F";
    boton.title = "Supervisar comportamiento";
    boton.setAttribute("aria-label", "Supervisar comportamiento");
    boton.setAttribute("aria-pressed", "false");
    document.body.appendChild(boton);

    const panel = document.createElement("div");
    panel.id = "rv-panel";
    panel.className = "rv-panel hidden";
    panel.innerHTML =
      '<div class="rv-fila"><span>Nivel</span><strong id="rv-valor-nivel">40%</strong></div>' +
      '<input id="rv-nivel" type="range" min="1" max="100" step="1" value="40">' +
      '<div class="rv-fila"><span>Espera</span><strong id="rv-valor-espera">10 s</strong></div>' +
      '<input id="rv-espera" type="range" min="3" max="60" step="1" value="10">' +
      '<div class="rv-estado" id="rv-estado">Listo</div>' +
      '<button type="button" id="rv-detener" class="rv-detener">Detener</button>';
    document.body.appendChild(panel);

    const aviso = document.createElement("div");
    aviso.id = "rv-aviso";
    aviso.className = "rv-aviso";
    document.body.appendChild(aviso);

    const sliderNivel = document.getElementById("rv-nivel");
    const sliderEspera = document.getElementById("rv-espera");
    const valorNivel = document.getElementById("rv-valor-nivel");
    const valorEspera = document.getElementById("rv-valor-espera");
    const estado = document.getElementById("rv-estado");
    const detener = document.getElementById("rv-detener");

    boton.addEventListener("click", () => {
      if (activo) desactivar(true);
      else activar();
    });

    detener.addEventListener("click", () => desactivar(true));

    sliderNivel.addEventListener("input", () => {
      umbral = clamp(parseInt(sliderNivel.value, 10), 1, 100);
      valorNivel.textContent = umbral + "%";
    });

    sliderEspera.addEventListener("input", () => {
      espera = clamp(parseInt(sliderEspera.value, 10), 3, 60);
      valorEspera.textContent = espera + " s";
    });

    return {
      boton: boton,
      panel: panel,
      aviso: aviso,
      sliderNivel: sliderNivel,
      sliderEspera: sliderEspera,
      valorNivel: valorNivel,
      valorEspera: valorEspera,
      estado: estado
    };
  }

  const ui = crearInterfaz();

  function avisar(texto) {
    ui.aviso.textContent = texto;
    ui.aviso.classList.add("visible");
    if (avisoTimer) clearTimeout(avisoTimer);
    avisoTimer = setTimeout(() => ui.aviso.classList.remove("visible"), 4000);
  }

  // ===== Micrófono =====
  async function iniciarMic() {
    if (!window.isSecureContext || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const e = new Error("El micrófono necesita una dirección segura (HTTPS).");
      throw e;
    }
    micStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false
      }
    });
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") await audioCtx.resume();
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 2048;
    audioCtx.createMediaStreamSource(micStream).connect(analyser);
    dataArray = new Uint8Array(analyser.frequencyBinCount);
  }

  function obtenerRMS() {
    analyser.getByteTimeDomainData(dataArray);
    let suma = 0;
    for (let i = 0; i < dataArray.length; i++) {
      const dif = dataArray[i] - 128;
      suma += dif * dif;
    }
    return Math.sqrt(suma / dataArray.length);
  }

  function rmsANivel(rms) {
    if (rms <= 0) return 0;
    const db = 20 * Math.log10(rms / 128);
    const pct = ((db + 60) / 60) * 100;
    return Math.max(0, Math.min(100, pct));
  }

  function nivelActual() {
    const crudo = rmsANivel(obtenerRMS());
    if (nivelSuave === null) {
      nivelSuave = crudo;
    } else if (crudo > nivelSuave) {
      nivelSuave += (crudo - nivelSuave) * 0.35;
    } else {
      nivelSuave += (crudo - nivelSuave) * 0.08;
    }
    return nivelSuave < 2 ? 0 : nivelSuave;
  }

  function vozSonando() {
    if (!("speechSynthesis" in window)) return false;
    return speechSynthesis.speaking || speechSynthesis.pending;
  }

  // ===== Frases =====
  async function cargarFrases() {
    const res = await fetch(encodeURIComponent(ARCHIVO), { cache: "no-store" });
    if (!res.ok) {
      throw new Error("No se encontró " + ARCHIVO);
    }
    const json = await res.json();
    const lista = Array.isArray(json) ? json : (Array.isArray(json.frases) ? json.frases : []);
    return lista
      .filter(texto => typeof texto === "string" && texto.trim().length > 0)
      .map(texto => texto.trim());
  }

  function elegirFrase() {
    if (frases.length === 0) return "";
    if (frases.length === 1) return frases[0];
    let indice;
    do {
      indice = Math.floor(Math.random() * frases.length);
    } while (indice === ultimaFrase);
    ultimaFrase = indice;
    return frases[indice];
  }

  function disparar() {
    sobreDesde = 0;
    ultimoDisparo = performance.now();

    const frase = elegirFrase();
    if (!frase) return;

    avisar(frase);
    hablar(frase, () => {
      ultimoDisparo = performance.now();
      silencioHasta = performance.now() + 500;
    });
  }

  // ===== Ciclo =====
  function medir() {
    if (!activo) return;

    if (calibrando) {
      rafId = requestAnimationFrame(medir);
      return;
    }

    const ahora = performance.now();

    if (vozSonando() || ahora < silencioHasta) {
      rafId = requestAnimationFrame(medir);
      return;
    }

    const nivel = nivelActual();

    if (nivel >= umbral) {
      if (sobreDesde === 0) sobreDesde = ahora;
      if (ahora - sobreDesde >= 250 && ahora - ultimoDisparo >= espera * 1000) {
        disparar();
      }
    } else {
      sobreDesde = 0;
    }

    rafId = requestAnimationFrame(medir);
  }

  // ===== Activar y desactivar =====
  async function activar() {
    if (activo || ocupado) return;
    ocupado = true;
    ui.boton.disabled = true;
    ui.boton.textContent = "…";

    try {
      if (frases.length === 0) {
        frases = await cargarFrases();
      }
      if (frases.length === 0) {
        throw new Error("La lista de frases está vacía.");
      }
      await iniciarMic();
    } catch (e) {
      avisar("No se pudo activar la supervisión. " + (e.message || "Revisa el micrófono."));
      ui.boton.disabled = false;
      ui.boton.textContent = "\uD83C\uDF99\uFE0F";
      ocupado = false;
      return;
    }

    ocupado = false;
    activo = true;
    calibrando = true;
    ui.boton.disabled = false;
    ui.boton.textContent = "\uD83C\uDF99\uFE0F";
    ui.boton.classList.add("activo");
    ui.boton.setAttribute("aria-pressed", "true");
    ui.boton.title = "Detener supervisión";
    ui.boton.setAttribute("aria-label", "Detener supervisión");
    ui.panel.classList.remove("hidden");
    ui.estado.textContent = "Calibrando…";
    nivelSuave = null;
    sobreDesde = 0;
    ultimoDisparo = performance.now();

    const inicioCalibracion = performance.now();
    const muestras = [];

    const calibrar = () => {
      if (!activo) return;
      muestras.push(obtenerRMS());

      if (performance.now() - inicioCalibracion < 3000) {
        rafId = requestAnimationFrame(calibrar);
        return;
      }
      if (!activo) return;

      const ordenadas = [...muestras].sort((a, b) => a - b);
      const base = rmsANivel(ordenadas[Math.floor(ordenadas.length / 2)]);
      umbral = clamp(Math.round(base) + 10, 5, 95);
      ui.sliderNivel.value = umbral;
      ui.valorNivel.textContent = umbral + "%";

      calibrando = false;
      ui.estado.textContent = "Supervisando";
      hablar("Supervisando comportamiento", () => {
        silencioHasta = performance.now() + 500;
      });
      medir();
    };

    calibrar();
  }

  function desactivar(decirFrase) {
    if (!activo) return;

    activo = false;
    calibrando = false;
    cancelAnimationFrame(rafId);
    rafId = null;

    if (micStream) {
      micStream.getTracks().forEach(track => track.stop());
      micStream = null;
    }
    if (audioCtx) {
      try { audioCtx.close(); } catch (e) {}
      audioCtx = null;
    }
    analyser = null;
    nivelSuave = null;

    ui.panel.classList.add("hidden");
    ui.boton.classList.remove("activo");
    ui.boton.setAttribute("aria-pressed", "false");
    ui.boton.title = "Supervisar comportamiento";
    ui.boton.setAttribute("aria-label", "Supervisar comportamiento");

    if (decirFrase) hablar("Supervisión terminada");
  }
})();
