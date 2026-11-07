"use client";

import React from "react";

/** Formatea respuestas de TEJIVA: negrita, cursiva, listas y párrafos. */
export function TeoRichText({ text }: { text: string }) {
  const blocks = splitBlocks(String(text || "").trim());
  if (!blocks.length) return null;

  return (
    <div className="flex flex-col gap-2.5 text-pretty text-base leading-[1.55] text-nara-tinta">
      {blocks.map((block, i) => {
        if (block.type === "ul") {
          return (
            <ul key={i} className="m-0 flex list-none flex-col gap-1.5 p-0">
              {block.items.map((item, j) => (
                <li key={j} className="flex gap-2">
                  <span className="mt-[0.55em] h-1.5 w-1.5 shrink-0 rounded-full bg-nara-tinta" />
                  <span>{renderInline(item)}</span>
                </li>
              ))}
            </ul>
          );
        }
        if (block.type === "ol") {
          return (
            <ol key={i} className="m-0 flex list-none flex-col gap-1.5 p-0">
              {block.items.map((item, j) => (
                <li key={j} className="flex gap-2">
                  <span className="w-5 shrink-0 font-medium text-[#6B7280]">
                    {j + 1}.
                  </span>
                  <span>{renderInline(item)}</span>
                </li>
              ))}
            </ol>
          );
        }
        return (
          <p key={i} className="m-0">
            {renderInline(block.text)}
          </p>
        );
      })}
    </div>
  );
}

type Block =
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] };

function splitBlocks(src: string): Block[] {
  const lines = src.replace(/\r\n/g, "\n").split("\n");
  const out: Block[] = [];
  let para: string[] = [];
  let list: { type: "ul" | "ol"; items: string[] } | null = null;

  const flushPara = () => {
    if (!para.length) return;
    out.push({ type: "p", text: para.join(" ").trim() });
    para = [];
  };
  const flushList = () => {
    if (!list) return;
    out.push(list);
    list = null;
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flushPara();
      flushList();
      continue;
    }
    const ul = line.match(/^[-*•]\s+(.+)$/);
    const ol = line.match(/^\d+[.)]\s+(.+)$/);
    if (ul) {
      flushPara();
      if (!list || list.type !== "ul") {
        flushList();
        list = { type: "ul", items: [] };
      }
      list.items.push(ul[1]);
      continue;
    }
    if (ol) {
      flushPara();
      if (!list || list.type !== "ol") {
        flushList();
        list = { type: "ol", items: [] };
      }
      list.items.push(ol[1]);
      continue;
    }
    flushList();
    para.push(line);
  }
  flushPara();
  flushList();
  return out;
}

function renderInline(text: string): React.ReactNode[] {
  // **bold**, *italic*, `code`
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts.filter(Boolean).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return (
        <em key={i} className="italic">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={i}
          className="rounded bg-nara-crema px-1 py-0.5 text-[0.92em]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}
