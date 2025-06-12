const apiUrl = "https://projet-json-server-5.onrender.com";

export async function checkAuth() {
    // Get session ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('sessionId');

    if (!sessionId) {
        window.location.href = '/';
        return null;
    }

    try {
        const response = await fetch(`${apiUrl}/sessions/${sessionId}`, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Session non trouvée');
            }
            throw new Error('Erreur lors de la vérification de la session');
        }

        const session = await response.json();
        
        // Check if session is expired (24h)
        const sessionDate = new Date(session.createdAt);
        const now = new Date();
        const diff = now - sessionDate;
        const hours = Math.floor(diff / 1000 / 60 / 60);
        
        if (hours > 24) {
            // Delete expired session
            await fetch(`${apiUrl}/sessions/${sessionId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            throw new Error('Session expirée');
        }

        return session;

    } catch (error) {
        console.error('Erreur de vérification de session:', error);
        // Redirect to login page
        setTimeout(() => {
            window.location.href = '/';
        }, 1500);
        return null;
    }
}