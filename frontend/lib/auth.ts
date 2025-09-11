// Fonction utilitaire pour récupérer les headers d'authentification
export async function getAuthHeaders(): Promise<Record<string, string>> {
  try {
    // Récupérer le token depuis localStorage ou cookies
    const token = localStorage.getItem('authToken') || '';
    
    if (!token) {
      // Si pas de token, essayer de le récupérer depuis les cookies
      const cookies = document.cookie.split(';');
      const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('authToken='));
      
      if (tokenCookie) {
        const cookieToken = tokenCookie.split('=')[1];
        return {
          'Authorization': `Bearer ${cookieToken}`
        };
      }
      
      // Pas de token trouvé, retourner des headers vides
      console.warn('Aucun token d\'authentification trouvé');
      return {};
    }
    
    return {
      'Authorization': `Bearer ${token}`
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des headers d\'authentification:', error);
    return {};
  }
}

// Fonction pour vérifier si l'utilisateur est authentifié
export function isAuthenticated(): boolean {
  try {
    const token = localStorage.getItem('authToken');
    const cookieToken = document.cookie
      .split(';')
      .find(cookie => cookie.trim().startsWith('authToken='));
    
    return !!(token || cookieToken);
  } catch (error) {
    console.error('Erreur lors de la vérification d\'authentification:', error);
    return false;
  }
}

// Fonction pour obtenir le token brut
export function getToken(): string | null {
  try {
    // Essayer localStorage en premier
    const token = localStorage.getItem('authToken');
    if (token) return token;
    
    // Essayer les cookies en second
    const cookies = document.cookie.split(';');
    const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('authToken='));
    
    if (tokenCookie) {
      return tokenCookie.split('=')[1];
    }
    
    return null;
  } catch (error) {
    console.error('Erreur lors de la récupération du token:', error);
    return null;
  }
}

