// JS principal pour la page chat (nécessaire pour éviter l'erreur MIME lors du déploiement Vercel)
// Ajoute ici ton code JS spécifique à la page chat si besoin.

console.log("chat.js chargé !");

// Configuration de l'API
const API_BASE_URL = 'https://projet-json-server-5.onrender.com';

// Fonctions utilitaires pour l'API
async function apiRequest(endpoint, options = {}) {
    try {
        console.log(`Requête API: ${API_BASE_URL}${endpoint}`, options);
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        console.log('Réponse API:', response.status, response.statusText);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Données reçues:', data);
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
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
        // Vérifier si un chat existe déjà avec ce contact
        const existingChats = await apiRequest('/chats');
        let chat = existingChats.find(c => c.contactId === parseInt(contactId));
        
        if (!chat && contactName && contactPhone) {
            // Créer un nouveau chat seulement si on a les informations du contact
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
            
            console.log('Nouveau chat créé:', chat);
            
            // Recharger la liste des chats dans la sidebar
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
        
        // Mettre à jour le dernier message du chat
        await apiRequest(`/chats/${chatId}`, {
            method: 'PATCH',
            body: JSON.stringify({
                lastMessage: messageText,
                lastMessageTime: new Date().toISOString()
            })
        });
        
        // Recharger la liste des chats pour mettre à jour l'aperçu
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
        const messages = await apiRequest(`/messages?chatId=${chatId}&_sort=timestamp&_order=asc`);
        return messages;
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
        
        if (chatListContainer && chats.length > 0) {
            let chatsHTML = '';
            
            // Trier les chats par date du dernier message
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
            
            // Réattacher les event listeners pour les chats
            setupChatListeners();
        }
    } catch (error) {
        console.error('Erreur lors du rafraîchissement des chats:', error);
    }
}

// Fonction pour charger et afficher les contacts dans la vue "Nouvelle discussion"
async function loadAndDisplayContacts() {
    try {
        console.log('Chargement des contacts...');
        const contacts = await getContacts();
        console.log('Contacts récupérés:', contacts);
        
        // Trouver la section avec le # (Bottom Section)
        const bottomSection = document.querySelector('#newChatPanel .px-4.mt-8');
        if (bottomSection) {
            let contactsHTML = `
                <div class="text-gray-500 text-sm mb-4">#</div>
            `;
            
            // Ajouter les contacts sauvegardés après le #
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
            
            // Ajouter les event listeners pour les contacts
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

document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM entièrement chargé !");

    // Sélection des éléments DOM
    const sidebarSettings = document.getElementById('sidebarSettings');
    const sidebarChats = document.getElementById('sidebarChats');
    const settingsIcon = document.getElementById('settingsIcon');
    const sidebarChatIcon = document.getElementById('sidebarChatIcon');
    const mainContent = document.querySelector('.flex-1.bg-gray-800.flex.items-center.justify-center');

    // Sauvegarde pour restauration
    let sidebarChatsBackup = null;
    let newChatBackup = null;

    // Charger les chats existants au démarrage
    refreshChatsList();

    // Fonction pour initialiser tous les event listeners
    function initializeEventListeners() {
        setupContextMenu();
        setupChatListeners();
        setupNewChatButton();
    }

    // Fonction pour gérer le menu contextuel
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

    // Fonction pour gérer le bouton nouvelle discussion
    function setupNewChatButton() {
        const newChatBtn = document.getElementById('newChatBtn');
        if (newChatBtn && sidebarChats) {
            const newNewChatBtn = newChatBtn.cloneNode(true);
            newChatBtn.parentNode.replaceChild(newNewChatBtn, newChatBtn);

            newNewChatBtn.addEventListener('click', function () {
                if (!sidebarChatsBackup) {
                    sidebarChatsBackup = sidebarChats.innerHTML;
                }
                
                showNewChatPanel();
            });
        }
    }

    // Fonction pour afficher le panel "Nouvelle discussion"
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
        
        // Charger les contacts depuis l'API
        setTimeout(() => {
            loadAndDisplayContacts();
        }, 500);
        
        setupNewChatListeners();
    }

    // Nouvelle discussion : bouton + (remplace sidebarChats)
    const newChatBtn = document.getElementById('newChatBtn');
    if (newChatBtn && sidebarChats) {
        newChatBtn.addEventListener('click', function () {
            if (!sidebarChatsBackup) {
                sidebarChatsBackup = sidebarChats.innerHTML;
            }
            
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
                    <!-- Contacts Section -->
                    <div class="px-4 mt-6">
                        <h2 class="text-gray-400 text-sm font-medium mb-4">Contacts sur WhatsApp</h2>
                        <div class="flex items-center py-2">
                            <div class="w-10 h-10 rounded-full overflow-hidden mr-4">
                                <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face" 
                                    alt="Profile" class="w-full h-full object-cover">
                            </div>
                            <div class="flex-1">
                                <div class="text-gray-200 text-base">BACHIR IIR💻🏠 (vous)</div>
                                <div class="text-gray-400 text-sm">Envoyez-vous un message</div>
                            </div>
                        </div>
                    </div>
                    <!-- Bottom Section -->
                    <div class="px-4 mt-8">
                        <div class="text-gray-500 text-sm">#</div>
                    </div>
                </div>
            `;
            
            sidebarChats.innerHTML = newChatHTML;
            newChatBackup = newChatHTML; // Sauvegarder la vue "Nouvelle discussion"
            
            // Bouton retour vers la liste des chats
            const backBtn = document.getElementById('backToChats');
            if (backBtn) {
                backBtn.addEventListener('click', function () {
                    if (sidebarChatsBackup) {
                        sidebarChats.innerHTML = sidebarChatsBackup;
                        // Réinitialiser les event listeners pour les chats
                        setupChatListeners();
                    }
                });
            }

            // Gestion du clic sur "Nouveau contact"
            const addContactBtn = document.getElementById('addContactBtn');
            if (addContactBtn) {
                addContactBtn.addEventListener('click', function () {
                    // Remplacer par la vue "Nouveau contact"
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
                });
            }
        });
    }
    
    // Fonction pour réattacher les event listeners de "Nouvelle discussion"
    function setupNewChatListeners() {
        const backBtn = document.getElementById('backToChats');
        if (backBtn) {
            backBtn.addEventListener('click', function () {
                if (sidebarChatsBackup) {
                    sidebarChats.innerHTML = sidebarChatsBackup;
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

    // Fonction pour afficher le panel "Nouveau contact"
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
                            </svg>
                            <span class="text-gray-400 text-sm">Prénom</span>
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

    // Fonction pour gérer les listeners de la vue "Nouveau contact"
    function setupAddContactListeners() {
        // Bouton retour vers "Nouvelle discussion"
        const backToNewChat = document.getElementById('backToNewChat');
        if (backToNewChat) {
            backToNewChat.addEventListener('click', function () {
                showNewChatPanel();
            });
        }
        
        // Gestion de la sauvegarde du contact
        const saveContactBtn = document.getElementById('saveContactBtn');
        if (saveContactBtn) {
            saveContactBtn.addEventListener('click', async function () {
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
                
                // Désactiver le bouton pendant la sauvegarde
                saveContactBtn.disabled = true;
                saveContactBtn.textContent = 'Sauvegarde en cours...';
                saveContactBtn.classList.add('opacity-50');
                
                try {
                    // Préparer les données du contact
                    const contactData = {
                        phone: phoneNumber,
                        country: "SN",
                        firstName: firstName,
                        lastName: lastName,
                        fullName: `${firstName} ${lastName}`.trim(),
                        createdAt: new Date().toISOString()
                    };
                    
                    console.log('Données à sauvegarder:', contactData);
                    
                    // Sauvegarder via l'API
                    const savedContact = await saveContact(contactData);
                    
                    console.log('Contact sauvegardé:', savedContact);
                    alert(`Contact ${firstName} ${lastName} ajouté avec succès !`);
                    
                    // Retourner à la vue "Nouvelle discussion" et recharger les contacts
                    showNewChatPanel();
                    
                } catch (error) {
                    console.error('Erreur lors de la sauvegarde:', error);
                    alert('Erreur lors de la sauvegarde du contact. Veuillez réessayer.');
                } finally {
                    // Réactiver le bouton
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
                
                console.log('Contact sélectionné:', { contactId, contactName, contactPhone });
                
                // Créer ou récupérer le chat avec ce contact
                const chat = await createOrGetChat(contactId, contactName, contactPhone);
                
                // Afficher l'interface de chat
                if (mainContent) {
                    mainContent.innerHTML = createChatInterface(contactName, null, 'bg-blue-500', contactId);
                    setupChatInterface(contactId);
                }
                
                // Retourner à la vue principale des chats
                if (sidebarChatsBackup) {
                    sidebarChats.innerHTML = sidebarChatsBackup;
                    setTimeout(() => {
                        refreshChatsList(); // Recharger la liste avec le nouveau chat
                        initializeEventListeners();
                    }, 100);
                }
            });
        });
    }

    // Fonction pour gérer les clics sur les chats existants
    function setupChatListeners() {
        const chatItems = document.querySelectorAll('.chat-item');

        chatItems.forEach(chatItem => {
            chatItem.addEventListener('click', async () => {
                const chatId = chatItem.getAttribute('data-chat-id');
                const contactId = chatItem.getAttribute('data-contact-id');
                const contactName = chatItem.getAttribute('data-contact-name');
                const contactPhone = chatItem.getAttribute('data-contact-phone');
                
                console.log('Chat sélectionné:', { chatId, contactId, contactName });
                
                // Afficher l'interface de chat
                if (mainContent) {
                    mainContent.innerHTML = createChatInterface(contactName, null, 'bg-blue-500', contactId);
                    setupChatInterface(contactId);
                }
            });
        });
    }

    // Fonction pour créer l'interface de chat
    function createChatInterface(contactName, avatarSrc, bgColor, contactId = null) {
        return `
            <div class="flex-1 flex flex-col h-full" data-contact-id="${contactId}">
                <!-- Chat Header -->
                <div class="bg-gray-800 p-3 flex items-center justify-between border-b border-gray-700">
                    <div class="flex items-center space-x-3">
                        <div class="w-10 h-10 ${bgColor} rounded-full flex items-center justify-center overflow-hidden">
                            ${avatarSrc ? 
                                `<img src="${avatarSrc}" alt="Profile" class="w-full h-full object-cover">` : 
                                `<i class="fas fa-user text-gray-400"></i>`
                            }
                        </div>
                        <div>
                            <div class="text-white text-sm font-medium">${contactName}</div>
                            <div class="text-gray-400 text-xs">cliquez ici pour les informations du contact</div>
                        </div>
                    </div>
                    <div class="flex space-x-2">
                        <div class="p-2 rounded-full hover:bg-gray-600 cursor-pointer">
                            <i class="fas fa-search text-gray-400 text-sm"></i>
                        </div>
                        <div class="p-2 rounded-full hover:bg-gray-600 cursor-pointer">
                            <i class="fas fa-ellipsis-v text-gray-400 text-sm"></i>
                        </div>
                    </div>
                </div>

                <!-- Messages Area -->
                <div class="flex-1 bg-gray-900 overflow-y-auto relative" id="messagesContainer">
                    <div class="p-6 space-y-4" id="messagesArea">
                        <!-- Day Separator -->
                        <div class="flex justify-center my-6">
                            <div class="bg-gray-800 bg-opacity-80 text-gray-400 text-xs px-3 py-1.5 rounded-xl">Aujourd'hui</div>
                        </div>
                        
                        <!-- Les messages seront chargés ici -->
                        <div class="text-center text-gray-500 text-sm py-4">
                            Chargement des messages...
                        </div>
                    </div>
                </div>

                <!-- Message Input Area -->
                <div class="bg-gray-800 p-4 border-t border-gray-700">
                    <div class="flex items-center space-x-3">
                        <div class="p-2 rounded-full hover:bg-gray-600 cursor-pointer">
                            <i class="fas fa-plus text-gray-400 text-lg"></i>
                        </div>
                        <div class="flex-1 relative">
                            <div class="bg-gray-700 rounded-lg px-4 py-3 flex items-center">
                                <input 
                                    type="text" 
                                    id="messageInput"
                                    placeholder="Entrez un message"
                                    class="flex-1 bg-transparent text-white text-sm outline-none placeholder-gray-400"
                                >
                                <i class="fas fa-face-smile text-gray-400 text-lg cursor-pointer hover:text-gray-300 ml-3"></i>
                            </div>
                        </div>
                        <div class="p-2 rounded-full hover:bg-gray-600 cursor-pointer" id="sendButton">
                            <i class="fas fa-paper-plane text-gray-400 text-lg"></i>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Fonction pour configurer l'interface de chat
    function setupChatInterface(contactId = null) {
        const messageInput = document.getElementById('messageInput');
        const sendButton = document.getElementById('sendButton');
        const messagesArea = document.getElementById('messagesArea');
        const messagesContainer = document.getElementById('messagesContainer');

        // Charger les messages existants
        if (contactId) {
            loadChatMessages(contactId);
        }

        if (messageInput && sendButton && messagesArea) {
            async function sendMessage() {
                const messageText = messageInput.value.trim();
                if (messageText && contactId) {
                    // Désactiver temporairement l'input
                    messageInput.disabled = true;
                    sendButton.style.opacity = '0.5';
                    
                    try {
                        // Récupérer ou créer le chat
                        const chats = await getChats();
                        let chat = chats.find(c => c.contactId === parseInt(contactId));
                        
                        if (chat) {
                            // Sauvegarder le message
                            await saveMessage(chat.id, messageText, 'me');
                            
                            // Ajouter le message à l'interface
                            const messageElement = document.createElement('div');
                            messageElement.className = 'flex justify-end mb-4';
                            messageElement.innerHTML = `
                                <div class="max-w-xs">
                                    <div class="bg-green-600 rounded-lg p-3 relative">
                                        <div class="absolute top-0 -right-2 w-0 h-0 border-l-8 border-l-green-600 border-t-8 border-t-transparent"></div>
                                        <div class="text-white text-sm">${messageText}</div>
                                    </div>
                                    <div class="flex justify-end items-center mt-1">
                                        <span class="text-gray-500 text-xs">${new Date().toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})}</span>
                                        <i class="fas fa-check text-gray-400 text-sm ml-1"></i>
                                    </div>
                                </div>
                            `;
                            
                            // Supprimer le message "Chargement des messages..." s'il existe
                            const loadingMessage = messagesArea.querySelector('.text-center.text-gray-500');
                            if (loadingMessage) {
                                loadingMessage.remove();
                            }
                            
                            messagesArea.appendChild(messageElement);
                            messageInput.value = '';
                            messagesContainer.scrollTop = messagesContainer.scrollHeight;
                            
                            // Simuler une réponse automatique après 2 secondes
                            setTimeout(async () => {
                                await saveMessage(chat.id, `Merci pour votre message : "${messageText}"`, 'contact');
                                
                                const responseElement = document.createElement('div');
                                responseElement.className = 'flex justify-start mb-4';
                                responseElement.innerHTML = `
                                    <div class="max-w-xs">
                                        <div class="bg-gray-700 rounded-lg p-3 relative">
                                            <div class="absolute top-0 -left-2 w-0 h-0 border-r-8 border-r-gray-700 border-t-8 border-t-transparent"></div>
                                            <div class="text-white text-sm">Merci pour votre message : "${messageText}"</div>
                                        </div>
                                        <div class="flex justify-start items-center mt-1">
                                            <span class="text-gray-500 text-xs">${new Date().toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})}</span>
                                        </div>
                                    </div>
                                `;
                                
                                messagesArea.appendChild(responseElement);
                                messagesContainer.scrollTop = messagesContainer.scrollHeight;
                            }, 2000);
                        }
                        
                    } catch (error) {
                        console.error('Erreur lors de l\'envoi du message:', error);
                        alert('Erreur lors de l\'envoi du message');
                    } finally {
                        // Réactiver l'input
                        messageInput.disabled = false;
                        sendButton.style.opacity = '1';
                    }
                }
            }

            // Event listeners pour l'envoi de messages
            sendButton.addEventListener('click', sendMessage);
            messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    sendMessage();
                }
            });
        }
    }

    // Fonction pour charger et afficher les messages d'un chat
    async function loadChatMessages(contactId) {
        try {
            // Récupérer le chat
            const chats = await getChats();
            const chat = chats.find(c => c.contactId === parseInt(contactId));
            
            const messagesArea = document.getElementById('messagesArea');
            const messagesContainer = document.getElementById('messagesContainer');
            
            if (chat) {
                // Charger les messages
                const messages = await loadMessages(chat.id);
                
                if (messagesArea) {
                    // Supprimer le message de chargement
                    messagesArea.innerHTML = `
                        <div class="flex justify-center my-6">
                            <div class="bg-gray-800 bg-opacity-80 text-gray-400 text-xs px-3 py-1.5 rounded-xl">Aujourd'hui</div>
                        </div>
                    `;
                    
                    if (messages.length > 0) {
                        // Afficher les messages
                        messages.forEach(message => {
                            const messageElement = document.createElement('div');
                            const isMyMessage = message.sender === 'me';
                            
                            messageElement.className = `flex ${isMyMessage ? 'justify-end' : 'justify-start'} mb-4`;
                            messageElement.innerHTML = `
                                <div class="max-w-xs">
                                    <div class="${isMyMessage ? 'bg-green-600' : 'bg-gray-700'} rounded-lg p-3 relative">
                                        <div class="absolute top-0 ${isMyMessage ? '-right-2 w-0 h-0 border-l-8 border-l-green-600' : '-left-2 w-0 h-0 border-r-8 border-r-gray-700'} border-t-8 border-t-transparent"></div>
                                        <div class="text-white text-sm">${message.text}</div>
                                    </div>
                                    <div class="flex ${isMyMessage ? 'justify-end' : 'justify-start'} items-center mt-1">
                                        <span class="text-gray-500 text-xs">${new Date(message.timestamp).toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})}</span>
                                        ${isMyMessage ? '<i class="fas fa-check text-gray-400 text-sm ml-1"></i>' : ''}
                                    </div>
                                </div>
                            `;
                            
                            messagesArea.appendChild(messageElement);
                        });
                        
                        // Scroll vers le bas
                        if (messagesContainer) {
                            messagesContainer.scrollTop = messagesContainer.scrollHeight;
                        }
                    } else {
                        // Aucun message, afficher un message d'accueil
                        messagesArea.innerHTML += `
                            <div class="text-center text-gray-500 text-sm py-8">
                                <i class="fas fa-comments text-4xl mb-4 text-gray-600"></i>
                                <p>Commencez une conversation avec ce contact</p>
                            </div>
                        `;
                    }
                }
            } else {
                // Aucun chat trouvé, afficher un message d'accueil
                if (messagesArea) {
                    messagesArea.innerHTML = `
                        <div class="flex justify-center my-6">
                            <div class="bg-gray-800 bg-opacity-80 text-gray-400 text-xs px-3 py-1.5 rounded-xl">Aujourd'hui</div>
                        </div>
                        <div class="text-center text-gray-500 text-sm py-8">
                            <i class="fas fa-comments text-4xl mb-4 text-gray-600"></i>
                            <p>Commencez une conversation avec ce contact</p>
                        </div>
                    `;
                }
            }
        } catch (error) {
            console.error('Erreur lors du chargement des messages:', error);
        }
    }

    // Gestion des paramètres
    if (settingsIcon && sidebarSettings && sidebarChats) {
        settingsIcon.addEventListener('click', () => {
            if (!sidebarChatsBackup) {
                sidebarChatsBackup = sidebarChats.innerHTML;
            }
            sidebarChats.classList.add('hidden');
            sidebarSettings.classList.remove('hidden');
        });
    }

    // Bouton retour vers la liste des chats depuis les paramètres
    if (sidebarChatIcon && sidebarSettings && sidebarChats) {
        sidebarChatIcon.addEventListener('click', () => {
            sidebarSettings.classList.add('hidden');
            sidebarChats.classList.remove('hidden');
            
            // Réinitialiser tous les event listeners après le retour
            setTimeout(() => {
                refreshChatsList();
                initializeEventListeners();
            }, 100);
        });
    }

    // Gestion déconnexion depuis les paramètres
    const settingsLogout = document.getElementById('settingsLogout');
    if (settingsLogout) {
        settingsLogout.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
                window.location.href = '/';
            }
        });
    }

    // Initialiser tous les event listeners au chargement
    initializeEventListeners();
});

export {};