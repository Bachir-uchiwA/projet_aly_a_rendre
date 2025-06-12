document.addEventListener('DOMContentLoaded', function() {
    // Affichage/fermeture du menu contextuel
    const menuBtn = document.getElementById('menuBtn');
    const contextMenu = document.getElementById('contextMenu');
    document.addEventListener('click', function(e) {
        if (menuBtn && menuBtn.contains(e.target)) {
            contextMenu.classList.toggle('hidden');
        } else if (contextMenu && !contextMenu.contains(e.target)) {
            contextMenu.classList.add('hidden');
        }
    });

    // Déconnexion
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            const params = new URLSearchParams(window.location.search);
            const sessionId = params.get('sessionId');
            if (sessionId) {
                try {
                    await fetch(`/api/sessions/${sessionId}`, { method: 'DELETE' });
                } catch (err) {}
            }
            window.location.href = '/index.html';
        });
    }

    // Navigation sidebar : chat <-> paramètres
    const sidebarChatIcon = document.getElementById('sidebarChatIcon');
    const settingsIcon = document.getElementById('settingsIcon');
    const sidebarChats = document.getElementById('sidebarChats');
    const sidebarSettings = document.getElementById('sidebarSettings');

    function showPanel(panel) {
        if (panel === 'settings') {
            sidebarChats.classList.add('hidden');
            sidebarSettings.classList.remove('hidden');
        } else {
            sidebarSettings.classList.add('hidden');
            sidebarChats.classList.remove('hidden');
        }
    }

    if (sidebarChats && sidebarSettings) {
        showPanel('chats');
    }

    if (sidebarChatIcon && sidebarChats && sidebarSettings) {
        sidebarChatIcon.addEventListener('click', () => {
            showPanel('chats');
        });
    }
    if (settingsIcon && sidebarChats && sidebarSettings) {
        settingsIcon.addEventListener('click', () => {
            showPanel('settings');
        });
    }

    // Déconnexion depuis le panneau paramètres
    const settingsLogout = document.getElementById('settingsLogout');
    if (settingsLogout) {
        settingsLogout.addEventListener('click', async function(e) {
            e.preventDefault();
            const params = new URLSearchParams(window.location.search);
            const sessionId = params.get('sessionId');
            if (sessionId) {
                try {
                    await fetch(`/api/sessions/${sessionId}`, { method: 'DELETE' });
                } catch (err) {}
            }
            window.location.href = '/index.html';
        });
    }
});
