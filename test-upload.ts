import { VertexService } from './src/services/vertexService';
import fs from 'fs';

async function test() {
  const service = new VertexService();
  fs.writeFileSync('synthetic-training-data.jsonl', '{"test": "data"}\n');
  try {
    const uri = await service.uploadToGCS('test-file.jsonl', '{"test": "data"}\n');
    console.log('Success:', uri);
  } catch (e) {
    console.error('Failed:', e);
  }
}

test();
