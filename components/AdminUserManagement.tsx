"use client";

import { useState } from "react";
import { CheckCircle2, CirclePause, RotateCcw, Save } from "lucide-react";
import type { DemoRole, DemoUserId } from "@/lib/demoUsers";
import type { ManagedUser, ManagedUserStatus } from "@/lib/admin-users";

const roleOptions: { value: DemoRole; label: string }[] = [
  { value: "admin", label: "管理者" },
  { value: "reviewer", label: "審査担当" },
  { value: "rehomer", label: "譲渡者" },
  { value: "adopter", label: "里親希望者" },
];

export function AdminUserManagement({ initialUsers, currentUserId }: { initialUsers: ManagedUser[]; currentUserId: DemoUserId }) {
  const [users, setUsers] = useState(initialUsers);
  const [draftRoles, setDraftRoles] = useState<Record<string, DemoRole>>(Object.fromEntries(initialUsers.map(user => [user.id, user.role])));
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function persist(user: ManagedUser, role: DemoRole, status: ManagedUserStatus) {
    setSaving(user.id); setMessage("");
    const response = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, role, status }),
    });
    const result = await response.json().catch(() => null);
    setSaving(null);
    if (!response.ok) { setMessage(result?.error ?? "保存できませんでした。"); return; }
    setUsers(current => current.map(item => item.id === user.id ? result.user : item));
    setDraftRoles(current => ({ ...current, [user.id]: result.user.role }));
    setMessage(`${user.name} の設定を保存しました。`);
  }

  async function changeStatus(user: ManagedUser) {
    const status: ManagedUserStatus = user.status === "active" ? "suspended" : "active";
    if (status === "suspended" && !window.confirm(`${user.name} のアカウントを停止しますか？`)) return;
    await persist(user, draftRoles[user.id], status);
  }

  return <div className="admin-users-page page-wrap">
    {message && <p className="admin-users-message" role="status"><CheckCircle2 />{message}</p>}
    <div className="admin-user-list">
      {users.map(user => {
        const protectedUser = user.id === "admin" || user.id === currentUserId;
        return <article className={`admin-user-row ${user.status}`} key={user.id}>
          <div className={`demo-avatar ${user.color}`}>{user.initials}</div>
          <div className="admin-user-identity"><strong>{user.name}</strong><span>{user.email}</span><small>{user.organization}</small></div>
          <label><span>権限</span><select value={draftRoles[user.id]} disabled={protectedUser || saving === user.id} onChange={event => setDraftRoles(current => ({ ...current, [user.id]: event.target.value as DemoRole }))}>{roleOptions.map(option => <option value={option.value} key={option.value}>{option.label}</option>)}</select></label>
          <div className="admin-user-status"><span className={`user-status-badge ${user.status}`}>{user.status === "active" ? "利用中" : "停止中"}</span>{protectedUser && <small>主管理者（保護）</small>}</div>
          <div className="admin-user-actions">
            <button type="button" className="secondary-action" disabled={protectedUser || saving === user.id || draftRoles[user.id] === user.role} onClick={() => persist(user, draftRoles[user.id], user.status)}><Save />権限を保存</button>
            <button type="button" className={user.status === "active" ? "danger-action" : "restore-action"} disabled={protectedUser || saving === user.id} onClick={() => changeStatus(user)}>{user.status === "active" ? <CirclePause /> : <RotateCcw />}{user.status === "active" ? "アカウントを停止" : "利用を再開"}</button>
          </div>
        </article>;
      })}
    </div>
  </div>;
}
