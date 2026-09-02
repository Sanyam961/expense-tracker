-- Drop tables if they exist
DROP TABLE IF EXISTS expenses;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;

-- Create Users Table
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    monthly_budget DECIMAL(10, 2) DEFAULT 0
);

-- Create Categories Table
CREATE TABLE categories (
    category_id SERIAL PRIMARY KEY,
    category_name VARCHAR(50) UNIQUE NOT NULL
);

-- Create Expenses Table
CREATE TABLE expenses (
    expense_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES categories(category_id) ON DELETE SET NULL,
    amount DECIMAL(10, 2) NOT NULL,
    date DATE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert Sample Categories
INSERT INTO categories (category_name) VALUES 
('Food & Dining'),
('Travel & Commute'),
('Study Materials'),
('Entertainment'),
('Rent & Utilities'),
('Health & Fitness'),
('Miscellaneous');

-- Sample Data for Users (Password here is 'password123' hashed with bcrypt for example purposes in real app, inserting raw here just as placeholder)
-- INSERT INTO users (name, email, password, monthly_budget) VALUES ('John Doe', 'john@example.com', 'hashed_pwd', 500.00);

-- Sample Data for Expenses
-- INSERT INTO expenses (user_id, category_id, amount, date, description) VALUES (1, 1, 25.50, '2023-10-01', 'Lunch at cafeteria');
