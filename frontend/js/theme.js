document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('themeToggle');
    const themeToggleMobile = document.getElementById('themeToggleMobile');
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Load saved theme or fallback to system preference
    const currentTheme = localStorage.getItem('theme');
    const setDark = () => {
        document.body.setAttribute('data-theme', 'dark');
        if(themeToggle) themeToggle.innerHTML = '<i class="fa-solid fa-sun"></i> <span>Light Mode</span>';
        if(themeToggleMobile) themeToggleMobile.innerHTML = '<i class="fa-solid fa-sun"></i>';
    };
    const setLight = () => {
        document.body.setAttribute('data-theme', 'light');
        if(themeToggle) themeToggle.innerHTML = '<i class="fa-solid fa-moon"></i> <span>Dark Mode</span>';
        if(themeToggleMobile) themeToggleMobile.innerHTML = '<i class="fa-solid fa-moon"></i>';
    }

    if (currentTheme == 'dark' || (!currentTheme && prefersDarkScheme.matches)) {
        setDark();
    } else {
        setLight();
    }

    const toggleTheme = () => {
        let theme = document.body.getAttribute('data-theme');
        if (theme == 'dark') {
            setLight();
            localStorage.setItem('theme', 'light');
        } else {
            setDark();
            localStorage.setItem('theme', 'dark');
        }
    };

    if(themeToggle) themeToggle.addEventListener('click', toggleTheme);
    if(themeToggleMobile) themeToggleMobile.addEventListener('click', toggleTheme);

    // Populate user profile in sidebar
    const userProfileContainer = document.getElementById('userProfile');
    if (userProfileContainer) {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user) {
            const displayName = user.username || user.email.split('@')[0];
            if (user.avatar) {
                userProfileContainer.innerHTML = `<img src="${user.avatar}" style="width: 28px; height: 28px; border-radius: 50%; object-fit: cover; border: 2px solid var(--primary-color);"> <span id="userNameDisplay">${displayName}</span>`;
            } else {
                userProfileContainer.innerHTML = `<i class="fa-solid fa-user-circle" style="font-size: 1.5rem; color: var(--primary-color);"></i> <span id="userNameDisplay">${displayName}</span>`;
            }
        }
    }
});
