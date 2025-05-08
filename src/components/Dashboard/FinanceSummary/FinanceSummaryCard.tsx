
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { LucideIcon } from 'lucide-react';

interface FinanceSummaryCardProps {
  title: string;
  value: string | React.ReactNode;
  icon: LucideIcon;
  iconBgColor: string;
  iconTextColor: string;
  valueColor: string;
  badge?: {
    text: string;
    color: string;
    bgColor: string;
  };
  tooltip?: string;
  footer?: React.ReactNode;
}

const FinanceSummaryCard: React.FC<FinanceSummaryCardProps> = ({
  title,
  value,
  icon: Icon,
  iconBgColor,
  iconTextColor,
  valueColor,
  badge,
  tooltip,
  footer
}) => {
  const CardIcon = () => (
    <div className={`p-2 ${iconBgColor} rounded-full`}>
      <Icon className={`h-4 w-4 ${iconTextColor}`} />
    </div>
  );

  return (
    <TooltipProvider>
      <Card className={`finance-card ${badge ? 'border-amber-300 shadow-amber-100' : ''}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">
              {title}
              {badge && (
                <span className={`ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${badge.bgColor} ${badge.color}`}>
                  {badge.text}
                </span>
              )}
            </h3>
            
            {tooltip ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <CardIcon />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{tooltip}</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <CardIcon />
            )}
          </div>
          <div className={`text-2xl font-bold ${valueColor} animate-value`}>
            {value}
          </div>
          {footer && (
            <div className="mt-2">
              {footer}
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};

export default FinanceSummaryCard;
