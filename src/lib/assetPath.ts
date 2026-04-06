export function withBaseUrl(assetPath: string): string {
  const normalizedPath = assetPath.replace(/^\/+/, '');
  return `${import.meta.env.BASE_URL}${normalizedPath}`;
}
