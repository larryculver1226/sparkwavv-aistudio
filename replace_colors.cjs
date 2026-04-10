const fs = require('fs');
const path = './src/components/skylar/HighFidelitySynthesisLab.tsx';

let content = fs.readFileSync(path, 'utf8');

content = content.replace(/bg-\[#E4E3E0\]/g, 'bg-transparent');
content = content.replace(/text-\[#141414\]/g, 'text-white');
content = content.replace(/border-\[#141414\]/g, 'border-white/10');
content = content.replace(/bg-white/g, 'bg-white/5');
content = content.replace(/bg-\[#141414\]/g, 'bg-white/10');
content = content.replace(/text-\[#E4E3E0\]/g, 'text-white');
content = content.replace(/bg-\[#F5F5F0\]/g, 'bg-white/5');
content = content.replace(/border-2/g, 'border');

fs.writeFileSync(path, content);
console.log('Replaced colors in HighFidelitySynthesisLab.tsx');
