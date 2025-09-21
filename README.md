# 📚 Générateur de Fiches de Révision

Une application web mobile-first qui transforme vos photos de cours en fiches de révision PDF personnalisées grâce à l'intelligence artificielle, adaptées au système éducatif français (CP à 3E).

## ✨ Fonctionnalités

- 📱 **Interface mobile-first** - Optimisé pour smartphone et tablette
- 📸 **Capture d'image** - Prise de photo directe ou upload de fichier
- 🎓 **Niveaux scolaires français** - Support complet CP à 3E
- 🤖 **Intelligence artificielle** - OpenAI GPT-4 Vision + Mistral AI
- 📄 **Génération PDF** - Fiches prêtes à imprimer
- 📚 **Historique** - Sauvegarde de toutes vos fiches
- 🐳 **Docker** - Déploiement simplifié sur NAS/serveur

## 🚀 Démarrage Rapide (Docker - Recommandé)

### 1. Cloner le projet
```bash
git clone <repository-url>
cd FicheDeRevision
```

### 2. Configuration des clés API
```bash
# Copier le fichier d'exemple
cp .env.example .env

# Éditer le fichier .env avec vos clés API
nano .env
```

Contenu du fichier `.env` :
```env
# Au moins une des deux clés est requise
OPENAI_API_KEY=sk-your-openai-key-here
MISTRAL_API_KEY=your-mistral-key-here

# Optionnel : personnaliser les ports
# FRONTEND_PORT=3000
# BACKEND_PORT=3001
```

### 3. Lancer l'application
```bash
# Construction et démarrage
docker-compose up --build

# En arrière-plan
docker-compose up -d --build
```

### 4. Accéder à l'application
- **Interface web** : http://localhost:3000
- **API** : http://localhost:3001

## 🛠️ Développement Local

### Prérequis
- Node.js 18+
- npm ou yarn

### Backend
```bash
cd backend
npm install

# Créer le fichier .env
cp .env.example .env
# Éditer avec vos clés API

# Démarrer en mode développement
npm run dev
```

### Frontend
```bash
cd frontend
npm install

# Créer le fichier .env.local
cp .env.local.example .env.local

# Démarrer en mode développement
npm run dev
```

## 🔧 Configuration

### Variables d'environnement

#### Backend (`backend/.env`)
```env
PORT=3001
NODE_ENV=development
OPENAI_API_KEY=your_openai_api_key
MISTRAL_API_KEY=your_mistral_api_key
DATABASE_PATH=./database.sqlite
UPLOADS_DIR=./uploads
MAX_FILE_SIZE=10485760
CORS_ORIGIN=http://localhost:3000

# Debug Options
DEBUG_AI=false
```

#### Frontend (`frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Clés API

#### OpenAI
1. Créer un compte sur https://platform.openai.com
2. Générer une clé API
3. Ajouter des crédits à votre compte

#### Mistral AI
1. Créer un compte sur https://console.mistral.ai
2. Générer une clé API
3. Ajouter des crédits à votre compte

## 🏫 Niveaux Scolaires Supportés

### Primaire
- **CP** (Cours Préparatoire) - 6-7 ans
- **CE1** (Cours Élémentaire 1) - 7-8 ans
- **CE2** (Cours Élémentaire 2) - 8-9 ans
- **CM1** (Cours Moyen 1) - 9-10 ans
- **CM2** (Cours Moyen 2) - 10-11 ans

### Collège
- **6E** (Sixième) - 11-12 ans
- **5E** (Cinquième) - 12-13 ans
- **4E** (Quatrième) - 13-14 ans
- **3E** (Troisième) - 14-15 ans

## 🏗️ Architecture Technique

### Frontend
- **Next.js 14** - Framework React avec App Router
- **TypeScript** - Typage statique
- **Tailwind CSS** - Framework CSS utilitaire
- **Shadcn/ui** - Composants UI modernes
- **PWA** - Support application web progressive

### Backend
- **Express.js** - Serveur API REST
- **TypeScript** - Typage statique
- **SQLite** - Base de données locale
- **Multer** - Upload de fichiers
- **Sharp** - Traitement d'images

### Intelligence Artificielle
- **OpenAI GPT-4 Vision** - Analyse d'images et génération de contenu
- **Mistral AI Pixtral** - Alternative européenne pour l'analyse d'images

