import { showModal } from './modals.js';

export function setupUIEvents() {
    // Nouveau chat
    const newChatBtn = document.getElementById('newChatBtn');
    if (newChatBtn) {
        newChatBtn.onclick = () => {
            showModal({
                title: 'Nouvelle discussion',
                content: '<p class="mb-4">Fonctionnalité à venir : sélectionnez un contact pour démarrer une discussion.</p>',
                actions: [
                    { label: 'Fermer', className: 'bg-gray-600 text-white hover:bg-gray-700' }
                ]
            });
        };
    }
    // Paramètres
    const settingsIcon = document.getElementById('settingsIcon');
    if (settingsIcon) {
        settingsIcon.onclick = () => {
            showModal({
                title: 'Paramètres',
                content: '<p class="mb-4">Fonctionnalité à venir : panneau de paramètres utilisateur.</p>',
                actions: [
                    { label: 'Fermer', className: 'bg-gray-600 text-white hover:bg-gray-700' }
                ]
            });
        };
    }
    // Avatar utilisateur
    const avatar = document.querySelector('.h-full.w-20 img.rounded-full, img[alt="avatar"]');
    if (avatar) {
        avatar.onclick = () => {
            showModal({
                title: 'Profil utilisateur',
                content: '<p class="mb-4">Fonctionnalité à venir : affichage du profil utilisateur.</p>',
                actions: [
                    { label: 'Fermer', className: 'bg-gray-600 text-white hover:bg-gray-700' }
                ]
            });
        };
    }
    // Menu contextuel (3 points)
    const menuBtn = document.getElementById('menuBtn');
    const contextMenu = document.getElementById('contextMenu');
    if (menuBtn && contextMenu) {
        menuBtn.onclick = (e) => {
            e.stopPropagation();
            contextMenu.classList.toggle('hidden');
        };
        document.addEventListener('click', (e) => {
            if (!contextMenu.classList.contains('hidden') && !contextMenu.contains(e.target) && e.target !== menuBtn) {
                contextMenu.classList.add('hidden');
            }
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !contextMenu.classList.contains('hidden')) {
                contextMenu.classList.add('hidden');
            }
        });
    }
    // Déconnexion
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.onclick = (e) => {
            e.preventDefault();
            showModal({
                title: 'Déconnexion',
                content: '<p>Voulez-vous vraiment vous déconnecter ?</p>',
                actions: [
                    { label: 'Annuler', className: 'bg-gray-600 text-white hover:bg-gray-700' },
                    { label: 'Déconnexion', className: 'bg-red-600 text-white hover:bg-red-700', onClick: () => window.location.href = '/' }
                ]
            });
        };
    }
}
