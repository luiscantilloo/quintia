const fs = require("fs");
const p = "C:/Users/ll-lu/Videos/aliento-v1/src/modules/admin/screens/AdminMainContent.tsx";
let c = fs.readFileSync(p, "utf8");

// homeLinks
c = c.replace(
  "{v.homeLinks?.map((l) => (<button onClick=",
  '{v.homeLinks?.map((l) => (<button key={l.id || l.label} onClick=',
);

// msgActions
c = c.replace(
  "{v.msgActions?.map((m) => (<button onClick=",
  '{v.msgActions?.map((m) => (<button key={m.label} onClick=',
);

// Generic: .map((x) => (<tag without key — add key from common fields or index
// levels
c = c.replace(
  "{v.levels?.map((l) => (<div onClick=",
  '{v.levels?.map((l) => (<div key={l.label} onClick=',
);
c = c.replace(
  "{v.modules?.map((m) => (<div onClick=",
  '{v.modules?.map((m) => (<div key={m.label} onClick=',
);
c = c.replace(
  "{v.tinsts?.map((m) => (<div onClick=",
  '{v.tinsts?.map((m) => (<div key={m.label} onClick=',
);
c = c.replace(
  "{v.teamTabs?.map((tt) => (<button onClick=",
  '{v.teamTabs?.map((tt) => (<button key={tt.label} onClick=',
);
c = c.replace(
  "{v.terrChips?.map((t) => (<button onClick=",
  '{v.terrChips?.map((t) => (<button key={t.n} onClick=',
);
c = c.replace(
  "{v.pathTabs?.map((pt) => (<button onClick=",
  '{v.pathTabs?.map((pt) => (<button key={pt.label} onClick=',
);
c = c.replace(
  "{v.pfPeriods?.map((p) => (<button onClick=",
  '{v.pfPeriods?.map((p) => (<button key={p.label} onClick=',
);
c = c.replace(
  "{v.pfCols?.map((c) => (<button onClick=",
  '{v.pfCols?.map((c) => (<button key={c.label} onClick=',
);
c = c.replace(
  "{v.mapLegend?.map((l) => (<span style=",
  '{v.mapLegend?.map((l) => (<span key={l.name} style=',
);
c = c.replace(
  "{v.checks?.map((c) => (<div style=",
  '{v.checks?.map((c) => (<div key={c.k} style=',
);

// maps with likely name fields
c = c.replace(
  /\{v\.terrs\?\.map\(\(t\) => \(\s*\n\s*<div /m,
  '{v.terrs?.map((t) => (\n                  <div key={t.name || t.id} ',
);
c = c.replace(
  /\{v\.experts\?\.map\(\(e\) => \(\s*\n\s*<div /m,
  '{v.experts?.map((e) => (\n                    <div key={e.name || e.id} ',
);
c = c.replace(
  /\{v\.flags\?\.map\(\(f\) => \(\s*\n\s*<div /m,
  '{v.flags?.map((f) => (\n                      <div key={f.id || f.person} ',
);
c = c.replace(
  /\{v\.pfRows\?\.map\(\(r\) => \(\s*<div onClick/m,
  '{v.pfRows?.map((r) => (<div key={r.name} onClick',
);
c = c.replace(
  "{v.mapZones?.map((z) => (<div style=",
  '{v.mapZones?.map((z) => (<div key={z.name} style=',
);
c = c.replace(
  "{v.mapDots?.map((d) => (<span title=",
  '{v.mapDots?.map((d, di) => (<span key={di} title=',
);
c = c.replace(
  /\{v\.lib\.rows\?\.map\(\(r\) => \(\s*<div onClick/m,
  '{v.lib.rows?.map((r) => (<div key={r.title} onClick',
);
c = c.replace(
  "{v.lib.kinds?.map((k) => (<button onClick=",
  '{v.lib.kinds?.map((k) => (<button key={k.label} onClick=',
);
c = c.replace(
  "{v.lib.sel.fields?.map((f) => (<label style=",
  '{v.lib.sel.fields?.map((f) => (<label key={f.k} style=',
);
c = c.replace(
  "{v.lib.mods?.map((m) => (<div style=",
  '{v.lib.mods?.map((m) => (<div key={m.n} style=',
);
c = c.replace(
  /\{s\.freqs\?\.map\(\(q\) => \(\s*<button onClick/m,
  '{s.freqs?.map((q) => (<button key={q.label} onClick',
);
c = c.replace(
  /\{v\.pe\.durs\?\.map\(\(d\) => \(\s*<button onClick/m,
  '{v.pe.durs?.map((d) => (<button key={d.label} onClick',
);
c = c.replace(
  /\{v\.pe\.rows\?\.map\(\(s\) => \(\s*\n/m,
  '{v.pe.rows?.map((s) => (\n                    <div key={s.name || s.id} ',
);

// f.reasons nested
c = c.replace(
  "{f.reasons?.map((r) => (<span style=",
  '{f.reasons?.map((r, ri) => (<span key={ri} style=',
);

fs.writeFileSync(p, c);
console.log("patched");
