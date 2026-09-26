import { notFound } from "next/navigation";
import { requirePageAccess } from "@/lib/access-control";
import { RecordsList } from "@/components/RecordsList";
const allowed = ["screening", "adoptions", "attention", "pending", "meetings", "trials"];
export default async function ReviewRecordsPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const user = await requirePageAccess("review", "/reviews/records");
  const { view = "pending" } = await searchParams;
  if (!allowed.includes(view)) notFound();
  return <RecordsList view={view} user={user} />;
}
