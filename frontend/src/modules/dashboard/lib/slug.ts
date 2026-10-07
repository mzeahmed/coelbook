// slugify mirrors the API's slug.Make (api/internal/slug): lowercase ASCII,
// accents stripped, any other run of characters turned into one dash.
// "Redémarrer le service" → "redemarrer-le-service".
export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Mn}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
