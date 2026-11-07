/**
 * Desempaqueta un HTML tipo Claude artifact (__bundler) a public/landing/.
 * Uso: node scripts/unpack-dc-page.mjs <ruta-origen.html> <nombre-salida.html>
 */
import fs from "fs";
import zlib from "zlib";
import path from "path";

const src = process.argv[2];
const outName = process.argv[3] || "page.html";
if (!src) {
  console.error("Uso: node scripts/unpack-dc-page.mjs <origen.html> <salida.html>");
  process.exit(1);
}

const outDir = path.resolve("public/landing");
const assetsDir = path.join(outDir, "assets");
fs.mkdirSync(assetsDir, { recursive: true });

const html = fs.readFileSync(src, "utf8");
const man = html.match(/<script type="__bundler\/manifest">([\s\S]*?)<\/script>/);
const tpl = html.match(/<script type="__bundler\/template">([\s\S]*?)<\/script>/);
if (!man || !tpl) {
  console.error("Faltan tags __bundler en", src);
  process.exit(1);
}

const manifest = JSON.parse(man[1]);
let template = JSON.parse(tpl[1]);

function extFor(mime = "") {
  if (mime.includes("svg")) return "svg";
  if (mime.includes("png")) return "png";
  if (mime.includes("woff2")) return "woff2";
  if (mime.includes("woff")) return "woff";
  if (mime.includes("jpeg") || mime.includes("jpg")) return "jpg";
  if (mime.includes("webp")) return "webp";
  if (mime.includes("gif")) return "gif";
  if (mime.includes("css")) return "css";
  if (mime.includes("javascript")) return "js";
  if (mime.includes("icon")) return "ico";
  if (mime.includes("mp4")) return "mp4";
  return "bin";
}

const idToUrl = {};
const jsIds = { react: null, reactDom: null, runtime: null };
for (const [id, meta] of Object.entries(manifest)) {
  let buf = Buffer.from(meta.data, "base64");
  if (meta.compressed) buf = zlib.gunzipSync(buf);
  const ext = extFor(meta.mime || "");
  const file = `${id}.${ext}`;
  fs.writeFileSync(path.join(assetsDir, file), buf);
  idToUrl[id] = `/landing/assets/${file}`;
  if ((meta.mime || "").includes("javascript")) {
    const head = buf.slice(0, 220).toString("utf8");
    if (head.includes("react.production.min.js") && !head.includes("react-dom")) jsIds.react = id;
    else if (head.includes("react-dom.production.min.js")) jsIds.reactDom = id;
    else if (head.includes("dc-runtime") || head.includes("__dcBoot")) jsIds.runtime = id;
  }
}

for (const [id, url] of Object.entries(idToUrl)) {
  template = template.split(id).join(url);
}

const reactUrl = jsIds.react ? idToUrl[jsIds.react] : null;
const reactDomUrl = jsIds.reactDom ? idToUrl[jsIds.reactDom] : null;
if (reactUrl && reactDomUrl && !template.includes(reactUrl)) {
  const inject = `<script src="${reactUrl}"></script>\n<script src="${reactDomUrl}"></script>\n`;
  template = template.replace(/<script src="\/landing\/assets\/[^"]+\.js"><\/script>/, `${inject}$&`);
}

template = template
  .replace(/href=["']NARA\.dc\.html["']/gi, 'href="/ingreso"')
  .replace(/href=["']index\.html["']/gi, 'href="/landing"')
  .replace(/href=["']\.\/["']/gi, 'href="/landing"')
  .replace(/href=["']\/["']/gi, 'href="/landing"')
  .replace(/href=["']privacidad\.html["']/gi, 'href="/landing/privacidad.html"')
  .replace(/href=["']tratamiento-de-datos\.html["']/gi, 'href="/landing/tratamiento-de-datos.html"')
  .replace(/href=["']#?ingresar["']/gi, 'href="/ingreso"')
  .replace(/href=["']#login["']/gi, 'href="/ingreso"');

const outPath = path.join(outDir, outName);
fs.writeFileSync(outPath, template);
console.log("assets", Object.keys(manifest).length);
console.log("wrote", outPath, template.length);
const hrefs = [...new Set(template.match(/href=["'][^"']+["']/g) || [])];
console.log("hrefs", hrefs.slice(0, 25));
