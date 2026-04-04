import { MarketSignal, DNAGap, ResonanceHistory, StrategicDirective } from '../types/dashboard';

class MarketSignalService {
  private apiKeys: Record<string, string> = {};

  setApiKey(provider: string, key: string) {
    this.apiKeys[provider] = key;
  }

  async fetchSignals(userId: string): Promise<MarketSignal[]> {
    // In a real app, this would call external APIs using the stored keys.
    // For now, we'll simulate high-fidelity signals based on the user's "Spark".
    // This is the "Signal Ingestor" infrastructure.

    // Simulate a delay for "scanning"
    await new Promise((resolve) => setTimeout(resolve, 1500));

    return [
      {
        id: 'sig-1',
        title: 'Senior AI Product Strategist',
        company: 'Neural Dynamics',
        location: 'Remote / San Francisco',
        salary: '$180k - $240k',
        resonanceScore: 94,
        dnaAlignment: {
          values: 98,
          capabilities: 92,
          trajectory: 95,
        },
        tags: ['AI', 'Product Strategy', 'High Growth'],
        timestamp: new Date().toISOString(),
        source: 'Adzuna',
        url: '#',
      },
      {
        id: 'sig-2',
        title: 'Head of Innovation',
        company: 'Spark Systems',
        location: 'New York, NY',
        salary: '$200k+',
        resonanceScore: 88,
        dnaAlignment: {
          values: 85,
          capabilities: 90,
          trajectory: 89,
        },
        tags: ['Innovation', 'Leadership', 'Systems Thinking'],
        timestamp: new Date().toISOString(),
        source: 'LinkedIn',
        url: '#',
      },
      {
        id: 'sig-3',
        title: 'Principal Solutions Architect',
        company: 'FutureFlow',
        location: 'Austin, TX',
        salary: '$190k - $220k',
        resonanceScore: 82,
        dnaAlignment: {
          values: 80,
          capabilities: 85,
          trajectory: 81,
        },
        tags: ['Architecture', 'Cloud', 'Scalability'],
        timestamp: new Date().toISOString(),
        source: 'Indeed',
        url: '#',
      },
    ];
  }

  async getDNAGaps(userId: string): Promise<DNAGap[]> {
    return [
      {
        skill: 'Generative AI Architecture',
        currentLevel: 65,
        targetLevel: 90,
        importance: 'critical',
        learningPath: [
          { title: 'Advanced LLM Fine-tuning', provider: 'DeepLearning.AI', url: '#' },
          { title: 'AI Systems Design', provider: 'Stanford Online', url: '#' },
        ],
      },
      {
        skill: 'Strategic Stakeholder Management',
        currentLevel: 80,
        targetLevel: 95,
        importance: 'high',
        learningPath: [
          { title: 'Executive Presence for Leaders', provider: 'LinkedIn Learning', url: '#' },
        ],
      },
      {
        skill: 'Market Resonance Analysis',
        currentLevel: 45,
        targetLevel: 85,
        importance: 'medium',
        learningPath: [{ title: 'Competitive Intelligence', provider: 'Coursera', url: '#' }],
      },
    ];
  }

  async getResonanceHistory(userId: string): Promise<ResonanceHistory[]> {
    const industries = ['AI & Machine Learning', 'FinTech', 'HealthTech'];
    const now = new Date();

    return industries.map((industry) => ({
      industry,
      dataPoints: Array.from({ length: 6 }).map((_, i) => ({
        timestamp: new Date(now.getTime() - (5 - i) * 7 * 24 * 60 * 60 * 1000).toISOString(),
        score: 60 + Math.random() * 35,
      })),
    }));
  }

  async getStrategicDirectives(userId: string): Promise<StrategicDirective[]> {
    return [
      {
        id: 'dir-1',
        title: 'Immediate Pivot: AI Strategy',
        content:
          'Your DNA shows 94% resonance with AI Product Strategy. Shift your focus from general product management to AI-native roles.',
        priority: 'immediate',
        type: 'pivot',
        action: 'Update LinkedIn Headline to "AI Product Strategist"',
        timestamp: new Date().toISOString(),
        status: 'active',
      },
      {
        id: 'dir-2',
        title: 'Capability Upgrade: LLM Architecture',
        content:
          'To unlock the $200k+ salary bracket, you must bridge the gap in LLM system design. Start the Stanford AI Systems course.',
        priority: 'high',
        type: 'capability',
        action: 'Enroll in "AI Systems Design" course',
        timestamp: new Date().toISOString(),
        status: 'active',
      },
      {
        id: 'dir-3',
        title: 'Market Positioning: Thought Leadership',
        content:
          'Your "Spark" is unique in the FinTech space. Begin publishing your insights on LinkedIn to build market velocity.',
        priority: 'medium',
        type: 'positioning',
        action: 'Draft first post on "AI in FinTech Evolution"',
        timestamp: new Date().toISOString(),
        status: 'active',
      },
    ];
  }
}

export const marketSignalService = new MarketSignalService();
