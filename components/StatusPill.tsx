import { Check, Clock3, Minus } from "lucide-react";
import type { VerificationState } from "@/lib/types";

export function StatusPill({ state }: { state: VerificationState }) {
  const labels = { verified: "確認済み", pending: "確認待ち", not_provided: "情報なし" };
  const Icon = state === "verified" ? Check : state === "pending" ? Clock3 : Minus;
  return <span className={`status-pill ${state}`}><Icon size={13} />{labels[state]}</span>;
}
