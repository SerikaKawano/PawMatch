"use client";

import { useState } from "react";
import { Copy, Share2 } from "lucide-react";

export function PetShareActions({ petId, petName }: { petId: string; petName: string }) {
  const [copied, setCopied] = useState(false);
  const url = () => `${window.location.origin}/pets/${encodeURIComponent(petId)}`;
  const message = `${petName}の里親募集を見てみませんか？`;

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(url());
      setCopied(true);
      window.setTimeout(() => setCopied(false), 3000);
    } catch {
      setCopied(false);
    }
  }

  function openShare(target: "x" | "line") {
    const shareUrl = target === "x"
      ? `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(url())}`
      : `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url())}`;
    window.open(shareUrl, "_blank", "noopener,noreferrer");
  }

  return <div className="pet-share" aria-label="この募集をシェア">
    <span><Share2 size={20} /> この子の募集をシェア</span>
    <div>
      <button type="button" onClick={() => openShare("x")} aria-label="Xで共有">Xで共有</button>
      <button type="button" onClick={() => openShare("line")} aria-label="LINEで共有">LINEで共有</button>
      <button type="button" onClick={copyUrl} aria-label="募集ページのURLをコピー"><Copy size={18} />{copied ? "コピーしました" : "URLをコピー"}</button>
    </div>
    <small>公開プロフィールのURLのみを共有します。相談内容や応募者情報は含みません。</small>
  </div>;
}
