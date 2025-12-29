const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'db.js');
let content = fs.readFileSync(dbPath, 'utf8');

// Replace curly quotes with straight quotes for SQL strings
content = content.replace(/WHERE status = "queued"/g, "WHERE status = 'queued'");
content = content.replace(/status = "synced"/g, "status = 'synced'");

fs.writeFileSync(dbPath, content);
console.log('Fixed SQL quotes in db.js');
