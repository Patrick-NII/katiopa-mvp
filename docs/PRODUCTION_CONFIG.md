# Configuration de production pour CubeAI Backend

## Variables d'environnement requises

### Base de données
DATABASE_URL="postgresql://username:password@host:5432/katiopa_db"

### JWT
JWT_SECRET="your-super-secure-jwt-secret-key-here"

### Emails
# Configuration noreply
NOREPLY_EMAIL_USER="noreply@cube-ai.fr"
NOREPLY_EMAIL_PASSWORD="your-email-password"
NOREPLY_SMTP_SERVER="smtp.gmail.com"
NOREPLY_SMTP_PORT="587"

# Configuration support
SUPPORT_EMAIL_USER="support@cube-ai.fr"
SUPPORT_EMAIL_PASSWORD="your-email-password"
SUPPORT_SMTP_SERVER="smtp.gmail.com"
SUPPORT_SMTP_PORT="587"

# Configuration hello
HELLO_EMAIL_USER="hello@cube-ai.fr"
HELLO_EMAIL_PASSWORD="your-email-password"
HELLO_SMTP_SERVER="smtp.gmail.com"
HELLO_SMTP_PORT="587"

### OpenAI
OPENAI_API_KEY="your-openai-api-key"

### URLs
FRONTEND_URL="https://app.cube-ai.fr"
API_BASE_URL="https://api.cube-ai.fr"

### Serveur
PORT="4000"
NODE_ENV="production"

## Scripts de déploiement

### 1. Préparation de la base de données
```bash
npm run db:generate
npm run db:deploy
```

### 2. Build de production
```bash
npm run build
```

### 3. Démarrage en production
```bash
npm start
```

## Monitoring et logs

### Logs recommandés
- Application logs: `/var/log/cubeai/app.log`
- Error logs: `/var/log/cubeai/error.log`
- Access logs: `/var/log/cubeai/access.log`

### Health check
- Endpoint: `GET /health`
- Expected response: `{"status":"ok","timestamp":"2024-01-01T00:00:00.000Z"}`

## Sécurité

### Headers de sécurité
- Helmet.js configuré
- CORS configuré pour le domaine de production
- Rate limiting activé
- Cookies sécurisés (httpOnly, secure, sameSite)

### Base de données
- Connexions SSL/TLS
- Pool de connexions optimisé
- Timeout de connexion configuré

## Performance

### Optimisations
- Compression gzip activée
- Cache headers configurés
- Pool de connexions PostgreSQL optimisé
- Logging structuré pour le monitoring

### Métriques recommandées
- Temps de réponse API
- Taux d'erreur
- Utilisation mémoire/CPU
- Connexions base de données actives
