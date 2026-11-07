import fs from "fs";

const p = "C:/Users/ll-lu/Videos/aliento-v1/src/modules/experto/components/ExpertoBody.tsx";
let s = fs.readFileSync(p, "utf8");
s = s.replace(/\{\(([a-zA-Z0-9_.]+)\)\}/g, "{v.$1}");
s = s.replace(
  /onClick=\{\(\) => \{ const fn = ([a-zA-Z0-9_.]+);/g,
  "onClick={() => { const fn = v.$1;",
);
s = s.replace(/ref="\{\(scrollRef\)\}"/g, "ref={v.scrollRef}");
s = s.replace(/ref="\{\(chatRef\)\}"/g, "ref={v.chatRef}");
s = s.replace(/ref="\{\(sigRef\)\}"/g, "ref={v.sigRef}");
s = s.replace(/<dc-import name="UserMenu"[^>]*><\/dc-import>/g, '<UserMenu notifKey={String(v.ex)} />');
s = s.replace(/fontFamily: ([^,"]+,[^,"]+,[^,"]+)/g, 'fontFamily: "$1"');
s = s.replace(/display: (flex|grid|block|none)/g, 'display: "$1"');
s = s.replace(/overflow: (auto|hidden)/g, 'overflow: "$1"');
s = s.replace(/position: (relative|absolute|fixed|sticky)/g, 'position: "$1"');
s = s.replace(/whiteSpace: (nowrap|normal)/g, 'whiteSpace: "$1"');
s = s.replace(/flexDirection: (column|row)/g, 'flexDirection: "$1"');
s = s.replace(/alignItems: ([a-z-]+)/g, 'alignItems: "$1"');
s = s.replace(/justifyContent: ([a-z-]+)/g, 'justifyContent: "$1"');
s = s.replace(/textAlign: ([a-z]+)/g, 'textAlign: "$1"');
s = s.replace(/cursor: ([a-z]+)/g, 'cursor: "$1"');
s = s.replace(/width: auto/g, 'width: "auto"');
s = s.replace(/marginLeft: auto/g, 'marginLeft: "auto"');
s = s.replace(/alignSelf: ([a-z-]+)/g, 'alignSelf: "$1"');
s = s.replace(/flex: none/g, 'flex: "none"');
s = s.replace(/flex: 1/g, 'flex: 1');
s = s.replace(/boxSizing: border-box/g, 'boxSizing: "border-box"');
s = s.replace(/touchAction: none/g, 'touchAction: "none"');
s = s.replace(/resize: (none|vertical)/g, 'resize: "$1"');
fs.writeFileSync(p, s);
console.log("fixed");
