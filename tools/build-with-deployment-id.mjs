import { spawnSync } from "node:child_process";
import { join } from "node:path";

// Next.js uses this value to detect an open tab from an older build and
// automatically replaces client-side navigation with a fresh document load.
const deploymentId = process.env.NEXT_DEPLOYMENT_ID || `local-${Date.now().toString(36)}`;
const nextCli = join(process.cwd(), "node_modules", "next", "dist", "bin", "next");
const result = spawnSync(process.execPath, [nextCli, "build", "--webpack"], {
  stdio: "inherit",
  env: { ...process.env, NEXT_DEPLOYMENT_ID: deploymentId },
});

if (result.error) throw result.error;
process.exit(result.status ?? 1);
