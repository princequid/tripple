import type { MetadataRoute } from 'next';

/** robots.txt (FR-87): APIs, auth and search result pages are not indexed. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/api/', '/login', '/signup', '/onboarding', '/search/'] }],
  };
}
