# Authentication & First-Time Setup

## Overview

Coelbook is a **self-hosted application**. Unlike a SaaS product, every
instance belongs to the organization or individual who installed it.

Because of this, Coelbook does **not** provide public user registration.

## Core Principles

-   No public sign-up page.
-   Authentication is mandatory.
-   The first installed user becomes the administrator.
-   The setup wizard is available only once.
-   Once configured, the application behaves like a standard
    authenticated application.

## Why There Is No Sign Up

The administrator has already decided to install Coelbook.

Typical flow:

1.  Install Coelbook.
2.  Start the containers.
3.  Open the application.
4.  Create the administrator account.

A public registration page adds unnecessary complexity and increases the
attack surface.

## Authentication

Authentication remains mandatory because Coelbook may be deployed on:

-   VPS
-   NAS
-   Raspberry Pi
-   Home server
-   Company infrastructure

## First-Time Setup

On startup, Coelbook checks whether an administrator account exists.

If not:

    /setup

### Step 1

Create the administrator.

Fields:

-   Name
-   Email
-   Password
-   Confirm Password

### Step 2

Configure the instance.

-   Instance name
-   Organization (optional)
-   Timezone

### Step 3

Finish configuration.

The setup route is permanently disabled and the user is redirected to
the login page.

## Normal Flow

    Application starts
            │
            ▼
    Administrator exists?
            │
       ┌────┴────┐
       │         │
      No        Yes
       │         │
       ▼         ▼
     /setup    /login
       │
    Create administrator
       │
    Configure instance
       │
    Disable setup
       │
    Redirect to login

## Future Authentication Providers

Future enterprise integrations may include:

-   LDAP
-   OpenID Connect (OIDC)
-   Keycloak
-   Authentik
-   Azure AD
-   GitHub OAuth
-   GitLab OAuth

The local administrator account should always remain available for
recovery.

## Recommendation for v1

    First launch
          ↓
    Setup Wizard
          ↓
    Create Administrator
          ↓
    Login
          ↓
    Dashboard

This provides a secure, simple and familiar experience for self-hosted
software.

## Inspirations

-   Forgejo
-   Gitea
-   Authentik
-   Outline
-   Keycloak
