// Opening-stock reset. Defaults to EVA; --stock-type=injection selects injection.
// Dry-run by default; --apply commits atomically.
// Backups use BSON Extended JSON to preserve ObjectIds and dates for recovery.
const fs = require('fs');
const path = require('path');
const assert = require('assert/strict');
const crypto = require('crypto');
const mongoose = require('mongoose');
const { EJSON } = require('bson');
require('dotenv').config({ path: path.join(__dirname, '../.env'), quiet: true });

const encode = value => EJSON.stringify(value, { relaxed: false });
const digest = value => crypto.createHash('sha256').update(encode(value)).digest('hex');
const stockType = process.argv.find(arg => arg.startsWith('--stock-type='))?.split('=')[1] || 'eva';
assert(['eva', 'injection'].includes(stockType), 'Supported stock types: eva, injection');
const isTarget = p => String(p.stockType || '').trim().toLowerCase() === stockType;

async function main() {
  assert(process.env.MONGO_URI, 'MONGO_URI is required');
  await mongoose.connect(process.env.MONGO_URI, { autoIndex: false, serverSelectionTimeoutMS: 15000 });
  const db = mongoose.connection.db;
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const before = {};
      // Sequential reads: MongoDB transactions do not support parallel operations.
      for (const name of ['products', 'salaryentries', 'histories', 'challans']) {
        before[name] = await db.collection(name).find({}, { session }).sort({ _id: 1 }).toArray();
      }
      const targets = before.products.filter(isTarget);
      assert(targets.length, `No ${stockType} products found; refusing to run`);
      const ids = targets.map(p => p._id);
      const idSet = new Set(ids.map(String));
      const related = d => idSet.has(String(d.product));
      const groups = {};
      for (const p of targets) {
        const key = p.gender || '(unspecified)';
        groups[key] = (groups[key] || 0) + 1;
      }
      const summary = {
        stockType, products: targets.length, activeProducts: targets.filter(p => p.isDeleted === false).length,
        categories: groups, salaryEntries: before.salaryentries.filter(related).length,
        historyEntries: before.histories.filter(related).length,
        salaryCartons: before.salaryentries.filter(related).reduce((s, e) => s + (e.cartons || 0), 0),
        nonzeroHistoryEntries: before.histories.filter(d => related(d) && d.quantityChanged).length,
        storedCartons: targets.reduce((s, p) => s + (p.cartons || 0), 0),
        storedPairs: targets.reduce((s, p) => s + (p.totalPairs || 0), 0)
      };
      console.log(JSON.stringify({ mode: process.argv.includes('--apply') ? 'APPLY' : 'DRY RUN', ...summary }));
      if (!process.argv.includes('--apply')) return;

      const resetAt = new Date();
      const backupDir = path.join(__dirname, '../uploads/stock-reset-backups');
      fs.mkdirSync(backupDir, { recursive: true });
      const backupPath = path.join(backupDir, `${stockType}-${resetAt.toISOString().replace(/[:.]/g, '-')}.ejson`);
      const backup = {
        resetAt, database: db.databaseName, summary,
        products: targets, salaryentries: before.salaryentries.filter(related),
        histories: before.histories.filter(related)
      };
      const fd = fs.openSync(backupPath, 'wx');
      try { fs.writeFileSync(fd, encode(backup)); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
      assert.equal(digest(EJSON.parse(fs.readFileSync(backupPath, 'utf8'))), digest(backup));
      console.log(`Verified backup: ${backupPath}`);

      await db.collection('products').updateMany({ _id: { $in: ids } }, {
        $set: { cartons: 0, totalPairs: 0, cartonsChallanedOut: 0 }
      }, { session });
      await db.collection('salaryentries').updateMany({ product: { $in: ids } }, {
        $set: { cartons: 0, totalPairs: 0 }
      }, { session });
      // Both old production and old dispatch quantities must stop contributing.
      // Preserve history records/metadata and original challan documents.
      await db.collection('histories').updateMany({ product: { $in: ids } }, {
        $set: { quantityChanged: 0 }
      }, { session });

      for (const name of Object.keys(before)) {
        const actual = await db.collection(name).find({}, { session }).sort({ _id: 1 }).toArray();
        const expected = before[name].map(doc => {
          if (name === 'products' && idSet.has(String(doc._id))) {
            return { ...doc, cartons: 0, totalPairs: 0, cartonsChallanedOut: 0 };
          }
          if (name === 'salaryentries' && related(doc)) return { ...doc, cartons: 0, totalPairs: 0 };
          if (name === 'histories' && related(doc)) return { ...doc, quantityChanged: 0 };
          return doc;
        });
        assert.equal(digest(actual), digest(expected), `${name}: unexpected change; aborting transaction`);
      }
      console.log(`Verified every product, salary entry, history and challan: only intended ${stockType} quantities changed.`);
    }, { readConcern: { level: 'snapshot' }, writeConcern: { w: 'majority' } });

    if (process.argv.includes('--apply')) {
      // Exercise the real table controller after commit, including live recalculation.
      const { getOptimizedProducts } = require('../controllers/optimizedProductController');
      let response;
      await getOptimizedProducts({ query: { stockType, export: 'true', limit: '50000' } }, {
        json: body => { response = body; }, status: () => ({ json: body => { response = body; } })
      });
      assert(response?.success && response.products.length > 0, 'Table verification failed');
      assert(response.products.length === response.total, 'Not all table rows verified');
      assert(response.products.every(p => p.cartons === 0 && p.totalPairs === 0), `Nonzero ${stockType} table quantity`);
      console.log(JSON.stringify({ committed: true, stockType, tableRowsVerified: response.products.length, cartons: 0, totalPairs: 0 }));
    }
  } finally {
    await session.endSession();
    await mongoose.disconnect();
  }
}

main().catch(error => {
  // Avoid logging connection strings or credentials from driver error objects.
  console.error(`Reset failed (${error.name}): ${String(error.message).replace(/mongodb(?:\+srv)?:\/\/\S+/g, '[REDACTED]')}`);
  process.exitCode = 1;
  mongoose.disconnect();
});
