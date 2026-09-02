export const unstable_cache: <A extends unknown[], R>(
  fn: (...args: A) => R,
  keyParts?: string[],
  options?: { revalidate?: number | false; tags?: string[] },
) => (...args: A) => R = (fn) => fn;
