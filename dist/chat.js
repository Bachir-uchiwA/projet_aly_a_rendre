// JS principal pour la page chat
console.log("chat.js chargé !");

const API_BASE_URL = 'https://projet-json-server-5.onrender.com';
let currentChatId = null;
let currentChatName = '';

document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM entièrement chargé !");
    const settingsIcon = document.getElementById('settingsIcon');
    const sidebarChats = document.getElementById('sidebarChats');
    const sidebarSettings = document.getElementById('sidebarSettings');
    const sidebarChatIcon = document.getElementById('sidebarChatIcon');
    const newChatBtn = document.getElementById('newChatBtn');

    // Gestion des paramètres (code existant)
    if (settingsIcon && sidebarChats && sidebarSettings) {
        settingsIcon.addEventListener('click', () => {
            console.log("Clic sur settingsIcon");
            sidebarChats.classList.add('hidden');
            sidebarSettings.classList.remove('hidden');
        });
    }
    
    if (sidebarChatIcon && sidebarChats && sidebarSettings) {
        sidebarChatIcon.addEventListener('click', () => {
            console.log("Clic sur sidebarChatIcon");
            sidebarSettings.classList.add('hidden');
            sidebarChats.classList.remove('hidden');
        });
    }

    // Gestion menu contextuel (code existant)
    const menuBtn = document.getElementById('menuBtn');
    const contextMenu = document.getElementById('contextMenu');

    if (menuBtn && contextMenu) {
        menuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            contextMenu.classList.toggle('hidden');
        });

        document.addEventListener('click', (e) => {
            if (!contextMenu.classList.contains('hidden')) {
                if (!contextMenu.contains(e.target) && e.target !== menuBtn) {
                    contextMenu.classList.add('hidden');
                }
            }
        });
    }

    // Gestion de l'ajout de contacts
    if (newChatBtn) {
        newChatBtn.addEventListener('click', () => {
            showAddContactModal();
        });
    }

    // Charger les contacts au démarrage
    loadContacts();
    
    // Ajouter les event listeners pour les chats existants
    addChatClickListeners();
});

// Fonction pour ajouter les event listeners aux chats
function addChatClickListeners() {
    const chatElements = document.querySelectorAll('.flex.items-center.p-3.hover\\:bg-gray-700.cursor-pointer.border-gray-600');
    
    chatElements.forEach(chatElement => {
        chatElement.addEventListener('click', () => {
            const nameElement = chatElement.querySelector('.text-white.font-medium.text-sm.truncate');
            if (nameElement) {
                const chatName = nameElement.textContent;
                const chatId = chatElement.dataset.chatId || generateChatId(chatName);
                openChat(chatId, chatName);
            }
        });
    });
}

// Fonction pour ouvrir une conversation
function openChat(chatId, chatName) {
    currentChatId = chatId;
    currentChatName = chatName;
    
    // Cacher la zone d'accueil et afficher la zone de chat
    const welcomeArea = document.querySelector('.flex-1.bg-gray-800.flex.items-center.justify-center');
    const chatArea = createChatArea(chatName);
    
    if (welcomeArea) {
        welcomeArea.style.display = 'none';
        welcomeArea.parentNode.appendChild(chatArea);
    }
    
    // Charger les messages de cette conversation
    loadMessages(chatId);
}

