export interface UserData {
  onboarding: {
    firstName: string;
    lastName: string;
    jobTitle: string;
    companyOrg: string;
    email: string;
    phone: string;
    programTrack: string;
    lifecycleStage: string;
    outcomesAttributes: string;
    feedbackQuote: string;
    userId: string;
    password?: string;
    // Legacy fields for compatibility
    name: string;
    role: string;
    bio: string;
    industry: string;
  };
  accomplishments: { title: string; description: string }[];
  environment: {
    perfectDay: string;
    extinguishers: string[];
  };
  passions: {
    energizers: string[];
    bestWhen: string;
  };
  attributes: string[];
  tagline: string;
  brandImage?: string;
}

export async function generateBrandImage(
  prompt: string,
  base64Image?: string,
  mimeType?: string,
  size: '512px' | '1K' | '2K' | '4K' = '1K'
) {
  try {
    const res = await fetch('/api/ai/brand-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, base64Image, mimeType, size })
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return data.result;
  } catch (error) {
    console.error('API Error:', error);
    return null;
  }
}

export async function generateDiscoverySummary(userData: UserData) {
  try {
    const res = await fetch('/api/ai/discovery-summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userData })
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return data.result;
  } catch (error) {
    console.error('API Error:', error);
    return null;
  }
}

export async function generateCinematicManifesto(userData: UserData) {
  try {
    const res = await fetch('/api/ai/cinematic-manifesto', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userData })
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return data.result;
  } catch (error) {
    console.error('API Error:', error);
    return null;
  }
}

export async function parseResume(fileData: string, mimeType: string) {
  try {
    const res = await fetch('/api/ai/parse-resume', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileData, mimeType })
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return data.result;
  } catch (error) {
    console.error('API Error:', error);
    return null;
  }
}

export async function generateHomeBenefits(count: number = 5) {
  try {
    const res = await fetch('/api/ai/home-benefits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ count })
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return data.result;
  } catch (error) {
    console.error('API Error:', error);
    return null;
  }
}
