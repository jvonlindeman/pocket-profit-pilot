
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from 'lucide-react';

interface SummaryCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  iconColor: string;
  iconBgColor: string;
  subtitle?: string;
  additionalContent?: React.ReactNode;
}

const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  value,
  icon: Icon,
  iconColor,
  iconBgColor,
  subtitle,
  additionalContent
}) => {
  return (
    <Card className="finance-card">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-500">{title}</h3>
          <div className={`p-2 ${iconBgColor} rounded-full`}>
            <Icon className={`h-4 w-4 ${iconColor}`} />
          </div>
        </div>
        <div className={`text-2xl font-bold ${iconColor} animate-value`}>
          {value}
          {subtitle && <div className="text-sm mt-1 text-gray-500">{subtitle}</div>}
        </div>
        {additionalContent}
      </CardContent>
    </Card>
  );
};

export default SummaryCard;