### Génération PDF
- **Puppeteer** - Génération PDF haute qualité
- **Templates HTML/CSS** - Mise en page professionnelle

## 🐳 Déploiement sur NAS

### Synology
```bash
# Via Docker dans DSM
1. Ouvrir Docker dans DSM
2. Télécharger le projet
3. Créer un fichier .env avec vos clés API
4. Lancer : docker-compose up -d --build
```

### QNAP
```bash
# Via Container Station
1. Ouvrir Container Station
2. Importer le docker-compose.yml
3. Configurer les variables d'environnement
4. Démarrer l'application
```

### Configuration réseau
- Port 3000 : Interface utilisateur
- Port 3001 : API backend
- Accès local : http://ip-du-nas:3000

## 📱 Utilisation

### 1. Prendre une photo
- Utiliser l'appareil photo du téléphone
- Ou uploader une image existante
- Formats supportés : JPG, PNG, WebP (max 10MB)

### 2. Sélectionner le niveau
- Choisir le niveau scolaire approprié
- L'IA adapte automatiquement la difficulté

### 3. Générer la fiche
- Cliquer sur "Générer la fiche de révision"
- Attendre le traitement (30s-2min)
- Télécharger le PDF généré

### 4. Consulter l'historique
- Toutes les fiches sont sauvegardées
- Accès rapide aux PDFs précédents
- Filtrage par niveau scolaire

## 🔧 Maintenance

### Sauvegarde des données
```bash
# Localisation des données
docker volume inspect revision-data

# Sauvegarde
docker run --rm -v revision-data:/data -v $(pwd):/backup alpine tar czf /backup/revision-backup.tar.gz -C /data .

# Restauration
docker run --rm -v revision-data:/data -v $(pwd):/backup alpine tar xzf /backup/revision-backup.tar.gz -C /data
```

### Logs et monitoring
```bash
# Voir les logs en temps réel
docker-compose logs -f

# Vérifier l'état des services
docker-compose ps

# Redémarrer l'application
docker-compose restart
```

## 🐛 Dépannage

### Mode Debug

Pour activer les logs détaillés des requêtes AI, ajoutez cette variable dans votre fichier `.env` :

```env
DEBUG_AI=true
```

**En mode debug, vous verrez :**
- 📤 Requêtes envoyées à OpenAI/Mistral (paramètres, prompts, métadonnées d'image)
- 📥 Réponses complètes des APIs (contenu, usage, timing)
- 🔄 Étapes de traitement d'image (conversion, redimensionnement, base64)
- 🗄️ Opérations de base de données
- ⚠️ Détails des erreurs avec stack traces

**Exemple de logs en mode debug :**
```
[AI DEBUG] === Starting OpenAI generation ===
[AI DEBUG] Education level: CP
[AI DEBUG] Image path: ./uploads/image_123.jpg
[AI DEBUG] Generated prompt: Tu es un enseignant français...
[AI DEBUG] OpenAI request payload: {"model":"gpt-4-vision-preview"...}
[AI DEBUG] OpenAI response received in 2341ms
[AI DEBUG] OpenAI response content: {"title":"Les animaux de la ferme"...}
```

### Problèmes courants

#### L'application ne démarre pas
```bash
# Vérifier les logs
docker-compose logs

# Vérifier les variables d'environnement
cat .env

# Activer le debug pour plus de détails
echo "DEBUG_AI=true" >> .env
```

#### PDF non généré
- Vérifier les clés API dans les logs
- S'assurer d'avoir des crédits sur votre compte AI
- Vérifier l'espace disque disponible
- Activer `DEBUG_AI=true` pour voir les détails des requêtes AI

#### Erreur de permission
```bash
# Réparer les permissions
sudo chown -R $USER:$USER ./data
```

#### Requêtes AI qui échouent
```bash
# Activer le debug
DEBUG_AI=true npm run dev

# Vérifier les logs pour voir :
# - Le prompt envoyé à l'AI
# - La réponse de l'API
# - Les erreurs de parsing JSON
# - Les métadonnées de la requête
```

### Support
- 📧 Issues GitHub pour les bugs
- 📖 Documentation complète dans `/docs`
- 🔧 Logs détaillés dans l'application

## 📄 Licence

MIT License - Voir le fichier LICENSE pour plus de détails.

---

🇫🇷 **Développé pour l'éducation française** - Adapté aux programmes officiels de l'Éducation Nationale