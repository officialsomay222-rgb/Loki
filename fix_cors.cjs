const fs = require('fs');
let content = fs.readFileSync('api/index.ts', 'utf8');

const startIdx = content.indexOf('const defaultOrigins');
const endBracketsIdx = content.indexOf('}));', startIdx) + 4;

if (startIdx !== -1 && endBracketsIdx !== -1) {
  content = content.substring(0, startIdx) + 'app.use(cors());\n' + content.substring(endBracketsIdx);
  fs.writeFileSync('api/index.ts', content);
  console.log('Fixed CORS');
} else {
  console.log('Could not find CORS configuration to fix');
}
