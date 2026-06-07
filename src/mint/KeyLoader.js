const fs = require('fs');
const path = require('path');

function loadPrivateKeys() {
  const pkPath = path.join(process.cwd(), 'pk.txt');

  if (!fs.existsSync(pkPath)) {
    throw new Error('pk.txt not found. Please upload using /pk command.');
  }

  const content = fs.readFileSync(pkPath, 'utf8');

  return content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0 && !line.startsWith('#'));
}

module.exports = { loadPrivateKeys };