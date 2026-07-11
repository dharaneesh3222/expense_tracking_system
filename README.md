# FinTrack - Smart SaaS Expense Management 🚀

[![Live Demo](https://img.shields.io/badge/Live_Demo-View_Project-blue?style=for-the-badge)](https://fintrack-by-dv.vercel.app/)

FinTrack is a full-stack, cloud-based personal finance SaaS application designed to help users intelligently track their expenses, set specific category budgets, and save towards custom financial goals. 

With a premium glassmorphism UI, a robust Node.js backend, and a secure Firebase Firestore database, FinTrack is built for scale, speed, and real-world utility.

## 🌟 Key Features

* **Multi-User Architecture:** Fully secure authentication system ensuring absolute data isolation between different users.
* **Smart Dashboard:** Comprehensive high-level overview of income, expenses, and net balance with responsive dynamic charts.
* **Category Budgets:** Set specific monthly spending limits on granular categories (Food, Travel, Bills, etc.) with real-time visual progress bars.
* **Savings Goals:** Create custom goals (e.g., "New Laptop") with target dates, target amounts, and visual tracking.
* **PDF Reporting:** Automatically generate and export beautiful summary reports of your monthly or yearly finances.
* **Dynamic Global Preferences:** Switch between global currencies (₹, $, €, £) from your settings page, instantly re-rendering all charts and values.
* **Dark/Light Mode:** Built-in seamless theme toggling saved to your local preferences.

## 🛠️ Tech Stack

### Frontend
* **HTML5 & CSS3:** Vanilla CSS featuring modern flexbox/grid layouts, CSS variables, and glassmorphism styling.
* **Vanilla JavaScript:** Fast, dependency-free DOM manipulation, local storage session caching, and modular API service integrations.
* **Chart.js:** For interactive and dynamic data visualization.

### Backend
* **Node.js & Express:** Lightweight, high-performance REST API.
* **Vercel Serverless Functions:** Backend seamlessly compiles to Vercel's serverless infrastructure.

### Database
* **Firebase Firestore (Admin SDK):** Scalable NoSQL database ensuring persistent storage of users, transactions, budgets, and goals.

## 🚀 Live Demo

**Check out the live application here:** [https://fintrack-by-dv.vercel.app/](https://fintrack-by-dv.vercel.app/)

## 💻 Local Development Setup

If you wish to run or modify this project locally, follow these steps:

### 1. Clone the repository
```bash
git clone https://github.com/dharaneesh3222/expense_tracking_system.git
cd expense_tracking_system
```

### 2. Set up the Backend
1. Navigate to the backend directory:
```bash
cd backend
npm install
```
2. You will need a Firebase Service Account key. Go to your Firebase Console -> Project Settings -> Service Accounts -> Generate New Private Key.
3. Rename the downloaded file to `serviceAccountKey.json` and place it in the `backend/` directory. (Ensure this file is in your `.gitignore`!)
4. Start the backend server:
```bash
node server.js
```

### 3. Set up the Frontend
1. Open a new terminal window and navigate to the frontend directory:
```bash
cd frontend
```
2. Start a local server (e.g., using `npx serve` or Live Server):
```bash
npx serve
```
3. Open your browser and navigate to the localhost port provided by your server.

## 🏗️ Deployment Architecture

This project is configured for one-click monolithic deployment on **Vercel**. 
The `vercel.json` at the root automatically handles:
- Routing all static traffic to the `frontend/` directory.
- Rewriting all `/api/*` requests to the Node.js Express serverless functions located in `backend/server.js`.
- Security is maintained by keeping Firebase credentials inside Vercel's secure Environment Variables (`FIREBASE_SERVICE_ACCOUNT`).

---
*Designed and built with precision to make personal finance tracking elegant and effortless.*
