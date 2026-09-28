"use client";

import { useState, type ReactNode, type Ref } from "react";
import { SparkIcon } from "@/components/icons";
import { CheckboxIcon, CloseXsIcon, PlusXsIcon } from "@/components/icons-mapping";
import { AutoTextarea, DrawerClose, DrawerFrame } from "@/components/setup/drawer";
import { HoverTooltip, InfoTooltip } from "@/components/ui/info-tooltip";
import { analysisOptions, commonProperties, observationScript } from "@/data/logging";
import type { AnalysisId, LoggingNodeId, TrackingEventId, TrackingItem } from "@/data/types";
import { useI18n } from "@/lib/i18n";
import { DataChip, Dot, SmallButton, Spinner } from "./parts";

// Figma `Drawer / Logging setup` (Step 1) · `· Step 2` · `· Step 3`.
// w480, 머리(제목 20 Bold + "Step n of 3" + X) · 발 고정, 가운데만 스크롤. 내용 p24 gap32.

export function LoggingDrawer({
  step,
  onClose,
  footer,
  bodyRef,
  onBodyScroll,
  animate,
  overlay,
  children,
}: {
  step: 1 | 2 | 3;
  onClose: () => void;
  footer: ReactNode;
  bodyRef?: Ref<HTMLDivElement>;
  onBodyScroll?: () => void;
  animate?: boolean;
  /** 본문 위에 덮는 것 (Apply 로딩) */
  overlay?: ReactNode;
  children: ReactNode;
}) {
  const { t } = useI18n();
  return (
    <DrawerFrame
      animate={animate}
      bodyRef={bodyRef}
      onBodyScroll={onBodyScroll}
      overlay={overlay}
      header={
        <header className="flex h-[74px] shrink-0 items-center gap-4 p-6 shadow-[inset_0_-1px_0_var(--gc-border-default)]">
          <h2 className="min-w-0 flex-1 truncate text-[20px] leading-[1.3] font-bold text-text-primary">
            {t.logging.title}
          </h2>
          <span className="text-caption-default whitespace-nowrap text-text-secondary">
            {t.onboarding.stepOf(step, 3)}
          </span>
          <DrawerClose label={t.logging.close} onClick={onClose} />
        </header>
      }
      footer={footer}
    >
      {/* flex-auto: Step 1은 칩·입력창을 아래로 민다 (Figma Flexible space) */}
      <div className="flex flex-auto flex-col gap-8 p-6">{children}</div>
    </DrawerFrame>
  );
}

function Intro({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-fs-16 leading-[1.6] font-bold text-text-primary">{title}</h3>
      <p className="text-body-default text-text-secondary">{description}</p>
    </div>
  );
}

