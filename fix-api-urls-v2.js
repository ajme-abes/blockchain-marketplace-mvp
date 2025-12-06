// fix-api-urls-v2.js
// Script to replace hardcoded localhost URLs with environment variables
// Handles nested template literals correctly

const fs = require('fs');
const path = require('path');

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

    // Pattern 1: 'http://localhost:5000/api' in single quotes
    const pattern1 = /'http:\/\/localhost:5000\/api'/g;
    if (pattern1.test(content)) {
        content = content.replace(pattern1, "(import.meta.env.VITE_API_URL || 'http://localhost:5000/api')");
        modified = true;
    }

    // Pattern 2: "http://localhost:5000/api" in double quotes
    const pattern2 = /"http:\/\/localhost:5000\/api"/g;
    if (pattern2.test(content)) {
        content = content.replace(pattern2, "(import.meta.env.VITE_API_URL || 'http://localhost:5000/api')");
        modified = true;
    }

    // Pattern 3: 'http://localhost:5000' (without /api) in single quotes
    const pattern3 = /'http:\/\/localhost:5000'(?!\/api)/g;
    if (pattern3.test(content)) {
        content = content.replace(pattern3, "(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000')");
        modified = true;
    }

    // Pattern 4: "http://localhost:5000" (without /api) in double quotes
    const pattern4 = /"http:\/\/localhost:5000"(?!\/api)/g;
    if (pattern4.test(content)) {
        content = content.replace(pattern4, "(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000')");
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
