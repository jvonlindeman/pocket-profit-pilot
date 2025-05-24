
/**
 * ApiRequestManager - Gestiona las peticiones API para prevenir duplicados y mejorar el rendimiento
 */
class ApiRequestManager {
  private activeRequests = new Map<string, Promise<any>>();
  private requestCooldowns = new Map<string, number>();
  private lastRequestTimes = new Map<string, number>();
  
  /**
   * Ejecuta una petición con deduplicación y cooldown
   */
  async executeRequest<T>(
    key: string,
    requestFn: () => Promise<T>,
    ttl: number = 30000, // 30 segundos por defecto
    cooldown: number = 5000 // 5 segundos entre requests
  ): Promise<T> {
    const now = Date.now();
    
    // Verificar cooldown
    const lastRequestTime = this.lastRequestTimes.get(key) || 0;
    const timeSinceLastRequest = now - lastRequestTime;
    
    if (timeSinceLastRequest < cooldown) {
      console.log(`[API_REQUEST_MANAGER] Request ${key} en cooldown, esperando ${cooldown - timeSinceLastRequest}ms`);
      throw new Error(`Request too frequent. Wait ${cooldown - timeSinceLastRequest}ms`);
    }
    
    // Verificar si hay una petición activa para esta key
    if (this.activeRequests.has(key)) {
      console.log(`[API_REQUEST_MANAGER] Reutilizando request activo para ${key}`);
      return this.activeRequests.get(key)!;
    }
    
    // Crear nueva petición
    console.log(`[API_REQUEST_MANAGER] Iniciando nueva petición ${key}`);
    this.lastRequestTimes.set(key, now);
    
    const requestPromise = requestFn()
      .finally(() => {
        // Limpiar la petición activa después del TTL
        setTimeout(() => {
          this.activeRequests.delete(key);
        }, ttl);
      });
    
    this.activeRequests.set(key, requestPromise);
    return requestPromise;
  }
  
  /**
   * Limpia una entrada específica de caché
   */
  clearCacheEntry(key: string): void {
    this.activeRequests.delete(key);
    this.requestCooldowns.delete(key);
    this.lastRequestTimes.delete(key);
    console.log(`[API_REQUEST_MANAGER] Cache entry cleared for ${key}`);
  }
  
  /**
   * Limpia una petición específica
   */
  clearRequest(key: string): void {
    this.activeRequests.delete(key);
    this.requestCooldowns.delete(key);
    this.lastRequestTimes.delete(key);
  }
  
  /**
   * Limpia todas las peticiones
   */
  clearAllRequests(): void {
    this.activeRequests.clear();
    this.requestCooldowns.clear();
    this.lastRequestTimes.clear();
  }
  
  /**
   * Obtiene el estado de las peticiones activas
   */
  getActiveRequestsStatus(): Record<string, any> {
    return {
      activeRequests: Array.from(this.activeRequests.keys()),
      cooldowns: Object.fromEntries(this.requestCooldowns),
      lastRequestTimes: Object.fromEntries(this.lastRequestTimes)
    };
  }
}

export const apiRequestManager = new ApiRequestManager();
