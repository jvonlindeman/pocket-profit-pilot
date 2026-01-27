import React from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { useProfitabilityMetrics } from "@/hooks/useProfitabilityMetrics";
import { KPISummaryCards } from "./KPISummaryCards";
import { MarginDistributionChart } from "./MarginDistributionChart";
import { TopClientsChart } from "./TopClientsChart";
import { ProfitabilityTable } from "./ProfitabilityTable";
import { SpecialtyAnalysis } from "./SpecialtyAnalysis";
import type { RetainerRow } from "@/types/retainers";

interface ProfitabilityDashboardProps {
  retainers: RetainerRow[];
}

export const ProfitabilityDashboard: React.FC<ProfitabilityDashboardProps> = ({ retainers }) => {
  const metrics = useProfitabilityMetrics(retainers);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dashboard de Rentabilidad</CardTitle>
      </CardHeader>
      <div className="p-6 pt-0 space-y-6">
        {/* KPI Summary */}
        <KPISummaryCards metrics={metrics} />

        {/* Charts Row */}
        <div className="grid md:grid-cols-2 gap-6">
          <MarginDistributionChart distribution={metrics.distribution} />
          <TopClientsChart clients={metrics.clientMetrics} />
        </div>

        {/* Specialty Analysis */}
        <SpecialtyAnalysis specialties={metrics.bySpecialty} />

        {/* Detailed Table */}
        <ProfitabilityTable clients={metrics.clientMetrics} />
      </div>
    </Card>
  );
};

export default ProfitabilityDashboard;
