const http = require('http');

setTimeout(() => {
  http.get('http://localhost:3000/', (res) => {
    let data = '';
    res.on('data', c => data += c);
    res.on('end', () => {
      const match = data.match(/window\.__ENV__[^;]*;/);
      if (match) console.log(match[0]);
      else console.log('No window.__ENV__ found');
    });
  }).on('error', err => console.log('Error:', err.message));
}, 2000);