// ── Step 1: 분석 고르기 ──────────────────────────────────────────────────────────
export function LoggingStep1({
  selected,
  onToggle,
  prompt,
  onPromptChange,
}: {
  selected: AnalysisId[];
  onToggle: (id: AnalysisId) => void;
  prompt: string;
  onPromptChange: (value: string) => void;
}) {
  const { t } = useI18n();
  const recommended = analysisOptions.filter((a) => !selected.includes(a.id));
  // Selected는 고른 순서대로
  const chosen = selected.map((id) => analysisOptions.find((a) => a.id === id)!);

  return (
    <>
      <Intro title={t.logging.step1.title} description={t.logging.step1.description} />
      <div aria-hidden className="min-h-0 flex-1" />

      {recommended.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="flex size-4 items-center justify-center text-icon-ai">
              <SparkIcon />
            </span>
            <span className="text-label-default text-text-secondary">{t.logging.step1.recommended}</span>
            <InfoTooltip text={t.logging.step1.recommendedTip} />
          </div>
          <div className="flex flex-wrap gap-2">
            {recommended.map((a) => (
              <HoverTooltip key={a.id} text={t.logging.analysis[a.id].description} delay={250}>
                {/* Figma `Chip / Recommended`: h32 pl8 pr12 gap4, + 12 */}
                <button
                  type="button"
                  onClick={() => onToggle(a.id)}
                  className="group flex h-8 items-center gap-1 rounded-full bg-bg-surface pr-3 pl-2 text-label-default text-text-secondary select-none inset-ring inset-ring-border-default cursor-pointer hover:bg-bg-hover hover:text-text-primary"
                >
                  <span className="flex size-3 items-center justify-center text-icon-secondary group-hover:text-icon-primary">
                    <PlusXsIcon />
                  </span>
                  {t.logging.analysis[a.id].label}
                </button>
              </HoverTooltip>
            ))}
          </div>
        </section>
      )}

      {chosen.length > 0 && (
        <section className="flex flex-col gap-3">
          <span className="text-label-default text-text-secondary">{t.logging.step1.selected}</span>
          <div className="flex flex-wrap gap-2">
            {chosen.map((a) => (
              // Figma `Chip / Selected`: h32 pl12 pr8 gap4, 테두리 icon/primary, × 14
              <span
                key={a.id}
                className="flex h-8 items-center gap-1 rounded-full bg-bg-surface pr-2 pl-3 text-label-default text-text-primary select-none inset-ring inset-ring-icon-primary"
              >
                {t.logging.analysis[a.id].label}
                <button
                  type="button"
                  aria-label={t.logging.step1.remove(t.logging.analysis[a.id].label)}
                  onClick={() => onToggle(a.id)}
                  className="flex size-[14px] items-center justify-center text-icon-secondary icon-hit cursor-pointer hover:text-icon-primary"
                >
                  <CloseXsIcon />
                </button>
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Figma Prompt input: bg canvas, radius 8, p12, 최소 96. 자연어 입력은 계산에 반영하지 않는다 */}
      <div className="min-h-24 shrink-0 rounded-md bg-bg-canvas p-3 inset-ring inset-ring-border-default">
        <AutoTextarea value={prompt} onChange={onPromptChange} placeholder={t.logging.step1.promptPlaceholder} />
      </div>
    </>
  );
}

// ── Step 2: 무엇을 추적할지 ─────────────────────────────────────────────────────
export type ItemFacts = {
  scope: LoggingNodeId[];
  scopeLabels: string[];
  properties: string[];
  coverage: string[];
};

function SectionHeader({ tone, label, tip }: { tone: "positive" | "critical"; label: string; tip: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex size-4 items-center justify-center">
        <Dot tone={tone} size={10} />
      </span>
      <span className="text-fs-16 leading-[1.6] font-bold text-text-primary">{label}</span>
      <InfoTooltip text={tip} tone="primary" />
    </div>
  );
}

function Detail({ label, tip, children }: { label: string; tip: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1">
        <span className="text-label-default text-text-secondary">{label}</span>
        <InfoTooltip text={tip} />
      </div>
      {children}
    </div>
  );
}

function DetailValue({ children }: { children: ReactNode }) {
  return <span className="text-label-default text-text-primary">{children}</span>;
}

/**
 * 공통 속성 안내 — Figma `Notice / Logging` (초록 점 8 + 14 Regular status/positive, gap 8).
 * 어떤 값이 같이 기록되는지는 보여주되, 추가할 필요는 없다(nothing to add)는 뜻. 로깅 셋업에서만 쓴다.
 */
export function AutoRecordedNotice() {
  const { t } = useI18n();
  return (
    <p className="flex items-start gap-2 text-label-default text-status-positive">
      <span className="flex h-[21px] w-4 shrink-0 items-center justify-center">
        <Dot tone="positive" />
      </span>
      {t.logging.autoRecorded(t.logging.fieldJoin(commonProperties))}
    </p>
  );
}

function ItemDetails({ facts }: { facts: ItemFacts }) {
  const { t } = useI18n();
  return (
    <>
      <div aria-hidden className="h-px w-full bg-border-default" />
      <div className="flex flex-col gap-4">
        <Detail label={t.logging.step2.appliesTo} tip={t.logging.step2.appliesToTip}>
          <DetailValue>{t.logging.listJoin(facts.scopeLabels)}</DetailValue>
        </Detail>
        <Detail label={t.logging.step2.properties} tip={t.logging.step2.propertiesTip}>
          {facts.properties.length > 0 && <DetailValue>{t.logging.fieldJoin(facts.properties)}</DetailValue>}
          <AutoRecordedNotice />
        </Detail>
        <Detail label={t.logging.step2.coverage} tip={t.logging.step2.coverageTip}>
          <DetailValue>{t.logging.listJoin(facts.coverage)}</DetailValue>
        </Detail>
      </div>
    </>
  );
}

export function LoggingStep2({
  ready,
  requiresSetup,
  facts,
  readyOn,
  onToggleReady,
  pending,
  onTogglePending,
}: {
  ready: TrackingItem[];
  requiresSetup: TrackingItem[];
  facts: (id: TrackingEventId) => ItemFacts;
  readyOn: TrackingEventId[];
  onToggleReady: (id: TrackingEventId) => void;
  pending: TrackingEventId[];
  onTogglePending: (id: TrackingEventId) => void;
}) {
  const { t } = useI18n();
  // Details는 기본으로 숨김
  const [open, setOpen] = useState<TrackingEventId[]>([]);
  const toggleOpen = (id: TrackingEventId) =>
    setOpen((o) => (o.includes(id) ? o.filter((x) => x !== id) : [...o, id]));
  const detailsButton = (id: TrackingEventId) => (
    <SmallButton aria-expanded={open.includes(id)} onClick={() => toggleOpen(id)}>
      {open.includes(id) ? t.logging.step2.hideDetails : t.logging.step2.viewDetails}
    </SmallButton>
  );

  return (
    <>
      <Intro title={t.logging.step2.title} description={t.logging.step2.description} />

      {ready.length > 0 && (
        <section className="flex flex-col gap-4">
          <SectionHeader tone="positive" label={t.logging.step2.ready} tip={t.logging.step2.readyTip} />
          {ready.map((item) => {
            const on = readyOn.includes(item.id);
            const expanded = open.includes(item.id);
            return (
              // Figma `Item / Logging` Ready to track: bg canvas, radius 16, p16/24 (열림: 아래 24), gap16
              <div
                key={item.id}
                className={`flex flex-col gap-4 rounded-lg bg-bg-canvas px-6 pt-4 inset-ring inset-ring-border-default ${expanded ? "pb-6" : "pb-4"}`}
              >
                <div className="flex h-8 items-center gap-3">
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={on}
                    aria-label={t.logging.events[item.id]}
                    onClick={() => onToggleReady(item.id)}
                    className="flex size-5 shrink-0 items-center justify-center text-icon-primary icon-hit cursor-pointer"
                  >
                    <CheckboxIcon checked={on} />
                  </button>
                  <span className="min-w-0 flex-1 truncate text-fs-16 leading-[1.6] font-bold text-text-primary">
                    {t.logging.events[item.id]}
                  </span>
                  {detailsButton(item.id)}
                </div>
                {expanded && <ItemDetails facts={facts(item.id)} />}
              </div>
            );
          })}
        </section>
      )}

      {requiresSetup.length > 0 && (
        <section className="flex flex-col gap-4">
          <SectionHeader tone="critical" label={t.logging.step2.requiresSetup} tip={t.logging.step2.requiresSetupTip} />
          {requiresSetup.map((item) => {
            const added = pending.includes(item.id);
            const expanded = open.includes(item.id);
            return (
              <div
                key={item.id}
                className={`flex flex-col gap-4 rounded-lg bg-bg-canvas px-6 pt-4 inset-ring inset-ring-border-default ${expanded ? "pb-6" : "pb-4"}`}
              >
                <div className="flex flex-col gap-2">
                  <div className="flex h-8 items-center gap-3">
                    <span className="min-w-0 flex-1 truncate text-fs-16 leading-[1.6] font-bold text-text-secondary">
                      {t.logging.events[item.id]}
                    </span>
                    <div className="flex items-center gap-2">
                      {detailsButton(item.id)}
                      <SmallButton onClick={() => onTogglePending(item.id)}>
                        {added ? t.logging.step2.cancel : t.logging.step2.addToPending}
                      </SmallButton>
                    </div>
                  </div>
                  {/* Add to pending 확인 문구 (pending 색). Cancel로 되돌린다 */}
                  {added && (
                    <p
                      className="flex items-center gap-2 text-label-default text-status-pending"
                      style={{ animation: "gc-fade-in 200ms ease-out both" }}
                    >
                      <Dot tone="pending" />
                      {t.logging.step2.addedToPending}
                    </p>
                  )}
                </div>
                {expanded && <ItemDetails facts={facts(item.id)} />}
              </div>
            );
          })}
        </section>
      )}
    </>
  );
}

// ── Step 3: 최종 확인 ───────────────────────────────────────────────────────────
// 섹션 제목은 모두 primary (Figma의 연한 Pending 제목도 primary로 맞춤 — 디자이너 요청)
function Section({ label, tip, children }: { label: string; tip?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-1">
        <span className="text-label-default text-text-primary">{label}</span>
        {tip && <InfoTooltip text={tip} />}
      </div>
      {children}
    </section>
  );
}

const card = "flex flex-col rounded-lg bg-bg-canvas px-6 pt-4 pb-6 inset-ring inset-ring-border-default";

export function LoggingStep3({
  analyses,
  readyEvents,
  readyProperties,
  pending,
  onViewScript,
}: {
  analyses: { id: AnalysisId; scopeLabels: string[] }[];
  readyEvents: TrackingEventId[];
  readyProperties: string[];
  pending: { id: TrackingEventId; neededFor: string[] }[];
  onViewScript: () => void;
}) {
  const { t } = useI18n();
  return (
    <>
      <Intro title={t.logging.step3.title} description={t.logging.step3.description} />

      <Section label={t.logging.step3.analyses}>
        <div className={`${card} gap-4`}>
          {analyses.map((a) => (
            <div key={a.id} className="flex flex-col gap-0.5">
              <span className="text-body-default text-text-primary">{t.logging.analysis[a.id].label}</span>
              <span className="text-label-default text-text-secondary">{t.logging.listJoin(a.scopeLabels)}</span>
            </div>
          ))}
        </div>
      </Section>

      {readyEvents.length > 0 && (
        <>
          <Section label={t.logging.step3.eventsProperties}>
            <div className={`${card} gap-4`}>
              <div className="flex flex-col gap-2">
                <span className="text-label-default text-text-secondary">{t.logging.step3.events}</span>
                <div className="flex flex-wrap gap-2">
                  {readyEvents.map((id) => (
                    <DataChip key={id}>{t.logging.events[id]}</DataChip>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-label-default text-text-secondary">{t.logging.step3.properties}</span>
                {readyProperties.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {readyProperties.map((p) => (
                      <DataChip key={p}>{p}</DataChip>
                    ))}
                  </div>
                )}
                <AutoRecordedNotice />
              </div>
            </div>
          </Section>

          <Section label={t.logging.step3.scriptToBeAdded} tip={t.logging.step3.scriptTip}>
            {/* Figma `Card / Script`: 스크립트 이름 → 위치 → View script */}
            <div className={`${card} gap-2`}>
              <span className="text-fs-16 leading-[1.6] font-bold text-text-primary">{observationScript.name}</span>
              <div className="flex items-center gap-2">
                <span className="flex h-6 items-center rounded-sm bg-bg-selected px-2 text-label-default text-text-primary">
                  {observationScript.location}
                </span>
              </div>
              <div className="flex pt-2">
                <SmallButton onClick={onViewScript}>{t.logging.step3.viewScript}</SmallButton>
              </div>
            </div>
          </Section>
        </>
      )}

      {pending.length > 0 && (
        <Section label={t.logging.step3.pending} tip={t.logging.step3.pendingTip}>
          {pending.map((p) => (
            // Figma `Card / Pending item`
            <div key={p.id} className={`${card} gap-1`}>
              <div className="flex items-center gap-2">
                <span className="flex size-4 items-center justify-center">
                  <Dot tone="pending" />
                </span>
                <span className="text-fs-16 leading-[1.6] font-bold text-text-primary">{t.logging.events[p.id]}</span>
              </div>
              <p className="text-label-default text-text-secondary">{t.logging.step3.neededFor(t.logging.listJoin(p.neededFor))}</p>
            </div>
          ))}
        </Section>
      )}
    </>
  );
}

/** Apply 로딩: 드로어 본문을 덮는다 */
export function ApplyingOverlay() {
  const { t } = useI18n();
  return (
    <div
      className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-bg-surface px-10 text-center"
      style={{ animation: "gc-fade-in 200ms ease-out both" }}
    >
      <Spinner className="size-6 text-text-primary" />
      <span className="text-fs-16 leading-[1.6] font-bold text-text-primary">{t.logging.step3.applyingTitle}</span>
      <span className="text-label-default text-text-secondary">{t.logging.step3.applyingCaption}</span>
    </div>
  );
}
