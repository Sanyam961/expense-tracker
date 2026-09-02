# Student Expense Tracker Web App

## Folder Structure
```
student-expense-tracker/
├── backend/
│   ├── package.json
│   ├── server.js
│   ├── db.js
│   └── routes/
│       ├── auth.js
│       └── expenses.js
├── frontend/
│   ├── index.html
│   ├── login.html
│   ├── register.html
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── api.js
│       ├── auth.js
│       └── dashboard.js
├── database.sql
└── README.md
```

## Setup Instructions

### 1. Database Setup (PostgreSQL)
1. Install PostgreSQL and pgAdmin (optional) on your system.
2. Open your terminal or SQL client and create a new database:
   ```sql
   CREATE DATABASE expense_tracker;
   ```
3. Connect to the `expense_tracker` database and run the queries found in `database.sql` to create the tables and insert sample categories.

### 2. Backend Setup
1. Open a terminal and navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `backend` folder (or update `db.js` directly) with your PostgreSQL credentials:
   ```env
   DB_USER=postgres
   DB_PASSWORD=your_password
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=expense_tracker
   JWT_SECRET=supersecretkey
   PORT=5000
   ```
4. Start the backend server:
   ```bash
   npm start
   ```
   (Server should run on http://localhost:5000)

### 3. Frontend Setup
1. You can simply open `frontend/login.html` in your web browser, or use a tool like Live Server in VS Code.
2. Register a new user, log in, and start tracking expenses!
