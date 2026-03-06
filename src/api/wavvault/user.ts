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
    const result = await writeUserWavvault(req.body);
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
