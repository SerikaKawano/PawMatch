import { AdminUserManagement } from "@/components/AdminUserManagement";
import { requirePageAccess } from "@/lib/access-control";
import { listManagedUsers } from "@/lib/admin-users";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const user = await requirePageAccess("admin", "/admin/users");
  return <AdminUserManagement initialUsers={await listManagedUsers()} currentUserId={user.id} />;
}
