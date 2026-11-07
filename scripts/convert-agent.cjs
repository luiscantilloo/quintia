const fs = require("fs");
const path = "C:/Users/ll-lu/Videos/aliento-v1/src/lib/agent/agent.js";
let c = fs.readFileSync(path, "utf8");
c = c.replace(/^\(function \(\) \{\r?\n/, "");
c = c.replace(
  /window\.AlientoAgent = \{ ROLE, list, ask, runById, briefing, gloriaCharts \};\r?\n\}\)\(\);\s*$/,
  "const AlientoAgent = { ROLE, list, ask, runById, briefing, gloriaCharts };\nif (typeof window !== 'undefined') {\n  window.AlientoAgent = AlientoAgent;\n}\nexport default AlientoAgent;\n",
);
fs.writeFileSync(path, c);
console.log(c.slice(-180));