// Fonction pour créer la zone de chat
function createChatArea(chatName) {
    const chatArea = document.createElement('div');
    chatArea.className = 'flex-1 flex flex-col h-full';
    chatArea.id = 'chatArea';
    
    chatArea.innerHTML = `
        <!-- En-tête du chat -->
        <div class="bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between">
            <div class="flex items-center space-x-3">
                <div class="w-10 h-10 bg-gray-600 rounded-full overflow-hidden">
                    <img src="${generateDefaultAvatar(chatName)}" alt="Profile" class="w-full h-full object-cover">
                </div>
                <div>
                    <h3 class="text-white font-medium">${chatName}</h3>
                    <p class="text-gray-400 text-sm">En ligne</p>
                </div>
            </div>
            <div class="flex items-center space-x-4 text-gray-400">
                <button class="hover:text-white transition-colors">
                    <i class="fas fa-search"></i>
                </button>
                <button class="hover:text-white transition-colors">
                    <i class="fas fa-phone"></i>
                </button>
                <button class="hover:text-white transition-colors">
                    <i class="fas fa-video"></i>
                </button>
                <button class="hover:text-white transition-colors">
                    <i class="fas fa-ellipsis-v"></i>
                </button>
            </div>
        </div>

        <!-- Zone des messages -->
        <div class="flex-1 overflow-y-auto p-4 bg-gray-900" id="messagesContainer">
            <div class="text-center text-gray-500 text-sm mb-4">
                Début de votre conversation avec ${chatName}
            </div>
        </div>

        <!-- Zone de saisie -->
        <div class="bg-gray-800 border-t border-gray-700 p-4">
            <div class="flex items-center space-x-3">
                <button class="text-gray-400 hover:text-white transition-colors">
                    <i class="fas fa-paperclip"></i>
                </button>
                <div class="flex-1 relative">
                    <input 
                        type="text" 
                        id="messageInput"
                        placeholder="Tapez un message..." 
                        class="w-full bg-gray-700 text-white rounded-full px-4 py-2 pr-12 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                    <button class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors">
                        <i class="fas fa-smile"></i>
                    </button>
                </div>
                <button id="sendButton" class="bg-green-600 hover:bg-green-700 text-white rounded-full p-2 transition-colors">
                    <i class="fas fa-paper-plane"></i>
                </button>
            </div>
        </div>
    `;
    
    // Ajouter les event listeners pour l'envoi de messages
    const messageInput = chatArea.querySelector('#messageInput');
    const sendButton = chatArea.querySelector('#sendButton');
    
    sendButton.addEventListener('click', () => sendMessage());
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    return chatArea;
}

// Fonction pour envoyer un message
async function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const messageText = messageInput.value.trim();
    
    if (!messageText || !currentChatId) return;
    
    const message = {
        id: Date.now().toString(),
        chatId: currentChatId,
        text: messageText,
        timestamp: new Date().toISOString(),
        sender: 'me',
        type: 'text'
    };
    
    try {
        // Sauvegarder le message
        await saveMessage(message);
        
        // Afficher le message dans l'interface
        displayMessage(message);
        
        // Vider le champ de saisie
        messageInput.value = '';
        
        // Mettre à jour la liste des contacts (remonter en haut)
        await updateContactLastMessage(currentChatId, messageText);
        
    } catch (error) {
        console.error('Erreur lors de l\'envoi du message:', error);
        showNotification('Erreur lors de l\'envoi du message', 'error');
    }
}

// Fonction pour sauvegarder un message
async function saveMessage(message) {
    const response = await fetch(`${API_BASE_URL}/messages`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(message)
    });
    
    if (!response.ok) {
        throw new Error('Erreur lors de la sauvegarde du message');
    }
}

