import Link from "next/link";
import { ArrowRight } from "lucide-react";
export function TaskGuide({ title, steps, action }: { title: string; steps: string[]; action?: { label: string; href: string } }) {
  return <section className="task-guide" aria-label={title}><h2>{title}</h2><ol>{steps.map((step, i) => <li key={step}><span>{i + 1}</span>{step}{i < steps.length - 1 && <ArrowRight size={18} aria-hidden="true" />}</li>)}</ol>{action && <Link className="task-link" href={action.href}>{action.label}<ArrowRight size={20} /></Link>}</section>;
}
