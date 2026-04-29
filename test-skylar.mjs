import http from 'http';

const postData = JSON.stringify({
  userId: "user123",
  stageId: "some-stage",
  message: "Test message"
});

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/skylar/chat-journey',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('STATUS:', res.statusCode, 'BODY:', data));
});

req.on('error', (e) => console.error(e));
req.write(postData);
req.end();
