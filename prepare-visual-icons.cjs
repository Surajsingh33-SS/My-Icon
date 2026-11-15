const fs = require('fs');
const path = require('path');

const source = path.join(__dirname, 'node_modules', 'lucide-static', 'icons');
const destination = path.join(__dirname, 'public', 'lucide-icons');
if (!fs.existsSync(source)) {
  throw new Error('Lucide SVG source folder was not found at node_modules/lucide-static/icons. Run npm install first.');
}
fs.mkdirSync(destination, { recursive: true });
const files = fs.readdirSync(source).filter(file => file.endsWith('.svg'));
for (const file of files) fs.copyFileSync(path.join(source, file), path.join(destination, file));
console.log('Prepared ' + files.length + ' Lucide SVGs for local visual categorization.');
