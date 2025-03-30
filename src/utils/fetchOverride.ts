const getCsrfToken = (): string | null => {
  if (typeof window !== 'undefined') {
    const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  }
  return null;
};

const isSameOrigin = (url: RequestInfo | URL): boolean => {
  const parsedUrl = new URL(
    url instanceof Request ? url.url : url.toString(),
    window.location.origin
  );
  return parsedUrl.origin === window.location.origin;
};

// We are using a custom fetch implementation to add the X-XSRF-TOKEN heade
// to all requests. This is required when CSRF protection is enabled.
if (typeof window !== 'undefined') {
  const originalFetch: typeof fetch = window.fetch;

  (window as typeof globalThis).fetch = async (
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> => {
    if (!isSameOrigin(input)) {
      return originalFetch(input, init);
    }

    const csrfToken = getCsrfToken();

    const headers = {
      ...(init?.headers || {}),
      ...(csrfToken ? { 'XSRF-TOKEN': csrfToken } : {}),
    };

    const newInit: RequestInit = {
      ...init,
      headers,
    };

    return originalFetch(input, newInit);
  };
}

export {};
