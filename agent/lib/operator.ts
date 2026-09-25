export function getOperatorConfig() {
  const rawUrl =
    process.env.OPERATOR_BACKEND_URL ||
    process.env.OPERATOR_API_BASE_URL ||
    "https://operador.afinitive.com.pe";

  let baseUrl = rawUrl;
  let authHeader: string | null = null;

  try {
    const parsed = new URL(rawUrl);
    if (parsed.username || parsed.password) {
      const username = decodeURIComponent(parsed.username);
      const password = decodeURIComponent(parsed.password);
      const credentials = Buffer.from(`${username}:${password}`).toString(
        "base64"
      );
      authHeader = `Basic ${credentials}`;
      baseUrl = `${parsed.protocol}//${parsed.host}`;
    }
  } catch (e) {
    // fallback
  }

  const apiKey = process.env.OPERATOR_API_KEY;
  if (!authHeader && apiKey) {
    authHeader = `Bearer ${apiKey}`;
  }

  return { baseUrl, authHeader };
}

export async function operatorFetch(
  path: string,
  options: {
    method?: string;
    params?: Record<string, string | number | undefined>;
    body?: any;
    headers?: Record<string, string>;
  } = {}
) {
  const { baseUrl, authHeader } = getOperatorConfig();
  const url = new URL(path, baseUrl);

  if (options.params) {
    for (const [key, value] of Object.entries(options.params)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (authHeader) {
    headers["Authorization"] = authHeader;
  }

  const response = await fetch(url.toString(), {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(
      `Error en Operador (${response.status} ${response.statusText}): ${
        errorText || "Error desconocido"
      }`
    );
  }

  return await response.json();
}