// Fonction pour afficher un message dans l'interface
function displayMessage(message) {
    const messagesContainer = document.getElementById('messagesContainer');
    if (!messagesContainer) return;
    
    const messageElement = document.createElement('div');
    messageElement.className = `flex ${message.sender === 'me' ? 'justify-end' : 'justify-start'} mb-4`;
    
    const time = new Date(message.timestamp).toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    messageElement.innerHTML = `
        <div class="max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
            message.sender === 'me' 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-700 text-white'
        }">
            <p class="text-sm">${message.text}</p>
            <p class="text-xs opacity-70 mt-1">${time}</p>
        </div>
    `;
    
    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Fonction pour charger les messages d'une conversation
async function loadMessages(chatId) {
    try {
        const response = await fetch(`${API_BASE_URL}/messages?chatId=${chatId}`);
        if (response.ok) {
            const messages = await response.json();
            const messagesContainer = document.getElementById('messagesContainer');
            
            if (messagesContainer) {
                // Garder seulement le message de début de conversation
                const welcomeMessage = messagesContainer.querySelector('.text-center');
                messagesContainer.innerHTML = '';
                if (welcomeMessage) {
                    messagesContainer.appendChild(welcomeMessage);
                }
                
                // Afficher tous les messages
                messages.forEach(message => displayMessage(message));
            }
        }
    } catch (error) {
        console.error('Erreur lors du chargement des messages:', error);
    }
}

// Fonction pour mettre à jour le dernier message d'un contact
async function updateContactLastMessage(chatId, lastMessage) {
    try {
        // Récupérer le contact
        const response = await fetch(`${API_BASE_URL}/contacts/${chatId}`);
        if (response.ok) {
            const contact = await response.json();
            
            // Mettre à jour les informations
            contact.lastMessage = lastMessage;
            contact.timestamp = new Date().toLocaleTimeString('fr-FR', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
            contact.lastActivity = new Date().toISOString();
            
            // Sauvegarder les modifications
            await fetch(`${API_BASE_URL}/contacts/${chatId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(contact)
            });
            
            // Recharger et réorganiser la liste des contacts
            loadContacts();
        }
    } catch (error) {
        console.error('Erreur lors de la mise à jour du contact:', error);
    }
}

// Fonction pour afficher le modal d'ajout de contact
function showAddContactModal() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-gray-800 rounded-lg p-6 w-96 max-w-md mx-4">
            <h3 class="text-white text-lg font-semibold mb-4">Ajouter un nouveau contact</h3>
            <form id="addContactForm">
                <div class="mb-4">
                    <label class="block text-gray-300 text-sm mb-2">Nom</label>
                    <input type="text" id="contactName" class="w-full bg-gray-700 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500" required>
                </div>
                <div class="mb-4">
                    <label class="block text-gray-300 text-sm mb-2">Numéro de téléphone</label>
                    <input type="tel" id="contactPhone" class="w-full bg-gray-700 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500" required>
                </div>
                <div class="mb-6">
                    <label class="block text-gray-300 text-sm mb-2">Photo (URL optionnelle)</label>
                    <input type="url" id="contactPhoto" class="w-full bg-gray-700 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500">
                </div>
                <div class="flex justify-end space-x-3">
                    <button type="button" id="cancelBtn" class="px-4 py-2 text-gray-300 hover:text-white">Annuler</button>
                    <button type="submit" class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Ajouter</button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    const form = modal.querySelector('#addContactForm');
    const cancelBtn = modal.querySelector('#cancelBtn');
    
    cancelBtn.addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await addContact();
        document.body.removeChild(modal);
    });
}

// Fonction pour ajouter un contact au JSON server
async function addContact() {
    const name = document.getElementById('contactName').value;
    const phone = document.getElementById('contactPhone').value;
    const photo = document.getElementById('contactPhoto').value || generateDefaultAvatar(name);
    
    const newContact = {
        id: Date.now().toString(),
        name: name,
        phone: phone,
        photo: photo,
        lastMessage: "Nouveau contact ajouté",
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        lastActivity: new Date().toISOString(),
        unreadCount: 0,
        isOnline: false
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/contacts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newContact)
        });
        
        if (response.ok) {
            console.log('Contact ajouté avec succès');
            loadContacts(); // Recharger la liste
            showNotification('Contact ajouté avec succès!', 'success');
            
            // Ouvrir automatiquement la conversation avec le nouveau contact
            setTimeout(() => {
                openChat(newContact.id, newContact.name);
            }, 500);
        } else {
            throw new Error('Erreur lors de l\'ajout du contact');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur lors de l\'ajout du contact', 'error');
    }
}

// Fonction pour charger les contacts depuis le JSON server
async function loadContacts() {
    try {
        const response = await fetch(`${API_BASE_URL}/contacts`);
        if (response.ok) {
            const contacts = await response.json();
            
            // Trier les contacts par activité récente (lastActivity)
            contacts.sort((a, b) => {
                const dateA = new Date(a.lastActivity || a.timestamp || 0);
                const dateB = new Date(b.lastActivity || b.timestamp || 0);
                return dateB - dateA; // Plus récent en premier
            });
            
            displayContacts(contacts);
        } else {
            console.error('Erreur lors du chargement des contacts');
        }
    } catch (error) {
        console.error('Erreur:', error);
    }
}

// Fonction pour afficher les contacts dans l'interface
function displayContacts(contacts) {
    const chatList = document.querySelector('.flex-1.overflow-y-auto.scrollbar-thin');
    if (!chatList) return;
    
    // Garder seulement l'élément "Archives"
    const archivesElement = chatList.querySelector('.px-10.py-3.flex.items-center.space-x-3');
    chatList.innerHTML = '';
    
    if (archivesElement) {
        chatList.appendChild(archivesElement);
    }
    
    // Ajouter tous les contacts triés
    contacts.forEach(contact => {
        const contactElement = createContactElement(contact);
        chatList.appendChild(contactElement);
    });
    
    // Réajouter les event listeners
    addChatClickListeners();
}

// Fonction pour créer un élément contact
function createContactElement(contact) {
    const div = document.createElement('div');
    div.className = 'flex items-center p-3 hover:bg-gray-700 cursor-pointer border-gray-600';
    div.dataset.chatId = contact.id;
    
    // Déterminer l'icône de statut du message
    let messageStatus = '';
    if (contact.lastMessage && contact.lastMessage !== "Nouveau contact ajouté") {
        messageStatus = '✓ '; // Message envoyé
    }
    
    div.innerHTML = `
        <div class="w-12 h-12 bg-gray-600 rounded-full flex-shrink-0 mr-3 overflow-hidden">
            <img src="${contact.photo}" alt="Profile" class="w-full h-full object-cover" onerror="this.src='${generateDefaultAvatar(contact.name)}'">
        </div>
        <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between">
                <div class="text-white font-medium text-sm truncate">${contact.name}</div>
                <div class="text-gray-400 text-xs">${contact.timestamp}</div>
            </div>
            <div class="flex items-center justify-between mt-1">
                <div class="text-gray-400 text-sm truncate">${messageStatus}${contact.lastMessage}</div>
                ${contact.unreadCount > 0 ? `<div class="bg-green-500 text-white text-xs rounded-full w-8 h-8 flex items-center justify-center">${contact.unreadCount}</div>` : ''}
            </div>
        </div>
    `;
    
    // Ajouter l'indicateur en ligne si nécessaire
    if (contact.isOnline) {
        const statusIndicator = document.createElement('span');
        statusIndicator.className = 'absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900';
        div.querySelector('.w-12.h-12').style.position = 'relative';
        div.querySelector('.w-12.h-12').appendChild(statusIndicator);
    }
    
    return div;
}

// Fonction pour générer un ID de chat
function generateChatId(name) {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '') + '_' + Date.now();
}

// Fonction pour générer un avatar par défaut
function generateDefaultAvatar(name) {
    const colors = ['#4B5563', '#EC4899', '#F87171', '#F59E0B', '#10B981', '#3B82F6'];
    const color = colors[name.length % colors.length];
    return `data:image/svg+xml;base64,${btoa(`
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="24" cy="24" r="24" fill="${color}"/>
            <circle cx="24" cy="20" r="8" fill="#F9FAFB"/>
            <path d="M12 40c0-8 8-12 12-12s12 4 12 12" fill="#F9FAFB"/>
        </svg>
    `)}`;
}

// Fonction pour afficher les notifications
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 px-6 py-3 rounded-lg text-white z-50 transition-all duration-300 ${
        type === 'success' ? 'bg-green-600' : 
        type === 'error' ? 'bg-red-600' : 'bg-blue-600'
    }`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Animation d'entrée
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
        notification.style.opacity = '1';
    }, 100);
    
    // Suppression automatique
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        notification.style.opacity = '0';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Fonction pour fermer le chat et revenir à l'écran d'accueil
function closeChat() {
    const chatArea = document.getElementById('chatArea');
    const welcomeArea = document.querySelector('.flex-1.bg-gray-800.flex.items-center.justify-center');
    
    if (chatArea) {
        chatArea.remove();
    }
    
    if (welcomeArea) {
        welcomeArea.style.display = 'flex';
    }
    
    currentChatId = null;
    currentChatName = '';
}

// Fonction pour simuler la réception d'un message (pour les tests)
function simulateIncomingMessage(chatId, text) {
    if (currentChatId === chatId) {
        const message = {
            id: Date.now().toString(),
            chatId: chatId,
            text: text,
            timestamp: new Date().toISOString(),
            sender: 'contact',
            type: 'text'
        };
        
        displayMessage(message);
        saveMessage(message);
    }
    
    // Mettre à jour la liste des contacts
    updateContactLastMessage(chatId, text);
}

// Fonction pour marquer les messages comme lus
async function markMessagesAsRead(chatId) {
    try {
        const response = await fetch(`${API_BASE_URL}/contacts/${chatId}`);
        if (response.ok) {
            const contact = await response.json();
            contact.unreadCount = 0;
            
            await fetch(`${API_BASE_URL}/contacts/${chatId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(contact)
            });
            
            loadContacts(); // Recharger pour mettre à jour l'affichage
        }
    } catch (error) {
        console.error('Erreur lors du marquage des messages comme lus:', error);
    }
}

// Ajouter un event listener pour fermer le chat avec Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && currentChatId) {
        closeChat();
    }
});

export {};
