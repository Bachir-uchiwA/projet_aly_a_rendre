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
        // Gestionnaire de clic sur le bouton menu
        menuBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            contextMenu.classList.toggle('hidden');
        });

        // Fermer le menu au clic en dehors
        document.addEventListener('click', (e) => {
            if (!contextMenu.contains(e.target) && !menuBtn.contains(e.target)) {
                contextMenu.classList.add('hidden');
            }
        });

        // Fermer le menu avec la touche Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                contextMenu.classList.add('hidden');
            }
        });

        // Gestionnaire de clic sur le bouton déconnexion
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                showModal({
                    title: 'Déconnexion',
                    content: '<p>Voulez-vous vraiment vous déconnecter ?</p>',
                    actions: [
                        { label: 'Annuler', className: 'bg-gray-600 text-white hover:bg-gray-700' },
                        { 
                            label: 'Déconnexion', 
                            className: 'bg-red-600 text-white hover:bg-red-700',
                            onClick: () => window.location.href = '/'
                        }
                    ]
                });
            });
        }
    }
}
