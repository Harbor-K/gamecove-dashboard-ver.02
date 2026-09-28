"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { SparkIcon } from "@/components/icons";
import { CloseIcon } from "@/components/icons-mapping";
import { CopyIcon, EyeIcon, FullScreenIcon, NormalScreenIcon, SendIcon, TemplateIcon, ThumbIcon } from "@/components/icons-dashboard";
import { AddPlusIcon } from "@/components/icons-mapping";
import { AutoTextarea } from "@/components/setup/drawer";
import type { DashboardPage } from "@/data/dashboard/types";
import type { CovyResponse, GameCoveContext } from "@/lib/ai/context";
import { useI18n } from "@/lib/i18n";
import { useRightInset } from "@/lib/right-inset";
import { toCssPx } from "@/lib/zoom";
import { useAgent, type AgentTurn } from "./agent-provider";

// Figma `AI Agent panel` (State = Empty / Clarifying / Answer, Size = Panel 480 / Expanded 1640).
// 상단 바 아래 오른쪽에 드로어처럼 뜬다. Expanded = 본문 영역 전체, 내용은 composer 폭(760) 가운데.

/** 화면 가장자리와의 간격, 최소 폭, 본문이 남아야 하는 최소 폭 */
const GAP = 16;
const MIN_W = 400;
const MIN_CONTENT = 560;

const PAGES: (DashboardPage | "tracking")[] = ["overview", "engagement", "retention", "experience", "explore", "tracking"];

/** 지금 보고 있는 화면 → context (직접 입력한 질문에 붙는다) */
function useCurrentPage(): DashboardPage | "tracking" {
  const pathname = usePathname();
  const last = pathname.split("/").filter(Boolean).pop() as DashboardPage | "tracking";
  return PAGES.includes(last) ? last : "overview";
}

