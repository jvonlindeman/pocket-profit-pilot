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
  baseIncome: number;
  upsellIncome: number;
  // New real profit fields
  stripeFees: number;
  netIncome: number;
  opexShare: number;
  zohoExpenseShare: number;
  realProfit: number;
  realMarginPercent: number;
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

export interface FinancialDataInput {
  stripeFees: number;
  stripeFeePercentage: number;
  stripeIncome: number;
  totalZohoExpenses: number;
  opexAmount: number;
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
  // Expansion metrics
  totalUpsellRevenue: number;
  clientsWithUpsells: number;
  expansionRate: number;
  // Real profit metrics
  totalStripeFees: number;
  totalNetIncome: number;
  totalOpex: number;
  totalZohoExpenses: number;
  totalRealProfit: number;
  realMarginPercent: number;
  stripeClientsCount: number;
  stripeClientsTotalIncome: number;
  hasRealData: boolean;
}

export function getMarginStatus(marginPercent: number): { status: MarginStatus; color: string; label: string } {
  if (marginPercent >= 50) return { status: "high", color: "hsl(142.1 76.2% 36.3%)", label: "Alto" };
  if (marginPercent >= 20) return { status: "medium", color: "hsl(45.4 93.4% 47.5%)", label: "Medio" };
  if (marginPercent >= 0) return { status: "low", color: "hsl(0 84.2% 60.2%)", label: "Bajo" };
  return { status: "negative", color: "hsl(0 62.8% 30.6%)", label: "Negativo" };
}

export function useProfitabilityMetrics(
  retainers: RetainerRow[],
  financialData?: FinancialDataInput
): ProfitabilityMetrics {
  return useMemo(() => {
    // Filter only active clients
    const activeRetainers = retainers.filter((r) => r.active);

    // Calculate total income for proration
    const totalIncome = activeRetainers.reduce(
      (sum, r) => sum + (Number(r.net_income) || 0), 0
    );

    // Calculate total income from Stripe clients (for fee proration)
    const totalStripeClientIncome = activeRetainers
      .filter(r => r.uses_stripe)
      .reduce((sum, r) => sum + (Number(r.net_income) || 0), 0);

    // Calculate metrics per client
    const clientMetrics: ClientMetric[] = activeRetainers.map((r) => {
      const baseIncome = Number((r as any).base_income) || 0;
      const upsellIncome = Number((r as any).upsell_income) || 0;
      const income = Number(r.net_income) || 0;
      const expenses = Number(r.total_expenses) || 0;
      
      // Simple margin (without real data)
      const margin = income - expenses;
      const marginPercent = income > 0 ? (margin / income) * 100 : 0;
      const { status } = getMarginStatus(marginPercent);

      // REAL PROFIT CALCULATION
      // Stripe Fees: Prorate based on client's share of total Stripe income
      let stripeFees = 0;
      if (r.uses_stripe && financialData?.stripeFees && totalStripeClientIncome > 0) {
        const clientStripeShare = income / totalStripeClientIncome;
        stripeFees = financialData.stripeFees * clientStripeShare;
      }

      const netIncome = income - stripeFees;

      // OPEX: Prorate based on client's share of total income
      let opexShare = 0;
      if (financialData?.opexAmount && totalIncome > 0) {
        const incomeShare = income / totalIncome;
        opexShare = financialData.opexAmount * incomeShare;
      }

      // Zoho Expenses: Prorate based on client's share of total income
      let zohoExpenseShare = 0;
      if (financialData?.totalZohoExpenses && totalIncome > 0) {
        const incomeShare = income / totalIncome;
        zohoExpenseShare = financialData.totalZohoExpenses * incomeShare;
      }

      // Real profit calculation - avoid double counting
      // If we have Zoho data, don't subtract retainer expenses (they're already in zohoExpenseShare)
      const realProfit = financialData?.totalZohoExpenses 
        ? netIncome - opexShare - zohoExpenseShare  // Real data: avoid double counting
        : netIncome - expenses - opexShare;         // No real data: use retainer expenses as estimate
      const realMarginPercent = income > 0 ? (realProfit / income) * 100 : 0;

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
        baseIncome,
        upsellIncome,
        // Real profit fields
        stripeFees,
        netIncome,
        opexShare,
        zohoExpenseShare,
        realProfit,
        realMarginPercent,
      };
    });

    // Sort by margin descending
    const sortedByMargin = [...clientMetrics].sort((a, b) => b.margin - a.margin);

    // Global totals
    const totalClients = clientMetrics.length;
    const totalExpenses = clientMetrics.reduce((sum, c) => sum + c.expenses, 0);
    const totalMargin = totalIncome - totalExpenses;
    const averageMarginPercent = totalIncome > 0 ? (totalMargin / totalIncome) * 100 : 0;

    // Real profit totals
    const totalStripeFees = financialData?.stripeFees ?? 0;
    const totalNetIncome = totalIncome - totalStripeFees;
    const totalOpex = financialData?.opexAmount ?? 0;
    const totalZohoExpenses = financialData?.totalZohoExpenses ?? 0;
    // Avoid double counting - if we have Zoho data, don't subtract retainer expenses
    const totalRealProfit = financialData?.totalZohoExpenses
      ? totalNetIncome - totalOpex - totalZohoExpenses  // Real data
      : totalNetIncome - totalExpenses - totalOpex;     // No real data
    const realMarginPercent = totalIncome > 0 ? (totalRealProfit / totalIncome) * 100 : 0;

    // Stripe clients stats
    const stripeClientsCount = clientMetrics.filter(c => c.usesStripe).length;
    const stripeClientsTotalIncome = clientMetrics
      .filter(c => c.usesStripe)
      .reduce((sum, c) => sum + c.income, 0);

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
        const specTotalIncome = data.clients.reduce((sum, c) => sum + c.income, 0);
        const specTotalExpenses = data.clients.reduce((sum, c) => sum + c.expenses, 0);
        const specTotalMargin = specTotalIncome - specTotalExpenses;
        const specAverageMarginPercent = specTotalIncome > 0 ? (specTotalMargin / specTotalIncome) * 100 : 0;

        return {
          specialty,
          clientCount: data.clients.length,
          totalIncome: specTotalIncome,
          totalExpenses: specTotalExpenses,
          totalMargin: specTotalMargin,
          averageMarginPercent: specAverageMarginPercent,
        };
      })
      .sort((a, b) => b.averageMarginPercent - a.averageMarginPercent);

    // Top and bottom client
    const topClient = sortedByMargin[0] ?? null;
    const bottomClient = sortedByMargin[sortedByMargin.length - 1] ?? null;

    // Expansion metrics
    const totalUpsellRevenue = clientMetrics.reduce((sum, c) => sum + c.upsellIncome, 0);
    const clientsWithUpsells = clientMetrics.filter((c) => c.upsellIncome > 0).length;
    const expansionRate = totalIncome > 0 ? (totalUpsellRevenue / totalIncome) * 100 : 0;

    // Has real data indicator
    const hasRealData = !!financialData && (financialData.stripeFees > 0 || financialData.totalZohoExpenses > 0 || financialData.opexAmount > 0);

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
      totalUpsellRevenue,
      clientsWithUpsells,
      expansionRate,
      // Real profit metrics
      totalStripeFees,
      totalNetIncome,
      totalOpex,
      totalZohoExpenses,
      totalRealProfit,
      realMarginPercent,
      stripeClientsCount,
      stripeClientsTotalIncome,
      hasRealData,
    };
  }, [retainers, financialData]);
}
