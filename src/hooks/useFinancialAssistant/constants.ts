
import { ChatMessage } from '@/types/chat';

export const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content: '¡Hola! Soy tu asistente financiero con acceso completo a tu historial de datos almacenados localmente y capacidades de búsqueda semántica avanzada. Puedo ayudarte a:\n\n• Analizar tus finanzas usando datos guardados localmente\n• Buscar transacciones específicas por descripción\n• Comparar períodos usando datos históricos almacenados\n• Responder preguntas sobre tu historial financiero completo\n\n¿En qué puedo ayudarte hoy?',
  timestamp: new Date(),
};
