// 화면 전체 배율(--gc-zoom, app/globals.css). 마우스 좌표·getBoundingClientRect·innerWidth는 화면 px라서
// 배율로 나눠야 CSS px(style의 left/top/width)와 맞는다.
export function uiZoom() {
  if (typeof window === "undefined") return 1;
  return parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--gc-zoom")) || 1;
}

/** 화면 px → CSS px */
export const toCssPx = (screenPx: number) => screenPx / uiZoom();
