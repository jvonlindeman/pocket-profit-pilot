
import React, { ReactNode, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon, ChevronDown, ChevronUp } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

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
  expandable?: boolean;
  expandedContent?: ReactNode;
  onToggle?: (expanded: boolean) => void;
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
  tooltip,
  expandable = false,
  expandedContent,
  onToggle
}) => {
  const isMobile = useIsMobile();
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Determine text size based on the valueSize prop and mobile state
  const textSizeClass = isMobile
    ? valueSize === 'large' ? 'text-2xl' : 'text-xl'
    : valueSize === 'small' 
      ? 'text-xl' 
      : valueSize === 'large' 
        ? 'text-3xl' 
        : 'text-2xl';

  // Use prop-based color or default based on icon color
  const finalValueColor = valueColor || iconColor;

  const handleToggle = () => {
    if (!expandable) return;
    
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    onToggle?.(newExpanded);
  };

  return (
    <Card className="finance-card" title={tooltip}>
      <CardContent className={isMobile ? "p-4" : "p-6"}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-500 truncate pr-2">{title}</h3>
          <div className="flex items-center gap-2">
            <div className={`p-2 ${iconBgColor} rounded-full`}>
              <Icon className={`h-4 w-4 ${iconColor}`} />
            </div>
            {expandable && (
              <button
                onClick={handleToggle}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                aria-label={isExpanded ? "Colapsar detalles" : "Expandir detalles"}
              >
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                )}
              </button>
            )}
          </div>
        </div>
        <div className={`${textSizeClass} font-bold ${finalValueColor} ${animate ? 'animate-value' : ''}`}>
          {value}
          {subtitle && <div className="text-sm mt-1 text-gray-500">{subtitle}</div>}
        </div>
        {additionalContent}
        
        {/* Expanded content */}
        {expandable && isExpanded && expandedContent && (
          <div className="animate-fade-in">
            {expandedContent}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default React.memo(SummaryCard);
