import apiClient from './apiClient';
import { Product } from '../types';
import { responseNormalizer } from './responseNormalizer';

export const productService = {
  /**
   * Obtiene la lista de productos
   */
  async getProducts(search?: string): Promise<Product[]> {
    const params = search ? { search } : {};
    const response = await apiClient.get('/advisor/products', { params });
    return responseNormalizer.normalizeArrayResponse<Product>(response.data, ["products", "data", "items"]);
  },

  /**
   * Obtiene el detalle o preview de un producto
   */
  async getProductPreview(productId: string): Promise<Product> {
    const response = await apiClient.get(`/advisor/product-preview/${productId}`);
    return responseNormalizer.normalizeObjectResponse<Product>(response.data, ["product", "data"])!;
  }
};
