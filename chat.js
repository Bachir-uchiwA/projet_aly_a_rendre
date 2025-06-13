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

    function setupNewChatButton() {
        const newChatBtn = document.getElementById('newChatBtn');
        if (newChatBtn && sidebarChats) {
            const newNewChatBtn = newChatBtn.cloneNode(true);
            newChatBtn.parentNode.replaceChild(newNewChatBtn, newChatBtn);
            newNewChatBtn.addEventListener('click', function () {
                if (!window.sidebarChatsBackup) {
                    window.sidebarChatsBackup = sidebarChats.innerHTML;
                }
                showNewChatPanel();
            });
        }
    }

    function showNewChatPanel() {
        const newChatHTML = `
            <div class="flex flex-col h-full bg-gray-900" id="newChatPanel">
                <!-- Header -->
                <div class="flex items-center p-4 bg-gray-800">
                    <button id="backToChats" class="mr-4 focus:outline-none">
                        <i class="fas fa-arrow-left text-gray-300 text-xl"></i>
                    </button>
                    <h1 class="text-lg font-medium text-gray-200">Nouvelle discussion</h1>
                </div>
                <!-- Search Bar -->
                <div class="px-4 py-3">
                    <div class="relative">
                        <i class="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm"></i>
                        <input type="text" placeholder="Rechercher un nom ou un numéro" 
                            class="w-full bg-gray-800 text-gray-300 pl-10 pr-4 py-2 rounded-lg placeholder-gray-500 text-sm border-none focus:outline-none focus:ring-1 focus:ring-green-500">
                    </div>
                </div>
                <!-- Action Items -->
                <div class="px-4">
                    <div class="flex items-center py-3 cursor-pointer hover:bg-gray-800 rounded-lg" id="addContactBtn">
                        <div class="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mr-4">
                            <i class="fas fa-user-plus text-white text-sm"></i>
                        </div>
                        <span class="text-gray-200 text-base">Nouveau contact</span>
                    </div>
                    <div class="flex items-center py-3 cursor-pointer hover:bg-gray-800 rounded-lg">
                        <div class="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mr-4">
                            <i class="fas fa-users text-white text-sm"></i>
                        </div>
                        <span class="text-gray-200 text-base">Nouveau groupe</span>
                    </div>
                    <div class="flex items-center py-3 cursor-pointer hover:bg-gray-800 rounded-lg">
                        <div class="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mr-4">
                            <i class="fas fa-users text-white text-sm"></i>
                        </div>
                        <span class="text-gray-200 text-base">Nouvelle communauté</span>
                    </div>
                </div>
                <!-- Bottom Section avec # et contacts -->
                <div class="px-4 mt-8 flex-1 overflow-y-auto">
                    <div class="text-gray-500 text-sm text-center py-4">
                        Chargement des contacts...
                    </div>
                </div>
            </div>
        `;
        sidebarChats.innerHTML = newChatHTML;
        newChatBackup = newChatHTML;
        setTimeout(() => {
            loadAndDisplayContacts();
        }, 500);
        setupNewChatListeners();
    }

    function setupNewChatListeners() {
        const backBtn = document.getElementById('backToChats');
        if (backBtn) {
            backBtn.addEventListener('click', function () {
                if (window.sidebarChatsBackup) {
                    sidebarChats.innerHTML = window.sidebarChatsBackup;
                    setTimeout(() => {
                        initializeEventListeners();
                    }, 100);
                }
            });
        }
        const addContactBtn = document.getElementById('addContactBtn');
        if (addContactBtn) {
            addContactBtn.addEventListener('click', function () {
                showAddContactPanel();
            });
        }
    }

    function showAddContactPanel() {
        sidebarChats.innerHTML = `
            <div class="flex flex-col h-full bg-gray-900" id="addContactPanel">
                <!-- Header -->
                <div class="flex items-center px-4 py-6">
                    <button id="backToNewChat" class="mr-4 text-gray-300 hover:text-white transition-colors">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                        </svg>
                    </button>
                    <h1 class="text-lg text-gray-300 font-normal">Nouveau contact</h1>
                </div>
                <!-- Form -->
                <div class="px-6 pt-8 space-y-12">
                    <!-- Prénom -->
                    <div class="relative">
                        <div class="flex items-center mb-4">
                            <svg class="w-5 h-5 text-gray-500 mr-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"></path>
                        </div>
                        <input 
                            type="text" 
                            id="firstName"
                            class="w-full bg-transparent border-0 border-b border-gray-600 focus:border-gray-500 outline-none pb-3 text-white text-lg"
                            placeholder="Entrez le prénom"
                        >
                    </div>
                    <!-- Nom -->
                    <div class="relative">
                        <div class="mb-4">
                            <span class="text-gray-400 text-sm">Nom</span>
                        </div>
                        <input 
                            type="text" 
                            id="lastName"
                            class="w-full bg-transparent border-0 border-b border-gray-600 focus:border-gray-500 outline-none pb-3 text-white text-lg"
                            placeholder="Entrez le nom"
                        >
                    </div>
                    <!-- Téléphone -->
                    <div class="relative">
                        <div class="flex items-center mb-4">
                            <svg class="w-5 h-5 text-gray-500 mr-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"></path>
                            </svg>
                            <div class="flex space-x-20">
                                <span class="text-gray-400 text-sm">Pays</span>
                                <span class="text-gray-400 text-sm">Téléphone</span>
                            </div>
                        </div>
                        <div class="flex items-center space-x-6">
                            <div class="flex items-center cursor-pointer hover:bg-gray-800 rounded px-2 py-1">
                                <span class="text-white text-lg mr-2">SN +221</span>
                                <svg class="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                                </svg>
                            </div>
                            <div class="flex-1">
                                <input 
                                    type="tel" 
                                    id="phoneNumber"
                                    class="w-full bg-transparent border-0 border-b border-gray-600 focus:border-gray-500 outline-none pb-3 text-white text-lg"
                                    placeholder="Numéro de téléphone"
                                >
                            </div>
                        </div>
                    </div>
                    <!-- Bouton Sauvegarder -->
                    <div class="pt-8">
                        <button id="saveContactBtn" class="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium transition-colors">
                            Sauvegarder le contact
                        </button>
                    </div>
                </div>
            </div>
        `;
        setupAddContactListeners();
    }

    function setupAddContactListeners() {
        const backToNewChat = document.getElementById('backToNewChat');
        if (backToNewChat) {
            backToNewChat.addEventListener('click', function () {
                showNewChatPanel();
            });
        }
        const saveContactBtn = document.getElementById('saveContactBtn');
        if (saveContactBtn) {
            saveContactBtn.addEventListener('click', async function (e) {
                e.preventDefault();
                const firstName = document.getElementById('firstName').value.trim();
                const lastName = document.getElementById('lastName').value.trim();
                const phoneNumber = document.getElementById('phoneNumber').value.trim();
                if (!firstName && !lastName) {
                    alert('Veuillez entrer au moins un prénom ou un nom.');
                    return;
                }
                if (!phoneNumber) {
                    alert('Veuillez entrer un numéro de téléphone.');
                    return;
                }
                saveContactBtn.disabled = true;
                saveContactBtn.textContent = 'Sauvegarde en cours...';
                saveContactBtn.classList.add('opacity-50');
                try {
                    const contactData = {
                        phone: phoneNumber,
                        country: "SN",
                        firstName: firstName,
                        lastName: lastName,
                        fullName: `${firstName} ${lastName}`.trim(),
                        createdAt: new Date().toISOString()
                    };
                    await saveContact(contactData);
                    alert(`Contact ${firstName} ${lastName} ajouté avec succès !`);
                    showNewChatPanel();
                } catch (error) {
                    alert('Erreur lors de la sauvegarde du contact. Veuillez réessayer.');
                } finally {
                    saveContactBtn.disabled = false;
                    saveContactBtn.textContent = 'Sauvegarder le contact';
                    saveContactBtn.classList.remove('opacity-50');
                }
            });
        }
    }

    // Fonction pour gérer les clics sur les contacts
    function setupContactClickListeners() {
        const contactItems = document.querySelectorAll('.contact-item');
        contactItems.forEach(contactItem => {
            contactItem.addEventListener('click', async () => {
                const contactId = contactItem.getAttribute('data-contact-id');
                const contactName = contactItem.getAttribute('data-contact-name');
                const contactPhone = contactItem.getAttribute('data-contact-phone');
                const chat = await createOrGetChat(contactId, contactName, contactPhone);
                const mainContent = document.querySelector('.flex-1.bg-gray-800.flex.items-center.justify-center');
                if (chat) {
                    const chatInterface = createChatInterface(contactName, chat.lastMessage, 'bg-green-500', chat.id);
                    mainContent.innerHTML = chatInterface;
                    setupChatInterface(chat.id);
                }
                sidebarChats.classList.add('hidden');
                mainContent.classList.remove('hidden');
            });
        });
    }

    // Exemple de chargement des contacts (à adapter selon ton backend)
    async function loadContacts() {
        const contacts = await apiRequest('/contacts');
        if (!contacts) return;
        const sidebar = document.getElementById('sidebarChats');
        let contactsHTML = '';
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
        sidebar.innerHTML = contactsHTML;
        setupContactClickListeners();
    }

    // Gestion du menu contextuel (menuBtn)
    const menuBtn = document.getElementById('menuBtn');
    const contextMenu = document.getElementById('contextMenu');
    if (menuBtn && contextMenu) {
        menuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            contextMenu.classList.toggle('hidden');
        });
        document.addEventListener('click', (e) => {
            if (!contextMenu.classList.contains('hidden')) {
                contextMenu.classList.add('hidden');
            }
        });
        contextMenu.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    // Gestion du bouton déconnexion
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // Supprime la session locale (à adapter selon ton système)
            // window.localStorage.removeItem('sessionId');
            window.location.href = '/';
        });
    }

    // Gestion du bouton "Nouveau chat"
    const newChatBtn = document.getElementById('newChatBtn');
    if (newChatBtn) {
        newChatBtn.addEventListener('click', () => {
            // ...ouvre une modale ou un formulaire pour créer un nouveau chat...
            alert('Fonctionnalité Nouveau chat à implémenter');
        });
    }

    // Chargement initial des contacts
    loadContacts();
});