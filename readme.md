# Blog Node Starter Express

Une API avec un CRUD pour un blog / category / système de login et media service.

## Installation

Pour installer cette application sur votre ordinateur, suivez ces étapes :

1. Clonez le projet depuis GitHub :

   ```bash
   git clone https://github.com/YohannKIPFER/express-node-blog

2. Installer les dépendances (node v14.18.3)

   ```bash
   npm install

3. Copiez le .env.example.local en .env.development.local et lancez la migration

   ```bash
   npx prisma migrate dev

4. Run le projet

   ```bash
   npm run dev
 
## Les environnements et DB

Le .env sert juste à Prisma
Le .env.development.local est à utiliser en local
Il faut créer un .env.production.local pour la production
   
## Collection Bruno

Vous trouverez une collection Bruno dans le dossier BrunoCollection que vous pouvez ouvrir directement avec le client API Bruno.

## Auteur

Kipdev, créateur de contenus et développeur.

## Buy me a coffee 
https://www.buymeacoffee.com/kipdev