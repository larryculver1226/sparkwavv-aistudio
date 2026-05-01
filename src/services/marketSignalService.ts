import { MarketSignal, DNAGap, ResonanceHistory, StrategicDirective } from '../types/dashboard';

class MarketSignalService {
  private apiKeys: Record<string, string> = {};
  private cache: Record<string, any> = {};
  private fetchPromise: Record<string, Promise<any>> = {};

  setApiKey(provider: string, key: string) {
    this.apiKeys[provider] = key;
  }

  async getBentoData(userId: string) {
    if (this.cache[userId]) return this.cache[userId];
    if (this.fetchPromise[userId]) return this.fetchPromise[userId];

    this.fetchPromise[userId] = fetch(`/api/user/discovery-bento?userId=${userId}`)
      .then(res => res.json())
      .then(data => {
        this.cache[userId] = data;
        return data;
      })
      .catch(err => {
        console.error('Error fetching bento data:', err);
        return { signals: [], gaps: [], history: [] };
      })
      .finally(() => {
        delete this.fetchPromise[userId];
      });

    return this.fetchPromise[userId];
  }

  async fetchSignals(userId: string): Promise<MarketSignal[]> {
    const data = await this.getBentoData(userId);
    return data.signals || [];
  }

  async getDNAGaps(userId: string): Promise<DNAGap[]> {
    const data = await this.getBentoData(userId);
    return data.gaps || [];
  }

  async getResonanceHistory(userId: string): Promise<ResonanceHistory[]> {
    const data = await this.getBentoData(userId);
    return data.history || [];
  }

  async getStrategicDirectives(userId: string): Promise<StrategicDirective[]> {
    // This is currently mocked as we didn't add it to the bento endpoint schema
    return [
      {
        id: 'dir-1',
        title: 'Immediate Pivot: AI Strategy',
        content:
          'Your DNA shows high resonance with AI Product Strategy. Shift your focus from general product management to AI-native roles.',
        priority: 'immediate',
        type: 'pivot',
        action: 'Update LinkedIn Headline to reflect your focus',
        timestamp: new Date().toISOString(),
        status: 'active',
      }
    ];
  }
}

export const marketSignalService = new MarketSignalService();
