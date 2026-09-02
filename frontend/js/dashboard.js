document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    document.getElementById('welcomeUser').innerText = `Dashboard - Welcome ${user.name}`;
    
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    });

    const expenseForm = document.getElementById('expenseForm');
    const expensesTableBody = document.querySelector('#expensesTable tbody');
    let chartInstance = null;

    // Load Data
    await loadCategories();
    await loadDashboard();

    // Handle Form Submit
    expenseForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const amount = document.getElementById('amount').value;
        const category_id = document.getElementById('category').value;
        const date = document.getElementById('date').value;
        const description = document.getElementById('description').value;

        await api.addExpense(token, { amount, category_id, date, description });
        expenseForm.reset();
        await loadDashboard();
    });

    async function loadCategories() {
        const categories = await api.getCategories();
        const select = document.getElementById('category');
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.category_id;
            option.textContent = cat.category_name;
            select.appendChild(option);
        });
    }

    async function loadDashboard() {
        const expenses = await api.getExpenses(token);
        
        // Update Table
        expensesTableBody.innerHTML = '';
        let total = 0;
        let categoryTotals = {};

        expenses.forEach(exp => {
            const amt = parseFloat(exp.amount);
            total += amt;
            
            if (!categoryTotals[exp.category_name]) {
                categoryTotals[exp.category_name] = 0;
            }
            categoryTotals[exp.category_name] += amt;

            const tr = document.createElement('tr');
            const dateFmt = new Date(exp.date).toLocaleDateString();
            tr.innerHTML = `
                <td>${dateFmt}</td>
                <td>${exp.category_name}</td>
                <td>${exp.description || ''}</td>
                <td>$${amt.toFixed(2)}</td>
                <td><button onclick="deleteExpense(${exp.expense_id})" class="del-btn">Delete</button></td>
            `;
            expensesTableBody.appendChild(tr);
        });

        document.getElementById('totalExpenses').innerText = `$${total.toFixed(2)}`;
        // For simplicity, treating total as monthly if no filtering is applied
        document.getElementById('monthlySpending').innerText = `$${total.toFixed(2)}`;

        updateChart(categoryTotals);
    }

    window.deleteExpense = async (id) => {
        if(confirm('Delete this expense?')) {
            await api.deleteExpense(token, id);
            await loadDashboard();
        }
    }

    function updateChart(data) {
        const ctx = document.getElementById('categoryChart').getContext('2d');
        
        if (chartInstance) {
            chartInstance.destroy();
        }

        chartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(data),
                datasets: [{
                    data: Object.values(data),
                    backgroundColor: [
                        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'
                    ]
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }
});
