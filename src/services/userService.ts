import { UserProfile } from '../types/user';

export const userService = {
  async fetchProfile(idToken: string): Promise<UserProfile | null> {
    const response = await fetch('/api/user/profile', {
      headers: { Authorization: `Bearer ${idToken}` },
    });

    if (response.ok) {
      return response.json();
    } else if (response.status === 404) {
      return null;
    }
    throw new Error('Failed to fetch user profile');
  },

  async fetchWavvaultStatus(idToken: string): Promise<boolean> {
    const response = await fetch('/api/user/wavvault-status', {
      headers: { Authorization: `Bearer ${idToken}` },
    });

    if (response.ok) {
      const { exists } = await response.json();
      return exists;
    }
    throw new Error('Failed to fetch Wavvault status');
  },

  async updateProfile(idToken: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    const response = await fetch('/api/user/profile', {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (response.ok) {
      return response.json();
    }
    throw new Error('Failed to update profile');
  },
};
