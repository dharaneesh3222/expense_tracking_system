document.addEventListener('DOMContentLoaded', async () => {
    const form = document.getElementById('transactionForm');
    const formTitle = document.getElementById('formTitle');
    const btnSubmit = form.querySelector('button[type="submit"]');

    const amountInput = document.getElementById('amount');
    const typeSelect = document.getElementById('type');
    const categorySelect = document.getElementById('category');
    const dateInput = document.getElementById('date');
    const noteInput = document.getElementById('note');

    // Preview Logic Components
    const previewAmount = document.getElementById('previewAmount');
    const previewCategory = document.getElementById('previewCategory');
    const previewDate = document.getElementById('previewDate');
    const previewIcon = document.getElementById('previewIcon');

    const categoryIcons = {
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

    const updatePreview = () => {
        let currencySymbol = '₹';
        try {
            const userObj = JSON.parse(localStorage.getItem('user'));
            if (userObj && userObj.currency) currencySymbol = userObj.currency;
        } catch(e) {}

        const amt = amountInput.value ? parseFloat(amountInput.value).toFixed(2) : '0.00';
        previewAmount.innerText = typeSelect.value === 'income' ? `+${currencySymbol}${amt}` : `-${currencySymbol}${amt}`;
        previewAmount.style.color = typeSelect.value === 'income' ? 'var(--income-color)' : 'var(--danger-color)';
        
        previewCategory.innerText = categorySelect.value || 'Select Category';
        const config = categoryIcons[categorySelect.value] || { icon: 'fa-receipt', color: 'var(--primary-color)' };
        previewIcon.innerHTML = `<i class="fa-solid ${config.icon}"></i>`;
        previewIcon.style.color = config.color;
        previewIcon.style.background = config.color + '20';

        previewDate.innerText = dateInput.value ? new Date(dateInput.value).toLocaleDateString() : 'Today';
    };

    amountInput.addEventListener('input', updatePreview);
    typeSelect.addEventListener('change', updatePreview);
    categorySelect.addEventListener('change', updatePreview);
    dateInput.addEventListener('change', updatePreview);

    const params = new URLSearchParams(window.location.search);
    const editId = params.get('edit');

    // Update categories toggling
    function updateCategories() {
        if (typeSelect.value === 'income') {
            for (let optgroup of categorySelect.getElementsByTagName('optgroup')) {
                optgroup.style.display = optgroup.label === 'Income Categories' ? 'block' : 'none';
            }
            if(!editId || !categorySelect.value) categorySelect.value = '';
        } else {
            for (let optgroup of categorySelect.getElementsByTagName('optgroup')) {
                optgroup.style.display = optgroup.label === 'Expense Categories' ? 'block' : 'none';
            }
            if(!editId || !categorySelect.value) categorySelect.value = '';
        }
        updatePreview();
    }
    
    typeSelect.addEventListener('change', () => {
        categorySelect.value = ''; 
        updateCategories();
    });

    if (editId) {
        formTitle.innerText = "Edit Transaction";
        btnSubmit.innerHTML = '<i class="fa-solid fa-save"></i> Save Changes';
        
        // Fetch to dynamically prefill
        const transactions = await window.api.fetchTransactions();
        const t = transactions.find(x => x.id === editId);
        
        if (t) {
            document.getElementById('transactionId').value = t.id;
            typeSelect.value = t.type;
            amountInput.value = t.amount;
            
            updateCategories(); 
            categorySelect.value = t.category;
            dateInput.value = t.date;
            noteInput.value = t.note;
            const paymentMethodSelect = document.getElementById('paymentMethod');
            if(t.paymentMethod) paymentMethodSelect.value = t.paymentMethod;
            updatePreview();
        } else {
            alert('Transaction not found!');
        }
    } else {
        dateInput.valueAsDate = new Date();
        updateCategories();
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const paymentMethodSelect = document.getElementById('paymentMethod');
        
        const data = {
            type: typeSelect.value,
            amount: Number(amountInput.value),
            category: categorySelect.value,
            date: dateInput.value,
            note: noteInput.value,
            paymentMethod: paymentMethodSelect.value
        };
        
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

        try {
            if (editId) {
                await window.api.editTransaction(editId, data);
            } else {
                await window.api.addTransaction(data);
            }
            window.location.href = 'dashboard.html';
        } catch (error) {
            alert('Failed to save transaction');
            btnSubmit.disabled = false;
            btnSubmit.innerText = 'Save Transaction';
        }
    });
});
