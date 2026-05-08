
async function testProxy() {
  try {
    const url = 'http://localhost:3000/api/bootstrap/config/metadata/skylar_global';
    console.log('Fetching:', url);
    const response = await fetch(url);
    console.log('Status:', response.status);
    const text = await response.text();
    console.log('Response body:', text);
  } catch (err) {
    console.error('Fetch error:', err.message);
  }
}

testProxy();
