import fs from 'fs';

const rawBin = fs.readFileSync('test_audio_raw.bin');
console.log('Size:', rawBin.length);

// Try making a WAV out of it.
const sampleRate = 24000;
const numChannels = 1;
const bitsPerSample = 16;
const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
const blockAlign = (numChannels * bitsPerSample) / 8;

const pcmBytes = rawBin;
const buffer = new ArrayBuffer(44 + pcmBytes.length);
const view = new DataView(buffer);

view.setUint32(0, 0x52494646, false); // "RIFF"
view.setUint32(4, 36 + pcmBytes.length, true);
view.setUint32(8, 0x57415645, false); // "WAVE"
view.setUint32(12, 0x666d7420, false); // "fmt "
view.setUint32(16, 16, true);
view.setUint16(20, 1, true);
view.setUint16(22, numChannels, true);
view.setUint32(24, sampleRate, true);
view.setUint32(28, byteRate, true);
view.setUint16(32, blockAlign, true);
view.setUint16(34, bitsPerSample, true);
view.setUint32(36, 0x64617461, false); // "data"
view.setUint32(40, pcmBytes.length, true);

const out = new Uint8Array(buffer, 44);
// Test unswapped:
out.set(pcmBytes);

fs.writeFileSync('test_unswapped.wav', Buffer.from(buffer));

// Test swapped:
const swappedBuffer = new ArrayBuffer(44 + pcmBytes.length);
const swappedView = new DataView(swappedBuffer);
// copy header
new Uint8Array(swappedBuffer).set(new Uint8Array(buffer).slice(0, 44));

const swappedOut = new Uint8Array(swappedBuffer, 44);
for (let i = 0; i < pcmBytes.length; i += 2) {
  if (i + 1 < pcmBytes.length) {
    swappedOut[i] = pcmBytes[i + 1];
    swappedOut[i + 1] = pcmBytes[i];
  } else {
    swappedOut[i] = pcmBytes[i];
  }
}

fs.writeFileSync('test_swapped.wav', Buffer.from(swappedBuffer));

console.log('done');
