import fs from "fs";
import path from "path";

const file = process.argv[2];
const out = process.argv[3];
const html = fs.readFileSync(file, "utf8");
const start = html.indexOf('<script type="text/x-dc" data-dc-script>');
const end = html.indexOf("</script>", start);
if (start < 0 || end < 0) throw new Error("script not found");
let script = html.slice(start + 38, end).trim();
script = script.replace(/^const SCRIPT = /m, "export const SCRIPT = ");
script = script.replace(/^const blank = /m, "export const blank = ");
script = script.replace(/^const OK_BG = /m, "export const OK_BG = ");
script = script.replace(/class Component extends DCLogic[\s\S]*$/m, "");
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, "// @ts-nocheck\n/* eslint-disable */\n" + script + "\n");
console.log("Wrote", out, script.split("\n").length, "lines");
