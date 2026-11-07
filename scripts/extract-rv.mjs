import fs from "fs";
const html = fs.readFileSync(process.argv[2], "utf8");
const start = html.indexOf("_rv()");
const end = html.indexOf("renderVals()", start);
fs.writeFileSync(process.argv[3], html.slice(start, end));
console.log("bytes", end - start);
