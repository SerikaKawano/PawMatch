"use client";

import { useEffect, useState } from "react";
import { translateText, type Language } from "@/lib/i18n";

type SavedText = { source: string; rendered: string };
const textMemory = new WeakMap<Text, SavedText>();
const attributeMemory = new WeakMap<Element, Map<string, SavedText>>();
let titleMemory: SavedText | null = null;
const translatableAttributes = ["aria-label", "placeholder", "title", "alt"] as const;

function ignored(element: Element | null, includeTextarea = true) {
  return !element || Boolean(element.closest(`script, style, code, pre, ${includeTextarea ? "textarea, " : ""}[contenteditable], [data-no-translate]`));
}

function applyText(node: Text, language: Language) {
  if (ignored(node.parentElement)) return;
  const current = node.nodeValue ?? "";
  const previous = textMemory.get(node);
  const saved = previous && current === previous.rendered ? previous : { source: current, rendered: current };
  const desired = language === "en" ? translateText(saved.source) : saved.source;
  saved.rendered = desired;
  textMemory.set(node, saved);
  if (current !== desired) node.nodeValue = desired;
}

function applyAttributes(element: Element, language: Language) {
  if (ignored(element, false)) return;
  let saved = attributeMemory.get(element);
  if (!saved) { saved = new Map(); attributeMemory.set(element, saved); }
  for (const attribute of translatableAttributes) {
    const current = element.getAttribute(attribute);
    if (current === null) continue;
    const previous = saved.get(attribute);
    const record = previous && current === previous.rendered ? previous : { source: current, rendered: current };
    const desired = language === "en" ? translateText(record.source) : record.source;
    record.rendered = desired;
    saved.set(attribute, record);
    if (current !== desired) element.setAttribute(attribute, desired);
  }
}

function applyLanguage(language: Language) {
  document.documentElement.lang = language;
  const currentTitle = document.title;
  const rememberedTitle: SavedText = titleMemory && currentTitle === titleMemory.rendered ? titleMemory : { source: currentTitle, rendered: currentTitle };
  const nextTitle = language === "en" ? translateText(rememberedTitle.source) : rememberedTitle.source;
  rememberedTitle.rendered = nextTitle;
  titleMemory = rememberedTitle;
  if (currentTitle !== nextTitle) document.title = nextTitle;
  // Explicit option values preserve search/filter behaviour while their labels change.
  document.querySelectorAll("option:not([value])").forEach(option => option.setAttribute("value", option.textContent ?? ""));
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) applyText(walker.currentNode as Text, language);
  document.body.querySelectorAll("*").forEach(element => applyAttributes(element, language));
}

export function LanguageSwitch() {
  const [language, setLanguage] = useState<Language>("ja");

  useEffect(() => {
    let saved: string | null = null;
    try { saved = window.localStorage.getItem("pawmatch-language"); } catch { /* Storage may be disabled. */ }
    if (saved !== "en") saved = document.cookie.match(/(?:^|;\s*)pawmatch-language=(en|ja)(?:;|$)/)?.[1] ?? null;
    if (saved !== "en") return;
    const frame = requestAnimationFrame(() => setLanguage("en"));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    let queued = 0;
    const refresh = () => {
      if (queued) return;
      queued = requestAnimationFrame(() => { queued = 0; applyLanguage(language); });
    };
    applyLanguage(language);
    const observer = new MutationObserver(refresh);
    observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: [...translatableAttributes] });
    return () => { observer.disconnect(); if (queued) cancelAnimationFrame(queued); };
  }, [language]);

  function choose(next: Language) {
    try { window.localStorage.setItem("pawmatch-language", next); } catch { /* Still switch for this page. */ }
    document.cookie = `pawmatch-language=${next}; Path=/; Max-Age=31536000; SameSite=Lax`;
    setLanguage(next);
  }
  return <div className="language-switch" role="group" aria-label="Language / 言語" data-no-translate>
    <button type="button" lang="ja" aria-pressed={language === "ja"} onClick={() => choose("ja")}>日本語</button>
    <button type="button" lang="en" aria-pressed={language === "en"} onClick={() => choose("en")}>EN</button>
  </div>;
}
