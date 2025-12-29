const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'db.js');
let content = fs.readFileSync(dbPath, 'utf8');

// Fix line 139 - getQueuedOrders
content = content.replace(
    /const rows = db\.prepare\('SELECT \* FROM orders_offline WHERE status = 'queued''\)\.all\(\);/,
    "const rows = db.prepare(`SELECT * FROM orders_offline WHERE status = 'queued'`).all();"
);

// Fix line 144 - markOrderSynced  
content = content.replace(
    /const update = db\.prepare\('UPDATE orders_offline SET status = 'synced' WHERE id = \?'\);/,
    "const update = db.prepare(`UPDATE orders_offline SET status = 'synced' WHERE id = ?`);"
);

fs.writeFileSync(dbPath, content);
console.log('Fixed SQL quotes in db.js');
