import { Bell } from "lucide-react";
import { AccessibilityControls } from "./AccessibilityControls";

export function PageHeader({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <header className="page-header">
      <div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>
      <div className="header-actions"><AccessibilityControls /><button className="icon-button has-dot" aria-label="お知らせ"><Bell size={21} /></button></div>
    </header>
  );
}
