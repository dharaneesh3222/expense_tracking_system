document.addEventListener('DOMContentLoaded', async () => {
    const categoryBudgetsContainer = document.getElementById('categoryBudgetsContainer');
    const overallBudgetInput = document.getElementById('overallBudgetInput');
    const saveBudgetsBtn = document.getElementById('saveBudgetsBtn');
    
    // Shared categoryConfig 
    const categories = [
        { name: 'Food', icon: 'fa-utensils', color: '#f59e0b' },
        { name: 'Travel', icon: 'fa-car', color: '#3b82f6' },
        { name: 'Bills', icon: 'fa-file-invoice-dollar', color: '#ef4444' },
        { name: 'Shopping', icon: 'fa-bag-shopping', color: '#ec4899' },
        { name: 'Online Shopping', icon: 'fa-cart-shopping', color: '#8b5cf6' },
        { name: 'UPI Payment', icon: 'fa-credit-card', color: '#10b981' },
        { name: 'Entertainment', icon: 'fa-film', color: '#f43f5e' },
        { name: 'Other Expense', icon: 'fa-icons', color: '#64748b' }
    ];

    let user = null;
    let transactions = [];
    let currentMonthExpenses = {};

    try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            user = JSON.parse(userStr);
            overallBudgetInput.value = user.budget || 5000;
        }

        transactions = await window.api.fetchTransactions();
        
        // Calculate current month expenses per category
        const now = new Date();
        const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        
        transactions.forEach(t => {
            if (t.type === 'expense' && t.date.startsWith(currentMonthPrefix)) {
                currentMonthExpenses[t.category] = (currentMonthExpenses[t.category] || 0) + t.amount;
            }
        });

        renderCategoryBudgets();
    } catch(e) {
        console.error("Failed to load data for budgets", e);
    }

    function renderCategoryBudgets() {
        const savedCatBudgets = user?.categoryBudgets || {};
        let html = '';

        categories.forEach(cat => {
            const limit = savedCatBudgets[cat.name] || 0;
            const spent = currentMonthExpenses[cat.name] || 0;
            
            let percent = limit > 0 ? (spent / limit) * 100 : 0;
            if (percent > 100) percent = 100;
            
            let barColor = 'var(--primary-color)';
            if (percent >= 90) barColor = 'var(--danger-color)';
            else if (percent >= 75) barColor = 'var(--warning-color)';
            else if (percent > 0) barColor = 'var(--income-color)';

            const currency = user?.currency || '₹';

            html += `
                <div class="budget-row" style="background: var(--bg-color); padding: 1.5rem; border-radius: 12px; border: 1px solid var(--border-color);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <div style="display: flex; align-items: center; gap: 1rem;">
                            <div style="width: 40px; height: 40px; border-radius: 8px; background: ${cat.color}20; color: ${cat.color}; display: flex; align-items: center; justify-content: center; font-size: 1.2rem;">
                                <i class="fa-solid ${cat.icon}"></i>
                            </div>
                            <div>
                                <h4 style="margin: 0;">${cat.name}</h4>
                                <p style="margin: 0; font-size: 0.8rem; color: var(--text-secondary);">Spent: ${currency}${spent.toFixed(2)}</p>
                            </div>
                        </div>
                        <div class="form-group" style="margin: 0; width: 120px;">
                            <input type="number" class="form-control cat-budget-input" data-category="${cat.name}" placeholder="Limit" value="${limit > 0 ? limit : ''}">
                        </div>
                    </div>
                    
                    ${limit > 0 ? `
                        <div class="progress-bar-bg" style="height: 8px; background: var(--border-color); border-radius: 4px; overflow: hidden;">
                            <div class="progress-bar-fill" style="width: ${percent}%; height: 100%; background: ${barColor}; transition: width 0.3s ease;"></div>
                        </div>
                        <p style="margin-top: 0.5rem; font-size: 0.75rem; color: var(--text-secondary); text-align: right;">${percent.toFixed(1)}% of ${currency}${limit}</p>
                    ` : '<p style="margin-top: 0.5rem; font-size: 0.75rem; color: var(--text-secondary); text-align: right; opacity: 0.5;">No limit set</p>'}
                </div>
            `;
        });

        categoryBudgetsContainer.innerHTML = html;
    }

    saveBudgetsBtn.addEventListener('click', async () => {
        saveBudgetsBtn.disabled = true;
        saveBudgetsBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
        
        try {
            const overallBudget = Number(overallBudgetInput.value);
            const newCatBudgets = {};
            
            document.querySelectorAll('.cat-budget-input').forEach(input => {
                const val = Number(input.value);
                if (val > 0) {
                    newCatBudgets[input.dataset.category] = val;
                }
            });

            const res = await window.api.updateUser({
                email: user.email, 
                budget: overallBudget,
                categoryBudgets: newCatBudgets
            });

            if (res) {
                const updatedUser = res;
                localStorage.setItem('user', JSON.stringify(updatedUser));
                user = updatedUser;
                renderCategoryBudgets(); // re-render to show updated progress bars
                alert('Budgets saved successfully!');
            } else {
                alert('Failed to save budgets.');
            }
        } catch(e) {
            alert('Error saving budgets.');
        } finally {
            saveBudgetsBtn.disabled = false;
            saveBudgetsBtn.innerHTML = '<i class="fa-solid fa-save"></i> Save Changes';
        }
    });
});
