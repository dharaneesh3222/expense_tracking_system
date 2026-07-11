document.addEventListener('DOMContentLoaded', () => {
    const settingsForm = document.getElementById('settingsForm');
    const currencySelect = document.getElementById('currencySelect');
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');
    
    let user = null;

    try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            user = JSON.parse(userStr);
            if (user.currency) {
                currencySelect.value = user.currency;
            }
        }
    } catch(e) {
        console.error("Failed to load user for settings", e);
    }

    settingsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        saveSettingsBtn.disabled = true;
        saveSettingsBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
        
        try {
            const res = await window.api.updateUser({ 
                email: user.email, 
                currency: currencySelect.value
            });

            if (res) {
                const updatedUser = res;
                localStorage.setItem('user', JSON.stringify(updatedUser));
                user = updatedUser;
                alert('Settings saved successfully!');
            } else {
                alert('Failed to save settings.');
            }
        } catch(e) {
            alert('Error saving settings.');
        } finally {
            saveSettingsBtn.disabled = false;
            saveSettingsBtn.innerHTML = '<i class="fa-solid fa-save"></i> Save Settings';
        }
    });
});
