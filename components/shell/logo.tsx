import Image from "next/image";

/** 내비게이션이 접혔을 때 사용하는 브랜드 심볼 (40×40) */
export function LogoMark() {
  return (
    <Image src={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/favicon-20260929.svg`} alt="GameCove" width={40} height={40} className="size-10 shrink-0" />
  );
}

/** 전체 GameCove 워드마크 (149×40) */
export function Logo() {
  return (
    <Image
      src={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/images/gamecove-logo-20260929.svg`}
      alt="GameCove"
      width={149}
      height={40}
      className="h-10 w-[149px] shrink-0"
    />
  );
}
