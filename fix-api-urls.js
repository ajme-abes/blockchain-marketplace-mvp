// fix-api-urls.js
// Script to replace hardcoded localhost URLs with environment variables

const fs = require('fs');
const path = require('path');

const API_VAR = "import.meta.env.VITE_API_URL || 'http://localhost:5000/api'";
const BACKEND_VAR = "import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'";

function getAllFiles(dirPath, arrayOfFiles = []) {
    const files = fs.readdirSync(dirPath);

    files.forEach(file => {
        const filePath = path.join(dirPath, file);
        if (fs.statSync(filePath).isDirectory()) {
            arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
        } else if (filePath.match(/\.(ts|tsx)$/)) {
            arrayOfFiles.push(filePath);
        }
    });

    return arrayOfFiles;
}

function fixFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Pattern 1: fetch('http://localhost:5000/api/...
    const pattern1 = /fetch\('http:\/\/localhost:5000\/api\//g;
    if (pattern1.test(content)) {
        content = content.replace(pattern1, `fetch(\`\${${API_VAR}}/`);
        modified = true;
    }

    // Pattern 2: fetch("http://localhost:5000/api/...
    const pattern2 = /fetch\("http:\/\/localhost:5000\/api\//g;
    if (pattern2.test(content)) {
        content = content.replace(pattern2, `fetch(\`\${${API_VAR}}/`);
        modified = true;
    }

    // Pattern 3: fetch(`http://localhost:5000/api/...
    const pattern3 = /fetch\(`http:\/\/localhost:5000\/api\//g;
    if (pattern3.test(content)) {
        content = content.replace(pattern3, `fetch(\`\${${API_VAR}}/`);
        modified = true;
    }

    // Pattern 4: const BACKEND_URL = 'http://localhost:5000';
    const pattern4 = /const BACKEND_URL = 'http:\/\/localhost:5000';/g;
    if (pattern4.test(content)) {
        content = content.replace(pattern4, `const BACKEND_URL = ${BACKEND_VAR};`);
        modified = true;
    }

    // Pattern 5: const API_URL = 'http://localhost:5000/api'
    const pattern5 = /const API_URL = 'http:\/\/localhost:5000\/api'/g;
    if (pattern5.test(content)) {
        content = content.replace(pattern5, `const API_URL = ${API_VAR}`);
        modified = true;
    }

    if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ Fixed: ${filePath}`);
        return 1;
    }

    return 0;
}

// Main execution
const srcDir = path.join(__dirname, 'frontend', 'src');
const files = getAllFiles(srcDir);
let count = 0;

console.log(`Found ${files.length} TypeScript files`);
console.log('Fixing hardcoded URLs...\n');

files.forEach(file => {
    count += fixFile(file);
});

console.log(`\n✅ Fixed ${count} files`);
