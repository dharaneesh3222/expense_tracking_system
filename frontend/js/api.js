const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://localhost:3000/api' 
    : '/api';

// Auth Guard Check
const checkAuth = () => {
    const p = window.location.pathname;
    const isAuthPage = p.includes('login') || p.includes('register');
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (!user && !isAuthPage) {
        // Also don't redirect if it's the landing page
        const isLandingPage = p === '/' || p.endsWith('index.html') || p.endsWith('index');
        if (!isLandingPage) {
            window.location.href = 'login.html';
        }
    } else if (user && isAuthPage) {
        window.location.href = 'dashboard.html';
    }
    return user ? user.id : null;
};

const getHeaders = () => {
    const headers = { 'Content-Type': 'application/json' };
    const userId = checkAuth();
    if (userId) {
        headers['x-user-id'] = userId;
    }
    return headers;
};

// User Endpoints
const registerUser = async (email, password) => {
    const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    
    const contentType = response.headers.get("content-type");
    if (!response.ok) {
        if (contentType && contentType.includes("application/json")) {
            const error = await response.json();
            throw new Error(error.error || 'Registration failed');
        } else {
            throw new Error('Server error: Please restart your backend server!');
        }
    }
    return await response.json();
};

const loginUser = async (email, password) => {
    const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    
    const contentType = response.headers.get("content-type");
    if (!response.ok) {
        if (contentType && contentType.includes("application/json")) {
            const error = await response.json();
            throw new Error(error.error || 'Login failed');
        } else {
            throw new Error('Server error: Please restart your backend server!');
        }
    }
    return await response.json();
};

const logoutUser = () => {
    localStorage.removeItem('user');
    window.location.href = 'login.html';
};

// Transaction Endpoints
const fetchTransactions = async () => {
    try {
        const response = await fetch(`${API_URL}/transactions`, { 
            headers: getHeaders(),
            cache: 'no-store' 
        });
        if (response.status === 401) return logoutUser();
        return await response.json();
    } catch (error) {
        console.error('Error fetching transactions:', error);
        return [];
    }
};

const addTransaction = async (data) => {
    try {
        const response = await fetch(`${API_URL}/transactions`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        if (response.status === 401) return logoutUser();
        return await response.json();
    } catch (error) {
        console.error('Error adding transaction:', error);
        throw error;
    }
};

const editTransaction = async (id, data) => {
    try {
        const response = await fetch(`${API_URL}/transactions/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        if (response.status === 401) return logoutUser();
        return await response.json();
    } catch (error) {
        console.error('Error editing transaction:', error);
        throw error;
    }
};

const deleteTransaction = async (id) => {
    try {
        const response = await fetch(`${API_URL}/transactions/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        if (response.status === 401) return logoutUser();
        return await response.json();
    } catch (error) {
        console.error('Error deleting transaction:', error);
        throw error;
    }
};

const getUser = async () => {
    const response = await fetch(`${API_URL}/user`, { headers: getHeaders() });
    if (!response.ok) {
        if (response.status === 401) return logoutUser();
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch user profile');
    }
    return await response.json();
};

const updateUser = async (data) => {
    const response = await fetch(`${API_URL}/user`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data)
    });
    if (!response.ok) {
        if (response.status === 401) return logoutUser();
        const error = await response.json();
        throw new Error(error.error || 'Failed to update user profile');
    }
    return await response.json();
};

// Goals Endpoints
const fetchGoals = async () => {
    try {
        const response = await fetch(`${API_URL}/goals`, { headers: getHeaders(), cache: 'no-store' });
        if (response.status === 401) return logoutUser();
        return await response.json();
    } catch (error) {
        console.error('Error fetching goals:', error);
        return [];
    }
};

const addGoal = async (data) => {
    try {
        const response = await fetch(`${API_URL}/goals`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        if (response.status === 401) return logoutUser();
        return await response.json();
    } catch (error) {
        console.error('Error adding goal:', error);
        throw error;
    }
};

const editGoal = async (id, data) => {
    try {
        const response = await fetch(`${API_URL}/goals/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        if (response.status === 401) return logoutUser();
        return await response.json();
    } catch (error) {
        console.error('Error editing goal:', error);
        throw error;
    }
};

const deleteGoal = async (id) => {
    try {
        const response = await fetch(`${API_URL}/goals/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        if (response.status === 401) return logoutUser();
        return await response.json();
    } catch (error) {
        console.error('Error deleting goal:', error);
        throw error;
    }
};

// Run check on script load
checkAuth();

window.api = { 
    registerUser, loginUser, logoutUser, getUser, updateUser, getHeaders,
    fetchTransactions, addTransaction, editTransaction, deleteTransaction,
    fetchGoals, addGoal, editGoal, deleteGoal
};
