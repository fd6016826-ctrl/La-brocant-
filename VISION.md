# Vision du Projet - Suivi des Changements & Corrections

Ce document récapitule la vision globale de l'application de Brocante, les erreurs rencontrées, et l'ensemble des corrections apportées pour assurer le bon fonctionnement de l'application.

---

## 1. Contexte & Problématique Initiale
L'application est une plateforme de brocante en ligne (achat et vente) composée d'un frontend en **React (TypeScript)** et d'un backend **Express**. Les données devaient être stockées initialement sur **Supabase**.

**Le Problème principal :**
Dans notre environnement local de développement et de test (sandboxing/hors-ligne), les appels réseau vers Supabase échouaient systématiquement, rendant impossible la publication d'annonces en ligne et le chargement du catalogue.

---

## 2. Erreurs rencontrées & Analysées

### Erreur réseau Supabase
* **Message d'erreur :** `Caused by: Error: getaddrinfo ENOTFOUND dhgckyfemhzgvmnysizh.supabase.co`
* **Cause :** Pas de connexion Internet ou problème de résolution DNS dans l'environnement d'exécution vis-à-vis du serveur distant Supabase.
* **Impact :** Les requêtes `listings`, `demands` et `chats` vers l'API échouaient avec des erreurs `TypeError: fetch failed` et renvoyaient des codes HTTP 500 à l'utilisateur.

### Conflit de compilation TypeScript
* **Message d'erreur :** Conflit de variables en double (`const localFilename` et `const localDirname` déjà définis).
* **Cause :** Ces constantes de chemins locaux étaient déclarées à la fois en haut du fichier `server.ts` et au milieu (vers la ligne 459).
* **Impact :** Plantage ou erreur de transpilation au démarrage du serveur de développement.

---

## 3. Corrections Apportées & Changements

### Détection & Commutation automatique (Fallback)
* Déclaration d'un indicateur global `useLocalDb`.
* Ajout d'un test de connectivité réseau à Supabase au démarrage (`start()`). En cas d'erreur (`PGRST205` ou échec DNS), l'application bascule silencieusement sur la base de données locale autonome.
* Shadowing de la variable `supabase` avec un wrapper intelligent :
  ```typescript
  const supabase = {
    from(tableName: string) {
      if (useLocalDb) {
        return new LocalQueryBuilder(tableName) as any;
      }
      return supabaseClient.from(tableName);
    }
  };
  ```

### Système d'émulation Supabase (`LocalQueryBuilder`)
* Création d'un constructeur de requêtes chaînables émulant l'ORM Supabase dans `server.ts`.
* Implémentation des méthodes :
  * `.select(fields)`
  * `.insert(rows)`
  * `.update(fields)`
  * `.delete()`
  * Filtres : `.eq()`, `.ilike()`, `.or()`, `.in()`, `.gte()`, `.lte()`
  * Formats : `.single()`, `.maybeSingle()`, `.order()`, `.limit()`
* Persistance directe dans un fichier local nommé `local_db.json`.

### Initialisation & Seeding de Données Premium
* Si la base locale `local_db.json` n'existe pas ou est vide, elle s'auto-alimente automatiquement avec des données riches en français :
  * **3 Annonces Premium :** Enfilade scandinave en teck, appareil photo Canon EOS 80D, et collection de vinyles rock.
  * **1 Demande d'acheteur :** Recherche d'un canapé Togo Ligne Roset.
  * **1 Fil de discussion existant :** Discussion de négociation entamée avec l'**Agent Antigravity 🤖**.

### Nettoyage du code
* Suppression des doublons de déclaration de `localFilename` et `localDirname` dans `server.ts`.

---

