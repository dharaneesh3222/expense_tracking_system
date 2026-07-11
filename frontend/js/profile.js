document.addEventListener('DOMContentLoaded', async () => {
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const usernameInput = document.getElementById('username');
    const profileForm = document.getElementById('profileForm');
    const errorMessage = document.getElementById('errorMessage');
    const successMessage = document.getElementById('successMessage');
    const avatarUpload = document.getElementById('avatarUpload');
    const avatarPreview = document.getElementById('avatarPreview');
    const avatarPlaceholder = document.getElementById('avatarPlaceholder');

    let currentAvatarBase64 = null;

    // Fetch user details on load
    try {
        const user = await window.api.getUser();
        emailInput.value = user.email || '';
        usernameInput.value = user.username || '';
        if (user.avatar) {
            currentAvatarBase64 = user.avatar;
            avatarPreview.src = user.avatar;
            avatarPreview.style.display = 'block';
            avatarPlaceholder.style.display = 'none';
        }
    } catch (err) {
        console.error('Failed to load profile', err);
    }

    avatarUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                currentAvatarBase64 = e.target.result;
                avatarPreview.src = currentAvatarBase64;
                avatarPreview.style.display = 'block';
                avatarPlaceholder.style.display = 'none';
            };
            reader.readAsDataURL(file);
        }
    });

    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        errorMessage.style.display = 'none';
        successMessage.style.display = 'none';
        
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        const username = usernameInput.value.trim();
        
        if (!email) {
            errorMessage.textContent = 'Email is required';
            errorMessage.style.display = 'block';
            return;
        }

        const btn = profileForm.querySelector('button');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Saving...';
        btn.disabled = true;

        try {
            const dataToUpdate = { email, username, avatar: currentAvatarBase64 };
            if (password) dataToUpdate.password = password; // Only update if not empty

            const updatedUser = await window.api.updateUser(dataToUpdate);
            
            // Update local storage to reflect the new email across the app
            localStorage.setItem('user', JSON.stringify(updatedUser));
            
            // Trigger a re-render of the sidebar profile immediately
            window.dispatchEvent(new Event('storage'));
            const userDisplay = document.getElementById('userNameDisplay');
            if (userDisplay) {
                userDisplay.innerText = updatedUser.username || updatedUser.email.split('@')[0];
            }
            const sidebarAvatar = document.querySelector('.sidebar-bottom .fa-user-circle')?.parentElement;
            if (sidebarAvatar && updatedUser.avatar) {
                 sidebarAvatar.innerHTML = `<img src="${updatedUser.avatar}" style="width: 24px; height: 24px; border-radius: 50%; object-fit: cover;"> <span id="userNameDisplay">${updatedUser.username || updatedUser.email.split('@')[0]}</span>`;
            }

            successMessage.textContent = 'Profile updated successfully!';
            successMessage.style.display = 'block';
            passwordInput.value = ''; // Clear password field
            
        } catch (err) {
            errorMessage.textContent = err.message || 'Failed to update profile';
            errorMessage.style.display = 'block';
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    });
});
