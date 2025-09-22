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

## 🚀 Installation Ultra-Rapide (Recommandée)

### Installation en une commande
```bash
curl -sSL https://raw.githubusercontent.com/yourusername/FicheDeRevision/main/install.sh | bash
```

Ou téléchargement manuel :
```bash
wget -qO- https://raw.githubusercontent.com/yourusername/FicheDeRevision/main/install.sh | bash
```

### Configuration et démarrage
```bash
cd revision-generator

# 1. Configurer vos clés API
nano .env

# 2. Démarrer l'application (images pré-construites)
docker-compose up -d

# 3. Accéder à l'application
# Interface web : http://localhost:3000
```

### Contenu du fichier `.env` :
```env
# Au moins une des deux clés est requise
OPENAI_API_KEY=sk-your-openai-key-here
MISTRAL_API_KEY=your-mistral-key-here
```

---

## 🔧 Installation Manuelle (Si vous préférez)

### 1. Télécharger les fichiers
```bash
mkdir revision-generator && cd revision-generator

# Docker Compose pour production (images pré-construites)
curl -sSL https://raw.githubusercontent.com/yourusername/FicheDeRevision/main/docker-compose.prod.yml -o docker-compose.yml

# Fichier d'exemple des variables d'environnement
curl -sSL https://raw.githubusercontent.com/yourusername/FicheDeRevision/main/.env.example -o .env.example
cp .env.example .env
```

### 2. Configuration et démarrage
```bash
# Éditer vos clés API
nano .env

# Démarrer (aucune compilation locale requise)
docker-compose up -d
```

---

## 🛠️ Développement Local (Build depuis les sources)

Si vous souhaitez modifier le code ou contribuer au projet :

### 1. Cloner le projet
```bash
git clone <repository-url>
cd FicheDeRevision
```

### 2. Configuration des clés API
```bash
cp .env.example .env
nano .env
```

### 3. Lancer en mode développement
```bash
# Construction et démarrage depuis les sources
docker-compose up --build

# En arrière-plan
docker-compose up -d --build
```

### 4. Accéder à l'application
- **Interface web** : http://localhost:3000

---

## 🛠️ Développement Local (Node.js)

### Prérequis
- Node.js 18+
- npm ou yarn

### Installation et démarrage
```bash
cd frontend
npm install

# Créer le fichier .env.local
cp ../.env.example .env.local
# Éditer avec vos clés API (OpenAI et/ou Mistral)

# Lancer le serveur Next.js (API + interface)
npm run dev
```

## 🔧 Configuration

### Variables d'environnement

Les variables suivantes peuvent être définies dans `.env` (Docker) ou `.env.local` (développement) :

```env
# Clés API (au moins une est requise)
OPENAI_API_KEY=your_openai_api_key
MISTRAL_API_KEY=your_mistral_api_key

# Configuration serveur
PORT=3000
DATABASE_PATH=./data/database.sqlite
UPLOADS_DIR=./uploads
MAX_FILE_SIZE=10485760

# Configuration IA
OPENAI_MODEL=gpt-4o-mini
OPENAI_MAX_OUTPUT_TOKENS=100000

# Debug
DEBUG_AI=false
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

### Configuration des modèles IA

#### Modèles OpenAI supportés
```env
# Modèles recommandés
OPENAI_MODEL=gpt-4o-mini          # Rapide et économique (par défaut)
OPENAI_MODEL=gpt-4o               # Plus puissant, plus cher
OPENAI_MODEL=gpt-4-turbo          # Version optimisée de GPT-4

# Modèles expérimentaux (si disponibles)
OPENAI_MODEL=gpt-5-preview        # Utilise l'API Responses
```

#### Optimisation des tokens
```env
# Pour les modèles GPT-5 avec API Responses
OPENAI_MAX_OUTPUT_TOKENS=100000   # Tokens de sortie maximum

# Pour les modèles GPT-4o avec Chat Completions
# Le max_tokens est fixé à 2000 dans le code
```

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
- **Next.js API Routes** - Gestion des endpoints serveur
- **TypeScript** - Typage statique
- **Better SQLite3** - Base de données locale performante
- **Sharp** - Traitement d'images
- **PDFKit** - Génération de PDFs

### Intelligence Artificielle
- **OpenAI GPT-4o Mini** - Modèle rapide et économique pour l'analyse d'images
- **Mistral AI Pixtral 12B** - Alternative européenne avec support multimodal
- **Configurable** - Possibilité d'utiliser d'autres modèles (GPT-4o, GPT-5, etc.)

### Génération PDF
- **PDFKit** - Génération PDF haute qualité
- **Mise en page vectorielle** - Typographie optimisée pour l'impression

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
- Port 3000 : Interface utilisateur + API Next.js
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