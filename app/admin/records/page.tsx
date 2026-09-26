import { requirePageAccess } from "@/lib/access-control";
import { RecordsList } from "@/components/RecordsList";
export const dynamic = "force-dynamic";
export default async function AdminRecordsPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const user = await requirePageAccess("admin", "/admin/records");
  const { view = "screening" } = await searchParams;
  return <RecordsList view={view} user={user} />;
}
