import { writeUserWavvault } from '../../services/wavvaultService';

/**
 * Next.js API Route for Wavvault User Data
 * POST /api/wavvault/user
 */
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // In a real implementation, we'd get tenantId from session/auth
    const tenantId = req.headers['x-tenant-id'] || 'sparkwavv';
    const result = await writeUserWavvault({
      ...req.body,
      tenantId: req.body.tenantId || tenantId,
    });
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
