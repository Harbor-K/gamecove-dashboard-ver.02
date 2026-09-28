// tokens/figma-tokens.json → app/tokens.css
// 실행: npm run tokens
// Figma 값이 바뀌면 JSON만 갱신하고 이 스크립트를 다시 돌린다. app/tokens.css는 직접 고치지 않는다.

import { readFileSync, writeFileSync } from "node:fs";

const src = JSON.parse(
  readFileSync(new URL("../tokens/figma-tokens.json", import.meta.url), "utf8"),
);

// "color/bg/canvas" → "bg-canvas", "chart/area/primary-0" → "chart-area-primary-0"
const slug = (name) => name.replace(/^color\//, "").replaceAll("/", "-");
// "Display/Page" → "display-page"
const styleSlug = (name, style) =>
  style.slug ?? name.toLowerCase().replaceAll("/", "-");

const semantic = Object.entries(src.semantic);
const themeBlock = (index) =>
  semantic.map(([name, v]) => `  --gc-${slug(name)}: ${v[index]};`).join("\n");

const textStyles = Object.entries(src.textStyles)
  .map(([name, s]) => {
    const k = styleSlug(name, s);
    return [
      `  /* ${name} */`,
      `  --text-${k}: ${s.size}px;`,
      `  --text-${k}--line-height: ${s.lineHeight / 100};`,
      `  --text-${k}--letter-spacing: ${s.letterSpacing / 100}em;`,
      `  --text-${k}--font-weight: ${s.weight};`,
    ].join("\n");
  })
  .join("\n");

const css = `/* 자동 생성 파일 — scripts/build-tokens.mjs. 직접 수정하지 말 것. */
/* 출처: ${src.$source} */

/* GC Semantic — Dark (기본) */
:root,
[data-theme="dark"] {
  color-scheme: dark;
${themeBlock(0)}
}

/* GC Semantic — Light */
[data-theme="light"] {
  color-scheme: light;
${themeBlock(1)}
}

/* System: OS 설정을 따른다 (Light일 때만 덮어씀, 기본은 Dark) */
@media (prefers-color-scheme: light) {
  [data-theme="system"] {
    color-scheme: light;
${themeBlock(1).replaceAll("\n  ", "\n    ").replace(/^  /, "    ")}
  }
}

/* Tailwind 유틸리티: 시맨틱 토큰만 노출한다. 기본 팔레트·radius·text 크기는 지운다. */
@theme inline {
  --color-*: initial;
${semantic.map(([name]) => `  --color-${slug(name)}: var(--gc-${slug(name)});`).join("\n")}

  --radius-*: initial;
${Object.entries(src.radius).map(([k, v]) => `  --radius-${k}: ${v}px;`).join("\n")}

${Object.entries(src.size).map(([k, v]) => `  --spacing-${k}: ${v}px;`).join("\n")}

  --text-*: initial;
${textStyles}

  --font-*: initial;
  --font-sans: var(--gc-font-sans); /* locale별 — app/globals.css */
  --font-logo: var(--font-ubuntu);
}
`;

writeFileSync(new URL("../app/tokens.css", import.meta.url), css);
console.log(`app/tokens.css: ${semantic.length} color tokens × 2 themes`);
