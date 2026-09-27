import { requirePageAccess } from "@/lib/access-control";
import { Braces, Database, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { openApiSpec } from "@/lib/openapi";

export default async function DocsPage() {
  await requirePageAccess("admin", "/docs");
  const endpoints = Object.entries(openApiSpec.paths).flatMap(([path, methods]) => Object.entries(methods).map(([method, value]) => ({ path, method, summary: (value as {summary:string}).summary })));
  return <div className="page-wrap"><PageHeader eyebrow="開発者向け情報" title="シンプルで分かりやすい REST API" description="ペットと申込みのAPIをOpenAPI 3.1形式で公開しています。" /><section className="docs-layout"><div className="content-card"><span className="eyebrow">OpenAPI 3.1</span><h2>エンドポイント</h2><div className="endpoint-list">{endpoints.map((item) => <div key={`${item.method}${item.path}`}><b className={`method ${item.method}`}>{item.method}</b><code>/api{item.path}</code><span>{item.summary}</span></div>)}</div><a className="secondary-button inline" href="/api/openapi" target="_blank">JSONを開く <ExternalLink size={18} /></a></div><aside className="docs-aside"><div className="content-card"><span className="docs-icon"><Database size={23} /></span><h3>MongoDB対応</h3><p><code>MONGODB_URI</code>を設定してから<code>/api/seed</code>へPOSTします。未設定でも初期データを表示できます。</p></div><div className="content-card"><span className="docs-icon"><Braces size={23} /></span><h3>個人情報に配慮</h3><p>本人確認書類、顔写真、住所、賃貸契約書、収入証明は保存せず、確認状況のみを扱います。</p></div></aside></section></div>;
}
