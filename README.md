# EduConnect — Système de Gestion des Notes Scolaires

Application web full-stack de gestion scolaire développée avec **Django REST Framework** (backend) et **React + TypeScript** (frontend).

---

## Présentation

**EduConnect** digitalise la gestion des notes dans les établissements scolaires. Elle centralise les informations pour tous les acteurs (administration, enseignants, étudiants, parents) et automatise les processus clés : saisie des notes, calcul des moyennes, génération des bulletins et gestion des réclamations.

---

## Fonctionnalités par rôle

| Rôle | Fonctionnalités |
|---|---|
| **Administrateur** | Gestion des utilisateurs, classes, matières, années scolaires, périodes, salles. Génération des bulletins finaux. |
| **Enseignant** | Saisie et modification des notes, gestion des séances, suivi des absences, traitement des réclamations, consultation des statistiques. |
| **Étudiant** | Consultation des notes et bulletins, téléchargement PDF, envoi de réclamations. |
| **Parent** | Consultation des résultats de son enfant. |

---

## Stack technique

### Backend
| Technologie | Version | Rôle |
|---|---|---|
| Python / Django | 4.2 | Framework principal |
| Django REST Framework | 3.15 | API REST |
| djangorestframework-simplejwt | 5.3 | Authentification JWT |
| drf-spectacular | 0.27 | Documentation OpenAPI / Swagger |
| MySQL | — | Base de données relationnelle |
| django-cors-headers | 4.3 | CORS pour le frontend |
| django-filter | 24.3 | Filtrage des querysets |
| ReportLab | 4.2 | Génération de bulletins PDF |
| gunicorn | 22.0 | Serveur WSGI (production) |
| python-dotenv | 1.0 | Variables d'environnement |

### Frontend
| Technologie | Version | Rôle |
|---|---|---|
| React | 19 | Interface utilisateur |
| TypeScript | — | Typage statique |
| Vite | — | Bundler / dev server |
| Tailwind CSS | 4 | Styles utilitaires |
| React Router | 7 | Navigation SPA |
| Axios | 1.15 | Appels API |
| Chart.js + react-chartjs-2 | 4.5 | Graphiques et statistiques |
| Framer Motion | 12 | Animations |
| i18next | 26 | Internationalisation (i18n) |
| react-hot-toast | 2.6 | Notifications UI |
| lucide-react | — | Icônes |

---

## Architecture du projet

```
EduConnect/
├── backend/
│   ├── manage.py
│   ├── requirements.txt
│   ├── .env                    # Variables d'environnement (non versionné)
│   ├── backend/                # Configuration Django (settings, urls, wsgi)
│   ├── accounts/               # Utilisateurs, rôles, profils
│   ├── academics/              # Classes, matières, séances, absences, salles
│   ├── grades/                 # Évaluations et notes
│   ├── reports/                # Bulletins scolaires
│   └── communication/          # Réclamations et notifications
└── frontend/
    ├── src/
    │   ├── api/                # Clients Axios
    │   ├── components/         # Composants réutilisables
    │   ├── dashboards/         # Tableaux de bord par rôle
    │   ├── context/            # Contextes React (auth, etc.)
    │   ├── hooks/              # Hooks personnalisés
    │   ├── routes/             # Définition des routes
    │   └── locales/            # Fichiers de traduction
    └── index.html
```

### Apps Django

| App | Modèles principaux |
|---|---|
| `accounts` | `Utilisateur` (email + rôle), `Enseignant`, `Etudiant`, `Parent` |
| `academics` | `AnneeScolaire`, `Periode`, `Matiere`, `Classe`, `EnseignantMatiere`, `Seance`, `Absence`, `Salle` |
| `grades` | `Evaluation` (CC / Examen / TP), `Note` |
| `reports` | `Bulletin` (moyenne, rang, mention, validation jury) |
| `communication` | `Reclamation`, `Notification` |

### Endpoints API principaux

Tous les endpoints sont préfixés par `/api/` et documentés sur `/api/docs/`.

```
POST   /api/accounts/token/          # Obtenir un JWT
POST   /api/accounts/token/refresh/  # Rafraîchir le JWT

/api/accounts/utilisateurs/
/api/accounts/enseignants/
/api/accounts/etudiants/
/api/accounts/parents/

/api/academics/annees-scolaires/
/api/academics/periodes/
/api/academics/classes/
/api/academics/matieres/
/api/academics/seances/
/api/academics/absences/
/api/academics/salles/

/api/grades/evaluations/
/api/grades/notes/

/api/reports/bulletins/

/api/communication/reclamations/
/api/communication/notifications/
```

---

## Installation et lancement

### Prérequis
- Python 3.11+
- Node.js 20+
- MySQL 8+

### Backend

```bash
cd backend

# Créer et activer l'environnement virtuel
python3 -m venv venv
source venv/bin/activate

# Installer les dépendances
pip install -r requirements.txt

# Configurer les variables d'environnement
cp .env.example .env   # puis renseigner SECRET_KEY, DB_NAME, DB_USER, DB_PASSWORD

# Appliquer les migrations
python manage.py migrate

# Créer un superutilisateur
python manage.py createsuperuser

# Lancer le serveur de développement
python manage.py runserver
```

Le backend sera disponible sur `http://localhost:8000`.  
Documentation Swagger : `http://localhost:8000/api/docs/`  
Admin Django : `http://localhost:8000/admin/`

### Frontend

```bash
cd frontend

# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev
```

Le frontend sera disponible sur `http://localhost:5173`.

---

## Variables d'environnement (`.env`)

```env
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=127.0.0.1,localhost

# Base de données MySQL
DB_NAME=educonnect
DB_USER=your_user
DB_PASSWORD=your_password
DB_HOST=127.0.0.1
DB_PORT=3306

# CORS (optionnel en production)
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

---

## Cycle de vie d'une note

```
Saisie (enseignant)
    → Validée (administration)
        → Publiée → Consultée (étudiant)
            → [si désaccord] Réclamation → En traitement
                → Corrigée (recalcul automatique) | Maintenue
```

---

## Déploiement

Le projet est préconfiguré pour un déploiement sur **Railway** :
- Supporte `MYSQL_URL` / `DATABASE_URL` pour la base de données
- `gunicorn` comme serveur WSGI
- CORS configuré pour les domaines `*.railway.app`




