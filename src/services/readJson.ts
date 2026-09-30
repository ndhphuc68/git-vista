/**
 * Reads a fetch response body as JSON, typed as `T`.
 *
 * `Response.json()` returns `any`, which silently switches off type checking
 * for everything read from it. This is the single place that accepts that
 * unchecked cast. Callers name the raw shape they expect (all-optional where
 * GitHub may omit a field) and keep their own runtime guards such as
 * `Array.isArray`.
 */
export async function readJson<T>(res: Response): Promise<T> {
  return (await res.json()) as T;
}
