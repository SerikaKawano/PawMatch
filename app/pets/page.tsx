import { TaskGuide } from "@/components/TaskGuide";
import { PageHeader } from "@/components/PageHeader";
import { PetExplorer } from "@/components/PetExplorer";
import { getPets } from "@/lib/repository";

export default async function PetsPage({ searchParams }: { searchParams: Promise<{ species?: string; region?: string }> }) {
  const petList = await getPets();
  const filters = await searchParams;
  return <div className="page-wrap"><PageHeader eyebrow="里親募集中のペットたち" title="暮らしに合う家族を探す" description="・「写真・条件を見る」ボタンから詳細を確認できます" /><TaskGuide title="家族を探す3つのステップ" steps={["種類・地域で絞り込む", "写真・条件を見る", "気になる子について相談する"]} /><PetExplorer pets={petList} initialSpecies={filters.species} initialRegion={filters.region} /></div>;
}
