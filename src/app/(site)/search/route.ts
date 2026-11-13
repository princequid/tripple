import { normaliseSearchTerm, searchPath } from '@/lib/search-term';

/** GET /search?q= → 308 /search/:term (BR-38, A-13). An empty term goes to the explore feed. */
export function GET(req: Request) {
  const url = new URL(req.url);
  const term = normaliseSearchTerm(url.searchParams.get('q') ?? '');
  return Response.redirect(new URL(term ? searchPath(term) : '/shots/popular', url), 308);
}
