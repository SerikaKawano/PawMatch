import { Bell } from "lucide-react";
import { AccessibilityControls } from "./AccessibilityControls";

export function PageHeader({ eyebrow, description }: { eyebrow?: string; description: string }) {
  return (
    <header className="page-header">
      <div>{eyebrow && <span className="eyebrow">{eyebrow}</span>}<p>{description}</p></div>
      <div className="header-actions"><AccessibilityControls /><button className="icon-button has-dot" aria-label="お知らせ"><Bell size={21} /></button></div>
    </header>
  );
}
