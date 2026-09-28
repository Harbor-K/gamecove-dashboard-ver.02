import { Suspense } from "react";
import { ExplorePage } from "@/components/dashboard/pages";

// ?metric= 누른 지표, ?selection= 선택돼 있던 대상 — 화면이 브라우저에서 읽는다 (페이지를 정적으로 두기 위해)
export default function ExploreRoute() {
  return (
    <Suspense>
      <ExplorePage />
    </Suspense>
  );
}
