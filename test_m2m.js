const fs = require('fs');
const http = require('http');

http.get('http://localhost:3000/api/m2m/1', { headers: { Authorization: 'Bearer placeholder' } }, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('M2M 1:', data));
});
