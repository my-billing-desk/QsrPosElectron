const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');
const bcrypt = require('bcryptjs');

// Store DB in user data folder
const dbPath = path.join(app.getPath('userData'), 'pos_offline.db');
const db = new Database(dbPath);

// Initialize Tables
function initDb() {
    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY,
            username TEXT,
            display_name TEXT,
            role TEXT,
            password_hash TEXT,
            passcode_hash TEXT,
            tenant_id TEXT,
            tenant_name TEXT
        );

        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY,
            name TEXT,
            image TEXT,
            tenant_id TEXT
        );

        CREATE TABLE IF NOT EXISTS items (
            id INTEGER PRIMARY KEY,
            name TEXT,
            price REAL,
            category_id INTEGER,
            image TEXT,
            tenant_id TEXT,
            FOREIGN KEY(category_id) REFERENCES categories(id)
        );

        CREATE TABLE IF NOT EXISTS orders_offline (
            id TEXT PRIMARY KEY,
            data TEXT, -- JSON blob
            status TEXT, -- 'queued', 'synced'
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);
    console.log('Local SQLite Database Initialized at:', dbPath);
}

// User Helpers
const saveUsers = (users) => {
    const insert = db.prepare(`
        INSERT OR REPLACE INTO users (id, username, display_name, role, password_hash, passcode_hash, tenant_id, tenant_name)
        VALUES (@id, @username, @display_name, @role, @password_hash, @passcode_hash, @tenant_id, @tenant_name)
    `);
    const transaction = db.transaction((userList) => {
        for (const user of userList) {
            insert.run({
                id: user.id,
                username: user.username,
                display_name: user.displayName || user.name,
                role: user.role,
                password_hash: user.password, // This should be the hash from backend
                passcode_hash: user.passcode, // This should be the hash from backend
                tenant_id: user.tenantId,
                tenant_name: user.tenantName || ''
            });
        }
    });
    transaction(users);
};

const verifyLocalLogin = async (credentials) => {
    const { username, password, passcode, tenantId } = credentials;

    if (passcode) {
        const users = db.prepare('SELECT * FROM users WHERE tenant_id = ?').all(tenantId);
        for (const user of users) {
            if (user.passcode_hash && await bcrypt.compare(passcode, user.passcode_hash)) {
                return formatUserResponse(user);
            }
        }
    } else if (username && password) {
        const user = db.prepare('SELECT * FROM users WHERE (username = ? OR id = ?) AND tenant_id = ?').get(username, username, tenantId);
        if (user && await bcrypt.compare(password, user.password_hash)) {
            return formatUserResponse(user);
        }
    }
    return null;
};

function formatUserResponse(user) {
    return {
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.display_name,
        tenantId: user.tenant_id,
        tenantName: user.tenant_name
    };
}

// Menu Helpers
const syncMenu = (categories, items, tenantId) => {
    const deleteItems = db.prepare('DELETE FROM items WHERE tenant_id = ?');
    const deleteCats = db.prepare('DELETE FROM categories WHERE tenant_id = ?');

    const insertCat = db.prepare('INSERT INTO categories (id, name, image, tenant_id) VALUES (?, ?, ?, ?)');
    const insertItem = db.prepare('INSERT INTO items (id, name, price, category_id, image, tenant_id) VALUES (?, ?, ?, ?, ?, ?)');

    const transaction = db.transaction(() => {
        deleteItems.run(tenantId);
        deleteCats.run(tenantId);

        for (const cat of categories) {
            insertCat.run(cat.id, cat.name, cat.image, tenantId);
        }
        for (const item of items) {
            insertItem.run(item.id, item.name, item.price, item.categoryId, item.image, tenantId);
        }
    });
    transaction();
};

const getLocalMenu = (tenantId) => {
    const categories = db.prepare('SELECT * FROM categories WHERE tenant_id = ?').all(tenantId);
    const items = db.prepare('SELECT * FROM items WHERE tenant_id = ?').all(tenantId);
    return { categories, items };
};

// Order Helpers
const saveOrder = (order) => {
    const insert = db.prepare('INSERT INTO orders_offline (id, data, status) VALUES (?, ?, ?)');
    insert.run(order.id || order._tempId, JSON.stringify(order), 'queued');
};

const getQueuedOrders = () => {
    const rows = db.prepare('SELECT * FROM orders_offline WHERE status = "queued"').all();
    return rows.map(r => JSON.parse(r.data));
};

const markOrderSynced = (id) => {
    const update = db.prepare('UPDATE orders_offline SET status = "synced" WHERE id = ?');
    update.run(id);
};

module.exports = {
    initDb,
    saveUsers,
    verifyLocalLogin,
    syncMenu,
    getLocalMenu,
    saveOrder,
    getQueuedOrders,
    markOrderSynced
};
