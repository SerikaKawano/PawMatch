"use client";

import { useState } from "react";
import { Type } from "lucide-react";

export function AccessibilityControls() {
  const [large, setLarge] = useState(false);
  function toggleTextSize() {
    const next = !large;
    document.documentElement.classList.toggle("large-text", next);
    setLarge(next);
  }
  return <button type="button" onClick={toggleTextSize} className={`${large ? "text-size-button active" : "text-size-button"} transition-colors duration-200`} aria-pressed={large}><Type size={21} /><span>{large ? "標準サイズ" : "文字を大きく"}</span></button>;
}
