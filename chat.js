// JS principal pour la page chat (nécessaire pour éviter l'erreur MIME lors du déploiement Vercel)

console.log("chat.js chargé !");

// Configuration de l'API
const API_BASE_URL = 'https://projet-json-server-5.onrender.com';

// Fonctions utilitaires pour l'API
async function apiRequest(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        return null;
    }
}

// Fonction pour sauvegarder un contact
async function saveContact(contactData) {
    return await apiRequest('/contacts', {
        method: 'POST',
        body: JSON.stringify(contactData)
    });
}

// Fonction pour récupérer tous les contacts
async function getContacts() {
    return await apiRequest('/contacts');
}

// Fonction pour récupérer tous les chats
async function getChats() {
    return await apiRequest('/chats');
}

// Fonction pour créer ou récupérer un chat
async function createOrGetChat(contactId, contactName = null, contactPhone = null) {
    try {
        const existingChats = await apiRequest('/chats');
        let chat = existingChats.find(c => c.contactId === parseInt(contactId));
        if (!chat && contactName && contactPhone) {
            const chatData = {
                contactId: parseInt(contactId),
                contactName: contactName,
                contactPhone: contactPhone,
                lastMessage: '',
                lastMessageTime: new Date().toISOString(),
                unreadCount: 0,
                createdAt: new Date().toISOString()
            };
            chat = await apiRequest('/chats', {
                method: 'POST',
                body: JSON.stringify(chatData)
            });
            await refreshChatsList();
        }
        return chat;
    } catch (error) {
        console.error('Erreur lors de la création/récupération du chat:', error);
        return null;
    }
}

// Fonction pour sauvegarder un message
async function saveMessage(chatId, messageText, sender = 'me') {
    try {
        const messageData = {
            chatId: parseInt(chatId),
            text: messageText,
            sender: sender,
            timestamp: new Date().toISOString(),
            status: 'sent'
        };
        const savedMessage = await apiRequest('/messages', {
            method: 'POST',
            body: JSON.stringify(messageData)
        });
        await apiRequest(`/chats/${chatId}`, {
            method: 'PATCH',
            body: JSON.stringify({
                lastMessage: messageText,
                lastMessageTime: new Date().toISOString()
            })
        });
        await refreshChatsList();
        return savedMessage;
    } catch (error) {
        console.error('Erreur lors de la sauvegarde du message:', error);
        return null;
    }
}

// Fonction pour charger les messages d'un chat
async function loadMessages(chatId) {
    try {
        return await apiRequest(`/messages?chatId=${chatId}&_sort=timestamp&_order=asc`);
    } catch (error) {
        console.error('Erreur lors du chargement des messages:', error);
        return [];
    }
}

// Fonction pour rafraîchir la liste des chats dans la sidebar
async function refreshChatsList() {
    try {
        const chats = await getChats();
        const chatListContainer = document.querySelector('#chatsList');
        if (chatListContainer) {
            let chatsHTML = '';
            chats.sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));
            chats.forEach(chat => {
                const lastMessageTime = new Date(chat.lastMessageTime);
                const timeString = lastMessageTime.toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit'
                });
                chatsHTML += `
                    <div class="flex items-center p-3 hover:bg-gray-700 cursor-pointer border-b border-gray-600 chat-item" 
                         data-chat-id="${chat.id}" 
                         data-contact-id="${chat.contactId}"
                         data-contact-name="${chat.contactName}"
                         data-contact-phone="${chat.contactPhone}">
                        <div class="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                            <i class="fas fa-user text-white"></i>
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="flex justify-between items-center mb-1">
                                <h3 class="text-white font-medium text-sm truncate">${chat.contactName}</h3>
                                <span class="text-gray-400 text-xs">${timeString}</span>
                            </div>
                            <div class="flex justify-between items-center">
                                <p class="text-gray-400 text-sm truncate">${chat.lastMessage || 'Nouvelle conversation'}</p>
                                ${chat.unreadCount > 0 ? `<span class="bg-green-500 text-white text-xs rounded-full px-2 py-1 ml-2">${chat.unreadCount}</span>` : ''}
                            </div>
                        </div>
                    </div>
                `;
            });
            chatListContainer.innerHTML = chatsHTML;
            setupChatListeners();
        }
    } catch (error) {
        console.error('Erreur lors du rafraîchissement des chats:', error);
    }
}

