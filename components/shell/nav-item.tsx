import Link from "next/link";
import type { ReactNode } from "react";

// Figma `Nav item` (248×48, gap12). Level=Top: px8 / Level=Child: px16.
// Default: radius 4, 글자·아이콘 secondary (워크스페이스 내비의 위쪽 그룹은 글자·아이콘 primary — labelTone)
// Hover: color/bg/hover, radius 8, 글자·아이콘 primary
// Selected: color/bg/selected, radius 8, 글자·아이콘 primary
// href도 onClick도 없으면 화면이 아직 없는 항목: hover만 되고 눌러도 아무 일 없음.

type NavItemProps = {
  icon?: ReactNode;
  label: string;
  href?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  selected?: boolean;
  level?: "top" | "child";
  /** 오른쪽 아이콘 (섹션 펼침 chevron) */
  trailing?: ReactNode;
  /** 기본 상태 글자색. 컴포넌트 기본은 secondary. */
  labelTone?: "primary" | "secondary";
  ariaExpanded?: boolean;
};

export function NavItem({
  icon,
  label,
  href,
  onClick,
  selected = false,
  level = "top",
  trailing,
  labelTone = "secondary",
  ariaExpanded,
}: NavItemProps) {
  const className = `group flex h-control-48 w-full shrink-0 items-center gap-3 text-left cursor-pointer ${
    level === "child" ? "px-4" : "px-2"
  } ${selected ? "rounded-md bg-bg-selected" : "rounded-sm hover:rounded-md hover:bg-bg-hover"}`;
  const primary = selected || labelTone === "primary";
  const iconColor = primary ? "text-icon-primary" : "text-icon-secondary group-hover:text-icon-primary";
  const labelColor = primary ? "text-text-primary" : "text-text-secondary group-hover:text-text-primary";

  const content = (
    <>
      <span className="flex min-w-0 flex-1 items-center gap-3">
        {icon && <span className={`flex size-icon-sm shrink-0 items-center justify-center ${iconColor}`}>{icon}</span>}
        <span className={`min-w-0 flex-1 truncate text-body-default ${labelColor}`}>{label}</span>
      </span>
      {trailing && (
        <span className={`flex size-icon-sm shrink-0 items-center justify-center ${iconColor}`}>{trailing}</span>
      )}
    </>
  );

  return href ? (
    <Link href={href} className={className} aria-current={selected ? "page" : undefined}>
      {content}
    </Link>
  ) : (
    <button
      type="button"
      className={className}
      onClick={onClick}
      aria-expanded={ariaExpanded}
      aria-current={selected ? "page" : undefined}
    >
      {content}
    </button>
  );
}