export function AgentPanel() {
  const { t, locale } = useI18n();
  const agent = useAgent();
  const page = useCurrentPage();
  const [draft, setDraft] = useState("");
  const threadRef = useRef<HTMLDivElement>(null);

  const [resizing, setResizing] = useState(false);

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: "smooth" });
  }, [agent.thread]);

  // 패널만큼 본문을 옆으로 민다 (패널 폭 + 양옆 간격)
  useRightInset("agent", agent.open && !agent.expanded ? agent.width + GAP * 2 : 0);

  if (!agent.open) return null;

  // 왼쪽 가장자리를 끌어 폭 조절. 본문이 최소 MIN_CONTENT는 남도록
  const startResize = (e: React.PointerEvent) => {
    e.preventDefault();
    setResizing(true);
    const contentLeft = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--gc-content-left")) || 0;
    const move = (m: PointerEvent) => {
      // 화면 px → CSS px (화면 전체 배율)
      const viewport = toCssPx(window.innerWidth);
      const max = viewport - contentLeft - MIN_CONTENT - GAP * 2;
      agent.setWidth(Math.round(Math.min(Math.max(MIN_W, viewport - GAP - toCssPx(m.clientX)), max)));
    };
    const up = () => {
      setResizing(false);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const context: GameCoveContext = agent.context ?? { page, locale };
  const send = (text: string) => {
    agent.ask(text, { ...context, locale });
    setDraft("");
  };
  const empty = agent.thread.length === 0;
  const wide = agent.expanded;
  const column = wide ? "mx-auto w-[760px] max-w-full" : "w-full";

  return (
    // 다른 드로어와 달리 화면 가장자리에서 16 떨어져 뜬다 (radius 16)
    <aside
      aria-label={t.agent.title}
      className="fixed z-40 flex flex-col overflow-hidden rounded-lg bg-bg-surface inset-ring inset-ring-border-default shadow-[0_8px_24px_0_var(--gc-effect-shadow)]"
      style={{
        top: 56 + GAP,
        right: GAP,
        bottom: GAP,
        left: wide ? `calc(var(--gc-content-left, 0px) + ${GAP}px)` : undefined,
        width: wide ? undefined : agent.width,
        animation: "gc-drawer-in 280ms cubic-bezier(0.2,0.8,0.2,1) both",
        userSelect: resizing ? "none" : undefined,
      }}
    >
      {!wide && (
        <span
          aria-hidden
          onPointerDown={startResize}
          className="absolute inset-y-4 left-0 z-10 w-2 -translate-x-1/2 cursor-col-resize rounded-full hover:bg-border-accent/40"
        />
      )}
      {/* Figma `AI Agent / Header`: h57, 아래 1px, spark 16 + 16/1.6, 오른쪽 28 버튼 두 개 */}
      <header className="flex h-[57px] shrink-0 items-center gap-2 px-6 shadow-[inset_0_-1px_0_var(--gc-border-default)]">
        <SparkIcon className="shrink-0 text-icon-ai" />
        <h2 className="flex-1 text-fs-16 leading-[1.6] text-text-primary">{t.agent.title}</h2>
        <button
          type="button"
          aria-label={wide ? t.agent.collapse : t.agent.expand}
          onClick={() => agent.setExpanded(!wide)}
          className="flex size-7 items-center justify-center rounded-md text-icon-secondary cursor-pointer hover:bg-bg-hover hover:text-icon-primary"
        >
          {wide ? <NormalScreenIcon /> : <FullScreenIcon />}
        </button>
        <button
          type="button"
          aria-label={t.agent.close}
          onClick={agent.close}
          className="flex size-7 items-center justify-center rounded-md text-icon-secondary cursor-pointer hover:bg-bg-hover hover:text-icon-primary"
        >
          <CloseIcon />
        </button>
      </header>

      <div ref={threadRef} className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 pt-6">
        {empty ? (
          <EmptyState column={column} onTemplate={send} />
        ) : (
          <Thread column={column} turns={agent.thread} onPick={send} />
        )}
      </div>

      {/* Composer dock: 아래 24, 좌우 24 (넓은 패널은 760 가운데) */}
      <div className="shrink-0 px-6 pt-2 pb-6">
        <Composer
          className={column}
          value={draft}
          onChange={setDraft}
          onSend={() => send(draft)}
          contextLabel={empty ? null : t.agent.context[context.page]}
        />
      </div>
    </aside>
  );
}

/** Covy (GameCove / Smiling logo) 80×64 — Figma 에셋 그대로 (브랜드 색) */
function Covy() {
  return (
    <svg width="80" height="64" viewBox="0 0 80 64" fill="none" aria-hidden>
      <path d="M49.3091 31.7832C56.7354 31.4296 62.6831 33.025 66.4917 35.7949C70.2784 38.5489 71.9619 42.4617 70.9409 46.8857C69.9294 51.2681 65.8609 54.3978 59.8462 56.3438C53.8512 58.2833 46.0583 58.9972 37.8784 58.6416L37.8677 58.6406H37.8569C31.8371 58.6406 26.7623 57.577 22.853 55.1445C19.0416 52.7728 16.2916 49.0704 14.8628 43.6592C24.0838 37.9993 35.3109 31.7832 49.2856 31.7832H49.3091Z" fill="#101010" stroke="var(--gc-border-default)" />
      <path d="M42.8755 6.07129C62.521 5.36982 75.2401 21.4978 78.0767 40.6445L78.0825 40.6816L78.0933 40.7188C79.5001 45.291 79.2935 48.8862 77.9556 51.3115C76.6326 53.7094 74.1433 55.0713 70.7144 55.0713C69.6952 55.0713 68.6724 54.9004 67.8228 54.6455C67.2986 54.4882 66.8667 54.306 66.5474 54.1279C69.1638 52.0278 70.8483 49.5972 71.4673 47.1211C72.09 44.6304 71.6237 42.1337 70.0083 39.9658L69.6704 39.5371C64.5054 32.9093 55.7085 31.4917 47.0444 33.6514C36.9289 35.105 28.9671 40.8944 19.7427 46.5713C16.1475 48.7284 12.8026 50.8403 9.90576 51.9814C6.99602 53.1276 4.76927 53.2053 3.21045 51.6465L3.18604 51.6211L3.15771 51.5996L2.92627 51.416C1.81855 50.4804 1.39307 49.2803 1.39307 47.8926C1.3931 46.3838 1.89857 44.6703 2.60693 42.8994C6.87073 32.24 12.9054 23.0198 19.896 16.4717C26.8881 9.92223 34.8072 6.07142 42.8569 6.07129H42.8755Z" fill="#F2F0EC" stroke="var(--gc-border-default)" />
      <path d="M36.4287 49.1426C37.143 42.7141 44.2859 41.9998 45.7144 48.4284" stroke="#F2F0EC" strokeWidth="2.57143" strokeLinecap="round" />
      <path d="M53.5713 48.4283C54.9999 41.9998 61.4284 41.9998 62.857 47.714" stroke="#F2F0EC" strokeWidth="2.57143" strokeLinecap="round" />
    </svg>
  );
}

function EmptyState({ column, onTemplate }: { column: string; onTemplate: (prompt: string) => void }) {
  const { t } = useI18n();
  const templates = [
    { key: "setUpLogging", icon: "data" },
    { key: "investigateData", icon: "search" },
    { key: "planNextMove", icon: "plan" },
  ] as const;
  return (
    <div className="flex flex-1 flex-col">
      {/* Figma: Covy 위 216px, 제목과 16 */}
      <div className="flex flex-col items-center gap-4 pt-[min(192px,18vh)] pb-8">
        <Covy />
        <p className="text-[18px] font-bold text-text-primary">{t.agent.emptyTitle}</p>
      </div>
      <div className="flex-1" />
      <div className={`flex flex-col gap-2 ${column}`}>
        <span className="pl-3 text-caption-default leading-[1.5] text-text-secondary">{t.agent.startWithTask}</span>
        <div className="flex flex-col gap-1">
          {templates.map((tpl) => {
            const copy = t.agent.templates[tpl.key];
            return (
              // Figma `AI Agent / Start template`: p8 gap12, 타일 32 bg/subtle radius 8, 제목 14 Bold · 설명 12. hover = 행 배경만
              <button
                key={tpl.key}
                type="button"
                onClick={() => onTemplate(copy.prompt)}
                className="flex items-center gap-3 rounded-md p-2 text-left cursor-pointer hover:bg-bg-hover"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-bg-subtle text-icon-secondary">
                  <TemplateIcon kind={tpl.icon} />
                </span>
                <span className="flex flex-col">
                  <span className="text-fs-14 leading-[1.5] font-bold text-text-primary">{copy.title}</span>
                  <span className="text-fs-12 leading-[1.5] text-text-secondary">{copy.description}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Thread({ column, turns, onPick }: { column: string; turns: AgentTurn[]; onPick: (text: string) => void }) {
  const { t } = useI18n();
  const last = turns[turns.length - 1];
  return (
    <div className={`flex flex-1 flex-col ${column}`}>
      {turns.map((turn, i) =>
        turn.role === "user" ? (
          // Figma 사용자 말풍선: 오른쪽, bg/bubble 50%, radius 16, px16 py12
          <div key={i} className={`flex justify-end ${i > 0 ? "mt-12" : ""}`}>
            <p className="max-w-[304px] rounded-lg bg-bg-bubble px-4 py-3 text-fs-16 leading-[1.6] text-text-primary">{turn.text}</p>
          </div>
        ) : turn.status === "pending" ? (
          <p key={i} className="mt-12 text-label-default text-text-secondary">
            {t.agent.thinking}
          </p>
        ) : (
          <AssistantTurn key={i} response={turn.response} isLast={turn === last} onPick={onPick} />
        ),
      )}
    </div>
  );
}

function AssistantTurn({ response, isLast, onPick }: { response: CovyResponse; isLast: boolean; onPick: (text: string) => void }) {
  const { t } = useI18n();
  if (response.kind === "clarify") {
    return (
      <>
        <p className="mt-12 text-label-default text-text-secondary">{response.status}</p>
        <div className="flex-1" />
        {isLast && <Clarify question={response.question} options={response.options} onPick={onPick} />}
      </>
    );
  }
  return (
    <>
      <div className="mt-12 flex flex-col gap-6">
        <div className="flex flex-col gap-8">
          {response.sections.map((s) => (
            <div key={s.heading} className="flex flex-col gap-3">
              <span className="text-label-default text-text-secondary">{s.heading}</span>
              {s.paragraphs?.map((p) => (
                <p key={p} className="text-fs-16 leading-[1.6] text-text-primary">
                  {p}
                </p>
              ))}
              {s.bullets?.map((b) => (
                <p key={b} className="text-fs-16 leading-[1.6] text-text-primary">
                  •&nbsp; {b}
                </p>
              ))}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          {[
            { label: t.agent.copy, icon: <CopyIcon /> },
            { label: t.agent.helpful, icon: <ThumbIcon /> },
            { label: t.agent.notHelpful, icon: <ThumbIcon down /> },
          ].map((b) => (
            <button
              key={b.label}
              type="button"
              aria-label={b.label}
              className="flex size-[26px] items-center justify-center rounded-md text-icon-secondary cursor-pointer hover:bg-bg-hover hover:text-icon-primary"
            >
              {b.icon}
            </button>
          ))}
        </div>
      </div>
      {isLast && response.followUps.length > 0 && (
        <>
          <div className="min-h-6 flex-1" />
          {/* Figma Follow-ups: 오른쪽 정렬, gap 12, `AI Agent / Suggestion` h36 pl12 pr16 */}
          <div className="flex flex-col items-end gap-3 pb-6">
            {response.followUps.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => onPick(q)}
                className="flex h-9 items-center gap-2 rounded-full pr-4 pl-3 text-label-default text-text-primary cursor-pointer hover:bg-bg-hover"
              >
                <SparkIcon className="shrink-0 text-icon-ai" />
                {q}
              </button>
            ))}
          </div>
        </>
      )}
    </>
  );
}

/** Figma `Clarify`: bg canvas radius 16 p24, spark + 질문 14, 번호 옵션 h44 (hover = bg/hover + 번호 칩 반전) */
function Clarify({ question, options, onPick }: { question: string; options: string[]; onPick: (text: string) => void }) {
  return (
    <div className="mb-6 flex flex-col gap-4 rounded-lg bg-bg-canvas p-6 inset-ring inset-ring-border-default">
      <div className="flex items-center gap-2">
        <SparkIcon className="shrink-0 text-icon-ai" />
        <span className="text-label-default text-text-primary">{question}</span>
      </div>
      <div className="flex flex-col gap-2">
        {options.map((o, i) => (
          <button
            key={o}
            type="button"
            onClick={() => onPick(o)}
            className="group flex h-11 items-center gap-2.5 rounded-md px-2.5 text-left text-fs-16 leading-[1.6] text-text-secondary cursor-pointer hover:bg-bg-hover hover:text-text-primary"
          >
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-bg-subtle text-fs-12 leading-[1.4] text-text-secondary group-hover:bg-icon-primary group-hover:text-bg-nav">
              {i + 1}
            </span>
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Figma `AI Agent / Composer` (Context = On / Off): bg canvas radius 8, 내용에 따라 높이가 늘어난다 */
function Composer({
  value,
  onChange,
  onSend,
  contextLabel,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  contextLabel: string | null;
  className: string;
}) {
  const { t } = useI18n();
  return (
    <div
      className={`flex flex-col gap-2 rounded-md bg-bg-canvas px-[13px] pt-[13px] pb-[13px] inset-ring inset-ring-border-default ${className}`}
      onKeyDown={(e) => {
        if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
          e.preventDefault();
          onSend();
        }
      }}
    >
      {contextLabel && (
        <span className="flex h-8 w-fit items-center gap-2 rounded-md bg-bg-surface pr-3 pl-2 text-label-default text-text-secondary inset-ring inset-ring-border-default">
          <EyeIcon className="shrink-0 text-icon-secondary" />
          {contextLabel}
        </span>
      )}
      <div className="px-[3px] pt-[3px] [&_textarea]:leading-[1.5]">
        <AutoTextarea value={value} onChange={onChange} placeholder={t.agent.placeholder} />
      </div>
      <div className="flex items-center justify-between">
        <button
          type="button"
          aria-label={t.agent.attach}
          className="flex size-7 items-center justify-center rounded-md text-icon-secondary cursor-pointer hover:bg-bg-hover hover:text-icon-primary"
        >
          <AddPlusIcon />
        </button>
        <button
          type="button"
          aria-label={t.agent.send}
          onClick={onSend}
          className="flex size-8 items-center justify-center rounded-full bg-bg-button-primary text-icon-inverse cursor-pointer hover-layer"
        >
          <SendIcon />
        </button>
      </div>
    </div>
  );
}
