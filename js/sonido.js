(function () {
  var CLAVE = "sonido.activo";

  var activo = true;
  try {
    if (localStorage.getItem(CLAVE) === "0") activo = false;
  } catch (e) {}

  function aplicarAudio() {
    var audios = document.querySelectorAll("audio");
    for (var i = 0; i < audios.length; i++) {
      audios[i].muted = !activo;
    }
  }

  function pintar(boton) {
    boton.textContent = activo ? "\uD83D\uDD0A" : "\uD83D\uDD07";
    boton.title = activo ? "Silenciar sonido" : "Activar sonido";
    boton.setAttribute("aria-label", boton.title);
    boton.setAttribute("aria-pressed", activo ? "false" : "true");
  }

  function inyectar() {
    if (document.getElementById("jv-sonido")) return;

    var style = document.createElement("style");
    style.textContent = [
      ".jv-sonido{",
      "  position:fixed;",
      "  top:max(14px, env(safe-area-inset-top));",
      "  right:max(14px, env(safe-area-inset-right));",
      "  z-index:9999;",
      "  width:44px; height:44px;",
      "  display:flex; align-items:center; justify-content:center;",
      "  font-size:1.1rem; line-height:1;",
      "  background:rgba(20,16,32,.72);",
      "  color:#f4f1fb;",
      "  border:1px solid rgba(255,255,255,.22);",
      "  border-radius:999px;",
      "  cursor:pointer;",
      "  -webkit-backdrop-filter:blur(6px);",
      "  backdrop-filter:blur(6px);",
      "  transition:transform .15s, border-color .2s;",
      "}",
      ".jv-sonido:active{ transform:scale(.94); }",
      ".jv-sonido[aria-pressed='true']{ border-color:#ff6a5c; }"
    ].join("");
    document.head.appendChild(style);

    var boton = document.createElement("button");
    boton.type = "button";
    boton.id = "jv-sonido";
    boton.className = "jv-sonido";
    pintar(boton);

    boton.addEventListener("click", function () {
      activo = !activo;
      try {
        localStorage.setItem(CLAVE, activo ? "1" : "0");
      } catch (e) {}
      pintar(boton);
      aplicarAudio();
      if (!activo && "speechSynthesis" in window) {
        try { speechSynthesis.cancel(); } catch (e) {}
      }
    });

    document.body.appendChild(boton);
    aplicarAudio();
  }

  window.Sonido = {
    activo: function () { return activo; }
  };

  if (document.body) inyectar();
  else document.addEventListener("DOMContentLoaded", inyectar);
})();