// Fonction pour charger et afficher les contacts dans la vue "Nouvelle discussion"
async function loadAndDisplayContacts() {
    try {
        const contacts = await getContacts();
        const bottomSection = document.querySelector('#newChatPanel .px-4.mt-8');
        if (bottomSection) {
            let contactsHTML = `<div class="text-gray-500 text-sm mb-4">#</div>`;
            if (contacts && contacts.length > 0) {
                contactsHTML += `<div class="space-y-2">`;
                contacts.forEach(contact => {
                    const displayName = contact.fullName || `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || contact.phone;
                    const phoneDisplay = `+${contact.country === 'SN' ? '221' : ''}${contact.phone}`;
                    contactsHTML += `
                        <div class="flex items-center py-2 cursor-pointer hover:bg-gray-800 rounded-lg px-2 transition-colors contact-item" 
                             data-contact-id="${contact.id}"
                             data-contact-name="${displayName}"
                             data-contact-phone="${phoneDisplay}">
                            <div class="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                                <i class="fas fa-user text-white text-sm"></i>
                            </div>
                            <div class="flex-1">
                                <div class="text-gray-200 text-base font-medium">${displayName}</div>
                                <div class="text-gray-400 text-sm">${phoneDisplay}</div>
                            </div>
                            <div class="text-gray-500 text-xs">
                                <i class="fas fa-chevron-right"></i>
                            </div>
                        </div>
                    `;
                });
                contactsHTML += `</div>`;
            } else {
                contactsHTML += `
                    <div class="text-gray-500 text-sm text-center py-4 italic">
                        Aucun contact ajouté pour le moment
                    </div>
                `;
            }
            bottomSection.innerHTML = contactsHTML;
            setupContactClickListeners();
        }
    } catch (error) {
        console.error('Erreur lors du chargement des contacts:', error);
        const bottomSection = document.querySelector('#newChatPanel .px-4.mt-8');
        if (bottomSection) {
            bottomSection.innerHTML = `
                <div class="text-gray-500 text-sm mb-4">#</div>
                <div class="text-red-400 text-sm text-center py-4">
                    Erreur lors du chargement des contacts
                </div>
            `;
        }
    }
}

// Fonction pour créer l'interface de chat (à adapter selon ton HTML)
function createChatInterface(contactName, lastMessage, colorClass, contactId) {
    return `
        <div class="flex flex-col h-full w-full">
            <div class="flex items-center p-4 bg-gray-800 border-b border-gray-700">
                <div class="w-12 h-12 ${colorClass} rounded-full flex items-center justify-center mr-4">
                    <i class="fas fa-user text-white text-xl"></i>
                </div>
                <div>
                    <h2 class="text-white text-lg font-medium">${contactName}</h2>
                    <p class="text-gray-400 text-xs">${lastMessage || ''}</p>
                </div>
            </div>
            <div id="messagesArea" class="flex-1 overflow-y-auto p-4 bg-gray-900" style="min-height:200px;">
                <div id="messagesContainer"></div>
            </div>
            <div class="p-4 bg-gray-800 flex items-center">
                <input id="messageInput" type="text" class="flex-1 bg-gray-700 text-white rounded-lg px-4 py-2 mr-2 outline-none" placeholder="Écrire un message...">
                <button id="sendButton" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg">Envoyer</button>
            </div>
        </div>
    `;
}

// Fonction pour gérer l'interface de chat (envoi/affichage messages)
function setupChatInterface(chatId) {
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');
    const messagesContainer = document.getElementById('messagesContainer');

    // Charger les messages existants
    async function loadChatMessages() {
        const messages = await loadMessages(chatId);
        messagesContainer.innerHTML = '';
        messages.forEach(msg => {
            messagesContainer.innerHTML += `
                <div class="mb-2 flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}">
                    <div class="px-4 py-2 rounded-lg ${msg.sender === 'me' ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-200'} max-w-xs break-words">
                        ${msg.text}
                        <div class="text-xs text-gray-300 mt-1 text-right">${new Date(msg.timestamp).toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})}</div>
                    </div>
                </div>
            `;
        });
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    loadChatMessages();

    async function sendMessage() {
        const messageText = messageInput.value.trim();
        if (messageText) {
            messageInput.disabled = true;
            sendButton.disabled = true;
            await saveMessage(chatId, messageText, 'me');
            messageInput.value = '';
            await loadChatMessages();
            messageInput.disabled = false;
            sendButton.disabled = false;
            messageInput.focus();
        }
    }

    sendButton.addEventListener('click', sendMessage);
    messageInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') sendMessage();
    });
}

// ----------- Événement principal DOMContentLoaded -----------
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM entièrement chargé !");

    const sidebarSettings = document.getElementById('sidebarSettings');
    const sidebarChats = document.getElementById('sidebarChats');
    const settingsIcon = document.getElementById('settingsIcon');
    const sidebarChatIcon = document.getElementById('sidebarChatIcon');
    const mainContent = document.querySelector('.flex-1.bg-gray-800.flex.items-center.justify-center');

    // Sauvegarde pour restauration
    window.sidebarChatsBackup = null;
    let newChatBackup = null;

    refreshChatsList();
    initializeEventListeners();

    function initializeEventListeners() {
        setupContextMenu();
        setupChatListeners();
        setupNewChatButton();
        setupSettingsButton();
    }

    function setupSettingsButton() {
        const settingsIcon = document.getElementById('settingsIcon');
        if (settingsIcon && sidebarChats) {
            const newSettingsIcon = settingsIcon.cloneNode(true);
            settingsIcon.parentNode.replaceChild(newSettingsIcon, settingsIcon);
            newSettingsIcon.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                if (!window.sidebarChatsBackup) {
                    window.sidebarChatsBackup = sidebarChats.innerHTML;
                }
                showSettingsPanel();
            });
        }
    }

    function showSettingsPanel() {
        const settingsHTML = `
            <div class="flex flex-col h-full bg-gray-900" id="settingsPanel">
                <!-- Header -->
                <div class="flex items-center p-4 bg-gray-800 border-b border-gray-700">
                    <button id="backToChatsFromSettings" class="mr-4 focus:outline-none">
                        <i class="fas fa-arrow-left text-gray-300 text-xl hover:text-white transition-colors"></i>
                    </button>
                    <h1 class="text-lg font-medium text-gray-200">Paramètres</h1>
                </div>
                
                <!-- Profile Section -->
                <div class="p-6 border-b border-gray-700">
                    <div class="flex items-center space-x-4">
                        <div class="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
                            <i class="fas fa-user text-white text-2xl"></i>
                        </div>
                        <div class="flex-1">
                            <h2 class="text-white text-xl font-medium">BACHIR IIR💻🏠</h2>
                            <p class="text-gray-400 text-sm">En ligne</p>
                        </div>
                        <button class="p-2 rounded-full hover:bg-gray-700 transition-colors">
                            <i class="fas fa-qrcode text-gray-400 text-xl"></i>
                        </button>
                    </div>
                </div>
                
                <!-- Settings Options -->
                <div class="flex-1 overflow-y-auto">
                    <div class="p-4 space-y-2">
                        <!-- Compte -->
                        <div class="flex items-center p-3 hover:bg-gray-800 rounded-lg cursor-pointer transition-colors">
                            <div class="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center mr-4">
                                <i class="fas fa-user text-white text-sm"></i>
                            </div>
                            <div class="flex-1">
                                <div class="text-gray-200 text-base">Compte</div>
                                <div class="text-gray-400 text-sm">Gérer votre compte</div>
                            </div>
                            <i class="fas fa-chevron-right text-gray-500"></i>
                        </div>
                        
                        <!-- Confidentialité -->
                        <div class="flex items-center p-3 hover:bg-gray-800 rounded-lg cursor-pointer transition-colors">
                            <div class="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center mr-4">
                                <i class="fas fa-lock text-white text-sm"></i>
                            </div>
                            <div class="flex-1">
                                <div class="text-gray-200 text-base">Confidentialité</div>
                                <div class="text-gray-400 text-sm">Confidentialité, sécurité, changer le numéro</div>
                            </div>
                            <i class="fas fa-chevron-right text-gray-500"></i>
                        </div>
                        
                        <!-- Discussions -->
                        <div class="flex items-center p-3 hover:bg-gray-800 rounded-lg cursor-pointer transition-colors">
                            <div class="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mr-4">
                                <i class="fas fa-comments text-white text-sm"></i>
                            </div>
                            <div class="flex-1">
                                <div class="text-gray-200 text-base">Discussions</div>
                                <div class="text-gray-400 text-sm">Thème, fonds d'écran, historique des discussions</div>
                            </div>
                            <i class="fas fa-chevron-right text-gray-500"></i>
                        </div>
                        
                        <!-- Notifications -->
                        <div class="flex items-center p-3 hover:bg-gray-800 rounded-lg cursor-pointer transition-colors">
                            <div class="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center mr-4">
                                <i class="fas fa-bell text-white text-sm"></i>
                            </div>
                            <div class="flex-1">
                                <div class="text-gray-200 text-base">Notifications</div>
                                <div class="text-gray-400 text-sm">Sons des messages, groupes et appels</div>
                            </div>
                            <i class="fas fa-chevron-right text-gray-500"></i>
                        </div>
                        
                        <!-- Stockage et données -->
                        <div class="flex items-center p-3 hover:bg-gray-800 rounded-lg cursor-pointer transition-colors">
                            <div class="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center mr-4">
                                <i class="fas fa-database text-white text-sm"></i>
                            </div>
                            <div class="flex-1">
                                <div class="text-gray-200 text-base">Stockage et données</div>
                                <div class="text-gray-400 text-sm">Utilisation du réseau, téléchargement automatique</div>
                            </div>
                            <i class="fas fa-chevron-right text-gray-500"></i>
                        </div>
                        
                        <!-- Aide -->
                        <div class="flex items-center p-3 hover:bg-gray-800 rounded-lg cursor-pointer transition-colors">
                            <div class="w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center mr-4">
                                <i class="fas fa-question-circle text-white text-sm"></i>
                            </div>
                            <div class="flex-1">
                                <div class="text-gray-200 text-base">Aide</div>
                                <div class="text-gray-400 text-sm">Centre d'aide, nous contacter, conditions d'utilisation</div>
                            </div>
                            <i class="fas fa-chevron-right text-gray-500"></i>
                        </div>
                        
                        <!-- Inviter des amis -->
                        <div class="flex items-center p-3 hover:bg-gray-800 rounded-lg cursor-pointer transition-colors">
                            <div class="w-10 h-10 bg-teal-600 rounded-full flex items-center justify-center mr-4">
                                <i class="fas fa-user-friends text-white text-sm"></i>
                            </div>
                            <div class="flex-1">
                                <div class="text-gray-200 text-base">Inviter des amis</div>
                                <div class="text-gray-400 text-sm">Partager WhatsApp avec vos amis</div>
                            </div>
                            <i class="fas fa-chevron-right text-gray-500"></i>
                        </div>
                    </div>
                </div>
                
                <!-- Footer avec déconnexion -->
                <div class="p-4 border-t border-gray-700">
                    <button id="settingsLogoutBtn" class="flex items-center w-full p-3 hover:bg-red-900 rounded-lg cursor-pointer transition-colors text-red-400 hover:text-red-300">
                        <div class="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center mr-4">
                            <i class="fas fa-sign-out-alt text-white text-sm"></i>
                        </div>
                        <div class="flex-1 text-left">
                            <div class="text-base">Déconnexion</div>
                            <div class="text-red-500 text-sm">Se déconnecter de WhatsApp Web</div>
                        </div>
                    </button>
                </div>
            </div>
        `;
        sidebarChats.innerHTML = settingsHTML;
        setupSettingsListeners();
    }

    function setupSettingsListeners() {
        const backToChatsBtn = document.getElementById('backToChatsFromSettings');
        if (backToChatsBtn) {
            backToChatsBtn.addEventListener('click', function() {
                if (window.sidebarChatsBackup) {
                    sidebarChats.innerHTML = window.sidebarChatsBackup;
                    setTimeout(() => {
                        refreshChatsList();
                        initializeEventListeners();
                    }, 100);
                }
            });
        }
        const logoutBtn = document.getElementById('settingsLogoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function(e) {
                e.preventDefault();
                if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
                    window.location.href = '/';
                }
            });
        }
    }

    function setupContextMenu() {
        const menuBtn = document.getElementById('menuBtn');
        const contextMenu = document.getElementById('contextMenu');
        if (menuBtn && contextMenu) {
            const newMenuBtn = menuBtn.cloneNode(true);
            menuBtn.parentNode.replaceChild(newMenuBtn, menuBtn);
            newMenuBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const isHidden = contextMenu.classList.contains('hidden');
                if (isHidden) {
                    contextMenu.classList.remove('hidden');
                } else {
                    contextMenu.classList.add('hidden');
                }
            });
            document.addEventListener('click', (e) => {
                if (!contextMenu.classList.contains('hidden')) {
                    if (!contextMenu.contains(e.target) && !newMenuBtn.contains(e.target)) {
                        contextMenu.classList.add('hidden');
                    }
                }
            });
            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
                        window.location.href = '/';
                    }
                });
            }
        }
    }

    // --- SIDEBAR ICONES GAUCHE ---
    // Icône chat principal (affiche la liste des discussions)
    const sidebarChatIcon = document.getElementById('sidebarChatIcon');
    if (sidebarChatIcon) {
        sidebarChatIcon.addEventListener('click', () => {
            // Affiche la liste principale des discussions
            document.getElementById('sidebarChats').classList.remove('hidden');
            document.querySelector('.flex-1.bg-gray-800.flex.items-center.justify-center').classList.add('hidden');
            refreshChatsList();
        });
        sidebarChatIcon.tabIndex = 0;
        sidebarChatIcon.setAttribute('role', 'button');
        sidebarChatIcon.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') sidebarChatIcon.click();
        });
    }

    // Icône paramètres (settings)
    const settingsIcon = document.getElementById('settingsIcon');
    if (settingsIcon) {
        settingsIcon.addEventListener('click', () => {
            // Affiche le panneau des paramètres
            document.getElementById('sidebarChats').classList.remove('hidden');
            document.querySelector('.flex-1.bg-gray-800.flex.items-center.justify-center').classList.add('hidden');
            showSettingsPanel();
        });
        settingsIcon.tabIndex = 0;
        settingsIcon.setAttribute('role', 'button');
        settingsIcon.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') settingsIcon.click();
        });
    }

    // Avatar (optionnel, placeholder)
    const avatar = document.querySelector('img[alt="avatar"]');
    if (avatar) {
        avatar.addEventListener('click', () => {
            // Affiche le panneau profil ou paramètres
            document.getElementById('sidebarChats').classList.remove('hidden');
            document.querySelector('.flex-1.bg-gray-800.flex.items-center.justify-center').classList.add('hidden');
            showSettingsPanel();
        });
        avatar.tabIndex = 0;
        avatar.setAttribute('role', 'button');
        avatar.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') avatar.click();
        });
    }

    // --- HEADER BOUTONS ---
    // Bouton "Nouveau chat" (icône +)
    const newChatBtn = document.getElementById('newChatBtn');
    if (newChatBtn) {
        newChatBtn.addEventListener('click', () => {
            // Affiche le panneau "Nouvelle discussion"
            document.getElementById('sidebarChats').classList.remove('hidden');
            document.querySelector('.flex-1.bg-gray-800.flex.items-center.justify-center').classList.add('hidden');
            showNewChatPanel();
        });
        newChatBtn.tabIndex = 0;
        newChatBtn.setAttribute('role', 'button');
        newChatBtn.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') newChatBtn.click();
        });
    }

    // Bouton menu contextuel (3 points verticaux)
    const menuBtn = document.getElementById('menuBtn');
    const contextMenu = document.getElementById('contextMenu');
    if (menuBtn && contextMenu) {
        menuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            contextMenu.classList.toggle('hidden');
        });
        menuBtn.tabIndex = 0;
        menuBtn.setAttribute('role', 'button');
        menuBtn.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') menuBtn.click();
        });
        document.addEventListener('click', (e) => {
            if (!contextMenu.classList.contains('hidden')) {
                contextMenu.classList.add('hidden');
            }
        });
        contextMenu.addEventListener('click', (e) => {
            e.stopPropagation();
        });
        // Déconnexion via menu
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
                    window.location.href = '/';
                }
            });
        }
    }

    // --- ACCESSIBILITÉ : focus visuel ---
    document.querySelectorAll('button, [role="button"]').forEach(el => {
        el.addEventListener('focus', () => el.classList.add('ring', 'ring-green-500'));
        el.addEventListener('blur', () => el.classList.remove('ring', 'ring-green-500'));
    });

    // Fonction pour créer l'interface de chat (à adapter selon ton HTML)
    function createChatInterface(contactName, lastMessage, colorClass, contactId) {
        return `
            <div class="flex flex-col h-full w-full">
                <div class="flex items-center p-4 bg-gray-800 border-b border-gray-700">
                    <div class="w-12 h-12 ${colorClass} rounded-full flex items-center justify-center mr-4">
                        <i class="fas fa-user text-white text-xl"></i>
                    </div>
                    <div>
                        <h2 class="text-white text-lg font-medium">${contactName}</h2>
                        <p class="text-gray-400 text-xs">${lastMessage || ''}</p>
                    </div>
                </div>
                <div id="messagesArea" class="flex-1 overflow-y-auto p-4 bg-gray-900" style="min-height:200px;">
                    <div id="messagesContainer"></div>
                </div>
                <div class="p-4 bg-gray-800 flex items-center">
                    <input id="messageInput" type="text" class="flex-1 bg-gray-700 text-white rounded-lg px-4 py-2 mr-2 outline-none" placeholder="Écrire un message...">
                    <button id="sendButton" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg">Envoyer</button>
                </div>
            </div>
        `;
    }

    // Fonction pour gérer l'interface de chat (envoi/affichage messages)
    function setupChatInterface(chatId) {
        const messageInput = document.getElementById('messageInput');
        const sendButton = document.getElementById('sendButton');
        const messagesContainer = document.getElementById('messagesContainer');

        // Charger les messages existants
        async function loadChatMessages() {
            const messages = await loadMessages(chatId);
            messagesContainer.innerHTML = '';
            messages.forEach(msg => {
                messagesContainer.innerHTML += `
                    <div class="mb-2 flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}">
                        <div class="px-4 py-2 rounded-lg ${msg.sender === 'me' ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-200'} max-w-xs break-words">
                            ${msg.text}
                            <div class="text-xs text-gray-300 mt-1 text-right">${new Date(msg.timestamp).toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})}</div>
                        </div>
                    </div>
                `;
            });
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }

        loadChatMessages();

        async function sendMessage() {
            const messageText = messageInput.value.trim();
            if (messageText) {
                messageInput.disabled = true;
                sendButton.disabled = true;
                await saveMessage(chatId, messageText, 'me');
                messageInput.value = '';
                await loadChatMessages();
                messageInput.disabled = false;
                sendButton.disabled = false;
                messageInput.focus();
            }
        }

        sendButton.addEventListener('click', sendMessage);
        messageInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') sendMessage();
        });
    }

    // Fonction pour sauvegarder un contact
    async function saveContact(contactData) {
        return await apiRequest('/contacts', {
            method: 'POST',
            body: JSON.stringify(contactData)
        });
    }

    // Fonction pour récupérer tous les contacts
    async function getContacts() {
        return await apiRequest('/contacts');
    }

    // Fonction pour récupérer tous les chats
    async function getChats() {
        return await apiRequest('/chats');
    }

    // Fonction pour créer ou récupérer un chat
    async function createOrGetChat(contactId, contactName = null, contactPhone = null) {
        try {
            const existingChats = await apiRequest('/chats');
            let chat = existingChats.find(c => c.contactId === parseInt(contactId));
            if (!chat && contactName && contactPhone) {
                const chatData = {
                    contactId: parseInt(contactId),
                    contactName: contactName,
                    contactPhone: contactPhone,
                    lastMessage: '',
                    lastMessageTime: new Date().toISOString(),
                    unreadCount: 0,
                    createdAt: new Date().toISOString()
                };
                chat = await apiRequest('/chats', {
                    method: 'POST',
                    body: JSON.stringify(chatData)
                });
                await refreshChatsList();
            }
            return chat;
        } catch (error) {
            console.error('Erreur lors de la création/récupération du chat:', error);
            return null;
        }
    }

    // Fonction pour sauvegarder un message
    async function saveMessage(chatId, messageText, sender = 'me') {
        try {
            const messageData = {
                chatId: parseInt(chatId),
                text: messageText,
                sender: sender,
                timestamp: new Date().toISOString(),
                status: 'sent'
            };
            const savedMessage = await apiRequest('/messages', {
                method: 'POST',
                body: JSON.stringify(messageData)
            });
            await apiRequest(`/chats/${chatId}`, {
                method: 'PATCH',
                body: JSON.stringify({
                    lastMessage: messageText,
                    lastMessageTime: new Date().toISOString()
                })
            });
            await refreshChatsList();
            return savedMessage;
        } catch (error) {
            console.error('Erreur lors de la sauvegarde du message:', error);
            return null;
        }
    }

    // Fonction pour charger les messages d'un chat
    async function loadMessages(chatId) {
        try {
            return await apiRequest(`/messages?chatId=${chatId}&_sort=timestamp&_order=asc`);
        } catch (error) {
            console.error('Erreur lors du chargement des messages:', error);
            return [];
        }
    }

    // Fonction pour rafraîchir la liste des chats dans la sidebar
    async function refreshChatsList() {
        try {
            const chats = await getChats();
            const chatListContainer = document.querySelector('#chatsList');
            if (chatListContainer) {
                let chatsHTML = '';
                chats.sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));
                chats.forEach(chat => {
                    const lastMessageTime = new Date(chat.lastMessageTime);
                    const timeString = lastMessageTime.toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                    chatsHTML += `
                        <div class="flex items-center p-3 hover:bg-gray-700 cursor-pointer border-b border-gray-600 chat-item" 
                             data-chat-id="${chat.id}" 
                             data-contact-id="${chat.contactId}"
                             data-contact-name="${chat.contactName}"
                             data-contact-phone="${chat.contactPhone}">
                            <div class="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                                <i class="fas fa-user text-white"></i>
                            </div>
                            <div class="flex-1 min-w-0">
                                <div class="flex justify-between items-center mb-1">
                                    <h3 class="text-white font-medium text-sm truncate">${chat.contactName}</h3>
                                    <span class="text-gray-400 text-xs">${timeString}</span>
                            </div>
                            <div class="flex justify-between items-center">
                                <p class="text-gray-400 text-sm truncate">${chat.lastMessage || 'Nouvelle conversation'}</p>
                                ${chat.unreadCount > 0 ? `<span class="bg-green-500 text-white text-xs rounded-full px-2 py-1 ml-2">${chat.unreadCount}</span>` : ''}
                            </div>
                        </div>
                    </div>
                `;
                });
                chatListContainer.innerHTML = chatsHTML;
                setupChatListeners();
            }
        } catch (error) {
            console.error('Erreur lors du rafraîchissement des chats:', error);
        }
    }

    // Fonction pour charger et afficher les contacts dans la vue "Nouvelle discussion"
    async function loadAndDisplayContacts() {
        try {
            const contacts = await getContacts();
            const bottomSection = document.querySelector('#newChatPanel .px-4.mt-8');
            if (bottomSection) {
                let contactsHTML = `<div class="text-gray-500 text-sm mb-4">#</div>`;
                if (contacts && contacts.length > 0) {
                    contactsHTML += `<div class="space-y-2">`;
                    contacts.forEach(contact => {
                        const displayName = contact.fullName || `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || contact.phone;
                        const phoneDisplay = `+${contact.country === 'SN' ? '221' : ''}${contact.phone}`;
                        contactsHTML += `
                            <div class="flex items-center py-2 cursor-pointer hover:bg-gray-800 rounded-lg px-2 transition-colors contact-item" 
                                 data-contact-id="${contact.id}"
                                 data-contact-name="${displayName}"
                                 data-contact-phone="${phoneDisplay}">
                                <div class="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                                    <i class="fas fa-user text-white text-sm"></i>
                                </div>
                                <div class="flex-1">
                                    <div class="text-gray-200 text-base font-medium">${displayName}</div>
                                    <div class="text-gray-400 text-sm">${phoneDisplay}</div>
                                </div>
                                <div class="text-gray-500 text-xs">
                                    <i class="fas fa-chevron-right"></i>
                                </div>
                            </div>
                        `;
                    });
                    contactsHTML += `</div>`;
                } else {
                    contactsHTML += `
                        <div class="text-gray-500 text-sm text-center py-4 italic">
                            Aucun contact ajouté pour le moment
                        </div>
                    `;
                }
                bottomSection.innerHTML = contactsHTML;
                setupContactClickListeners();
            }
        } catch (error) {
            console.error('Erreur lors du chargement des contacts:', error);
            const bottomSection = document.querySelector('#newChatPanel .px-4.mt-8');
            if (bottomSection) {
                bottomSection.innerHTML = `
                    <div class="text-gray-500 text-sm mb-4">#</div>
                    <div class="text-red-400 text-sm text-center py-4">
                        Erreur lors du chargement des contacts
                    </div>
                `;
            }
        }
    }

    // --- MENU CONTEXTUEL (menuBtn) ---
    const menuBtn = document.getElementById('menuBtn');
    const contextMenu = document.getElementById('contextMenu');

    if (menuBtn && contextMenu) {
        // Toggle menu on click
        menuBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            contextMenu.classList.toggle('hidden');
        });

        // Hide menu on click outside
        document.addEventListener('click', function(e) {
            if (!contextMenu.classList.contains('hidden')) {
                if (!contextMenu.contains(e.target) && e.target !== menuBtn) {
                    contextMenu.classList.add('hidden');
                }
            }
        });

        // Hide menu with Escape
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && !contextMenu.classList.contains('hidden')) {
                contextMenu.classList.add('hidden');
            }
        });
    }

    // --- NOUVEAU CHAT (newChatBtn) ---
    const newChatBtn = document.getElementById('newChatBtn');
    if (newChatBtn) {
        newChatBtn.addEventListener('click', function() {
            // Ici, tu peux ouvrir une modale ou afficher une alerte
            alert('Fonctionnalité "Nouveau chat" à implémenter (ouvre une modale de création de discussion)');
        });
    }

    // --- PARAMÈTRES (settingsIcon) ---
    const settingsIcon = document.getElementById('settingsIcon');
    if (settingsIcon) {
        settingsIcon.addEventListener('click', function() {
            // Ici, tu peux ouvrir une modale de paramètres
            alert('Fonctionnalité "Paramètres" à implémenter (ouvre une modale de paramètres utilisateur)');
        });
    }

    // --- AVATAR UTILISATEUR (dernier élément du sidebar) ---
    // On cible le dernier <img> dans la sidebar (avatar)
    const sidebar = document.querySelector('.h-full.w-20');
    if (sidebar) {
        const avatar = sidebar.querySelector('img.rounded-full');
        if (avatar) {
            avatar.addEventListener('click', function() {
                // Ici, tu peux ouvrir une modale de profil utilisateur
                alert('Fonctionnalité "Profil utilisateur" à implémenter (ouvre une modale de profil)');
            });
        }
    }

    // --- LOGOUT (Déconnexion) ---
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            // Ici, tu peux supprimer la session côté API/localStorage puis rediriger
            alert('Déconnexion... (à implémenter)');
            window.location.href = '/';
        });
    }

    // ...autres fonctionnalités existantes...
});