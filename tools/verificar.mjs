// Revisión única de Juego-Actividades.
// Se corre con: node tools/verificar.mjs
// Revisa sintaxis de JS, JSON y scripts dentro del HTML. No prueba la app.

import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname, relative, extname } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const problemas = [];
const avisos = [];
const ignorar = new Set([".git", "node_modules", ".opencode", ".vscode"]);

const archivos = { js: [], json: [], html: [] };

function recorrer(directorio) {
  for (const entrada of readdirSync(directorio, { withFileTypes: true })) {
    if (ignorar.has(entrada.name)) continue;
    const ruta = join(directorio, entrada.name);
    if (entrada.isDirectory()) {
      recorrer(ruta);
      continue;
    }
    const ext = extname(entrada.name).toLowerCase();
    if (ext === ".js" || ext === ".mjs" || ext === ".cjs") archivos.js.push(ruta);
    else if (ext === ".json") archivos.json.push(ruta);
    else if (ext === ".html" || ext === ".htm") archivos.html.push(ruta);
  }
}

const nombre = (ruta) => relative(raiz, ruta).replace(/\\/g, "/");

function leerTexto(ruta) {
  return readFileSync(ruta, "utf8").replace(/^\uFEFF/, "");
}

recorrer(raiz);

/* 1. Sintaxis de los JavaScript */
for (const archivo of archivos.js) {
  try {
    execFileSync(process.execPath, ["--check", archivo], { stdio: "pipe" });
  } catch (error) {
    const lineas = String(error.stderr || error.message || "")
      .trim()
      .split(/\r?\n/)
      .map((linea) => linea.trim())
      .filter(Boolean);
    const detalle = lineas.find((linea) => /Error/.test(linea)) || lineas[0] || "error de sintaxis";
    problemas.push(`${nombre(archivo)}: ${detalle}`);
  }
}

/* 2. JSON bien formados */
for (const archivo of archivos.json) {
  try {
    JSON.parse(leerTexto(archivo));
  } catch (error) {
    problemas.push(`${nombre(archivo)}: JSON mal formado: ${error.message}`);
  }
}

/* 3. Scripts escritos dentro del HTML (los que no son archivos externos) */
let scriptsRevisados = 0;
const etiquetaScript = /<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi;

for (const archivo of archivos.html) {
  const html = leerTexto(archivo);
  let encontrado;
  while ((encontrado = etiquetaScript.exec(html)) !== null) {
    const atributos = encontrado[1] || "";
    if (/\bsrc\s*=/i.test(atributos)) continue;

    const tipo = atributos.match(/\btype\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
    const valorTipo = (tipo ? (tipo[1] || tipo[2] || tipo[3] || "") : "").trim().toLowerCase();
    if (valorTipo && valorTipo !== "text/javascript" && valorTipo !== "application/javascript" && valorTipo !== "module") {
      continue;
    }

    const codigo = encontrado[2] || "";
    if (!codigo.trim()) continue;

    if (valorTipo === "module") {
      avisos.push(`${nombre(archivo)}: script module no revisado`);
      continue;
    }

    const cierreEtiqueta = encontrado[0].indexOf(">") + 1;
    const antesDelCodigo = html.slice(0, encontrado.index + cierreEtiqueta);
    const lineaInicio = antesDelCodigo.split(/\r?\n/).length;

    try {
      new vm.Script(codigo, { filename: nombre(archivo) });
      scriptsRevisados++;
    } catch (error) {
      const pila = String(error.stack || "").split(/\r?\n/);
      const ubicacion = pila[0].match(/:(\d+)$/);
      const lineaCodigo = ubicacion ? Number(ubicacion[1]) : 1;
      const linea = lineaInicio + lineaCodigo - 1;
      problemas.push(`${nombre(archivo)}:${linea}: ${error.message}`);
    }
  }
}

/* Resultado */
if (problemas.length) {
  console.log("");
  console.log("PROBLEMAS:");
  for (const problema of problemas) console.log("  - " + problema);
  console.log("");
  process.exit(1);
}

for (const aviso of avisos) console.log("Aviso: " + aviso);
console.log(
  `Todo bien: ${archivos.js.length} JavaScript, ${archivos.json.length} JSON, ` +
    `${archivos.html.length} HTML y ${scriptsRevisados} scripts en línea.`
);
