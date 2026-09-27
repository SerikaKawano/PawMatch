import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { currentDemoUser } from "@/lib/demo-session-server";
export default async function AccessDeniedPage() {
  const user = await currentDemoUser();
  return <section className="access-denied"><ShieldAlert size={48} /><p>{user ? user.roleLabel + "の機能は、ホームから選べます。" : "ログインして利用できる機能をご確認ください。"}</p><Link href={user ? "/dashboard" : "/login"} className="task-primary">{user ? "自分のホームへ戻る" : "テストユーザーを選ぶ"}</Link><p>別のロールを試す場合は、ログイン画面で明示的にテストユーザーを切り替えてください。</p></section>;
}
