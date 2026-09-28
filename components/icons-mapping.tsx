// Mapping(Tracking) 화면 아이콘. Figma 인스턴스에서 export한 SVG 그대로, 색만 currentColor.

type IconProps = { className?: string };
const common = { fill: "none", "aria-hidden": true } as const;

// ── 노드 아이콘 (16) — Edit node의 Icon options 순서 ──────────────────────────
export function DoorIcon({ className }: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" className={className} {...common}>
      <path d="M3.3335 1.33337H10.6668C11.1973 1.33337 11.706 1.54409 12.081 1.91916C12.4561 2.29423 12.6668 2.80294 12.6668 3.33337V12.6667C12.6668 12.8435 12.5966 13.0131 12.4716 13.1381C12.3465 13.2631 12.177 13.3334 12.0002 13.3334H10.0002" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8.00016 8.00004V9.33337M3.3335 1.33337L8.39216 2.34537C8.8455 2.43598 9.25344 2.68084 9.5466 3.0383C9.83976 3.39576 10 3.84374 10.0002 4.30604V13.8534C10.0001 13.952 9.97818 14.0493 9.93596 14.1384C9.89374 14.2275 9.83229 14.3061 9.75603 14.3686C9.67977 14.4311 9.59059 14.4759 9.49493 14.4998C9.39928 14.5237 9.29951 14.526 9.20283 14.5067L4.4055 13.548C4.10312 13.4876 3.83105 13.3242 3.63559 13.0857C3.44013 12.8473 3.33337 12.5484 3.3335 12.24V1.33337Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function FlagIcon({ className }: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" className={className} {...common}>
      <path d="M2.6665 13.9999V10.4579M2.6665 10.4579C6.54517 7.42461 9.4545 13.4913 13.3332 10.4579V2.87528C9.4545 5.90861 6.54517 -0.158052 2.6665 2.87528V10.4579Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ShopIcon({ className }: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" className={className} {...common}>
      <path d="M3.25 10.8003C3.25021 11.4343 3.76631 11.9497 4.40039 11.9497H7.60059C8.23449 11.9495 8.74979 11.4342 8.75 10.8003V7.24951H3.25V10.8003ZM3.15039 7.29834L2.45312 7.24951C2.17329 7.22962 1.95026 6.99373 1.9502 6.70752C1.9502 6.62503 1.97037 6.53923 2.00879 6.4624L3.42773 3.62158C3.57357 3.33125 3.86789 3.1499 4.19043 3.1499H11.8125C12.1336 3.1499 12.4284 3.33181 12.5713 3.61865V3.61963L13.9922 6.4624C14.0309 6.5399 14.0498 6.62327 14.0498 6.70752C14.0497 6.99377 13.8268 7.22967 13.5469 7.24951L12.8506 7.29834V12.8003C12.8504 12.8284 12.828 12.8501 12.7998 12.8501C12.7718 12.8499 12.7502 12.8283 12.75 12.8003V7.24951H8.85059V12.3999C8.85059 12.6481 8.64859 12.85 8.40039 12.8501H3.60059C3.3523 12.8501 3.15039 12.6482 3.15039 12.3999V7.29834Z" fill="currentColor" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function PlayersIcon({ className }: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" className={className} {...common}>
      <path d="M11.2515 7C11.8236 7.00039 12.3883 7.13165 12.9019 7.38379C13.4154 7.63597 13.8642 8.00261 14.2144 8.45508C14.5646 8.90766 14.8071 9.43458 14.9224 9.99512C15.0375 10.5554 15.0226 11.1347 14.8794 11.6885C14.7361 12.2425 14.4678 12.757 14.0952 13.1914C13.7227 13.6257 13.2556 13.9693 12.73 14.1953C12.2043 14.4213 11.6335 14.5236 11.062 14.4951C10.4908 14.4666 9.93354 14.3082 9.43311 14.0312L9.15479 13.877L8.85107 13.9697L7.67334 14.3271L8.03174 13.1494L8.12451 12.8457L7.97021 12.5674C7.65394 11.9965 7.49183 11.3528 7.50049 10.7002C7.50916 10.0476 7.68865 9.40803 8.02002 8.8457C8.35133 8.28364 8.82365 7.81784 9.39014 7.49414C9.95689 7.17035 10.5987 6.99988 11.2515 7ZM9.25146 8.5C8.96141 8.5 8.6819 8.60098 8.45947 8.7832L8.36768 8.86621C8.13325 9.10063 8.00146 9.41848 8.00146 9.75C8.00146 10.0815 8.13325 10.3994 8.36768 10.6338C8.41012 10.6762 8.45591 10.7145 8.50342 10.75C8.48873 10.761 8.4737 10.7715 8.45947 10.7832L8.36768 10.8662C8.13325 11.1006 8.00146 11.4185 8.00146 11.75C8.00146 12.0815 8.13325 12.3994 8.36768 12.6338C8.6021 12.8682 8.91995 13 9.25146 13H11.2515C11.583 13 11.9008 12.8682 12.1353 12.6338C12.3697 12.3994 12.5015 12.0815 12.5015 11.75C12.5015 11.4776 12.4113 11.2153 12.2495 11H13.2515C13.583 11 13.9008 10.8682 14.1353 10.6338C14.3697 10.3994 14.5015 10.0815 14.5015 9.75C14.5015 9.45995 14.4005 9.18043 14.2183 8.95801L14.1353 8.86621L14.0435 8.7832C13.821 8.60098 13.5415 8.5 13.2515 8.5H9.25146ZM2.25146 8H5.64111C5.422 8.44692 5.25556 8.91963 5.14795 9.40918C4.99727 10.0949 4.96554 10.7991 5.04834 11.4922C4.94996 11.4969 4.85099 11.5 4.75146 11.5C3.81579 11.5 2.96947 11.3089 2.31885 10.9854L2.05225 10.8389C1.3749 10.4256 1.00146 9.87043 1.00146 9.25C1.00146 8.91848 1.13325 8.60063 1.36768 8.36621C1.6021 8.13179 1.91994 8 2.25146 8ZM4.75146 1.5C5.2819 1.5 5.79045 1.71086 6.16553 2.08594C6.5406 2.46101 6.75146 2.96957 6.75146 3.5C6.75146 4.03043 6.5406 4.53899 6.16553 4.91406C5.79045 5.28914 5.2819 5.5 4.75146 5.5C4.22103 5.5 3.71247 5.28914 3.3374 4.91406C2.96233 4.53899 2.75146 4.03043 2.75146 3.5C2.75146 2.96957 2.96233 2.46101 3.3374 2.08594C3.66569 1.75765 4.0962 1.55515 4.5542 1.50977L4.75146 1.5ZM11.2524 2.49707H11.2544C11.4515 2.49693 11.6465 2.53602 11.8286 2.61133C12.0108 2.68667 12.1765 2.79717 12.3159 2.93652C12.4552 3.07577 12.5657 3.24092 12.6411 3.42285C12.7165 3.605 12.7555 3.8009 12.7554 3.99805C12.7553 4.22534 12.7027 4.4473 12.605 4.64844C12.1613 4.55026 11.7079 4.49984 11.2524 4.5C10.797 4.49961 10.3436 4.54952 9.8999 4.64746C9.8028 4.44668 9.7514 4.22472 9.75146 3.99805L9.7583 3.85059C9.77276 3.7041 9.80917 3.56031 9.86572 3.42383C9.94119 3.24176 10.0515 3.07583 10.1909 2.93652C10.3303 2.79722 10.4961 2.68663 10.6782 2.61133C10.8618 2.53543 11.0572 2.49694 11.2524 2.49707Z" fill="currentColor" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function TrophyIcon({ className }: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" className={className} {...common}>
      <path d="M3.3335 2.66683C3.3335 2.31321 3.47397 1.97407 3.72402 1.72402C3.97407 1.47397 4.31321 1.3335 4.66683 1.3335H11.3335C11.6871 1.3335 12.0263 1.47397 12.2763 1.72402C12.5264 1.97407 12.6668 2.31321 12.6668 2.66683V6.00016C12.6668 7.23784 12.1752 8.42482 11.3 9.29999C10.4248 10.1752 9.23784 10.6668 8.00016 10.6668C6.76249 10.6668 5.5755 10.1752 4.70033 9.29999C3.82516 8.42482 3.3335 7.23784 3.3335 6.00016V2.66683ZM6.00016 14.6668H10.0002L8.00016 11.3335L6.00016 14.6668Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3.3335 2.6665H2.66683C2.31321 2.6665 1.97407 2.80698 1.72402 3.05703C1.47397 3.30708 1.3335 3.64622 1.3335 3.99984V4.82584C1.33349 5.31049 1.46556 5.78598 1.71551 6.20121C1.96547 6.61643 2.32386 6.95569 2.75216 7.1825L3.66683 7.6665M12.6668 2.6665H13.3335C13.6871 2.6665 14.0263 2.80698 14.2763 3.05703C14.5264 3.30708 14.6668 3.64622 14.6668 3.99984V4.4245C14.6669 5.03035 14.5018 5.62475 14.1894 6.14381C13.8769 6.66288 13.4289 7.08697 12.8935 7.3705L12.3335 7.6665" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

export function PortalIcon({ className }: IconProps) {
  const arrow =
    "M9.6465 5.64672C9.74025 5.55308 9.86734 5.50049 9.99984 5.50049C10.1323 5.50049 10.2594 5.55308 10.3532 5.64672L12.3532 7.64672C12.4468 7.74047 12.4994 7.86755 12.4994 8.00005C12.4994 8.13255 12.4468 8.25963 12.3532 8.35338L10.3532 10.3534C10.3074 10.4025 10.2522 10.4419 10.1909 10.4692C10.1295 10.4966 10.0633 10.5113 9.99619 10.5124C9.92905 10.5136 9.86236 10.5013 9.80011 10.4761C9.73785 10.451 9.68129 10.4136 9.63381 10.3661C9.58633 10.3186 9.5489 10.262 9.52376 10.1998C9.49861 10.1375 9.48626 10.0708 9.48744 10.0037C9.48863 9.93656 9.50332 9.87036 9.53065 9.80902C9.55798 9.74769 9.59738 9.69249 9.6465 9.64672L10.7932 8.50005H6.6665C6.5339 8.50005 6.40672 8.44737 6.31295 8.3536C6.21918 8.25983 6.1665 8.13266 6.1665 8.00005C6.1665 7.86744 6.21918 7.74026 6.31295 7.6465C6.40672 7.55273 6.5339 7.50005 6.6665 7.50005H10.7932L9.6465 6.35338C9.55287 6.25963 9.50028 6.13255 9.50028 6.00005C9.50028 5.86755 9.55287 5.74047 9.6465 5.64672Z";
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" className={className} {...common}>
      <path d="M3.3335 2.25H4.6665C5.13056 2.25 5.57564 2.43461 5.90381 2.7627C6.232 3.09088 6.4165 3.53587 6.4165 4V12C6.4165 12.4641 6.232 12.9091 5.90381 13.2373C5.57564 13.5654 5.13056 13.75 4.6665 13.75H3.3335C2.86937 13.75 2.42438 13.5655 2.09619 13.2373C1.768 12.9091 1.5835 12.4641 1.5835 12V4C1.5835 3.53587 1.768 3.09088 2.09619 2.7627C2.42438 2.43451 2.86937 2.25 3.3335 2.25Z" fill="currentColor" stroke="currentColor" strokeWidth="1.5" />
      {/* Figma는 같은 색 inside stroke(마스크)를 얹었지만 채움과 같은 색이라 보이는 결과는 채움과 같다 */}
      <path fillRule="evenodd" clipRule="evenodd" d={arrow} fill="currentColor" />
    </svg>
  );
}

export function RobloxNodeIcon({ className }: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" className={className} {...common}>
      <path d="M8.86377 10.562L9.5874 10.7563L9.78174 10.0317L10.0552 9.01025L12.353 9.62744L11.269 13.6685L2.31885 11.269L2.93408 8.97314L8.86377 10.562ZM13.6675 4.71729L13.0522 7.01318L7.12354 5.42529L6.3999 5.23096L6.20557 5.95557L5.93115 6.97607L3.6333 6.36084L4.71729 2.31787L13.6675 4.71729Z" fill="currentColor" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

/** Icon / node — 새로 추가한 노드의 기본 아이콘 */
export function NodeIcon({ className }: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" className={className} {...common}>
      <path d="M12 4H4C2.9 4 2 4.9 2 6V10C2 11.1 2.9 12 4 12H12C13.1 12 14 11.1 14 10V6C14 4.9 13.1 4 12 4Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4.6665 8H7.99984" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function GroupIcon({ className }: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" className={className} {...common}>
      <path d="M8.00008 2.6665H4.00008C3.26675 2.6665 2.66675 3.2665 2.66675 3.99984V7.99984C2.66675 8.73317 3.26675 9.33317 4.00008 9.33317H8.00008C8.73341 9.33317 9.33341 8.73317 9.33341 7.99984V3.99984C9.33341 3.2665 8.73341 2.6665 8.00008 2.6665Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12.0001 6.6665H8.00008C7.26675 6.6665 6.66675 7.2665 6.66675 7.99984V11.9998C6.66675 12.7332 7.26675 13.3332 8.00008 13.3332H12.0001C12.7334 13.3332 13.3334 12.7332 13.3334 11.9998V7.99984C13.3334 7.2665 12.7334 6.6665 12.0001 6.6665Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── 캔버스 컨트롤 (20, stroke 1.75) ───────────────────────────────────────────
export function ZoomInIcon({ className }: IconProps) {
  return (
    <svg width="23" height="23" viewBox="0 0 23 23" className={className} {...common}>
      <path d="M11.25 18.75V11.25M11.25 11.25V3.75M11.25 11.25H18.75M11.25 11.25H3.75" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

export function ZoomOutIcon({ className }: IconProps) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" className={className} {...common}>
      <path d="M4.1665 10H15.8332" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function FitIcon({ className }: IconProps) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" className={className} {...common}>
      <path d="M3.3335 7.49992V3.33325H7.50016" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12.5 3.33325H16.6667V7.49992" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16.6667 12.5V16.6667H12.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7.50016 16.6667H3.3335V12.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function UndoIcon({ className }: IconProps) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" className={className} {...common}>
      <path d="M7.50016 11.6666L3.3335 7.49992L7.50016 3.33325" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3.3335 7.5H12.5002C14.8002 7.5 16.6668 9.36667 16.6668 11.6667C16.6668 13.9667 14.8002 15.8333 12.5002 15.8333H9.16683" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function RedoIcon({ className }: IconProps) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" className={className} {...common}>
      <path d="M12.5 11.6666L16.6667 7.49992L12.5 3.33325" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16.6668 7.5H7.50016C5.20016 7.5 3.3335 9.36667 3.3335 11.6667C3.3335 13.9667 5.20016 15.8333 7.50016 15.8333H10.8335" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Button / Add 의 plus (16 슬롯, stroke 1.5) */
export function AddPlusIcon({ className }: IconProps) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" className={className} {...common}>
      <path d="M9 15V9M9 9V3M9 9H15M9 9H3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// ── 메뉴 (20) ────────────────────────────────────────────────────────────────
export function EditIcon({ className }: IconProps) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" className={className} {...common}>
      <path d="M11.5 4.4999L15.5 8.4999M3 16.9999L3.5 13.4999L13.5 3.4999C14.3 2.6999 15.7 2.6999 16.5 3.4999C17.3 4.2999 17.3 5.6999 16.5 6.4999L6.5 16.4999L3 16.9999Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function TrashIcon({ className }: IconProps) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" className={className} {...common}>
      <path d="M3.3335 5.8335H16.6668" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8.3335 9.1665V14.1665" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11.6665 9.1665V14.1665" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 5.8335L5.83333 16.6668H14.1667L15 5.8335" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7.5 5.8335V3.3335H12.5V5.8335" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function UngroupIcon({ className }: IconProps) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" className={className} {...common}>
      <path d="M7.5 2.5H4.16667C3.25 2.5 2.5 3.25 2.5 4.16667V7.5C2.5 8.41667 3.25 9.16667 4.16667 9.16667H7.5C8.41667 9.16667 9.16667 8.41667 9.16667 7.5V4.16667C9.16667 3.25 8.41667 2.5 7.5 2.5Z" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15.8335 10.8335H12.5002C11.5835 10.8335 10.8335 11.5835 10.8335 12.5002V15.8335C10.8335 16.7502 11.5835 17.5002 12.5002 17.5002H15.8335C16.7502 17.5002 17.5002 16.7502 17.5002 15.8335V12.5002C17.5002 11.5835 16.7502 10.8335 15.8335 10.8335Z" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── 팝업 (20, stroke 2) ──────────────────────────────────────────────────────
export function MinusIcon({ className }: IconProps) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" className={className} {...common}>
      <path d="M4.1665 10H15.8332" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CloseIcon({ className }: IconProps) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" className={className} {...common}>
      <path d="M15 15L10 10M10 10L5 5M10 10L15 5M10 10L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ChevronUpIcon({ className }: IconProps) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" className={className} {...common}>
      <path d="M5 12.5L10 7.5L15 12.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function WarningIcon({ className }: IconProps) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" className={className} {...common}>
      <path d="M21.5 20L12 3.5L2.5 20H21.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 10V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 17V17.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** 본문 옆 링크 ↗ (14, stroke 1.2) */
export function ArrowUpRightIcon({ className }: IconProps) {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" className={className} {...common}>
      <path d="M10.5 4L3.5 11M10.5 9.83333V4H4.66667" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── 연결선 툴바 (24 / chevron 16) ─────────────────────────────────────────────
export function ChevronDownSmIcon({ className }: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" className={className} {...common}>
      <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function StrokeWeightIcon({ className }: IconProps) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" className={className} {...common}>
      <path d="M4 6H20" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 18H20" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function TextIcon({ className }: IconProps) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" className={className} {...common}>
      <path d="M5 5H19" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 5V19" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 19H15" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function LineStyleIcon({ className }: IconProps) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" className={className} {...common}>
      <path d="M3 12H7" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 12H14" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17 12H21" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CurveIcon({ className }: IconProps) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" className={className} {...common}>
      <path d="M4 19C4 10 20 14 20 5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ArrowheadIcon({ className }: IconProps) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" className={className} {...common}>
      <path d="M4 12H19" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 7L19 12L14 17" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Step 2·3 드로어 (상태 16, 체크박스 20) ──────────────────────────────────────
export function CheckSmIcon({ className }: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" className={className} {...common}>
      <path fillRule="evenodd" clipRule="evenodd" d="M12.0199 5.31334C12.1136 5.40709 12.1662 5.53417 12.1662 5.66667C12.1662 5.79917 12.1136 5.92626 12.0199 6.02001L7.35327 10.6867C7.25952 10.7803 7.13244 10.8329 6.99994 10.8329C6.86744 10.8329 6.74036 10.7803 6.64661 10.6867L3.97994 8.02001C3.93081 7.97423 3.89141 7.91903 3.86409 7.8577C3.83676 7.79637 3.82206 7.73016 3.82088 7.66302C3.81969 7.59589 3.83204 7.5292 3.85719 7.46694C3.88234 7.40468 3.91977 7.34813 3.96725 7.30065C4.01473 7.25317 4.07128 7.21574 4.13354 7.19059C4.1958 7.16545 4.26249 7.1531 4.32962 7.15428C4.39676 7.15546 4.46297 7.17016 4.5243 7.19749C4.58563 7.22481 4.64083 7.26422 4.68661 7.31334L6.99994 9.62667L11.3133 5.31334C11.407 5.21971 11.5341 5.16711 11.6666 5.16711C11.7991 5.16711 11.9262 5.21971 12.0199 5.31334Z" fill="currentColor" />
    </svg>
  );
}

export function WarningSmIcon({ className }: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" className={className} {...common}>
      <path d="M14.3334 13.3334L8.00008 2.33337L1.66675 13.3334H14.3334Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 6.66663V9.33329" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 11.3334V11.34" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ClockSmIcon({ className }: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" className={className} {...common}>
      <path d="M7.99992 14.6667C11.6818 14.6667 14.6666 11.6819 14.6666 8.00004C14.6666 4.31814 11.6818 1.33337 7.99992 1.33337C4.31802 1.33337 1.33325 4.31814 1.33325 8.00004C1.33325 11.6819 4.31802 14.6667 7.99992 14.6667Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 10.6667L8.39067 9.05733C8.1406 8.80734 8.00008 8.46826 8 8.11467V4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function InfoSmIcon({ className }: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" className={className} {...common}>
      <path d="M7.75 2C4.57469 2 2 4.57469 2 7.75C2 10.9253 4.57469 13.5 7.75 13.5C10.9253 13.5 13.5 10.9253 13.5 7.75C13.5 4.57469 10.9253 2 7.75 2Z" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" />
      <path d="M6.875 6.875H7.875V10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.5 10.625H9.25" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" />
      <path d="M7.75 4.0625C7.5893 4.0625 7.43221 4.11015 7.2986 4.19943C7.16498 4.28871 7.06084 4.4156 6.99935 4.56407C6.93785 4.71253 6.92176 4.8759 6.95311 5.03351C6.98446 5.19112 7.06185 5.33589 7.17548 5.44952C7.28911 5.56315 7.43388 5.64054 7.59149 5.67189C7.7491 5.70324 7.91247 5.68715 8.06093 5.62565C8.2094 5.56416 8.33629 5.46002 8.42557 5.3264C8.51485 5.19279 8.5625 5.0357 8.5625 4.875C8.5625 4.65951 8.4769 4.45285 8.32452 4.30048C8.17215 4.1481 7.96549 4.0625 7.75 4.0625Z" fill="currentColor" />
    </svg>
  );
}

/** Icon / checkbox-checked·unchecked (20). 체크 표시는 배경을 뚫는 마스크 */
export function CheckboxIcon({ checked, className }: IconProps & { checked: boolean }) {
  if (!checked) {
    return (
      <svg width="20" height="20" viewBox="0 0 20 20" className={className} {...common}>
        <path d="M4.16699 3.25H15.833C16.0761 3.25 16.3095 3.34665 16.4814 3.51855C16.6534 3.69046 16.75 3.92388 16.75 4.16699V15.833C16.75 16.0761 16.6534 16.3095 16.4814 16.4814C16.3095 16.6534 16.0761 16.75 15.833 16.75H4.16699C3.92388 16.75 3.69046 16.6534 3.51855 16.4814C3.34665 16.3095 3.25 16.0761 3.25 15.833V4.16699C3.25 3.65621 3.65621 3.25 4.16699 3.25Z" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    );
  }
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" className={className} {...common}>
      <mask id="gc-checkbox-mask" style={{ maskType: "luminance" }} maskUnits="userSpaceOnUse" x="2" y="2" width="16" height="16">
        <path d="M3.33301 10.0007V4.16732C3.33301 3.70898 3.70801 3.33398 4.16634 3.33398H15.833C16.2913 3.33398 16.6663 3.70898 16.6663 4.16732V15.834C16.6663 16.2923 16.2913 16.6673 15.833 16.6673H4.16634C3.70801 16.6673 3.33301 16.2923 3.33301 15.834V10.0007Z" fill="white" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M6.66602 10.0007L9.16602 12.5007L13.3327 8.33398" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </mask>
      <g mask="url(#gc-checkbox-mask)">
        <path d="M0 0H20V20H0V0Z" fill="currentColor" />
      </g>
    </svg>
  );
}

// ── 프로젝트 내비 (16) ────────────────────────────────────────────────────────
export function ChevronRightSmIcon({ className }: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" className={className} {...common}>
      <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function GridSmIcon({ className }: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" className={className} {...common}>
      <path d="M15.1111 7.11111H9.77778C9.28889 7.11111 8.88889 7.51111 8.88889 8V15.1111C8.88889 15.6 9.28889 16 9.77778 16H15.1111C15.6 16 16 15.6 16 15.1111V8C16 7.51111 15.6 7.11111 15.1111 7.11111ZM14.2222 14.2222H10.6667V8.88889H14.2222V14.2222ZM6.22222 10.6667H0.888889C0.4 10.6667 0 11.0667 0 11.5556V15.1111C0 15.6 0.4 16 0.888889 16H6.22222C6.71111 16 7.11111 15.6 7.11111 15.1111V11.5556C7.11111 11.0667 6.71111 10.6667 6.22222 10.6667ZM5.33333 14.2222H1.77778V12.4444H5.33333V14.2222ZM15.1111 0H9.77778C9.28889 0 8.88889 0.4 8.88889 0.888889V4.44444C8.88889 4.93333 9.28889 5.33333 9.77778 5.33333H15.1111C15.6 5.33333 16 4.93333 16 4.44444V0.888889C16 0.4 15.6 0 15.1111 0ZM14.2222 3.55556H10.6667V1.77778H14.2222V3.55556ZM6.22222 0H0.888889C0.4 0 0 0.4 0 0.888889V8C0 8.48889 0.4 8.88889 0.888889 8.88889H6.22222C6.71111 8.88889 7.11111 8.48889 7.11111 8V0.888889C7.11111 0.4 6.71111 0 6.22222 0ZM5.33333 7.11111H1.77778V1.77778H5.33333V7.11111Z" fill="currentColor" />
    </svg>
  );
}

export function LineChartIcon({ className }: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" className={className} {...common}>
      <path d="M2 2V14H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4.66669 9.66667L7.33335 7L9.33335 9L12.6667 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function RepeatIcon({ className }: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" className={className} {...common}>
      <path d="M11.3333 1.66667L13.6667 4L11.3333 6.33334" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2.33334 8V6.33333C2.33334 5.71449 2.57918 5.121 3.01676 4.68342C3.45435 4.24583 4.04784 4 4.66668 4H13.6667M4.66668 14.3333L2.33334 12L4.66668 9.66667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.6667 8V9.66667C13.6667 10.2855 13.4208 10.879 12.9833 11.3166C12.5457 11.7542 11.9522 12 11.3333 12H2.33334" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function GamepadIcon({ className }: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" className={className} {...common}>
      <path d="M11.6667 4.66666H4.33332C2.86056 4.66666 1.66666 5.86057 1.66666 7.33333V9C1.66666 10.4728 2.86056 11.6667 4.33332 11.6667H11.6667C13.1394 11.6667 14.3333 10.4728 14.3333 9V7.33333C14.3333 5.86057 13.1394 4.66666 11.6667 4.66666Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4.66667 7V9.33333M3.5 8.16667H5.83333M10.3333 7.66667H10.34M12 9.33333H12.0067" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function RadioIcon({ className }: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" className={className} {...common}>
      <path d="M7.99999 9.46667C8.81001 9.46667 9.46666 8.81002 9.46666 8.00001C9.46666 7.18999 8.81001 6.53334 7.99999 6.53334C7.18997 6.53334 6.53333 7.18999 6.53333 8.00001C6.53333 8.81002 7.18997 9.46667 7.99999 9.46667Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.2 5.2C4.46709 5.94771 4.05657 6.95298 4.05657 8C4.05657 9.04701 4.46709 10.0523 5.2 10.8M10.8 10.8C11.5329 10.0523 11.9434 9.04701 11.9434 8C11.9434 6.95298 11.5329 5.94771 10.8 5.2M3.26667 3.26666C2.64181 3.88642 2.14585 4.62376 1.80739 5.43615C1.46893 6.24855 1.29468 7.11992 1.29468 8C1.29468 8.88008 1.46893 9.75145 1.80739 10.5638C2.14585 11.3762 2.64181 12.1136 3.26667 12.7333M12.7333 12.7333C13.3582 12.1136 13.8542 11.3762 14.1926 10.5638C14.5311 9.75145 14.7053 8.88008 14.7053 8C14.7053 7.11992 14.5311 6.24855 14.1926 5.43615C13.8542 4.62376 13.3582 3.88642 12.7333 3.26666" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function MessageIcon({ className }: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" className={className} {...common}>
      <path d="M2.66666 3.33333H13.3333V10.6667H6L2.66666 13.3333V3.33333Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CompassIcon({ className }: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" className={className} {...common}>
      <path d="M8 14C11.3137 14 14 11.3137 14 8C14 4.68629 11.3137 2 8 2C4.68629 2 2 4.68629 2 8C2 11.3137 4.68629 14 8 14Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10.4 5.6L9.06667 9.06667L5.60001 10.4L6.93334 6.93333L10.4 5.6Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Logging setup ─────────────────────────────────────────────────────────────
/** Icon / plus (12, stroke 1.5) — Chip / Recommended */
export function PlusXsIcon({ className }: IconProps) {
  return (
    <svg width="12" height="12" viewBox="0.75 0.75 12 12" className={`overflow-visible ${className ?? ""}`} {...common}>
      <path d="M6.75 11.25V6.75M6.75 6.75V2.25M6.75 6.75H11.25M6.75 6.75H2.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/** Icon / close (14, stroke 1.5) — Chip / Selected 제거 */
export function CloseXsIcon({ className }: IconProps) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" className={className} {...common}>
      <path d="M10.5 10.5L7 7M7 7L3.5 3.5M7 7L10.5 3.5M7 7L3.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Icon / close (16, stroke 1.6) — Panel / Tracked events 닫기 */
export function CloseSmIcon({ className }: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" className={className} {...common}>
      <path d="M15 15L10 10M10 10L5 5M10 10L15 5M10 10L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
