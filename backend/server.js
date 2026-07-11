require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');

let serviceAccount;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} else {
    const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
    if (!fs.existsSync(serviceAccountPath)) {
        console.error("FATAL ERROR: serviceAccountKey.json is missing and FIREBASE_SERVICE_ACCOUNT env var is not set!");
        process.exit(1);
    }
    serviceAccount = require('./serviceAccountKey.json');
}

// Initialize Firebase
initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();
db.settings({ preferRest: true }); // Forces HTTP/1.1 to fix proxy hanging issues

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Auth endpoints
app.post('/api/register', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'Missing credentials' });

        const usersRef = db.collection('users');
        const snapshot = await usersRef.where('email', '==', email).get();
        if (!snapshot.empty) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        const newUserRef = usersRef.doc();
        const newUser = {
            email,
            password,
            username: null,
            avatar: null,
            budget: 5000,
            createdAt: FieldValue.serverTimestamp()
        };
        
        await newUserRef.set(newUser);
        res.status(201).json({ id: newUserRef.id, email, username: null, avatar: null, budget: 5000 });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const usersRef = db.collection('users');
        const snapshot = await usersRef.where('email', '==', email).where('password', '==', password).get();
        
        if (snapshot.empty) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const userDoc = snapshot.docs[0];
        const userData = userDoc.data();
        
        res.json({ id: userDoc.id, email: userData.email, username: userData.username, avatar: userData.avatar, budget: userData.budget || 5000 });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET current user profile
app.get('/api/user', async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userData = userDoc.data();
        res.json({ id: userDoc.id, email: userData.email, username: userData.username, avatar: userData.avatar, budget: userData.budget || 5000 });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.put('/api/user', async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const { email, password, username, avatar, budget, currency, categoryBudgets } = req.body;
        if (!email) return res.status(400).json({ error: 'Email is required' });

        const usersRef = db.collection('users');
        const snapshot = await usersRef.where('email', '==', email).get();
        
        const existingUser = snapshot.docs.find(doc => doc.id !== userId);
        if (existingUser) {
            return res.status(400).json({ error: 'Email already in use' });
        }

        const updateData = { email };
        if (password) updateData.password = password;
        if (username !== undefined) updateData.username = username;
        if (avatar !== undefined) updateData.avatar = avatar;
        if (budget !== undefined) updateData.budget = Number(budget);
        if (currency !== undefined) updateData.currency = currency;
        if (categoryBudgets !== undefined) updateData.categoryBudgets = categoryBudgets;

        const userRef = db.collection('users').doc(userId);
        await userRef.update(updateData);
        
        const updatedDoc = await userRef.get();
        const updatedData = updatedDoc.data();

        res.json({ 
            id: updatedDoc.id, 
            email: updatedData.email, 
            username: updatedData.username, 
            avatar: updatedData.avatar, 
            budget: updatedData.budget,
            currency: updatedData.currency || '₹',
            categoryBudgets: updatedData.categoryBudgets || {} 
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ==================== GOALS ENDPOINTS ====================

// GET all goals
app.get('/api/goals', async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const snapshot = await db.collection('goals').where('userId', '==', userId).get();
        const goals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        res.json(goals);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST new goal
app.post('/api/goals', async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const { title, targetAmount, savedAmount, deadline } = req.body;
        
        if (!title || !targetAmount) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const newGoalData = {
            userId,
            title,
            targetAmount: Number(targetAmount),
            savedAmount: Number(savedAmount || 0),
            deadline: deadline || null,
            createdAt: FieldValue.serverTimestamp()
        };

        const goalRef = await db.collection('goals').add(newGoalData);
        res.status(201).json({ id: goalRef.id, ...newGoalData });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT update goal
app.put('/api/goals/:id', async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const { id } = req.params;
        const { title, targetAmount, savedAmount, deadline } = req.body;
        
        const goalRef = db.collection('goals').doc(id);
        const goalDoc = await goalRef.get();
        
        if (!goalDoc.exists || goalDoc.data().userId !== userId) {
            return res.status(404).json({ error: 'Goal not found or unauthorized' });
        }

        const updateData = {};
        if (title !== undefined) updateData.title = title;
        if (targetAmount !== undefined) updateData.targetAmount = Number(targetAmount);
        if (savedAmount !== undefined) updateData.savedAmount = Number(savedAmount);
        if (deadline !== undefined) updateData.deadline = deadline;

        await goalRef.update(updateData);
        
        const updatedDoc = await goalRef.get();
        res.json({ id: updatedDoc.id, ...updatedDoc.data() });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE goal
app.delete('/api/goals/:id', async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const { id } = req.params;
        const goalRef = db.collection('goals').doc(id);
        const goalDoc = await goalRef.get();
        
        if (!goalDoc.exists || goalDoc.data().userId !== userId) {
            return res.status(404).json({ error: 'Goal not found or unauthorized' });
        }

        await goalRef.delete();
        res.json({ message: 'Goal deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET all transactions
app.get('/api/transactions', async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const snapshot = await db.collection('transactions').where('userId', '==', userId).get();
        const transactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        res.json(transactions);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST new transaction
app.post('/api/transactions', async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const { amount, type, category, date, note, paymentMethod } = req.body;
        
        if (!amount || !type || !category || !date) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const newTxData = {
            userId,
            amount: Number(amount),
            type,
            category,
            date,
            paymentMethod: paymentMethod || 'cash',
            note: note || '',
            createdAt: FieldValue.serverTimestamp()
        };

        const txRef = await db.collection('transactions').add(newTxData);
        
        res.status(201).json({ id: txRef.id, ...newTxData });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT update transaction
app.put('/api/transactions/:id', async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const { id } = req.params;
        const { amount, type, category, date, note, paymentMethod } = req.body;
        
        const txRef = db.collection('transactions').doc(id);
        const txDoc = await txRef.get();
        
        if (!txDoc.exists || txDoc.data().userId !== userId) {
            return res.status(404).json({ error: 'Transaction not found or unauthorized' });
        }

        const updateData = {};
        if (amount !== undefined) updateData.amount = Number(amount);
        if (type) updateData.type = type;
        if (category) updateData.category = category;
        if (date) updateData.date = date;
        if (note !== undefined) updateData.note = note;
        if (paymentMethod) updateData.paymentMethod = paymentMethod;

        await txRef.update(updateData);
        
        const updatedDoc = await txRef.get();
        res.json({ id: updatedDoc.id, ...updatedDoc.data() });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE transaction
app.delete('/api/transactions/:id', async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const { id } = req.params;
        const txRef = db.collection('transactions').doc(id);
        const txDoc = await txRef.get();
        
        if (!txDoc.exists || txDoc.data().userId !== userId) {
            return res.status(404).json({ error: 'Transaction not found or unauthorized' });
        }

        await txRef.delete();
        res.json({ message: 'Transaction deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;
