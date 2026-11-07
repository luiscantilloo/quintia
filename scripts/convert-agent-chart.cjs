const fs = require("fs");
const p = "C:/Users/ll-lu/Videos/aliento-v1/src/lib/agent/agent-chart.js";
let c = fs.readFileSync(p, "utf8");
c = c.replace(
  "window.makeAlientoChart = function (React) {",
  "var makeAlientoChart = function (React) {",
);
if (!c.includes("export default")) {
  c =
    c.trimEnd() +
    "\n\nif (typeof window !== 'undefined') { window.makeAlientoChart = makeAlientoChart; }\nexport default makeAlientoChart;\n";
}
fs.writeFileSync(p, c);
console.log("bytes", fs.statSync(p).size);
console.log(c.slice(0, 90));
console.log(c.slice(-140));
