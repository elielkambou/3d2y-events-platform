# 3D2Y Events Platform

## Description
3D2Y Events Platform est une plateforme de découverte culturelle et de billetterie premium orientée Abidjan.
Elle permet de publier des événements, vendre ou réserver des billets, générer des QR codes et contrôler les entrées.

## Technologies
- Next.js
- TypeScript
- Tailwind CSS
- Prisma ORM
- PostgreSQL (local)
- Docker

## Installation
git clone <url-du-repo>
cd 3d2y-events-platform
npm install

## Configuration
Créer un fichier .env à la racine du projet :

DATABASE_URL="postgresql://eliel:eliel123@localhost:5432/3d2y_local"
DIRECT_URL="postgresql://eliel:eliel123@localhost:5432/3d2y_local"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

## Base de données locale
Démarrer PostgreSQL avec Docker :

docker compose up -d

Puis lancer Prisma :

npx prisma migrate dev --name init_schema
npx prisma generate --schema=./prisma/schema.prisma
npm run db:seed

## Lancer le projet
npm run dev

L'application sera disponible sur :
http://localhost:3000

## Comptes de test
- admin@3d2y.local : administrateur
- agency@lagune.local : agence
- scanner@lagune.local : scanner
- client@test.local : client

## Fonctionnalités disponibles
- catalogue public d'événements
- détail d'un événement
- création et soumission d'événements côté agence
- validation et publication côté administration
- achat direct de billets
- réservation avec acompte
- génération de billets avec QR code
- contrôle des billets par scanner
- statistiques côté agence
- commandes et remboursements côté admin

## Organisation du projet
- src/app : routes et pages Next.js
- src/server : actions et queries serveur
- src/lib : utilitaires et helpers
- src/validators : validations Zod
- prisma : schéma, migrations et seed

## Travail en équipe
Workflow recommandé :
- garder main comme branche stable
- créer une branche par fonctionnalité
- tester localement avant chaque merge

Exemple :
git checkout -b feature/nom-feature

## À ne pas versionner
- .env
- .env.local
- node_modules
- .next

## État du projet
Le projet est actuellement développé en local afin de stabiliser l'architecture, le modèle de données et les workflows principaux avant l'intégration des services externes.