import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Synthetic Methodology Generator
 * Generates training data (JSONL format) for fine-tuning Skylar 
 * on the Philip Lobkowicz coaching methodology.
 */
export class MethodologyGenerator {
  private model = "gemini-1.5-pro";

  /**
   * Generates a set of coaching dialogues based on a specific career scenario.
   */
  async generateDialogue(scenario: string): Promise<any[]> {
    const prompt = `
      Generate 5 realistic coaching dialogues between Philip Lobkowicz (Strategic Coach) and a client.
      Scenario: ${scenario}
      
      Philip's Methodology:
      - Focus on "Career DNA" (core attributes).
      - Use the "Five Stories" framework for branding.
      - Strategic, slightly provocative, "tough love" tone.
      - High-fidelity, data-driven advice.
      
      Output Format: JSON array of objects with "input" (client) and "output" (Philip).
    `;

    try {
      const response = await ai.models.generateContent({
        model: this.model,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: { responseMimeType: "application/json" }
      });

      const data = JSON.parse(response.text);
      return data;
    } catch (error) {
      console.error("[GENERATOR ERROR]", error);
      return [];
    }
  }

  /**
   * Generates a full training set for a list of scenarios.
   */
  async generateTrainingSet(scenarios: string[]): Promise<string> {
    let trainingSet = "";
    
    for (const scenario of scenarios) {
      const dialogues = await this.generateDialogue(scenario);
      for (const dialogue of dialogues) {
        // Vertex AI Fine-tuning format (JSONL)
        const entry = {
          contents: [
            { role: "user", parts: [{ text: dialogue.input }] },
            { role: "model", parts: [{ text: dialogue.output }] }
          ]
        };
        trainingSet += JSON.stringify(entry) + "\n";
      }
    }
    
    return trainingSet;
  }
}

export const methodologyGenerator = new MethodologyGenerator();
