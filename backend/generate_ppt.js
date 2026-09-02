const pptxgen = require('pptxgenjs');
const path = require('path');

let pres = new pptxgen();

// Setup Master Slide or Defaults
pres.layout = 'LAYOUT_16x9';

// Slide 1
let slide1 = pres.addSlide();
slide1.addText('SQL in Expense Tracker', { x: 1.5, y: 2.0, w: 7, h: 1, fontSize: 44, bold: true, align: 'center', color: '003366' });
slide1.addText('Detailed Query Explanation', { x: 1.5, y: 3.5, w: 7, h: 1, fontSize: 24, align: 'center', color: '666666' });

// Function to add a query slide
function addQuerySlide(title, query, explanationArr) {
    let slide = pres.addSlide();
    
    // Title
    slide.addText(title, { x: 0.5, y: 0.3, w: 9, h: 0.8, fontSize: 28, color: '003366', bold: true });
    
    // Query Code Block Background
    slide.addShape(pres.ShapeType.rect, { fill: { color: 'F4F4F4' }, x: 0.5, y: 1.2, w: 9, h: 1.8 });
    
    // Query Text
    slide.addText(query, {
        x: 0.6, y: 1.3, w: 8.8, h: 1.6, 
        fontSize: 14, fontFace: 'Courier New', color: 'B22222', valign: 'top'
    });
    
    // Explanation Bullets
    let bullets = explanationArr.map(txt => ({ text: txt, options: { bullet: true, color: '333333', fontSize: 18 } }));
    slide.addText(bullets, { x: 0.5, y: 3.3, w: 9, h: 2, valign: 'top' });
}

addQuerySlide(
    "1. Table Creation (DDL)",
    `CREATE TABLE expenses (
    expense_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id),
    category_id INTEGER REFERENCES categories(category_id),
    amount DECIMAL(10, 2) NOT NULL
);`,
    [
        "SERIAL PRIMARY KEY: Autogenerates a unique, non-repeating integer for each expense.",
        "REFERENCES users(user_id): Enforces Foreign Key constraints so an expense must belong to a real user.",
        "DECIMAL(10, 2): Safely stores currency up to 10 total digits and precisely 2 decimal places to prevent float math errors."
    ]
);

addQuerySlide(
    "2. Registering a User (INSERT)",
    `INSERT INTO users (name, email, password)
VALUES ($1, $2, $3)
RETURNING user_id, name, email;`,
    [
        "INSERT INTO ... VALUES: A standard command to append a brand new row to the 'users' table.",
        "$1, $2, $3: Parameterized queries. These placeholders protect the database from SQL Injection attacks by safely sanitizing user input.",
        "RETURNING: A PostgreSQL specific command that skips a second lookup query and immediately yields the generated ID and data."
    ]
);

addQuerySlide(
    "3. Querying User Login (SELECT)",
    `SELECT * FROM users
WHERE email = $1;`,
    [
        "SELECT *: Fetches all columns (id, name, email, and the hashed bcrypt password) for the user.",
        "WHERE email = $1: A strict filter ensuring we only pull the exact record matching the provided login email address.",
        "With this data, the Node.js backend handles security by comparing the database password hash against what the user typed."
    ]
);

addQuerySlide(
    "4. Adding a New Expense (INSERT)",
    `INSERT INTO expenses (user_id, category_id, amount, date, description)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;`,
    [
        "Links the transaction to the specific logged-in user ($1) and their chosen UI category ($2).",
        "Records the amount ($3), the date it occurred ($4), and an optional description string ($5).",
        "RETURNING * outputs the complete new database row instantly so the React frontend can update the table without refreshing the page."
    ]
);

addQuerySlide(
    "5. Fetching Dashboard Data (JOIN)",
    `SELECT e.expense_id, e.amount, e.date, e.description, c.category_name
FROM expenses e
JOIN categories c ON e.category_id = c.category_id
WHERE e.user_id = $1
ORDER BY e.date DESC;`,
    [
        "JOIN categories c: Merges the 'expenses' and 'categories' tables by aligning their matching category_id columns.",
        "This mapping is what enables the frontend to display 'Food & Dining' instead of seeing the raw ID '1'.",
        "WHERE e.user_id = $1: Validates security so users ONLY pull and view their personal expenses.",
        "ORDER BY e.date DESC: Sorts the result set chronologically, pushing the newest expenses to the top of the table array."
    ]
);

addQuerySlide(
    "6. Editing an Expense (UPDATE)",
    `UPDATE expenses
SET category_id = $1, amount = $2, date = $3, description = $4
WHERE expense_id = $5 AND user_id = $6
RETURNING *;`,
    [
        "UPDATE expenses SET: Directly modifies existing column values in a specific row.",
        "WHERE expense_id = $5: Locates the exact historical transaction the user wants to edit.",
        "AND user_id = $6: Crucial security parameter. This prevents an attacker from supplying someone else's expense_id and maliciously altering it."
    ]
);

addQuerySlide(
    "7. Deleting an Expense (DELETE)",
    `DELETE FROM expenses
WHERE expense_id = $1 AND user_id = $2;`,
    [
        "DELETE FROM: Removes the specified row from the table database completely and permanently.",
        "The mandatory WHERE clause ensures we don't accidentally wipe out every expense row.",
        "AND user_id = $2: The same vital security ownership check. You can only delete an expense if you are actively authenticated as the creator."
    ]
);

let outPath = path.join(__dirname, '..', 'SQL_Queries_Explained.pptx');
pres.writeFile({ fileName: outPath }).then(() => {
    console.log('PPTX generated successfully at: ' + outPath);
}).catch(err => {
    console.error(err);
});
