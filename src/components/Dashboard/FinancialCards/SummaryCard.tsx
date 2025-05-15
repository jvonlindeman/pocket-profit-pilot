
import React, { ReactNode } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from 'lucide-react';

interface SummaryCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  iconColor: string;
  iconBgColor: string;
  subtitle?: string;
  additionalContent?: ReactNode;
  valueColor?: string;
  valueSize?: 'small' | 'medium' | 'large';
  animate?: boolean;
  tooltip?: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  value,
  icon: Icon,
  iconColor,
  iconBgColor,
  subtitle,
  additionalContent,
  valueColor,
  valueSize = 'medium',
  animate = true,
  tooltip
}) => {
  // Determine text size based on the valueSize prop
  const textSizeClass = valueSize === 'small' 
    ? 'text-xl' 
    : valueSize === 'large' 
      ? 'text-3xl' 
      : 'text-2xl';

  // Use prop-based color or default based on icon color
  const finalValueColor = valueColor || iconColor;

  return (
    <Card className="finance-card" title={tooltip}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-500">{title}</h3>
          <div className={`p-2 ${iconBgColor} rounded-full`}>
            <Icon className={`h-4 w-4 ${iconColor}`} />
          </div>
        </div>
        <div className={`${textSizeClass} font-bold ${finalValueColor} ${animate ? 'animate-value' : ''}`}>
          {value}
          {subtitle && <div className="text-sm mt-1 text-gray-500">{subtitle}</div>}
        </div>
        {additionalContent}
      </CardContent>
    </Card>
  );
};

export default React.memo(SummaryCard);
