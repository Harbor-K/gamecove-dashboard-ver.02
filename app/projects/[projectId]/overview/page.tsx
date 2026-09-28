import { OverviewPage } from "@/components/dashboard/pages";
import { getBriefing } from "@/lib/ai/service";
import { defaultFilters } from "@/lib/dashboard/queries";
import { LOCALES } from "@/lib/i18n/messages";

// AI 브리핑 문장은 페이지를 만들 때 미리 계산해 넣는다 → 화면이 뜰 때 이미 글자가 있다 (뒤늦게 나타나지 않음).
// Overview는 필터가 없어서(전체 데이터) 언어별로 한 번씩만 만들면 된다.
export default async function OverviewRoute() {
  const briefings = Object.fromEntries(
    await Promise.all(LOCALES.map(async (locale) => [locale, await getBriefing({ page: "overview", filters: defaultFilters, locale })] as const)),
  );
  return <OverviewPage briefings={briefings} />;
}
