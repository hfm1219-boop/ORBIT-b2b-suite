/**
 * Utilidad para normalizar identificadores de clientes
 * Maneja las inconsistencias entre customer_id, partner_id, customer_partner_id, etc.
 */
export const idNormalizer = {
  /**
   * Obtiene el ID del cliente de un objeto crudo, probando múltiples claves comunes
   */
  normalizeCustomerId(raw: any): string | null {
    if (!raw) return null;
    if (typeof raw === 'string') return raw;
    
    return (
      raw.customer_id || 
      raw.partner_id || 
      raw.customer_partner_id || 
      raw.id || 
      null
    );
  }
};
