# EduConnect 🎓 - Système de Gestion des Notes Scolaires

## 📝 Présentation du projet
**EduConnect** est une application web moderne et centralisée permettant de gérer les notes des élèves [1]. Dans de nombreux établissements, la gestion des notes est encore manuelle ou peu optimisée, ce qui engendre des erreurs et un manque de communication [1]. 

Ce projet vise à **digitaliser ce processus** afin de faciliter le travail des enseignants et d'améliorer la communication entre les différents acteurs de la vie scolaire : administration, enseignants, étudiants et parents [1].

## 🎯 Objectifs principaux
- **Automatiser la gestion des notes** et calculer les moyennes automatiquement [2].
- **Générer des bulletins scolaires** téléchargeables au format PDF [2, 3].
- **Améliorer la communication** via des systèmes de notifications par email et de gestion des réclamations [2, 4, 5].
- **Sécuriser les accès** en gérant des rôles distincts (Admin, Enseignant, Étudiant, Parent) [2].

## 👥 Acteurs et Fonctionnalités (Cas d'utilisation)
L'application propose des interfaces et des droits spécifiques selon le profil de l'utilisateur :

*   **Administrateur** : Configure les classes, les matières, définit les périodes, gère les utilisateurs du système et génère les bulletins finaux [4].
*   **Enseignant** : Saisit et modifie les notes de ses évaluations, ajoute des commentaires, consulte des statistiques et traite les réclamations envoyées par les élèves [4, 6].
*   **Étudiant** : S'authentifie pour consulter ses notes, télécharger son bulletin, et dispose d'une fonctionnalité pour envoyer une réclamation s'il constate une erreur [4, 6].
*   **Parent** : Peut se connecter pour consulter exclusivement les résultats scolaires de son enfant [4].

## 🔄 Cycle de vie d'une note (Workflow)
Une note dans **EduConnect** n'est pas statique, elle suit un cycle de vie précis pour garantir la fiabilité des données :
1. **Brouillon** ➔ **Saisie** (par l'enseignant) [7].
2. **Validée** (par l'administration) puis **Publiée** [7].
3. **Consultée** (par l'étudiant) [7].
4. En cas de désaccord, la note passe en statut **Réclamation** puis **En Traitement** par l'enseignant [7].
5. Elle est finalement **Corrigée** (avec recalcul automatique de la moyenne) ou **Maintenue** [7, 8].

## ⚙️ Stack Technique

**Backend (API & Logique métier)**
*   **Django** & **Django REST Framework** : Création de l'API robuste et gestion des modèles [3].
*   **MySQL** : Base de données relationnelle pour stocker les entités (Utilisateurs, Classes, Matières, Évaluations, Bulletins, etc.) [3, 9].

**Frontend (Interface Utilisateur)**
*   **React** : Création d'une interface dynamique et réactive [3].
*   **Tailwind CSS** : Design moderne et responsive [3].

**Outils annexes**
*   **Chart.js** : Intégration de graphiques pour le suivi et les statistiques [3].
*   **ReportLab** : Génération des bulletins scolaires en documents PDF [3].

## 🚀 État d'avancement
Actuellement, **la structure du backend a été développée avec Django REST Framework**. 
- ✅ Initialisation du projet et configuration de la base de données MySQL.
- ✅ Création des modèles pour les 5 domaines clés : `accounts` (utilisateurs), `academics` (classes, matières), `grades` (notes, évaluations), `reports` (bulletins) et `communication` (réclamations, notifications).
- ✅ Configuration de l'interface d'administration Django (Admin panel).
- ✅ Développement de l'ensemble des routes API REST et intégration des ViewSets et Routers.
- ✅ Mise en place de la documentation interactive OpenAPI / Swagger UI via `drf-spectacular`.

## 💡 Conclusion
**EduConnect** est conçu pour simplifier la gestion scolaire, garantir la fiabilité 






