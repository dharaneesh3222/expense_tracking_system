document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const errorMsg = document.getElementById('errorMsg');

    const showError = (msg) => {
        errorMsg.innerText = msg;
        errorMsg.style.display = 'block';
    };

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = loginForm.querySelector('button[type="submit"]');
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Loading...';
            btn.disabled = true;
            
            try {
                const user = await window.api.loginUser(
                    document.getElementById('email').value,
                    document.getElementById('password').value
                );
                localStorage.setItem('user', JSON.stringify(user));
                window.location.href = 'dashboard.html';
            } catch (err) {
                showError(err.message);
                btn.innerHTML = 'Login';
                btn.disabled = false;
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = registerForm.querySelector('button[type="submit"]');
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Creating...';
            btn.disabled = true;
            
            try {
                const user = await window.api.registerUser(
                    document.getElementById('email').value,
                    document.getElementById('password').value
                );
                localStorage.setItem('user', JSON.stringify(user));
                window.location.href = 'dashboard.html';
            } catch (err) {
                showError(err.message);
                btn.innerHTML = 'Create Account';
                btn.disabled = false;
            }
        });
    }
});
