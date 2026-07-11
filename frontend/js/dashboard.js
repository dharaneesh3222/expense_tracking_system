document.addEventListener('DOMContentLoaded', async () => {
    const transactionList = document.getElementById('transactionList');
    const noDataMsg = document.getElementById('noDataMsg');
    const totalBalanceEl = document.getElementById('totalBalance');
    const totalIncomeEl = document.getElementById('totalIncome');
    const totalExpenseEl = document.getElementById('totalExpense');

    const filterType = document.getElementById('filterType');
    const filterCategory = document.getElementById('filterCategory');
    const filterDate = document.getElementById('filterDate');
    const resetFiltersBtn = document.getElementById('resetFilters');

    let transactions = [];
    let currencySymbol = '₹';
    try {
        const userObj = JSON.parse(localStorage.getItem('user'));
        if (userObj && userObj.currency) currencySymbol = userObj.currency;
    } catch(e) {}

    const categoryConfig = {
        'Food': { icon: 'fa-utensils', color: '#f59e0b' },
        'Travel': { icon: 'fa-car', color: '#3b82f6' },
        'Bills': { icon: 'fa-file-invoice-dollar', color: '#ef4444' },
        'Shopping': { icon: 'fa-bag-shopping', color: '#ec4899' },
        'Online Shopping': { icon: 'fa-cart-shopping', color: '#8b5cf6' },
        'UPI Payment': { icon: 'fa-credit-card', color: '#10b981' },
        'Entertainment': { icon: 'fa-film', color: '#f43f5e' },
        'Other Expense': { icon: 'fa-icons', color: '#64748b' },
        'Other': { icon: 'fa-icons', color: '#64748b' },
        'Salary': { icon: 'fa-money-check-dollar', color: '#22c55e' },
        'Freelance': { icon: 'fa-laptop-code', color: '#0ea5e9' },
        'Investments': { icon: 'fa-chart-line', color: '#84cc16' },
        'Other Income': { icon: 'fa-sack-dollar', color: '#64748b' }
    };

    const loadData = async () => {
        transactions = await window.api.fetchTransactions();
        transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
        applyFilters();
    };

    const renderTopSpends = (data) => {
        const topSpendsContainer = document.getElementById('topSpendsContainer');
        const expenses = data.filter(t => t.type === 'expense');
        let totalExpense = 0;
        const catMap = {};
        expenses.forEach(e => {
            totalExpense += e.amount;
            catMap[e.category] = (catMap[e.category] || 0) + e.amount;
        });
        
        let sortedCats = Object.keys(catMap).sort((a,b) => catMap[b] - catMap[a]).slice(0, 4); // Show top 4
        
        if (sortedCats.length === 0) {
            topSpendsContainer.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 1rem;"><i class="fa-solid fa-face-smile" style="margin-right: 0.5rem; opacity: 0.5;"></i>No expenses yet.</p>';
            return;
        }

        topSpendsContainer.innerHTML = '';
        sortedCats.forEach(cat => {
            const amount = catMap[cat];
            const percent = totalExpense > 0 ? (amount / totalExpense) * 100 : 0;
            const config = categoryConfig[cat] || { color: '#9ca3af' };
            
            topSpendsContainer.innerHTML += `
                <div class="progress-group">
                    <div class="progress-header">
                        <span>${cat}</span>
                        <span style="color: ${config.color}">${currencySymbol}${amount.toFixed(2)}</span>
                    </div>
                    <div class="progress-bar-bg">
                        <div class="progress-bar-fill" style="width: ${percent}%; background-color: ${config.color};"></div>
                    </div>
                </div>
            `;
        });
    };

    const renderTable = (data) => {
        transactionList.innerHTML = '';
        if (data.length === 0) {
            noDataMsg.style.display = 'block';
            document.querySelector('.table-container').style.display = 'none';
        } else {
            noDataMsg.style.display = 'none';
            document.querySelector('.table-container').style.display = 'block';
            
            data.forEach(t => {
                const catInfo = categoryConfig[t.category] || { icon: 'fa-circle-dot', color: '#9ca3af' };
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>
                        <div class="cat-badge">
                            <div class="cat-icon" style="color: ${catInfo.color}; background: ${catInfo.color}20">
                                <i class="fa-solid ${catInfo.icon}"></i>
                            </div>
                            <span>${t.category}</span>
                        </div>
                    </td>
                    <td><div style="color: var(--text-secondary); font-weight: 500;">${new Date(t.date).toLocaleDateString()}</div></td>
                    <td>${t.note || '-'}</td>
                    <td style="font-weight: 700;" class="${t.type === 'income' ? 'income-text' : 'expense-text'}">
                        ${t.type === 'income' ? '+' : '-'}${currencySymbol}${t.amount.toFixed(2)}
                    </td>
                    <td><span class="type-badge badge-${t.type}">${t.type}</span></td>
                    <td>
                        <div class="action-btns">
                            <button class="btn-icon edit" onclick="editTr('${t.id}')" title="Edit"><i class="fa-solid fa-pen"></i></button>
                            <button class="btn-icon delete" onclick="deleteTr('${t.id}')" title="Delete"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    </td>
                `;
                transactionList.appendChild(tr);
            });
        }
    };

    const updateSummaries = (data) => {
        let income = 0;
        let expense = 0;
        
        // Calculate only for current month for budget
        let currentMonthExpense = 0;
        const now = new Date();
        const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        data.forEach(t => {
            if (t.type === 'income') income += t.amount;
            else if (t.type === 'expense') {
                expense += t.amount;
                if (t.date.startsWith(currentMonthPrefix)) {
                    currentMonthExpense += t.amount;
                }
            }
        });
        const balance = income - expense;
        
        totalIncomeEl.innerText = `${currencySymbol}${income.toFixed(2)}`;
        totalExpenseEl.innerText = `${currencySymbol}${expense.toFixed(2)}`;
        totalBalanceEl.innerText = balance < 0 ? `-${currencySymbol}${Math.abs(balance).toFixed(2)}` : `${currencySymbol}${balance.toFixed(2)}`;

        // Budget Logic
        const userStr = localStorage.getItem('user');
        let budgetTotal = 5000; // default
        if (userStr) {
            try {
                const userObj = JSON.parse(userStr);
                if (userObj.budget) budgetTotal = Number(userObj.budget);
            } catch(e) {}
        }

        const budgetSpentEl = document.getElementById('budgetSpent');
        const budgetTotalEl = document.getElementById('budgetTotal');
        const budgetProgressFill = document.getElementById('budgetProgressFill');
        const budgetStatusText = document.getElementById('budgetStatusText');

        if(budgetSpentEl) {
            budgetSpentEl.innerText = `${currencySymbol}${currentMonthExpense.toFixed(0)}`;
            budgetTotalEl.innerText = `/ ${currencySymbol}${budgetTotal}`;
            
            let percent = (currentMonthExpense / budgetTotal) * 100;
            if (percent > 100) percent = 100;
            
            budgetProgressFill.style.width = `${percent}%`;
            
            if (percent >= 90) {
                budgetProgressFill.style.background = 'var(--danger-color)';
            } else if (percent >= 75) {
                budgetProgressFill.style.background = 'var(--warning-color)';
            } else {
                budgetProgressFill.style.background = 'var(--income-color)';
            }
            
            budgetStatusText.innerText = `${percent.toFixed(1)}% used`;
        }
    };

    const applyFilters = () => {
        let filtered = transactions;

        const type = filterType.value;
        if (type !== 'all') filtered = filtered.filter(t => t.type === type);

        const category = filterCategory.value;
        if (category !== 'all') filtered = filtered.filter(t => t.category === category);

        const date = filterDate.value;
        if (date) filtered = filtered.filter(t => t.date.startsWith(date));

        renderTable(filtered);
        updateSummaries(filtered);
        renderTopSpends(filtered); // Render analytics
    };

    filterType.addEventListener('change', applyFilters);
    filterCategory.addEventListener('change', applyFilters);
    filterDate.addEventListener('change', applyFilters);

    resetFiltersBtn.addEventListener('click', () => {
        filterType.value = 'all';
        filterCategory.value = 'all';
        filterDate.value = '';
        applyFilters();
    });

    window.deleteTr = async (id) => {
        if (confirm('Are you sure you want to delete this transaction?')) {
            await window.api.deleteTransaction(id);
            loadData();
        }
    };

    window.editTr = (id) => {
        window.location.href = `/add?edit=${id}`;
    };

    // CSV Export
    const exportCsvBtn = document.getElementById('exportCsvBtn');
    if (exportCsvBtn) {
        exportCsvBtn.addEventListener('click', () => {
            if (transactions.length === 0) return alert("No data to export.");
            
            let csvContent = "data:text/csv;charset=utf-8,";
            csvContent += "Date,Type,Category,Amount,Note\n";
            
            transactions.forEach(row => {
                const date = row.date;
                const type = row.type;
                const cat = row.category;
                const amt = row.amount;
                const note = row.note ? row.note.replace(/,/g, "") : ""; // remove commas from note
                csvContent += `${date},${type},${cat},${amt},${note}\n`;
            });
            
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "transactions_export.csv");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    }

    // Edit Budget
    const editBudgetBtn = document.getElementById('editBudgetBtn');
    if (editBudgetBtn) {
        editBudgetBtn.addEventListener('click', async () => {
            const userStr = localStorage.getItem('user');
            if(!userStr) return;
            const userObj = JSON.parse(userStr);
            const currentBudget = userObj.budget || 5000;
            
            const newBudget = prompt(`Enter your new monthly budget goal (${currencySymbol}):`, currentBudget);
            if (newBudget !== null && !isNaN(newBudget) && Number(newBudget) > 0) {
                try {
                    const res = await window.api.updateUser({ email: userObj.email, budget: Number(newBudget) });
                    if (res) {
                        const updatedUser = res;
                        localStorage.setItem('user', JSON.stringify({...userObj, budget: updatedUser.budget}));
                        applyFilters(); // Re-render budget UI
                    } else {
                        alert("Failed to update budget.");
                    }
                } catch (e) {
                    alert("Error connecting to server.");
                }
            }
        });
    }

    loadData();
});
