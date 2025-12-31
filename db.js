const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

let db;

function initDb() {
    const { app } = require('electron');
    if (!app) {
        console.error('CRITICAL: Electron app module is undefined in db.js initDb!');
    }
    const isDev = !app.isPackaged;
    const dbFolder = isDev ? path.join(process.cwd(), 'data') : app.getPath('userData');
    const dbPath = path.join(dbFolder, 'pos_offline.db');

    console.log('Opening Database at:', dbPath);
    db = new Database(dbPath, { verbose: console.log });
    db.pragma('journal_mode = WAL');
    db.pragma('synchronous = NORMAL');

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
            data TEXT,
            FOREIGN KEY(category_id) REFERENCES categories(id)
        );

        CREATE TABLE IF NOT EXISTS orders_offline (
            id TEXT PRIMARY KEY,
            data TEXT,
            status TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

    try {
        db.exec(`ALTER TABLE items ADD COLUMN data TEXT`);
    } catch (e) { }

    console.log('Local SQLite Database Initialized');
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
                role: user.role || user.roleData?.name || 'staff',
                password_hash: user.password,
                passcode_hash: user.passcode,
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

const syncMenu = (categories, items, tenantId) => {
    console.log(`[DB] Syncing menu for tenant ${tenantId}: ${categories.length} categories, ${items.length} items`);

    // We disable foreign keys temporarily because DELETE/REPLACE operations
    // can trigger immediate FK violations even if the parent is restored in the same transaction.
    db.pragma('foreign_keys = OFF');

    try {
        const transaction = db.transaction(() => {
            // Clear existing data for this tenant
            db.prepare('DELETE FROM items WHERE tenant_id = ?').run(tenantId);
            db.prepare('DELETE FROM categories WHERE tenant_id = ?').run(tenantId);

            const insertCat = db.prepare('INSERT OR REPLACE INTO categories (id, name, image, tenant_id) VALUES (?, ?, ?, ?)');
            const insertItem = db.prepare('INSERT OR REPLACE INTO items (id, name, price, category_id, image, tenant_id, data) VALUES (?, ?, ?, ?, ?, ?, ?)');

            for (const cat of categories) {
                insertCat.run(cat.id, cat.name, cat.image || cat.icon, tenantId);
            }

            for (const item of items) {
                // Determine category_id, ensuring it exists in the categories we just inserted
                // This is a safety check to prevent orphans in items table
                const categoryId = item.categoryId || item.Category?.id;
                const categoryExists = categories.some(c => c.id === categoryId);

                if (categoryExists || !categoryId) {
                    insertItem.run(
                        item.id,
                        item.name,
                        item.price,
                        categoryId,
                        item.image,
                        tenantId,
                        JSON.stringify(item)
                    );
                } else {
                    console.warn(`[DB] Skipping item ${item.name} due to missing category ${categoryId}`);
                }
            }
        });

        transaction();
        console.log('[DB] Menu sync successful');
    } catch (error) {
        console.error('[DB] Menu sync failed:', error);
        throw error;
    } finally {
        db.pragma('foreign_keys = ON');
    }
};

const getLocalMenu = (tenantId) => {
    const categories = db.prepare('SELECT * FROM categories WHERE tenant_id = ?').all(tenantId);
    const rawItems = db.prepare('SELECT * FROM items WHERE tenant_id = ?').all(tenantId);
    const items = rawItems.map(row => row.data ? JSON.parse(row.data) : { id: row.id, name: row.name, price: row.price, categoryId: row.category_id, image: row.image });
    return { categories, items };
};

const saveOrder = (order, status = 'queued') => {
    db.prepare('INSERT OR REPLACE INTO orders_offline (id, data, status) VALUES (?, ?, ?)').run(order.id || order._tempId, JSON.stringify(order), status);
};

const getQueuedOrders = () => db.prepare(`SELECT * FROM orders_offline WHERE status = 'queued'`).all().map(r => JSON.parse(r.data));
const markOrderSynced = (id) => db.prepare(`UPDATE orders_offline SET status = 'synced' WHERE id = ?`).run(id);
const deleteLocalOrder = (id) => db.prepare('DELETE FROM orders_offline WHERE id = ?').run(id);
const getAllLocalOrders = () => db.prepare(`SELECT * FROM orders_offline ORDER BY created_at DESC LIMIT 50`).all().map(r => ({ ...JSON.parse(r.data), status: r.status }));

module.exports = {
    initDb,
    saveUsers,
    verifyLocalLogin,
    syncMenu,
    getLocalMenu,
    saveOrder,
    deleteLocalOrder,
    getQueuedOrders,
    markOrderSynced,
    getAllLocalOrders
};
