
import { FinanceContextType } from '@/contexts/FinanceContext';

/**
 * Generates suggested questions based on financial context
 * @param financeContext The current financial context
 * @returns Array of suggested questions as strings
 */
export const generateSuggestedQuestions = (financeContext: FinanceContextType): string[] => {
  // Basic suggestions always available
  const basicQuestions = [
    "¿Cómo están mis finanzas este mes comparado con el mes anterior?",
    "¿Cuáles son mis mayores gastos por categoría?",
    "¿Cómo ha evolucionado mi margen de beneficio en el último año?"
  ];
  
  // Context-aware suggestions
  const contextQuestions: string[] = [];
  
  // Profit margin suggestions
  if (financeContext.summary) {
    if (financeContext.summary.profitMargin < 15) {
      contextQuestions.push("¿Qué estrategias puedo implementar para mejorar mi margen de beneficio?");
    } else if (financeContext.summary.profitMargin > 40) {
      contextQuestions.push("¿Cómo puedo mantener mi alto margen de beneficio en los próximos meses?");
    }
  }
  
  // Stripe-related suggestions
  if (financeContext.stripeIncome > 0) {
    contextQuestions.push("¿Cómo han evolucionado las comisiones de Stripe en los últimos meses?");
  }
  
  // Collaborator expense suggestions
  if (financeContext.collaboratorExpenses.length > 3) {
    contextQuestions.push("¿Cuál es la tendencia de gastos en colaboradores durante el último año?");
  }
  
  // Historical analysis suggestions
  contextQuestions.push("¿Existen patrones estacionales en mis ingresos o gastos?");
  contextQuestions.push("¿Puedes identificar anomalías en mis datos financieros históricos?");
  
  // Income source analysis
  if (financeContext.regularIncome > 0 || financeContext.stripeIncome > 0) {
    contextQuestions.push("¿Cómo se distribuyen mis fuentes de ingresos a lo largo del tiempo?");
  }
  
  // Return a mix of context and basic questions, up to 5 total
  return [...contextQuestions, ...basicQuestions].slice(0, 5);
};
