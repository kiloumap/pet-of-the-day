# Pet of the Day 🐕🐱

Une application sociale et ludique pour les propriétaires d'animaux de compagnie qui transforme le quotidien avec leur animal en une expérience communautaire gamifiée.

## 🚀 Démarrage rapide

### Prérequis

- Docker et Docker Compose
- Make (optionnel, pour les commandes simplifiées)

### Installation

1. **Cloner le projet**
```bash
git clone https://github.com/votre-username/pet-of-the-day.git
cd pet-of-the-day/backend
```

2. **Rendre les scripts exécutables**
```bash
chmod +x scripts/*.sh
```

3. **Démarrer l'application**
```bash
make dev
# ou
./scripts/dev.sh start
```

L'application sera disponible sur :
- **API** : http://localhost:8080
- **Adminer** (interface DB) : http://localhost:8081
- **Base de données** : localhost:5432

## 📚 Commandes utiles

### Avec Make (recommandé)
```bash
make help              # Voir toutes les commandes
make start             # Démarrer les services
make stop              # Arrêter les services
make logs              # Voir les logs
make shell             # Shell dans le container API
make db                # Shell PostgreSQL
make migrate-up        # Appliquer les migrations
make test              # Lancer les tests
```

### Avec les scripts
```bash
./scripts/dev.sh start        # Démarrer
./scripts/dev.sh stop         # Arrêter
./scripts/dev.sh logs api     # Logs de l'API
./scripts/migrate.sh up       # Migrations
./scripts/migrate.sh create nom_migration  # Nouvelle migration
```

## 🏗️ Architecture

### Structure du projet
```
backend/
├── cmd/server/          # Point d'entrée de l'application
├── internal/            # Code interne de l'application
│   ├── config/         # Configuration
│   ├── database/       # Connexion DB
│   ├── handlers/       # Gestionnaires HTTP
│   ├── models/         # Modèles de données
│   └── middleware/     # Middlewares
├── database/migrations/ # Migrations SQL
├── scripts/            # Scripts d'automatisation
├── Dockerfile          # Image Docker
├── docker-compose.yml  # Orchestration
└── Makefile           # Commandes simplifiées
```

### Stack technique
- **Backend** : Go 1.24 avec Gorilla Mux
- **Base de données** : PostgreSQL 15
- **Authentification** : JWT
- **Migrations** : golang-migrate
- **Containerisation** : Docker & Docker Compose

## 🗄️ Base de données

### Schéma principal

- **users** : Utilisateurs de l'application
- **pets** : Animaux de compagnie
- **groups** : Groupes (famille, quartier, amis)
- **group_members** : Appartenance des animaux aux groupes
- **behaviors** : Comportements configurables avec points
- **score_events** : Événements de score quotidiens
- **daily_scores** : Scores agrégés par jour et groupe
- **badges** : Badges obtenus par les animaux

### Migrations

```bash
# Appliquer toutes les migrations
make migrate-up

# Créer une nouvelle migration
make migrate-create NAME=add_new_feature

# Voir le statut
make migrate-status

# Rollback
make migrate-down
```

## 🔌 API Endpoints

### Authentification
```http
POST /api/auth/register    # Inscription
POST /api/auth/login       # Connexion
```

### Utilisateurs
```http
GET /api/users/me          # Profil utilisateur
```

### Animaux
```http
GET    /api/pets           # Liste des animaux
POST   /api/pets           # Créer un animal
GET    /api/pets/{id}      # Détails d'un animal
PUT    /api/pets/{id}      # Modifier un animal
DELETE /api/pets/{id}      # Supprimer un animal
```

### Groupes
```http
GET  /api/groups                    # Liste des groupes
POST /api/groups                    # Créer un groupe
GET  /api/groups/{id}               # Détails d'un groupe
GET  /api/groups/{id}/members       # Membres du groupe
POST /api/groups/{id}/join          # Rejoindre un groupe
```

### Comportements et Scores
```http
GET  /api/behaviors                 # Liste des comportements
POST /api/behaviors                 # Créer un comportement
POST /api/scores/events             # Enregistrer un événement
GET  /api/groups/{id}/daily-scores  # Scores du jour
```

### Santé
```http
GET /health                         # Statut de l'API
```

## 🧪 Tests

