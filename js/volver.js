(function () {
  var cs = document.currentScript;
  var padre = (cs && cs.getAttribute("data-padre")) || "index.html";
  var etiqueta = (cs && cs.getAttribute("data-label")) || "Volver";

  function inyectar() {
    if (document.getElementById("jv-volver")) return;

    var style = document.createElement("style");
    style.textContent = [
      ".jv-volver{",
      "  position:fixed;",
      "  top:max(14px, env(safe-area-inset-top));",
      "  left:max(14px, env(safe-area-inset-left));",
      "  z-index:9999;",
      "  display:inline-flex; align-items:center; gap:6px;",
      "  font-family:'Chakra Petch', system-ui, sans-serif;",
      "  font-size:.85rem; font-weight:500; letter-spacing:.02em;",
      "  color:var(--fg-muted, #a599c7);",
      "  background:rgba(32,25,51,.72);",
      "  border:1px solid var(--card-border, #322a4a);",
      "  border-radius:999px;",
      "  padding:8px 16px;",
      "  text-decoration:none;",
      "  -webkit-backdrop-filter:blur(6px);",
      "  backdrop-filter:blur(6px);",
      "  transition:color .2s, border-color .2s, transform .15s;",
      "}",
      ".jv-volver:hover{ color:var(--fg, #f4f1fb); border-color:var(--fg-muted, #a599c7); }",
      ".jv-volver:active{ transform:scale(.95); }"
    ].join("");
    document.head.appendChild(style);

    var a = document.createElement("a");
    a.id = "jv-volver";
    a.className = "jv-volver";
    a.href = padre;
    a.textContent = "\u2190 " + etiqueta;
    a.addEventListener("click", function (e) {
      if (window.history.length > 1) {
        e.preventDefault();
        window.history.back();
      }
    });
    document.body.appendChild(a);
  }

  if (document.body) inyectar();
  else document.addEventListener("DOMContentLoaded", inyectar);
})();
