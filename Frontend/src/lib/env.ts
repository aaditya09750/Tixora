function required(name: string, value: string | undefined): string {
  if (!value || value.trim() === '') {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function normalizeBaseUrl(url: string): string {
  return url.trim().replace(/\/+$/, '');
}

export const env = {
  apiUrl: normalizeBaseUrl(required('VITE_API_URL', import.meta.env.VITE_API_URL)),
  mode: import.meta.env.MODE as 'development' | 'production' | 'test',
} as const;
