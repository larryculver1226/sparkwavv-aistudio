import fetch from 'node-fetch';

async function test() {
  const res = await fetch('http://localhost:3000/api/skylar/chat-journey', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'custom-auth-bypass-test': 'realActor' },
    body: JSON.stringify({ userId: 'realActor', stageId: 'ignition', message: "hello" })
  });
  console.log(res.status);
  console.log(await res.text());
}
test();
