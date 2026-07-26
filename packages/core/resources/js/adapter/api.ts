import type {
  RequestPayload,
  VisitHelperOptions,
} from '@inertiajs/core';
import { router } from '@inertiajs/react';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
type ApiPayload = unknown;

export interface ApiRequestOptions {
  headers?: HeadersInit;
  signal?: AbortSignal;
}

export type ApiInertiaOptions = VisitHelperOptions & {
  inertia: true;
};

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly errors: Record<string, string[]> = {},
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function csrfToken(): string {
  return document
    .querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
    ?.content ?? '';
}

function isInertiaOptions(
  options: ApiRequestOptions | ApiInertiaOptions | undefined,
): options is ApiInertiaOptions {
  return options !== undefined
    && 'inertia' in options
    && options.inertia;
}

async function request<T>(
  method: HttpMethod,
  url: string,
  data?: ApiPayload,
  options: ApiRequestOptions = {},
): Promise<T> {
  const isFormData = data instanceof FormData;
  const headers = new Headers(options.headers);

  headers.set('Accept', 'application/json');
  headers.set('X-CSRF-TOKEN', csrfToken());
  if (data !== undefined && !isFormData) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    method,
    headers,
    credentials: 'same-origin',
    signal: options.signal,
    body: data === undefined
      ? undefined
      : isFormData
        ? data
        : JSON.stringify(data),
  });
  const contentType = response.headers.get('content-type') ?? '';
  const payload = contentType.includes('application/json')
    ? await response.json() as unknown
    : undefined;

  if (!response.ok) {
    const errorPayload = payload as {
      message?: string;
      errors?: Record<string, string[]>;
    } | undefined;

    throw new ApiError(
      errorPayload?.message ?? `Request failed with status ${response.status}.`,
      response.status,
      errorPayload?.errors,
    );
  }

  return payload as T;
}

function withoutInertiaFlag(
  options: ApiInertiaOptions,
): VisitHelperOptions {
  const { inertia: _inertia, ...visitOptions } = options;
  return visitOptions;
}

function get<T>(
  url: string,
  options?: ApiRequestOptions,
): Promise<T> {
  return request<T>('GET', url, undefined, options);
}

function post<T>(
  url: string,
  data: ApiPayload,
  options?: ApiRequestOptions,
): Promise<T>;
function post(
  url: string,
  data: RequestPayload,
  options: ApiInertiaOptions,
): void;
function post<T>(
  url: string,
  data: ApiPayload,
  options?: ApiRequestOptions | ApiInertiaOptions,
): Promise<T> | void {
  if (isInertiaOptions(options)) {
    router.post(url, data as RequestPayload, withoutInertiaFlag(options));
    return;
  }

  return request<T>('POST', url, data, options);
}

function put<T>(
  url: string,
  data: ApiPayload,
  options?: ApiRequestOptions,
): Promise<T>;
function put(
  url: string,
  data: RequestPayload,
  options: ApiInertiaOptions,
): void;
function put<T>(
  url: string,
  data: ApiPayload,
  options?: ApiRequestOptions | ApiInertiaOptions,
): Promise<T> | void {
  if (isInertiaOptions(options)) {
    router.put(url, data as RequestPayload, withoutInertiaFlag(options));
    return;
  }

  return request<T>('PUT', url, data, options);
}

function patch<T>(
  url: string,
  data: ApiPayload,
  options?: ApiRequestOptions,
): Promise<T>;
function patch(
  url: string,
  data: RequestPayload,
  options: ApiInertiaOptions,
): void;
function patch<T>(
  url: string,
  data: ApiPayload,
  options?: ApiRequestOptions | ApiInertiaOptions,
): Promise<T> | void {
  if (isInertiaOptions(options)) {
    router.patch(url, data as RequestPayload, withoutInertiaFlag(options));
    return;
  }

  return request<T>('PATCH', url, data, options);
}

function remove<T>(
  url: string,
  options?: ApiRequestOptions,
): Promise<T>;
function remove(
  url: string,
  options: ApiInertiaOptions,
): void;
function remove<T>(
  url: string,
  options?: ApiRequestOptions | ApiInertiaOptions,
): Promise<T> | void {
  if (isInertiaOptions(options)) {
    router.delete(url, withoutInertiaFlag(options));
    return;
  }

  return request<T>('DELETE', url, undefined, options);
}

export const api = {
  get,
  post,
  put,
  patch,
  delete: remove,
};
