const fs = require("fs");
const path = "C:/Users/ll-lu/Videos/aliento-v1/src/lib/store/store.js";
let c = fs.readFileSync(path, "utf8");

c = c.replace(
  /^\(function \(\) \{\r?\n  if \(window\.AlientoStore\) return;[^\n]*\r?\n/,
  "",
);

const pairs = [
  ["href: 'Admin.dc.html'", "href: '/admin'"],
  ["href: 'Experto.dc.html'", "href: '/experto'"],
  ["href: 'Clinico.dc.html'", "href: '/clinico'"],
  ["href: 'Paciente.dc.html'", "href: '/paciente'"],
  ["href: 'PacientePlan.dc.html'", "href: '/paciente/plan'"],
  ["href: 'Observador.dc.html'", "href: '/observador'"],
  ["location.href = 'NARA.dc.html'", "location.href = '/ingreso'"],
  ["location.replace('NARA.dc.html')", "location.replace('/ingreso')"],
];

for (const [from, to] of pairs) c = c.split(from).join(to);

c = c.split("Clinico.dc.html").join("/clinico");
c = c.split("Experto.dc.html").join("/experto");
c = c.split("Admin.dc.html").join("/admin");

c = c.replace("window.AlientoStore = {", "const AlientoStore = {");
c = c.replace(
  /\};\r?\n\}\)\(\);\s*$/,
  "};\n\nif (typeof window !== 'undefined') {\n  window.AlientoStore = AlientoStore;\n}\n\nexport default AlientoStore;\n",
);

fs.writeFileSync(path, c, "utf8");
console.log(c.includes("Andrés Ocampo") ? "OK_ANDRES" : "BAD");
console.log(c.slice(0, 80));
console.log(c.slice(-160));
