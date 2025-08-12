import { useMemo } from "react";
import { endOfMonth, isAfter, isBefore, isEqual, startOfMonth } from "date-fns";
import type { RetainerRow } from "@/types/retainers";

export type ChurnMetrics = {
  periodStart: Date;
  periodEnd: Date;
  startingActive: number;
  newThisPeriod: number;
  churnedThisPeriod: number;
  endingActive: number;
  churnRate: number; // 0..1
  retentionRate: number; // 0..1
};

function toDate(value: any): Date | null {
  if (!value) return null;
  try {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
    
  } catch {
    return null;
  }
}

function isOnOrBefore(a: Date, b: Date) {
  return isBefore(a, b) || isEqual(a, b);
}

function isOnOrAfter(a: Date, b: Date) {
  return isAfter(a, b) || isEqual(a, b);
}

export function calculateChurn(retainers: RetainerRow[], monthDate: Date): ChurnMetrics {
  const periodStart = startOfMonth(monthDate);
  const periodEnd = endOfMonth(monthDate);

  let startingActive = 0;
  let newThisPeriod = 0;
  let churnedThisPeriod = 0;
  let endingActive = 0;

  for (const r of retainers) {
    const createdAt = toDate((r as any).created_at) ?? periodStart;
    const canceledAt: Date | null = toDate((r as any).canceled_at);

    const wasActiveAtStart = isOnOrBefore(createdAt, periodStart) && (!canceledAt || isOnOrAfter(canceledAt, periodStart));
    const isNewThisPeriod = isOnOrAfter(createdAt, periodStart) && isOnOrBefore(createdAt, periodEnd);
    const isChurnedThisPeriod = !!canceledAt && isOnOrAfter(canceledAt, periodStart) && isOnOrBefore(canceledAt, periodEnd);
    const wasActiveAtEnd = isOnOrBefore(createdAt, periodEnd) && (!canceledAt || isAfter(canceledAt, periodEnd));

    if (wasActiveAtStart) startingActive += 1;
    if (isNewThisPeriod) newThisPeriod += 1;
    if (isChurnedThisPeriod) churnedThisPeriod += 1;
    if (wasActiveAtEnd) endingActive += 1;
  }

  const denom = Math.max(startingActive, 1);
  const churnRate = churnedThisPeriod / denom;
  const retentionRate = Math.max(0, 1 - churnRate);

  return {
    periodStart,
    periodEnd,
    startingActive,
    newThisPeriod,
    churnedThisPeriod,
    endingActive,
    churnRate,
    retentionRate,
  };
}

export function useChurnMetrics(retainers: RetainerRow[] | undefined, monthDate: Date): ChurnMetrics {
  return useMemo(() => calculateChurn(retainers ?? [], monthDate), [retainers, monthDate]);
}
