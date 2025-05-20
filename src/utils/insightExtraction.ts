
/**
 * Extracts key insights from assistant responses
 * @param content The content from which to extract insights
 * @returns Array of extracted insights as strings
 */
export const extractInsights = (content: string): string[] => {
  const insights: string[] = [];
  
  // Split content into paragraphs
  const paragraphs = content.split('\n\n');
  
  // Look for insights in paragraphs that contain numbers, percentages, or financial terms
  paragraphs.forEach(paragraph => {
    if (
      (paragraph.includes('$') || paragraph.includes('%') || 
       paragraph.includes('USD') || paragraph.includes('euros')) && 
      (paragraph.includes('aument') || paragraph.includes('disminu') || 
       paragraph.includes('tendencia') || paragraph.includes('comparaci') || 
       paragraph.includes('históric') || paragraph.includes('análisis') ||
       paragraph.includes('crecimiento') || paragraph.includes('reducción') ||
       paragraph.includes('estacional') || paragraph.includes('trimestre') ||
       paragraph.includes('margen'))
    ) {
      insights.push(paragraph.trim());
    }
  });
  
  return insights;
};
