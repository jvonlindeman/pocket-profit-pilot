import { useMemo } from "react";
import { endOfMonth, isAfter, isBefore, isEqual, startOfMonth } from "date-fns";
import type { RetainerRow } from "@/types/retainers";

export type ChurnMetrics = {
  periodStart: Date;
  periodEnd: Date;
  // Logo Churn
  startingActive: number;
  newThisPeriod: number;
  churnedThisPeriod: number;
  endingActive: number;
  churnRate: number; // 0..1
  retentionRate: number; // 0..1
  // Revenue Churn
  startingMRR: number;
  churnedMRR: number;
  newMRR: number;
  endingMRR: number;
  revenueChurnRate: number; // 0..1
  netRevenueRetention: number; // 0..1+
  // Paused metrics (new)
  pausedCount: number;
  pausedMRR: number;
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

  // Logo Churn counters
  let startingActive = 0;
  let newThisPeriod = 0;
  let churnedThisPeriod = 0;
  let endingActive = 0;

  // Revenue Churn counters
  let startingMRR = 0;
  let churnedMRR = 0;
  let newMRR = 0;
  let endingMRR = 0;

  // Paused counters (new)
  let pausedCount = 0;
  let pausedMRR = 0;

  for (const r of retainers) {
    const isLegacy = Boolean((r as any).is_legacy);
    const rawCreatedAt = toDate((r as any).created_at);
    // Los clientes legacy se consideran activos "desde siempre"
    const createdAt = isLegacy 
      ? new Date('2000-01-01') 
      : (rawCreatedAt ?? periodStart);
    const canceledAt: Date | null = toDate((r as any).canceled_at);
    const pausedAt: Date | null = toDate((r as any).paused_at);
    const netIncome = Number(r.net_income) || 0;

    const wasActiveAtStart = isOnOrBefore(createdAt, periodStart) && (!canceledAt || isOnOrAfter(canceledAt, periodStart));
    // Solo contar como nuevo si NO es legacy y fue creado en el período
    const isNewThisPeriod = !isLegacy && isOnOrAfter(createdAt, periodStart) && isOnOrBefore(createdAt, periodEnd);
    const isChurnedThisPeriod = !!canceledAt && isOnOrAfter(canceledAt, periodStart) && isOnOrBefore(canceledAt, periodEnd);
    const wasActiveAtEnd = isOnOrBefore(createdAt, periodEnd) && (!canceledAt || isAfter(canceledAt, periodEnd));
    
    // Check if client was paused during/before period end
    const isPausedAtEnd = !!pausedAt && isOnOrBefore(pausedAt, periodEnd);

    // Logo Churn - pausados SIGUEN contando como clientes activos
    if (wasActiveAtStart) startingActive += 1;
    if (isNewThisPeriod) newThisPeriod += 1;
    if (isChurnedThisPeriod) churnedThisPeriod += 1;
    if (wasActiveAtEnd) endingActive += 1;

    // Revenue Churn - pausados NO contribuyen al MRR
    if (wasActiveAtStart) startingMRR += netIncome;
    if (isChurnedThisPeriod) churnedMRR += netIncome;
    if (isNewThisPeriod) newMRR += netIncome;
    
    // Para endingMRR, solo contar si está activo Y no pausado
    if (wasActiveAtEnd && !isPausedAtEnd) {
      endingMRR += netIncome;
    }
    
    // Track paused clients
    if (wasActiveAtEnd && isPausedAtEnd) {
      pausedCount += 1;
      pausedMRR += netIncome;
    }
  }

  // Logo Churn rates
  const logoDenom = Math.max(startingActive, 1);
  const churnRate = churnedThisPeriod / logoDenom;
  const retentionRate = Math.max(0, 1 - churnRate);

  // Revenue Churn rates
  const revenueDenom = Math.max(startingMRR, 1);
  const revenueChurnRate = churnedMRR / revenueDenom;
  const netRevenueRetention = endingMRR / revenueDenom;

  return {
    periodStart,
    periodEnd,
    // Logo Churn
    startingActive,
    newThisPeriod,
    churnedThisPeriod,
    endingActive,
    churnRate,
    retentionRate,
    // Revenue Churn
    startingMRR,
    churnedMRR,
    newMRR,
    endingMRR,
    revenueChurnRate,
    netRevenueRetention,
    // Paused
    pausedCount,
    pausedMRR,
  };
}

export function useChurnMetrics(retainers: RetainerRow[] | undefined, monthDate: Date): ChurnMetrics {
  return useMemo(() => calculateChurn(retainers ?? [], monthDate), [retainers, monthDate]);
}
