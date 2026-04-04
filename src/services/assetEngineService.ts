import { SynthesizedAsset, AssetShare, WavvaultData } from '../types/wavvault';
import { getAuth } from 'firebase/auth';

const getIdToken = async () => {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');
  return user.getIdToken();
};

export const analyzeDelta = async (
  currentData: WavvaultData
): Promise<{ suggestCommit: boolean; reason?: string; deltaSummary?: string }> => {
  const idToken = await getIdToken();
  const response = await fetch('/api/wavvault/analyze-delta', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(currentData),
  });
  if (!response.ok) throw new Error('Failed to analyze delta');
  return response.json();
};

export const fetchUserAssets = async (): Promise<SynthesizedAsset[]> => {
  const idToken = await getIdToken();
  const response = await fetch('/api/user-assets', {
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  });
  if (!response.ok) throw new Error('Failed to fetch assets');
  const data = await response.json();
  return data.assets;
};

export const lockAsset = async (
  asset: Omit<SynthesizedAsset, 'id' | 'userId' | 'isLocked' | 'createdAt'>
): Promise<{ success: boolean; assetId: string }> => {
  const idToken = await getIdToken();
  const response = await fetch('/api/user-assets/lock', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(asset),
  });
  if (!response.ok) throw new Error('Failed to lock asset');
  return response.json();
};

export const createShare = async (
  shareData: Omit<AssetShare, 'id' | 'userId' | 'accessKey' | 'viewCount' | 'createdAt'>
): Promise<{ success: boolean; shareId: string; accessKey: string }> => {
  const idToken = await getIdToken();
  const response = await fetch('/api/shares', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(shareData),
  });
  if (!response.ok) throw new Error('Failed to create share');
  return response.json();
};

export const fetchPublicShare = async (
  shareId: string,
  accessKey: string
): Promise<{ asset: SynthesizedAsset; brandingPersona: string; userName: string }> => {
  const response = await fetch(`/api/shares/public/${shareId}?key=${accessKey}`);
  if (!response.ok) throw new Error('Failed to fetch public share');
  return response.json();
};
