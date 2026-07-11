document.addEventListener('DOMContentLoaded', async () => {
    let transactions = await window.api.fetchTransactions();
    transactions.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Shared categoryConfig 
    const categoryConfig = {
        'Food': '#f59e0b',
        'Travel': '#3b82f6',
        'Bills': '#ef4444',
        'Shopping': '#ec4899',
        'Online Shopping': '#8b5cf6',
        'UPI Payment': '#10b981',
        'Entertainment': '#f43f5e',
        'Other Expense': '#64748b',
        'Other': '#64748b',
        'Salary': '#22c55e',
        'Freelance': '#0ea5e9',
        'Investments': '#84cc16',
        'Other Income': '#64748b'
    };

    // Calculate Summary Stats
    const totalTxCount = document.getElementById('totalTxCount');
    const highestExpense = document.getElementById('highestExpense');
    const avgDailyExpense = document.getElementById('avgDailyExpense');

    let currencySymbol = '₹';
    let userStr = localStorage.getItem('user');
    if (userStr) {
        try {
            const userObj = JSON.parse(userStr);
            if (userObj && userObj.currency) currencySymbol = userObj.currency;
        } catch(e) {}
    }

    if (totalTxCount && highestExpense && avgDailyExpense) {
        totalTxCount.innerText = transactions.length;
        
        const allExpenses = transactions.filter(t => t.type === 'expense').map(t => t.amount);
        const maxExp = allExpenses.length > 0 ? Math.max(...allExpenses) : 0;
        highestExpense.innerText = `${currencySymbol}${maxExp.toFixed(2)}`;

        // Avg daily expense (calculate over the date range of existing transactions)
        if (transactions.length > 0) {
            const firstDate = new Date(transactions[0].date);
            const lastDate = new Date(transactions[transactions.length - 1].date);
            const diffTime = Math.abs(lastDate - firstDate);
            let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays === 0) diffDays = 1; // prevent divide by zero
            
            const totalExp = allExpenses.reduce((a, b) => a + b, 0);
            avgDailyExpense.innerText = `${currencySymbol}${(totalExp / diffDays).toFixed(2)}`;
        } else {
            avgDailyExpense.innerText = `${currencySymbol}0.00`;
        }
    }

    // --- PIE CHART ---
    const expenses = transactions.filter(t => t.type === 'expense');
    const catMap = {};
    expenses.forEach(e => {
        catMap[e.category] = (catMap[e.category] || 0) + e.amount;
    });

    const pieLabels = Object.keys(catMap);
    const pieData = Object.values(catMap);
    const pieColors = pieLabels.map(label => categoryConfig[label] || '#9ca3af');

    const ctxPie = document.getElementById('categoryPieChart').getContext('2d');
    
    if (expenses.length === 0) {
        new Chart(ctxPie, {
            type: 'pie',
            data: { labels: ['No Data'], datasets: [{ data: [1], backgroundColor: ['#e2e8f0'] }] },
            options: { plugins: { tooltip: { enabled: false } }, responsive: true, maintainAspectRatio: false }
        });
    } else {
        new Chart(ctxPie, {
            type: 'pie',
            data: {
                labels: pieLabels,
                datasets: [{
                    data: pieData,
                    backgroundColor: pieColors,
                    borderWidth: 1,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'right', labels: { color: '#6b7280', font: { family: 'Outfit', size: 12 } } },
                    tooltip: { callbacks: { label: (context) => ` ${currencySymbol}${context.raw.toFixed(2)}` } }
                }
            }
        });
    }

    // --- BAR CHART ---
    const monthMap = {};
    transactions.forEach(t => {
        const month = t.date.substring(0, 7); 
        if (!monthMap[month]) monthMap[month] = { income: 0, expense: 0 };
        if (t.type === 'income') monthMap[month].income += t.amount;
        else monthMap[month].expense += t.amount;
    });

    const months = Object.keys(monthMap).sort();
    const mapIncome = months.map(m => monthMap[m].income);
    const mapExpense = months.map(m => monthMap[m].expense);

    const ctxBar = document.getElementById('monthlyBarChart').getContext('2d');
    
    if (months.length === 0) {
        new Chart(ctxBar, {
            type: 'bar',
            data: { labels: ['No Data'], datasets: [{ label: 'Empty', data: [0] }] },
            options: { responsive: true, maintainAspectRatio: false }
        });
    } else {
        new Chart(ctxBar, {
            type: 'bar',
            data: {
                labels: months,
                datasets: [
                    { label: 'Income', data: mapIncome, backgroundColor: '#10b981', borderRadius: 4 },
                    { label: 'Expense', data: mapExpense, backgroundColor: '#f43f5e', borderRadius: 4 }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { labels: { color: '#6b7280', font: { family: 'Outfit' } } }
                },
                scales: {
                    y: { 
                        beginAtZero: true, 
                        ticks: { color: '#6b7280', callback: (value) => currencySymbol + value },
                        grid: { color: 'rgba(156, 163, 175, 0.1)' }
                    },
                    x: {
                        ticks: { color: '#6b7280' },
                        grid: { display: false }
                    }
                }
            }
        });
    }

    // --- LINE CHART (Cash Flow Trend) ---
    const dateMap = {};
    transactions.forEach(t => {
        if(!dateMap[t.date]) dateMap[t.date] = 0;
        if(t.type === 'income') dateMap[t.date] += t.amount;
        else dateMap[t.date] -= t.amount;
    });

    const sortedDates = Object.keys(dateMap).sort();
    let cumulative = 0;
    const trendData = [];
    sortedDates.forEach(d => {
        cumulative += dateMap[d];
        trendData.push(cumulative);
    });

    const ctxLine = document.getElementById('trendLineChart').getContext('2d');
    if (sortedDates.length === 0) {
        new Chart(ctxLine, { type: 'line', data: { labels: ['No Data'], datasets: [{ data: [0] }] } });
    } else {
        new Chart(ctxLine, {
            type: 'line',
            data: {
                labels: sortedDates,
                datasets: [{
                    label: 'Net Balance',
                    data: trendData,
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.15)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointBackgroundColor: '#ffffff',
                    pointBorderColor: '#6366f1'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { callbacks: { label: (context) => ` ${currencySymbol}${context.raw.toFixed(2)}` } }
                },
                scales: {
                    y: { 
                        ticks: { color: '#6b7280', callback: (value) => currencySymbol + value },
                        grid: { color: 'rgba(156, 163, 175, 0.1)' }
                    },
                    x: {
                        ticks: { color: '#6b7280' },
                        grid: { display: false }
                    }
                }
            }
        });
    }

    // --- PDF EXPORT LOGIC ---
    const generatePDF = (period) => {
        const user = JSON.parse(localStorage.getItem('user'));
        const userEmail = user ? user.email : 'User';
        const dateStr = new Date().toLocaleDateString();
        
        let filteredData = transactions;
        let title = "Complete Expense Report";
        
        if (period === 'monthly') {
            const currentMonth = new Date().toISOString().substring(0, 7);
            filteredData = transactions.filter(t => t.date.startsWith(currentMonth));
            title = `Monthly Expense Report (${currentMonth})`;
        } else if (period === 'yearly') {
            const currentYear = new Date().getFullYear().toString();
            filteredData = transactions.filter(t => t.date.startsWith(currentYear));
            title = `Yearly Expense Report (${currentYear})`;
        }

        let inc = 0, exp = 0;
        let tableRows = '';
        filteredData.forEach(t => {
            if (t.type === 'income') inc += t.amount;
            else exp += t.amount;
            
            tableRows += `
                <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 10px; color: #4b5563;">${new Date(t.date).toLocaleDateString()}</td>
                    <td style="padding: 10px; font-weight: 600; color: #1f2937;">${t.category}</td>
                    <td style="padding: 10px; color: #6b7280;">${t.note || '-'}</td>
                    <td style="padding: 10px; text-align: right; font-weight: bold; color: ${t.type === 'income' ? '#10b981' : '#f43f5e'}">
                        ${t.type === 'income' ? '+' : '-'}${currencySymbol}${t.amount.toFixed(2)}
                    </td>
                </tr>
            `;
        });

        const htmlContent = `
            <div style="padding: 40px; font-family: 'Outfit', sans-serif; background: white; color: #111827;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #6366f1; margin: 0; font-size: 28px;">FinTrack</h1>
                    <h2 style="color: #374151; margin: 10px 0; font-size: 20px;">${title}</h2>
                    <p style="color: #6b7280; margin: 0;">Generated for: ${userEmail} | Date: ${dateStr}</p>
                </div>
                
                <div style="display: flex; justify-content: space-between; background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 30px; border: 1px solid #e5e7eb;">
                    <div style="text-align: center; flex: 1;">
                        <span style="display: block; color: #6b7280; font-size: 14px;">Total Income</span>
                        <span style="font-size: 24px; font-weight: bold; color: #10b981;">${currencySymbol}${inc.toFixed(2)}</span>
                    </div>
                    <div style="text-align: center; flex: 1; border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb;">
                        <span style="display: block; color: #6b7280; font-size: 14px;">Total Expense</span>
                        <span style="font-size: 24px; font-weight: bold; color: #f43f5e;">${currencySymbol}${exp.toFixed(2)}</span>
                    </div>
                    <div style="text-align: center; flex: 1;">
                        <span style="display: block; color: #6b7280; font-size: 14px;">Net Balance</span>
                        <span style="font-size: 24px; font-weight: bold; color: ${(inc - exp) >= 0 ? '#10b981' : '#f43f5e'};">${currencySymbol}${(inc - exp).toFixed(2)}</span>
                    </div>
                </div>

                <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 14px;">
                    <thead>
                        <tr style="background: #f3f4f6; color: #374151;">
                            <th style="padding: 12px; border-bottom: 2px solid #e5e7eb;">Date</th>
                            <th style="padding: 12px; border-bottom: 2px solid #e5e7eb;">Category</th>
                            <th style="padding: 12px; border-bottom: 2px solid #e5e7eb;">Note</th>
                            <th style="padding: 12px; border-bottom: 2px solid #e5e7eb; text-align: right;">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows || '<tr><td colspan="4" style="text-align: center; padding: 20px; color: #9ca3af;">No transactions found for this period.</td></tr>'}
                    </tbody>
                </table>
            </div>
        `;

        const container = document.getElementById('pdfExportContainer');
        if(!container) return;
        container.innerHTML = htmlContent;
        container.style.display = 'block';

        const opt = {
            margin:       0.5,
            filename:     `FinTrack_${period}_report.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true },
            jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(container).save().then(() => {
            container.style.display = 'none';
        });
    };

    document.getElementById('exportMonthlyPdf')?.addEventListener('click', () => generatePDF('monthly'));
    document.getElementById('exportYearlyPdf')?.addEventListener('click', () => generatePDF('yearly'));
});
