document.addEventListener('DOMContentLoaded', async () => {
    const goalsContainer = document.getElementById('goalsContainer');
    const noGoalsMsg = document.getElementById('noGoalsMsg');
    
    // Modal elements
    const goalModal = document.getElementById('goalModal');
    const addGoalBtn = document.getElementById('addGoalBtn');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const goalForm = document.getElementById('goalForm');
    
    // Form elements
    const goalIdInput = document.getElementById('goalId');
    const goalTitleInput = document.getElementById('goalTitle');
    const goalTargetInput = document.getElementById('goalTarget');
    const goalSavedInput = document.getElementById('goalSaved');
    const goalDateInput = document.getElementById('goalDate');
    const modalTitle = document.getElementById('modalTitle');

    const openModal = (isEdit = false, goal = null) => {
        goalForm.reset();
        if (isEdit && goal) {
            modalTitle.innerText = "Edit Goal";
            goalIdInput.value = goal.id;
            goalTitleInput.value = goal.title;
            goalTargetInput.value = goal.targetAmount;
            goalSavedInput.value = goal.savedAmount || 0;
            if(goal.deadline) goalDateInput.value = goal.deadline;
        } else {
            modalTitle.innerText = "Create New Goal";
            goalIdInput.value = '';
        }
        goalModal.style.display = 'flex';
    };

    const closeModal = () => {
        goalModal.style.display = 'none';
    };

    addGoalBtn.addEventListener('click', () => openModal(false));
    closeModalBtn.addEventListener('click', closeModal);
    
    // Get Currency
    const userStr = localStorage.getItem('user');
    let currencySymbol = '₹';
    if(userStr) {
        try {
            const userObj = JSON.parse(userStr);
            if(userObj.currency) currencySymbol = userObj.currency;
        } catch(e){}
    }

    const loadGoals = async () => {
        try {
            const goals = await window.api.fetchGoals();
            goalsContainer.innerHTML = '';
            
            if (goals.length === 0) {
                noGoalsMsg.style.display = 'block';
            } else {
                noGoalsMsg.style.display = 'none';
                
                goals.forEach(goal => {
                    let percent = (goal.savedAmount / goal.targetAmount) * 100;
                    if (percent > 100) percent = 100;
                    
                    const isComplete = percent >= 100;
                    
                    let dateHtml = '';
                    if (goal.deadline) {
                        const dateObj = new Date(goal.deadline);
                        dateHtml = `<p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.5rem;"><i class="fa-regular fa-clock"></i> Target: ${dateObj.toLocaleDateString()}</p>`;
                    }

                    goalsContainer.innerHTML += `
                        <div class="goal-card">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                                <div>
                                    <h3 style="margin: 0; font-size: 1.25rem;">${goal.title}</h3>
                                    ${dateHtml}
                                </div>
                                <div>
                                    <button class="btn-icon" onclick="editGoalData('${goal.id}')" title="Edit" style="color: var(--primary-color)"><i class="fa-solid fa-pen"></i></button>
                                    <button class="btn-icon" onclick="deleteGoalData('${goal.id}')" title="Delete" style="color: var(--danger-color)"><i class="fa-solid fa-trash"></i></button>
                                </div>
                            </div>
                            
                            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.875rem;">
                                <span style="font-weight: 600; color: ${isComplete ? 'var(--income-color)' : 'var(--text-primary)'};">${currencySymbol}${goal.savedAmount.toFixed(0)}</span>
                                <span style="color: var(--text-secondary);">${currencySymbol}${goal.targetAmount.toFixed(0)}</span>
                            </div>
                            
                            <div class="progress-bar-bg" style="height: 12px; background: var(--bg-color); border-radius: 6px; overflow: hidden;">
                                <div class="progress-bar-fill" style="width: ${percent}%; height: 100%; background: ${isComplete ? 'var(--income-color)' : 'var(--primary-color)'}; transition: width 0.3s ease;"></div>
                            </div>
                            <p style="margin-top: 0.5rem; font-size: 0.75rem; color: var(--text-secondary); text-align: right;">${percent.toFixed(1)}%</p>
                        </div>
                    `;
                });
            }
        } catch (e) {
            console.error("Failed to load goals", e);
        }
    };

    goalForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
            title: goalTitleInput.value,
            targetAmount: goalTargetInput.value,
            savedAmount: goalSavedInput.value || 0,
            deadline: goalDateInput.value
        };
        
        try {
            if (goalIdInput.value) {
                await window.api.editGoal(goalIdInput.value, data);
            } else {
                await window.api.addGoal(data);
            }
            closeModal();
            loadGoals();
        } catch(err) {
            alert("Error saving goal");
        }
    });

    window.editGoalData = async (id) => {
        const goals = await window.api.fetchGoals();
        const goal = goals.find(g => g.id === id);
        if (goal) openModal(true, goal);
    };

    window.deleteGoalData = async (id) => {
        if(confirm("Delete this savings goal?")) {
            await window.api.deleteGoal(id);
            loadGoals();
        }
    };

    loadGoals();
});
