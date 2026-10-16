/**
 * HunarHub Universal Theme & UI Script
 * Controls Dark Mode toggle, persistence in localStorage, and theme synchronization across all pages.
 */
(function() {
    'use strict';

    function getPreferredTheme() {
        try {
            var saved = localStorage.getItem('hunarhub_theme');
            if (saved === 'dark' || saved === 'light') return saved;
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                return 'dark';
            }
        } catch (e) {}
        return 'light';
    }

    function applyTheme(theme) {
        var isDark = theme === 'dark';
        var root = document.documentElement;
        var body = document.body;

        if (isDark) {
            root.setAttribute('data-bs-theme', 'dark');
            root.setAttribute('data-theme', 'dark');
            root.classList.add('dark');
            if (body) {
                body.setAttribute('data-bs-theme', 'dark');
                body.setAttribute('data-theme', 'dark');
                body.classList.add('dark-mode');
                body.classList.add('dark');
            }
        } else {
            root.setAttribute('data-bs-theme', 'light');
            root.setAttribute('data-theme', 'light');
            root.classList.remove('dark');
            if (body) {
                body.setAttribute('data-bs-theme', 'light');
                body.setAttribute('data-theme', 'light');
                body.classList.remove('dark-mode');
                body.classList.remove('dark');
            }
        }

        try {
            localStorage.setItem('hunarhub_theme', theme);
        } catch (e) {}

        updateToggleButtons(theme);
    }

    function updateToggleButtons(theme) {
        var isDark = theme === 'dark';
        var buttons = document.querySelectorAll('#themeToggleBtn, #desktop-theme-toggle-btn, #mobile-theme-toggle-btn, #hh-floating-theme-toggle');
        
        buttons.forEach(function(btn) {
            btn.setAttribute('title', isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode');
            btn.setAttribute('aria-label', isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode');
            btn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
            var icon = btn.querySelector('i, svg');
            if (icon && icon.tagName.toLowerCase() === 'i') {
                if (isDark) {
                    icon.className = 'bi bi-sun-fill text-warning';
                } else {
                    icon.className = 'bi bi-moon-stars';
                }
            }
        });
    }

    function toggleTheme() {
        var current = document.documentElement.getAttribute('data-bs-theme') === 'dark' || 
                      document.documentElement.classList.contains('dark') ? 'dark' : 'light';
        var nextTheme = current === 'dark' ? 'light' : 'dark';
        applyTheme(nextTheme);
        return nextTheme;
    }

    // Apply immediately to prevent flash of light theme
    var initialTheme = getPreferredTheme();
    document.documentElement.setAttribute('data-bs-theme', initialTheme);
    document.documentElement.setAttribute('data-theme', initialTheme);
    if (initialTheme === 'dark') {
        document.documentElement.classList.add('dark');
    }

    function initThemeUI() {
        var currentTheme = getPreferredTheme();
        applyTheme(currentTheme);

        // Attach click listeners to all navbar theme toggle buttons
        var existingBtns = document.querySelectorAll('#themeToggleBtn, #desktop-theme-toggle-btn, #mobile-theme-toggle-btn');
        existingBtns.forEach(function(btn) {
            btn.onclick = function(e) {
                if (e) e.preventDefault();
                toggleTheme();
            };
        });

        // Create floating button only if no navbar toggle exists on this page
        var floatingBtn = document.getElementById('hh-floating-theme-toggle');
        if (!floatingBtn && existingBtns.length === 0) {
            floatingBtn = document.createElement('button');
            floatingBtn.id = 'hh-floating-theme-toggle';
            floatingBtn.type = 'button';
            floatingBtn.className = 'hh-floating-theme-btn';
            floatingBtn.setAttribute('title', currentTheme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode');
            floatingBtn.setAttribute('aria-label', 'Toggle dark mode');
            
            var icon = document.createElement('i');
            icon.className = currentTheme === 'dark' ? 'bi bi-sun-fill text-warning' : 'bi bi-moon-stars';
            floatingBtn.appendChild(icon);

            floatingBtn.onclick = function(e) {
                if (e) e.preventDefault();
                toggleTheme();
            };

            document.body.appendChild(floatingBtn);
        }

        updateToggleButtons(currentTheme);
    }

    // Run as soon as DOM is ready or immediately if already interactive
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initThemeUI);
    } else {
        initThemeUI();
    }

    // Listen for storage changes across browser tabs
    window.addEventListener('storage', function(e) {
        if (e.key === 'hunarhub_theme' && (e.newValue === 'dark' || e.newValue === 'light')) {
            applyTheme(e.newValue);
        }
    });

    // Expose toggleTheme and applyTheme globally for inline HTML onclick fallbacks
    window.hunarhubToggleTheme = toggleTheme;
    window.hunarhubApplyTheme = applyTheme;
})();

