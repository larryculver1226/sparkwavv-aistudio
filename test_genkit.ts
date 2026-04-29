import { runJourneyStageFlow } from './backend/services/genkitService.js';

async function test() {
  try {
    const res = await runJourneyStageFlow({ userId: 'realActor', stageId: 'ignition', message: "hello" });
    console.log(res);
  } catch (err) {
    console.error('ERROR OCCURRED:', err);
  }
}
test();
