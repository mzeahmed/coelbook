# Playbook

[![Go Version](https://img.shields.io/github/go-mod/go-version/mzeahmed/playbook?filename=backend%2Fgo.mod)](backend/go.mod)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://www.docker.com)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](#license)

# Playbook

# Playbook

> Ne résolvez jamais deux fois le même problème.

Playbook est une plateforme de capitalisation des connaissances techniques permettant de documenter, retrouver et réutiliser les solutions aux incidents rencontrés au quotidien.

Chaque problème résolu devient une connaissance exploitable par vous-même, votre équipe ou un assistant IA.

---

# Pourquoi ?

Chaque développeur passe une partie importante de son temps à résoudre des problèmes déjà rencontrés :

- erreur Git
- configuration Docker
- problème SSH
- incident CI/CD
- erreur Kubernetes
- configuration Traefik
- problème PostgreSQL

Quelques mois plus tard…

…on recommence les mêmes recherches.

Playbook transforme chaque résolution en une ressource durable.

---

# Vision

Playbook n'est pas un wiki.

Playbook est une plateforme de capitalisation d'expérience technique.

Chaque incident suit un cycle de vie :

```text
Incident

↓

Investigation

↓

Diagnostic

↓

Résolution

↓

Capitalisation

↓

Réutilisation
```

L'objectif est simple :

> **Construire votre mémoire technique.**

---

# Fonctionnalités

## Gestion des incidents

Chaque incident contient :

- titre
- résumé
- catégorie
- tags
- symptômes
- diagnostic
- cause
- résolution
- prévention
- commandes
- logs
- captures
- pièces jointes

---

## Recherche

Recherche rapide par :

- texte
- commande
- tag
- catégorie
- symptôme
- message d'erreur

---

## Assistant IA

L'assistant IA pourra :

- analyser un log
- retrouver une résolution existante
- proposer une nouvelle résolution
- générer automatiquement une fiche

---

## Historique

Chaque modification est historisée.

---

## API REST

L'application est entièrement pilotée par une API REST.

Le frontend, la CLI et les futures extensions utiliseront la même API.

---

# Cas d'utilisation

Playbook peut documenter des incidents liés à :

- Git
- GitHub
- Docker
- Kubernetes
- Linux
- SSH
- Go
- Symfony
- PostgreSQL
- WordPress
- Apache
- Nginx
- CI/CD
- GitHub Actions
- OpenAI
- Ollama

---

# Stack technique

## Backend

- Go
- Chi
- PostgreSQL
- sqlc
- goose
- JWT
- OpenAPI

## Frontend

- JavaScript vanilla
- TypeScript
- Vite
- Bootstrap 5

## Base de données

- PostgreSQL

## Déploiement

- Docker
- Docker Compose

---

# Démarrage de l'environnement de développement

## Prérequis

- Docker
- Docker Compose

## Installation

1. Copier le fichier d'environnement :

   ```bash
   cp .env.example .env
   ```

2. Démarrer l'environnement :

   ```bash
   make up
   ```

   Cette commande :
   - ajoute `playbook.local` et `api.playbook.local` à `/etc/hosts` (demande le mot de passe sudo)
   - copie `.env.example` vers `.env` si ce dernier n'existe pas encore
   - build et démarre les conteneurs : PostgreSQL, backend (hot-reload via [air](https://github.com/air-verse/air)), frontend (serveur de développement Vite), nginx, Adminer

## Services disponibles

| Service    | URL                        |
| ---------- | -------------------------- |
| Frontend   | http://playbook.local      |
| API        | http://api.playbook.local  |
| Adminer    | http://localhost:8081      |
| PostgreSQL | localhost:5432             |

## Arrêt

```bash
make down
```

Arrête les conteneurs et retire `playbook.local`/`api.playbook.local` de `/etc/hosts`.

## Autres commandes utiles

| Commande | Description |
| --- | --- |
| `make logs` | Suivre les logs des conteneurs |
| `make ps` | Lister les conteneurs |
| `make bash` | Ouvrir un shell dans le conteneur backend |
| `make restart` | Redémarrer l'environnement |
| `make migrate-up` | Appliquer les migrations |
| `make migrate-down` | Annuler la dernière migration |
| `make sqlc` | Régénérer le code Go depuis les requêtes SQL |

La liste complète des commandes est disponible via :

```bash
make help
```

---

# Architecture

```text
                Frontend (Vite + TypeScript)

                  │

            REST API

                  │

               Go API

                  │

             PostgreSQL
```

---

# Roadmap

## V1

- Gestion des incidents
- Catégories
- Tags
- Recherche
- Authentification

## V2

- Assistant IA

- Recherche sémantique

- Génération automatique de fiches

## V3

- CLI

- Extension navigateur

- Import / Export

- Synchronisation

## V4

- Travail collaboratif

- Gestion des équipes

- Permissions

---

# Licence

MIT