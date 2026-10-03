import type { Metadata } from "next";
import { Ubuntu } from "next/font/google";
import localFont from "next/font/local";
import Script from "next/script";
import { I18nProvider } from "@/lib/i18n";
import { THEME_COOKIE } from "@/lib/theme-config";
import "./globals.css";

// Figma에서 쓰는 Lato 굵기 전부 (Regular / Medium / SemiBold / Bold)
// Lato 2.0 파일의 세로 기준값(ascent 0.81 / descent 0.20)이 Figma의 Lato(0.987 / 0.213, 기본 줄높이 1.2)와 달라
// 글자가 줄 안에서 약 1px 위로 그려진다. Figma 값으로 덮어써서 세로 위치를 맞춘다.
const lato = localFont({
  variable: "--font-lato",
  declarations: [
    { prop: "ascent-override", value: "98.7%" },
    { prop: "descent-override", value: "21.3%" },
    { prop: "line-gap-override", value: "0%" },
  ],
  src: [
    { path: "./fonts/lato-normal.woff2", weight: "400", style: "normal" },
    { path: "./fonts/lato-medium.woff2", weight: "500", style: "normal" },
    { path: "./fonts/lato-semibold.woff2", weight: "600", style: "normal" },
    { path: "./fonts/lato-bold.woff2", weight: "700", style: "normal" },
  ],
});

// 한국어(?lang=ko)용 Pretendard. 굵기는 Lato와 같은 값으로 매핑 (400 / 500 / 600 / 700).
// 영어 사용자는 받지 않도록 preload 끔 — 한국어 글자가 그려질 때만 내려받는다.
const pretendard = localFont({
  variable: "--font-pretendard",
  preload: false,
  src: [
    { path: "./fonts/pretendard-regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/pretendard-medium.woff2", weight: "500", style: "normal" },
    { path: "./fonts/pretendard-semibold.woff2", weight: "600", style: "normal" },
    { path: "./fonts/pretendard-bold.woff2", weight: "700", style: "normal" },
  ],
});

// 로고 "GameCove"
const ubuntu = Ubuntu({
  variable: "--font-ubuntu",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GameCove",
  icons: {
    icon: [{ url: `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/favicon-20260929.svg`, type: "image/svg+xml" }],
    shortcut: `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/favicon-20260929.svg`,
  },
};

// 저장된 테마(쿠키)를 첫 페인트 전에 넣는 작은 스크립트. 기본 Dark.
// 서버에서 쿠키를 읽으면 모든 페이지가 요청마다 서버에서 다시 만들어져 전환이 느려지므로, 페이지는 정적으로 두고 여기서 적용한다.
const themeScript = `try{var m=document.cookie.match(/(?:^|; )${THEME_COOKIE}=([^;]+)/);var v=m&&m[1];if(v==="light"||v==="system")document.documentElement.dataset.theme=v}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-theme="dark"
      suppressHydrationWarning
      className={`${lato.variable} ${pretendard.variable} ${ubuntu.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <Script id="gc-theme" strategy="beforeInteractive">
          {themeScript}
        </Script>
        <I18nProvider>{children}</I18nProvider>
        <script
          type="text/javascript"
          src="https://api.useberry.com/integrations/liveUrl/scripts/useberryScript.js"
          async
        ></script>
      </body>
    </html>
  );
}