```bash
# Lancer tous les tests
make test

# Tests avec coverage
docker-compose exec api go test -cover ./...

# Tests d'une fonction spécifique
docker-compose exec api go test -run TestFunctionName ./...
```

## 🔧 Développement

### Variables d'environnement

Créer un fichier `.env` (optionnel, les valeurs par défaut fonctionnent) :

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=secret
DB_NAME=pet_of_the_day
JWT_SECRET=your-super-secret-jwt-key
PORT=8080
```

### Workflow de développement

1. **Faire des changements** dans le code
2. **Rebuilder** si nécessaire : `make build`
3. **Redémarrer** : `make restart`
4. **Voir les logs** : `make logs`
5. **Tester** : `make test`

### Créer une nouvelle migration

```bash
# Créer les fichiers de migration
make migrate-create NAME=add_notifications

# Éditer les fichiers générés
# database/migrations/004_add_notifications.up.sql
# database/migrations/004_add_notifications.down.sql

# Appliquer la migration
make migrate-up
```

### Debug

```bash
# Logs en temps réel
make logs SERVICE=api

# Shell dans le container
make shell

# Accès direct à la DB
make db

# Statut des services
make status
```

## 📝 Exemples d'utilisation

### Inscription et connexion

```bash
# Inscription
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "julie@example.com",
    "password": "password123",
    "firstName": "Julie",
    "lastName": "Martin"
  }'

# Connexion
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "julie@example.com",
    "password": "password123"
  }'
```

### Créer un animal

```bash
# Avec le token d'authentification
curl -X POST http://localhost:8080/api/pets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Nala",
    "species": "chien",
    "breed": "Golden Retriever",
    "personality": ["joueur", "affectueux"]
  }'
```

### Enregistrer un comportement

```bash
curl -X POST http://localhost:8080/api/scores/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "petId": "pet-uuid",
    "behaviorId": "behavior-uuid",
    "points": 5,
    "comment": "Très bon pipi dehors!"
  }'
```

## 🚀 Déploiement

### Production avec Docker

```bash
# Construire l'image de production
make prod-build

# Lancer en production (à adapter)
docker run -d \
  --name pet-of-the-day \
  -p 8080:8080 \
  -e DB_HOST=your-db-host \
  -e DB_PASSWORD=your-secure-password \
  -e JWT_SECRET=your-secure-jwt-secret \
  pet-of-the-day:latest
```

### Avec Railway/Render

1. **Connecter le repository**
2. **Configurer les variables d'environnement**
3. **Déployer automatiquement**

### Variables d'environnement de production

```env
DB_HOST=your-production-db-host
DB_PORT=5432
DB_USER=your-db-user
DB_PASSWORD=your-secure-password
DB_NAME=pet_of_the_day
JWT_SECRET=your-very-secure-jwt-secret-256-bits
PORT=8080
```

## 🤝 Contribution

1. **Fork** le projet
2. **Créer une branche** : `git checkout -b feature/nouvelle-fonctionnalite`
3. **Commit** : `git commit -m 'Ajout nouvelle fonctionnalité'`
4. **Push** : `git push origin feature/nouvelle-fonctionnalite`
5. **Pull Request**

## 📋 TODO

- [ ] Système de notifications push
- [ ] Upload d'images pour les animaux
- [ ] Intégration colliers connectés
- [ ] Système de badges avancé
- [ ] Tests d'intégration complets
- [ ] API GraphQL (alternative REST)
- [ ] Métriques et monitoring
- [ ] Cache Redis
- [ ] Websockets pour temps réel

## 🐛 Problèmes courants

### La base de données ne démarre pas
```bash
# Vérifier les logs
just logs SERVICE=db

# Nettoyer et redémarrer
just clean
just start
```

### L'API ne répond pas
```bash
# Vérifier les logs
just logs SERVICE=api

# Redémarrer l'API
docker-compose restart api
```

### Erreur de migration
```bash
# Voir le statut
./scripts/migrate.sh version

# Forcer une version si nécessaire
./scripts/migrate.sh force 001
```

## 📄 Licence

MIT License - voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 👥 Équipe

- **Développeur Principal** : [Votre nom]
- **Concept** : Application Pet of the Day

---

🐾 **Fait avec ❤️ pour nos amis à quatre pattes !**