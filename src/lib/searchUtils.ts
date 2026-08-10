/**
 * Parsea un string de búsqueda en tokens (palabras).
 * Ejemplo: "cable 12 thhn" -> ["cable", "12", "thhn"]
 * Retorna las condiciones necesarias para Prisma OR/AND.
 */
export function buildSearchTokenConditions(query: string, fields: string[]) {
  if (!query || typeof query !== "string") return undefined;
  
  const tokens = query.trim().split(/\s+/).filter(t => t.length > 0);
  if (tokens.length === 0) return undefined;

  return {
    AND: tokens.map((token) => ({
      OR: fields.map((field) => ({
        [field]: { contains: token, mode: 'insensitive' }
      }))
    }))
  };
}