## 4. Statut Actuel du Projet
* **GitHub Repository :** Code source publié et synchronisé avec succès sur [github.com/fd6016826-ctrl/La-brocant-](https://github.com/fd6016826-ctrl/La-brocant-).
* **Serveur de développement :** Actif et fonctionnel sur `http://localhost:3000`.
* **Publication d'annonces :** Entièrement opérationnelle. Le test de création d'une annonce (*Vélo vintage Peugeot* à 150 €) a été validé avec succès.
* **Persistance :** Les données locales sont enregistrées en temps réel dans `local_db.json` au format attendu par le client React.
* **Interface de Discussion (Chat) :**
  - Alignement des filtres (`Tous`, `Reçus`, `Envoyés`) et du bouton de statut de transaction sur la même ligne horizontale.
  - Réduction générale de la taille des composants de filtre pour un rendu compact.
  - Suppression de la limite des 10 messages (le nombre de messages à l'intérieur d'une discussion est illimité pour tout le monde).
  - Mise en gras (`**`) automatique des paramètres clés injectés dans les messages de contact (titres d'annonces, quantités demandées, budgets, etc.).
  - **Règle de limitation des discussions de vente (Standard) :**
    * Les discussions d'**Achat** (où l'utilisateur connecté est l'acheteur) sont **illimitées**.
    * Les discussions de **Vente** (où l'utilisateur connecté est le vendeur) sont limitées à **10 discussions maximum** avec 10 acheteurs différents pour les forfaits Standard (Gratuit).
    * En cas de dépassement de la limite de 10 discussions de vente :
      - Un badge rouge `🔒 Limite` s'affiche sur les discussions de vente hors-limite dans la liste latérale.
      - L'envoi de messages est bloqué pour ces discussions de vente hors-limite avec un bandeau d'information et un bouton d'upgrade vers Brocante Pro.

* **Nettoyage des Comptes Simulés (Front-end) :**
  - Tous les comptes de test inactifs ou dysfonctionnels ont été supprimés.
  - Seuls les **deux comptes les plus actifs** ont été conservés : **Jean Testeur** (`jean.testeur@gmail.com`) et **Sophie B.** (`sophie.b69@gmail.com`).
  - Le compte de l'Agent Antigravity (`antigravity@la-brocante.fr`) ainsi que les autres comptes secondaires ont été entièrement retirés de cette liste.

---

## 5. Actions Requises de Votre Côté
Pour valider et profiter de ces changements, voici ce que vous devez faire :

1. **Vérifier le visuel et les limites :**
   - Ouvrez ou rafraîchissez votre navigateur sur [http://localhost:3000](http://localhost:3000).
   - Accédez à l'onglet de messagerie.
   - En tant qu'acheteur, vous pouvez avoir autant de fils de discussion d'achat que vous le souhaitez sans blocage ni bandeau.
   - Si un utilisateur standard a plus de 10 discussions de vente distinctes, les discussions au-delà de la 10ème (dans l'ordre chronologique de leur création) afficheront le badge rouge `🔒 Limite` dans la liste et bloqueront la saisie de message dans la fenêtre active avec le bandeau d'upgrade.

2. **Activer l'Agent de Négociation Réel (Optionnel) :**
   - Actuellement, l'Agent Antigravity fonctionne en mode simulé. Si vous souhaitez activer ses réelles capacités de négociation autonome via l'API Gemini, ajoutez votre clé API Gemini dans le fichier `.env` à la racine du projet comme suit :
     ```env
     GEMINI_API_KEY=votre_cle_api_ici
     ```
   - Si la clé n'est pas fournie, l'agent continuera d'utiliser des réponses simulées de secours.

3. **Sauvegarde et Chargement des Comptes depuis la Base de Données (DB) :**
   - Les **deux comptes les plus actifs** (Jean Testeur et Sophie B.) sont désormais enregistrés en base de données dans la collection `users` (dans `local_db.json` ou la table Supabase `profiles`).
   - Le front-end charge dynamiquement la liste des comptes via l'API `GET /api/users` au démarrage de l'application, éliminant les données codées en dur.
   - Les nouveaux comptes de test créés via l'interface sont enregistrés de façon permanente en base de données en effectuant une requête `POST /api/users`.
   - Les comptes inactifs (comme Marc Dupuis, Pierre M., et l'Agent Antigravity) ont été exclus et supprimés de la base de données.

4. **Nettoyage des Anciens Émoticônes de Profil (emojiMap) :**
   - L'ancien mappage statique `emojiMap` (qui associait des icônes d'animaux 🦊, 🦉, 🦁, 🐱 à des photos Unsplash) a été complètement supprimé de `src/App.tsx` et `AccountManagementModal.tsx`.
   - L'application utilise dorénavant directement les images d'avatars choisies (ou le composant d'image par défaut) lors de la création ou de l'affichage d'un compte.

5. **Résolution du Chevauchement Mobile (Responsivité) :**
   - Le menu de navigation flottant horizontal du bas de l'écran se cache désormais automatiquement dès qu'un modal s'ouvre (création d'annonce, création de recherche citoyenne, profil, upgrade, connexion) ou lorsqu'une discussion de messagerie active est ouverte sur mobile.
   - Cela élimine définitivement les chevauchements entre le menu horizontal et les boutons de validation ("Publier l'annonce maintenant", etc.), garantissant une utilisation fluide et ergonomique sur smartphone.

6. **Installation des Bibliothèques Supabase :**
   - Installation des paquets officiels `@supabase/supabase-js` et `@supabase/ssr` pour supporter les liaisons de bases de données et les fonctionnalités côté serveur (Server-Side Rendering).

7. **Script de Création des Tables Supabase (SQL) :**
   - Création du fichier [supabase_schema.sql](file:///c:/Users/bmd/Documents/brocant%20achat%20et%2520vente/supabase_schema.sql) à la racine du projet contenant le script de création de toutes les tables (`profiles`, `listings`, `demands`, `chats`) et les règles de sécurité associées (RLS), prêt à être exécuté dans l'éditeur SQL de Supabase.

8. **Vérification OTP Réelle par E-mail (Supabase Auth) :**
   - Implémentation de deux nouveaux endpoints API dans `server.ts` :
     - `POST /api/auth/send-otp` : Envoie un vrai e-mail OTP de 6 chiffres à l'utilisateur via `supabase.auth.signInWithOtp`. En cas de limitation de taux (rate limit) ou d'erreur Supabase, le serveur bascule automatiquement vers un code simulé affiché dans une notification à l'écran (mode démonstration).
     - `POST /api/auth/verify-otp` : Valide le code saisi par l'utilisateur via `supabase.auth.verifyOtp`. Si le mode simulé était actif, le code stocké en mémoire est comparé directement.
   - Mise à jour de `LoginPage.tsx` :
     - Passage des champs de saisie OTP de **4 chiffres à 6 chiffres** (format natif Supabase).
     - La notification toast affiche désormais deux messages distincts : un pour le mode simulé (avec le code en clair) et un pour le vrai e-mail (indiquant que le code a été envoyé à l'adresse e-mail saisie).
     - Les boutons de soumission (Continuer, Confirmer) affichent un texte de chargement ("Envoi du code...", "Vérification...") et sont désactivés pendant les appels réseau pour éviter les soumissions multiples.
