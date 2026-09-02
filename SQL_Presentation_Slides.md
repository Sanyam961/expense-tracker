# Slide 1: Title Slide
**Title:** Student Expense Tracker - Database Architecture
**Subtitle:** A deep dive into SQL operations, schema design, and data management in Node.js
**Presenter:** [Your Name]

---

# Slide 2: Relational Database Design
**Title:** The Foundation: Database Schema
*   **Description:** Our application uses PostgreSQL to store structured, relational data across three main tables.
*   **Tables:**
    1.  `users`: Stores user identity and authentication data.
    2.  `categories`: A lookup table for expense types (Food, Travel, Study, etc.).
    3.  `expenses`: The core transaction table linking users, categories, amounts, and dates.
*   **Data Integrity:** We use `PRIMARY KEY` to uniquely identify rows and `FOREIGN KEY` to link tables together.

---

# Slide 3: User Authentication Queries (Register)
**Title:** Creating Users (INSERT)
*   **Purpose:** Securely registering a new student.
*   **SQL Query:**
    ```sql
    INSERT INTO users (name, email, password) 
    VALUES ($1, $2, $3) 
    RETURNING user_id, name, email;
    ```
*   **Breakdown:** 
    *   `INSERT INTO`: The command to add a new row.
    *   `$1, $2, $3`: Parameterized inputs to prevent SQL Injection attacks.
    *   `RETURNING`: Immediately sends the newly created user data back to the server so they can be logged in instantly.

---

# Slide 4: User Authentication Queries (Login)
**Title:** Authenticating Users (SELECT)
*   **Purpose:** Verifying credentials when a student attempts to log in.
*   **SQL Query:**
    ```sql
    SELECT * FROM users WHERE email = $1;
    ```
*   **Breakdown:** 
    *   Finds the specific user by their unique email.
    *   The server then securely compares the typed password against the hashed password returned by this query.

---

# Slide 5: Expense Management - Creating
**Title:** Adding an Expense (INSERT)
*   **Purpose:** Saving a new financial transaction to the database.
*   **SQL Query:**
    ```sql
    INSERT INTO expenses (user_id, category_id, amount, date, description) 
    VALUES ($1, $2, $3, $4, $5) 
    RETURNING *;
    ```
*   **Breakdown:** 
    *   Requires the `user_id` (so we know who bought it) and `category_id` (so we know what type of expense it is).
    *   `RETURNING *` allows the frontend UI to instantly display the new expense without reloading the page.

---

# Slide 6: Complex Queries - Fetching Dashboard Data
**Title:** Reading & Joining Data (SELECT & JOIN)
*   **Purpose:** Displaying a student's tracking dashboard with human-readable categories.
*   **SQL Query:**
    ```sql
    SELECT e.expense_id, e.amount, e.date, e.description, c.category_name 
    FROM expenses e 
    JOIN categories c ON e.category_id = c.category_id 
    WHERE e.user_id = $1 
    ORDER BY e.date DESC;
    ```
*   **Breakdown:** 
    *   `JOIN`: Combines the `expenses` and `categories` tables so we see "Food" instead of category ID "1".
    *   `WHERE user_id = $1`: Crucial security step—ensures students only see their own private financial data.
    *   `ORDER BY ... DESC`: Sorts the records so the newest expenses appear at the top.

---

# Slide 7: Modifying Data (Update & Delete)
**Title:** Editing and Removing Records
*   **Update Purpose:** Fixing a typo or changing an expense amount.
    ```sql
    UPDATE expenses 
    SET category_id = $1, amount = $2, date = $3, description = $4 
    WHERE expense_id = $5 AND user_id = $6;
    ```
*   **Delete Purpose:** Removing an unwanted transaction.
    ```sql
    DELETE FROM expenses 
    WHERE expense_id = $1 AND user_id = $2;
    ```
*   **Security Priority:** Both queries mandate checking `user_id = $x` to guarantee a malicious user cannot edit or delete another student's record by guessing an `expense_id`.
