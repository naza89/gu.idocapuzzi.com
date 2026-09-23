// Estadísticas determinísticas del vault para /mapa: el modelo sólo interpreta.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, basename } from "node:path";

const VAULT = process.argv[2] ?? "C:/Users/LAUTA/ObsidianVaults/GÜIDO";
const SKIP = new Set([".obsidian", ".trash", ".claude"]);

const notas = [];
(function walk(dir) {
  for (const n of readdirSync(dir)) {
    if (SKIP.has(n)) continue;
    const p = join(dir, n);
    if (statSync(p).isDirectory()) walk(p);
    else if (n.endsWith(".md")) notas.push(p);
  }
})(VAULT);

const nombre = (p) => basename(p, ".md");
const existentes = new Set(notas.map(nombre));
const salientes = new Map();
const entrantes = new Map(notas.map((p) => [nombre(p), 0]));
const rotos = [];

for (const p of notas) {
  const texto = readFileSync(p, "utf8");
  const links = [...texto.matchAll(/\[\[([^\]|#]+)/g)].map((m) => basename(m[1].trim()));
  salientes.set(nombre(p), links.length);
  for (const l of new Set(links)) {
    if (existentes.has(l)) entrantes.set(l, entrantes.get(l) + 1);
    else rotos.push({ desde: relative(VAULT, p), hacia: l });
  }
}

const totalLinks = [...salientes.values()].reduce((a, b) => a + b, 0);
console.log(JSON.stringify({
  totalNotas: notas.length,
  totalLinks,
  densidad: +(totalLinks / notas.length).toFixed(2),
  huerfanas: [...entrantes].filter(([, n]) => n === 0).map(([k]) => k),
  hubs: [...entrantes].sort((a, b) => b[1] - a[1]).slice(0, 5),
  callejones: [...salientes].filter(([, n]) => n === 0).map(([k]) => k),
  rotos,
}, null, 2));
