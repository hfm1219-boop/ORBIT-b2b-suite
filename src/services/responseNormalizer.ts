/**
 * Utilidades para normalizar respuestas de la API de Flask/Odoo
 * Permite que el frontend sea resiliente a cambios en la estructura de respuesta
 */
export const responseNormalizer = {
  /**
   * Normaliza una respuesta que se espera sea una lista de elementos
   */
  normalizeArrayResponse<T>(response: any, possibleKeys: string[] = ["data", "items", "customers", "orders", "messages", "actions"]): T[] {
    if (!response) return [];
    
    // Si la respuesta es un array directo
    if (Array.isArray(response)) return response;
    
    // Si es un objeto, buscar en las claves posibles
    if (typeof response === 'object') {
      // Caso especial para cuando viene dentro de una propiedad 'ok'
      const target = response.data || response;
      
      if (Array.isArray(target)) return target;
      
      for (const key of possibleKeys) {
        if (Array.isArray(target[key])) {
          return target[key];
        }
      }
    }
    
    return [];
  },

  /**
   * Normaliza una respuesta que se espera sea un objeto único
   */
  normalizeObjectResponse<T>(response: any, possibleKeys: string[] = ["data", "customer", "order", "message", "action"]): T | null {
    if (!response) return null;
    
    // Si es un objeto
    if (typeof response === 'object' && !Array.isArray(response)) {
      // Si el objeto tiene las propiedades deseadas pero no en la raíz
      for (const key of possibleKeys) {
        if (response[key] && typeof response[key] === 'object' && !Array.isArray(response[key])) {
          return response[key];
        }
      }
      
      // Si el objeto mismo parece ser la entidad (tiene id o claves esperadas)
      // O si es el objeto 'data'
      return response.data || response;
    }
    
    return null;
  },

  /**
   * Centraliza el manejo de errores de API
   */
  normalizeApiError(error: any): string {
    if (typeof error === 'string') return error;
    
    if (error?.response?.data?.error) {
      return error.response.data.error;
    }
    
    if (error?.message) {
      return error.message;
    }
    
    return "Error de conexión con el servidor";
  }
};
