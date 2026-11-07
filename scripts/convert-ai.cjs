const fs = require("fs");
const path = "C:/Users/ll-lu/Videos/aliento-v1/src/lib/ai/ai.js";
let c = fs.readFileSync(path, "utf8");
c = c.replace(/^\(function \(\) \{\r?\n/, "");
c = c.replace(
  /window\.AlientoAI = \{ complete: complete, interpretNote: interpretNote, companion: companion, crisisText: crisisText \};\r?\n\}\)\(\);\s*$/,
  "const AlientoAI = { complete: complete, interpretNote: interpretNote, companion: companion, crisisText: crisisText };\nif (typeof window !== 'undefined') {\n  window.AlientoAI = AlientoAI;\n}\nexport default AlientoAI;\n",
);
fs.writeFileSync(path, c, "utf8");
console.log(c.slice(-200));
