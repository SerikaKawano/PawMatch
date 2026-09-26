import { DemoLogin } from "@/components/DemoLogin";
import { currentDemoUser } from "@/lib/demo-session-server";
import { safeLoginNext } from "@/lib/demo-session";
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; intent?: string }> }) {
  const params = await searchParams;
  return <div className="login-page"><DemoLogin next={safeLoginNext(params.next)} currentUser={await currentDemoUser()} intent={params.intent} /></div>;
}
