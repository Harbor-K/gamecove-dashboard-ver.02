import type { ButtonHTMLAttributes, ReactNode } from "react";

// Figma `Button` (Type=Primary / Secondary): h48, px16, gap8, radius 16, 1px border.
// 라벨: Primary만 SemiBold, Secondary는 Regular (CLAUDE.md 버튼 규칙). 아이콘은 24 슬롯 안에 16 아이콘.

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant: "primary" | "secondary";
  icon?: ReactNode;
};

// 테두리: inset-ring을 쓰면 밝은 배경의 둥근 모서리 밖으로 배경이 번져 보여서,
// 실제 border + background-clip: padding-box를 쓰고 padding을 1px 줄여 Figma(inside stroke, px16)와 같게 맞춘다.
// Primary hover = color/bg/hover-subtle 반투명 레이어 (디자이너 확정).
const variants = {
  primary: "bg-bg-button-primary border-border-default text-text-on-button-primary hover-layer",
  secondary:
    "bg-bg-button-secondary border-border-button-secondary text-text-button-secondary hover:text-text-primary cursor-pointer",
};

export function Button({ variant, icon, children, className = "", ...props }: ButtonProps) {
  return (
    <button
      type="button"
      // 누를 수 없을 때: 40% 흐리게, hover 없음
      className={`flex h-control-48 shrink-0 items-center gap-2 rounded-lg border bg-clip-padding px-[15px] disabled:cursor-default disabled:opacity-40 disabled:after:hidden ${variants[variant]} ${className}`}
      {...props}
    >
      {icon && (
        <span
          className={`flex size-icon-md items-center justify-center ${variant === "primary" ? "text-icon-inverse" : "text-icon-button-secondary"}`}
        >
          {icon}
        </span>
      )}
      <span
        className={`text-fs-16 whitespace-nowrap ${variant === "primary" ? "leading-[1.5] font-semibold" : "leading-[1.5]"}`}
      >
        {children}
      </span>
    </button>
  );
}

// Figma `Button / Pill`: h32, px20, radius 999, bg surface, 14 Regular.
export function PillButton({ children, className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`flex h-8 shrink-0 items-center justify-center rounded-full inset-ring inset-ring-border-default bg-bg-surface px-5 text-label-default text-text-primary whitespace-nowrap cursor-pointer hover:bg-bg-hover ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
