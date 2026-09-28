import Image from "next/image";

// 브랜드명은 번역하지 않는다.
export const BRAND_NAME = "GameCove";

/** Covy 캐릭터 (40×40) */
export function LogoMark() {
  return (
    <Image src={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/images/logo-covy.png`} alt="" width={40} height={40} className="size-10 shrink-0 object-cover" />
  );
}

/** Figma `로고`: 캐릭터 40 + "GameCove" Ubuntu 24, gap 4 */
export function Logo() {
  return (
    <div className="flex items-center gap-1">
      <LogoMark />
      <span className="font-logo text-[24px] leading-normal tracking-[-1.68px] whitespace-nowrap text-text-primary">
        {BRAND_NAME}
      </span>
    </div>
  );
}
