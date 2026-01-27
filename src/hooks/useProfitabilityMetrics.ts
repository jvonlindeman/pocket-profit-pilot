import { useMemo } from "react";
import type { RetainerRow } from "@/types/retainers";

export type MarginStatus = "high" | "medium" | "low" | "negative";

export interface ClientMetric {
  id: string;
  clientName: string;
  specialty: string;
  income: number;
  expenses: number;
  margin: number;
  marginPercent: number;
  status: MarginStatus;
  usesStripe: boolean;
  articlesPerMonth: number;
  hasWhatsappBot: boolean;
}

export interface SpecialtyMetric {
  specialty: string;
  clientCount: number;
  totalIncome: number;
  totalExpenses: number;
  totalMargin: number;
  averageMarginPercent: number;
}

export interface MarginDistribution {
  high: number;
  medium: number;
  low: number;
  negative: number;
}

export interface ProfitabilityMetrics {
  totalClients: number;
  totalIncome: number;
  totalExpenses: number;
  totalMargin: number;
  averageMarginPercent: number;
  distribution: MarginDistribution;
  clientMetrics: ClientMetric[];
  bySpecialty: SpecialtyMetric[];
  topClient: ClientMetric | null;
  bottomClient: ClientMetric | null;
}

export function getMarginStatus(marginPercent: number): { status: MarginStatus; color: string; label: string } {
  if (marginPercent >= 50) return { status: "high", color: "hsl(142.1 76.2% 36.3%)", label: "Alto" };
  if (marginPercent >= 20) return { status: "medium", color: "hsl(45.4 93.4% 47.5%)", label: "Medio" };
  if (marginPercent >= 0) return { status: "low", color: "hsl(0 84.2% 60.2%)", label: "Bajo" };
  return { status: "negative", color: "hsl(0 62.8% 30.6%)", label: "Negativo" };
}

export function useProfitabilityMetrics(retainers: RetainerRow[]): ProfitabilityMetrics {
  return useMemo(() => {
    // Filter only active clients
    const activeRetainers = retainers.filter((r) => r.active);

    // Calculate metrics per client
    const clientMetrics: ClientMetric[] = activeRetainers.map((r) => {
      const income = Number(r.net_income) || 0;
      const expenses = Number(r.total_expenses) || 0;
      const margin = income - expenses;
      const marginPercent = income > 0 ? (margin / income) * 100 : 0;
      const { status } = getMarginStatus(marginPercent);

      return {
        id: r.id,
        clientName: r.client_name,
        specialty: r.specialty ?? "(sin especialidad)",
        income,
        expenses,
        margin,
        marginPercent,
        status,
        usesStripe: r.uses_stripe,
        articlesPerMonth: r.articles_per_month,
        hasWhatsappBot: r.has_whatsapp_bot,
      };
    });

    // Sort by margin descending
    const sortedByMargin = [...clientMetrics].sort((a, b) => b.margin - a.margin);

    // Global totals
    const totalClients = clientMetrics.length;
    const totalIncome = clientMetrics.reduce((sum, c) => sum + c.income, 0);
    const totalExpenses = clientMetrics.reduce((sum, c) => sum + c.expenses, 0);
    const totalMargin = totalIncome - totalExpenses;
    const averageMarginPercent = totalIncome > 0 ? (totalMargin / totalIncome) * 100 : 0;

    // Distribution by margin status
    const distribution: MarginDistribution = {
      high: clientMetrics.filter((c) => c.status === "high").length,
      medium: clientMetrics.filter((c) => c.status === "medium").length,
      low: clientMetrics.filter((c) => c.status === "low").length,
      negative: clientMetrics.filter((c) => c.status === "negative").length,
    };

    // Group by specialty
    const specialtyMap = new Map<string, { clients: ClientMetric[] }>();
    for (const c of clientMetrics) {
      const key = c.specialty;
      if (!specialtyMap.has(key)) {
        specialtyMap.set(key, { clients: [] });
      }
      specialtyMap.get(key)!.clients.push(c);
    }

    const bySpecialty: SpecialtyMetric[] = Array.from(specialtyMap.entries())
      .map(([specialty, data]) => {
        const totalIncome = data.clients.reduce((sum, c) => sum + c.income, 0);
        const totalExpenses = data.clients.reduce((sum, c) => sum + c.expenses, 0);
        const totalMargin = totalIncome - totalExpenses;
        const averageMarginPercent = totalIncome > 0 ? (totalMargin / totalIncome) * 100 : 0;

        return {
          specialty,
          clientCount: data.clients.length,
          totalIncome,
          totalExpenses,
          totalMargin,
          averageMarginPercent,
        };
      })
      .sort((a, b) => b.averageMarginPercent - a.averageMarginPercent);

    // Top and bottom client
    const topClient = sortedByMargin[0] ?? null;
    const bottomClient = sortedByMargin[sortedByMargin.length - 1] ?? null;

    return {
      totalClients,
      totalIncome,
      totalExpenses,
      totalMargin,
      averageMarginPercent,
      distribution,
      clientMetrics: sortedByMargin,
      bySpecialty,
      topClient,
      bottomClient,
    };
  }, [retainers]);
}
