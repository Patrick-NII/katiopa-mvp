# 🤝 Guide de Contribution

Merci de votre intérêt pour contribuer à **Katiopa MVP** ! Ce document vous guidera dans le processus de contribution.

## 📋 **Avant de commencer**

- Assurez-vous d'avoir lu le [README](README.md)
- Vérifiez que vous avez Node.js 18+ et Docker installés
- Familiarisez-vous avec la [licence MIT](LICENSE)

## 🚀 **Workflow de développement**

### **1. Fork et Clone**
```bash
# Fork le projet sur GitHub
# Puis clonez votre fork
git clone https://github.com/VOTRE_USERNAME/katiopa-mvp.git
cd katiopa-mvp
```

### **2. Configuration de l'environnement**
```bash
# Ajoutez le repository original comme upstream
git remote add upstream https://github.com/Patrick-NII/katiopa-mvp.git

# Créez une branche de développement
git checkout -b feature/votre-nouvelle-fonctionnalite
```

### **3. Développement**
```bash
# Installez les dépendances
cd backend && npm install
cd ../frontend && npm install

# Lancez les services
docker-compose up -d db
cd backend && npm run dev
cd ../frontend && npm run dev
```

### **4. Tests et Validation**
```bash
# Backend
cd backend
npm run build
npm run db:push

# Frontend
cd frontend
npm run build
```

### **5. Commit et Push**
```bash
# Ajoutez vos changements
git add .

# Committez avec un message descriptif
git commit -m "feat: ajouter nouvelle fonctionnalité

- Description détaillée des changements
- Impact sur l'utilisateur final
- Tests effectués"

# Poussez votre branche
git push origin feature/votre-nouvelle-fonctionnalite
```

### **6. Pull Request**
- Allez sur GitHub et créez une Pull Request
- Ciblez la branche `develop` (pas `main`)
- Remplissez le template de PR
- Attendez la review

## 📝 **Conventions de commit**

Nous utilisons [Conventional Commits](https://www.conventionalcommits.org/) :

```bash
feat: nouvelle fonctionnalité
fix: correction de bug
docs: documentation
style: formatage (pas de changement fonctionnel)
refactor: refactorisation du code
test: ajout de tests
chore: tâches de maintenance
```

### **Exemples :**
```bash
git commit -m "feat(auth): ajouter authentification par Google OAuth"
git commit -m "fix(dashboard): corriger l'affichage des statistiques"
git commit -m "docs(api): mettre à jour la documentation des endpoints"
```

## 🧪 **Tests**

### **Tests Backend**
```bash
cd backend
npm run test        # Tests unitaires
npm run test:e2e    # Tests d'intégration
```

### **Tests Frontend**
```bash
cd frontend
npm run test        # Tests unitaires
npm run test:e2e    # Tests E2E
```

## 🔒 **Sécurité**

- **Ne committez JAMAIS** de secrets ou clés API
- Utilisez les fichiers `.env.example` comme modèles
- Signalez les vulnérabilités de sécurité en privé
- Respectez les bonnes pratiques OWASP

## 📚 **Documentation**

- Mettez à jour le README si nécessaire
- Documentez les nouvelles API
- Ajoutez des commentaires dans le code complexe
- Créez des exemples d'utilisation

## 🎯 **Zones de contribution prioritaires**

- [ ] **Tests automatisés** (Jest, Testing Library)
- [ ] **CI/CD** (GitHub Actions)
- [ ] **Monitoring** et analytics
- [ ] **Performance** et optimisation
- [ ] **Accessibilité** (WCAG)
- [ ] **Internationalisation** (i18n)
- [ ] **PWA** (Progressive Web App)

## 🚨 **Problèmes connus**

- Le dashboard peut avoir des problèmes de hooks React (en cours de résolution)
- L'intégration LLM nécessite une clé OpenAI valide
- Certains composants manquent de tests

## 📞 **Besoin d'aide ?**

- **Issues** : [GitHub Issues](https://github.com/Patrick-NII/katiopa-mvp/issues)
- **Discussions** : [GitHub Discussions](https://github.com/Patrick-NII/katiopa-mvp/discussions)
- **Email** : patrick.nii@aol.com

## 🙏 **Reconnaissance**

Tous les contributeurs seront mentionnés dans le README et recevront des crédits appropriés.

---

**Merci de contribuer à Katiopa !** 🎮🧠✨ 