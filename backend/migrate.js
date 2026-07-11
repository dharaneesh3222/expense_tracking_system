const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');

const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
if (!fs.existsSync(serviceAccountPath)) {
    console.error("FATAL ERROR: serviceAccountKey.json is missing!");
    process.exit(1);
}

const serviceAccount = require('./serviceAccountKey.json');

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

const migrate = async () => {
    try {
        console.log('Connecting to Firebase...');

        console.log('Reading users.json...');
        const usersFile = path.join(__dirname, 'users.json');
        if (fs.existsSync(usersFile)) {
            const usersData = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
            for (const user of usersData) {
                // To keep old IDs working, we set the document ID to the old ID
                const userRef = db.collection('users').doc(user.id);
                const userDoc = await userRef.get();
                if (!userDoc.exists) {
                    await userRef.set({
                        email: user.email,
                        password: user.password,
                        username: user.username || null,
                        avatar: user.avatar || null
                    });
                    console.log(`Imported user: ${user.email}`);
                }
            }
        }

        console.log('Reading transactions.json...');
        const txFile = path.join(__dirname, 'transactions.json');
        if (fs.existsSync(txFile)) {
            const txData = JSON.parse(fs.readFileSync(txFile, 'utf8'));
            for (const tx of txData) {
                const txRef = db.collection('transactions').doc(tx.id);
                const txDoc = await txRef.get();
                if (!txDoc.exists) {
                    await txRef.set({
                        userId: tx.userId || 'unknown', // Fallback to 'unknown' if missing
                        amount: tx.amount,
                        type: tx.type,
                        category: tx.category,
                        date: tx.date,
                        note: tx.note || ''
                    });
                    console.log(`Imported transaction: ${tx.id}`);
                }
            }
        }

        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
};

migrate();
