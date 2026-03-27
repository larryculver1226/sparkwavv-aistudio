import { searchSimilarWavvaults } from '../../services/wavvaultService';

/**
 * Next.js API Route for Wavvault Vector Search
 * GET /api/wavvault/search?q=...&limit=...
 */
export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { q, limit } = req.query;

  if (!q || typeof q !== 'string') {
    return res.status(400).json({ error: 'Query string "q" is required' });
  }

  try {
    // In a real implementation, we'd get tenantId from session/auth
    const tenantId = req.headers['x-tenant-id'] || 'sparkwavv';
    const result = await searchSimilarWavvaults(q, tenantId as string, limit ? parseInt(limit as string) : 5);
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
