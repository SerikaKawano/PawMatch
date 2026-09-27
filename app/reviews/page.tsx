import { redirect } from "next/navigation";
import { requirePageAccess } from "@/lib/access-control";

export default async function ReviewsPage({ searchParams }: { searchParams: Promise<{ pet?: string }> }) {
  await requirePageAccess("review", "/reviews/progress");
  const { pet } = await searchParams;
  redirect(pet ? `/reviews/progress?pet=${encodeURIComponent(pet)}` : "/reviews/progress");
}
