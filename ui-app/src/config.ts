// src/config.ts

export const ORCHESTRATOR_BASE_URL =
  import.meta.env.VITE_ORCHESTRATOR_BASE_URL || 'http://localhost:4000';

export const INVENTORY_API_BASE_URL =
  import.meta.env.VITE_INVENTORY_API_URL || 'http://localhost:4001';

export const USER_API_BASE_URL = import.meta.env.VITE_USER_API_URL || 'http://localhost:4002';

export const PRICING_API_BASE_URL = import.meta.env.VITE_PRICING_API_URL || 'http://localhost:4003';

// Tek bir placeholder product görseli
export const PRODUCT_IMAGE =
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=60';
