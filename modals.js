export function showModal({ title = '', content = '', actions = [] }) {
    let modal = document.getElementById('globalModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'globalModal';
        modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60';
        modal.innerHTML = `
            <div class="bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6 relative animate-fade-in">
                <button id="closeModalBtn" class="absolute top-3 right-3 text-gray-400 hover:text-white text-xl">&times;</button>
                <h2 id="modalTitle" class="text-white text-lg font-semibold mb-4"></h2>
                <div id="modalContent" class="text-gray-200 mb-4"></div>
                <div id="modalActions" class="flex justify-end space-x-2"></div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    modal.querySelector('#modalTitle').textContent = title;
    modal.querySelector('#modalContent').innerHTML = content;
    const actionsDiv = modal.querySelector('#modalActions');
    actionsDiv.innerHTML = '';
    actions.forEach(({ label, className = '', onClick }) => {
        const btn = document.createElement('button');
        btn.textContent = label;
        btn.className = `px-4 py-2 rounded-lg ${className}`;
        btn.onclick = () => {
            if (onClick) onClick();
            closeModal();
        };
        actionsDiv.appendChild(btn);
    });
    modal.classList.remove('hidden');
    // Fermeture par bouton ou clic extérieur
    modal.querySelector('#closeModalBtn').onclick = closeModal;
    modal.onclick = (e) => {
        if (e.target === modal) closeModal();
    };
    // Fermeture par Escape
    document.onkeydown = (e) => {
        if (e.key === 'Escape') closeModal();
    };
}
export function closeModal() {
    const modal = document.getElementById('globalModal');
    if (modal) modal.classList.add('hidden');
    document.onkeydown = null;
}
