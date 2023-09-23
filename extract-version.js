const fs = require('fs');

const packageJson = fs.readFileSync('./package.json', 'utf-8');
const version = JSON.parse(packageJson).version;

console.log(version);