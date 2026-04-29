import { runJourneyStageFlow } from './backend/services/genkitService.js';

(async () => {
    try {
        console.log("Running flow...");
        const result = await runJourneyStageFlow({
          userId: "anonymous",
          stageId: "dive-in",
          message: "Hello",
          history: [],
          attachments: [],
          stageConfig: null,
          missingArtifacts: []
        });
        console.log("Result:", result);
    } catch(e) {
        console.error("Caught error:", e);
    }
})();
