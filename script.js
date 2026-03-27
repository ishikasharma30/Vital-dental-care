document.addEventListener('DOMContentLoaded', () => {
    // Select all FAQ toggle buttons
    const faqButtons = document.querySelectorAll('.faq-toggle');

    faqButtons.forEach(button => {
        button.addEventListener('click', () => {
            const faqItem = button.parentElement;
            const content = faqItem.querySelector('.faq-content');
            const icon = button.querySelector('i');

            // Optional: Close all other open FAQs when opening a new one
            document.querySelectorAll('.faq-content').forEach(item => {
                if (item !== content && !item.classList.contains('hidden')) {
                    item.classList.add('hidden');
                    item.previousElementSibling.querySelector('i').classList.remove('rotate-180');
                }
            });

            // Toggle the clicked FAQ content
            content.classList.toggle('hidden');
            
            // Rotate the chevron arrow
            icon.classList.toggle('rotate-180');
        });
    });
});


//dark mode code 
document.addEventListener('DOMContentLoaded', () => {
    
    /* --- Theme Toggle Logic (Light/Dark Mode) --- */
    const themeBtn = document.querySelector('.btn-theme');
    const themeIcon = themeBtn.querySelector('i');
    const rootElement = document.documentElement;

    // 1. Check if the user already chose a theme in a previous session
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        rootElement.setAttribute('data-theme', 'dark');
        themeIcon.classList.replace('fa-sun', 'fa-moon');
    }

    // 2. Listen for clicks on the theme button
    themeBtn.addEventListener('click', () => {
        const currentTheme = rootElement.getAttribute('data-theme');
        
        if (currentTheme === 'dark') {
            // Switch to Light Mode
            rootElement.removeAttribute('data-theme');
            themeIcon.classList.replace('fa-moon', 'fa-sun');
            localStorage.setItem('theme', 'light');
        } else {
            // Switch to Dark Mode
            rootElement.setAttribute('data-theme', 'dark');
            themeIcon.classList.replace('fa-sun', 'fa-moon');
            localStorage.setItem('theme', 'dark');
        }
    });


    /* --- FAQ Toggle Logic --- */
    const faqButtons = document.querySelectorAll('.faq-toggle');

    faqButtons.forEach(button => {
        button.addEventListener('click', () => {
            const faqItem = button.parentElement;
            const content = faqItem.querySelector('.faq-content');
            const icon = button.querySelector('i');

            // Close all other open FAQs
            document.querySelectorAll('.faq-content').forEach(item => {
                if (item !== content && !item.classList.contains('hidden')) {
                    item.classList.add('hidden');
                    item.previousElementSibling.querySelector('i').classList.remove('rotate-180');
                }
            });

            // Toggle the clicked FAQ content
            content.classList.toggle('hidden');
            
            // Rotate the chevron arrow
            icon.classList.toggle('rotate-180');
        });
    });
});



//code for universal dark and light mode 
// 1. Select the button and the root element
const themeBtn = document.getElementById('themeBtn'); // Ensure your toggle has this ID
const rootElement = document.documentElement;

// 2. Function to apply the theme
function applyTheme(theme) {
    rootElement.setAttribute('data-theme', theme);
    localStorage.setItem('vital-dental-theme', theme); // Save preference
    
    // Update icon if the button exists on the current page
    if (themeBtn) {
        const icon = themeBtn.querySelector('i');
        icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
}

// 3. Check for saved user preference on page load
const savedTheme = localStorage.getItem('vital-dental-theme') || 'light';
applyTheme(savedTheme);

// 4. Toggle event listener
if (themeBtn) {
    themeBtn.addEventListener('click', () => {
        const currentTheme = rootElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        applyTheme(newTheme);
    });
}