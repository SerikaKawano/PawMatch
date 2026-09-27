import { DemoLogin } from "@/components/DemoLogin";
import { currentDemoUser } from "@/lib/demo-session-server";
import { safeLoginNext } from "@/lib/demo-session";
import { redirect } from "next/navigation";
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; intent?: string }> }) {
  const params = await searchParams;
  if (await currentDemoUser()) redirect("/dashboard");
  return <div className="login-page"><DemoLogin next={safeLoginNext(params.next)} intent={params.intent} /></div>;
}
