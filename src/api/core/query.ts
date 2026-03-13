export type QueryPrimitive = string | number | boolean | null | undefined;
export type QueryValue = QueryPrimitive | QueryPrimitive[];
export type QueryParams = Record<string, QueryValue>;

export function appendQueryParams(url: URL, query?: QueryParams): URL {
  if (!query) {
    return url;
  }

  for (const [key, value] of Object.entries(query)) {
    if (value == null) {
      continue;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item != null) {
          url.searchParams.append(key, String(item));
        }
      });
      continue;
    }

    url.searchParams.set(key, String(value));
  }

  return url;
}
