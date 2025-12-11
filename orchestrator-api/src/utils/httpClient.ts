// Shared HTTP client utility for orchestrator-api service clients

import axios, { AxiosError } from "axios";

export interface HttpClientConfig {
  baseURL: string;
  serviceName: string;
}

export interface ApiError extends Error {
  code: string;
}

/**
 * Creates a standardized error from axios errors
 */
function createApiError(
  error: any,
  defaultMessage: string,
  defaultCode: string
): ApiError {
  if (error.response) {
    const status = error.response.status;
    const message =
      error.response.data?.message ||
      error.message ||
      defaultMessage;

    const e = new Error(message) as ApiError;
    
    if (status === 404) {
      e.code = defaultCode.replace("_API_ERROR", "_NOT_FOUND");
    } else {
      e.code = defaultCode;
    }
    
    return e;
  }

  const e = new Error(defaultMessage) as ApiError;
  e.code = defaultCode;
  return e;
}

/**
 * Base HTTP client wrapper with standardized error handling
 */
export class HttpClient {
  private baseURL: string;
  private serviceName: string;

  constructor(config: HttpClientConfig) {
    this.baseURL = config.baseURL;
    this.serviceName = config.serviceName;
  }

  async get<T>(
    path: string,
    options?: { params?: Record<string, string> }
  ): Promise<T> {
    try {
      const url = `${this.baseURL}${path}`;
      const queryString = options?.params
        ? new URLSearchParams(options.params).toString()
        : "";
      const fullUrl = queryString ? `${url}?${queryString}` : url;

      const response = await axios.get<T>(fullUrl, {
        headers: { Accept: "application/json" }
      });
      return response.data;
    } catch (error: any) {
      const serviceCode = this.serviceName.toUpperCase().replace(/-/g, "_");
      throw createApiError(
        error,
        `Failed to fetch from ${this.serviceName}`,
        `${serviceCode}_API_ERROR`
      );
    }
  }
}
