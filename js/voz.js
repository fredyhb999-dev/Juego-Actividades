(function () {
  function esVozFemenina(voz) {
    const n = String(voz.name || "").toLowerCase();
    if (/female|femenina|mujer|woman/.test(n)) return true;
    const nombres = ["paulina", "monica", "mónica", "marisol", "sabina", "helena", "laura", "maria", "maría", "carmen", "lucia", "lucía", "elvira", "penelope", "penélope", "esperanza", "ximena", "valeria", "dalia", "camila", "gabriela", "isabela", "sofia", "sofía", "lupe", "guadalupe", "angela", "ángela", "irene", "soledad", "conchita", "teresa", "juana", "veronica", "verónica", "alejandra", "fernanda", "renata", "julia", "julieta", "diana", "claudia", "patricia", "silvia", "rocio", "rocío", "lorena", "miriam", "nuria"];
    return nombres.some(nombre => n.includes(nombre));
  }

  function buscarVozEspanol() {
    if (!("speechSynthesis" in window)) return null;
    const voces = speechSynthesis.getVoices();
    const normal = voz => String(voz.lang || "").toLowerCase().replace("_", "-");
    const paises = ["es-mx", "es-us", "es-419"];

    for (const pref of paises) {
      const voz = voces.find(v => normal(v).startsWith(pref) && esVozFemenina(v));
      if (voz) return voz;
    }
    const femenina = voces.find(voz => normal(voz).startsWith("es") && esVozFemenina(voz));
    if (femenina) return femenina;

    for (const pref of paises) {
      const voz = voces.find(v => normal(v).startsWith(pref));
      if (voz) return voz;
    }
    return voces.find(voz => normal(voz).startsWith("es")) || null;
  }

  function hablar(texto, alTerminar) {
    if (!texto) {
      if (alTerminar) alTerminar();
      return;
    }
    if (window.Sonido && !window.Sonido.activo()) {
      if (alTerminar) alTerminar();
      return;
    }
    if (!("speechSynthesis" in window)) {
      if (alTerminar) alTerminar();
      return;
    }

    try {
      const frase = new SpeechSynthesisUtterance(texto);
      const voz = buscarVozEspanol();
      if (voz) {
        frase.voice = voz;
        frase.lang = voz.lang;
      } else {
        frase.lang = "es-MX";
      }
      frase.rate = 1;
      if (alTerminar) {
        frase.onend = alTerminar;
        frase.onerror = alTerminar;
      }
      speechSynthesis.speak(frase);
    } catch (e) {
      if (alTerminar) alTerminar();
    }
  }

  window.Voz = {
    hablar: hablar,
    elegirVoz: buscarVozEspanol
  };
})();
