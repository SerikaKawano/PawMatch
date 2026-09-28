import { TaskGuide } from "@/components/TaskGuide";
import { PetExplorer } from "@/components/PetExplorer";
import { getPets } from "@/lib/repository";

export default async function PetsPage({ searchParams }: { searchParams: Promise<{ species?: string; region?: string }> }) {
  const petList = await getPets();
  const filters = await searchParams;
  return <div className="page-wrap"><TaskGuide title="家族を探す3つのステップ" steps={["種類・地域で絞り込む", "詳細を見る", "気になる子について相談する"]} /><PetExplorer pets={petList} initialSpecies={filters.species} initialRegion={filters.region} /></div>;
}
