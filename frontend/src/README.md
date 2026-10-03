# Smart Engine — intégration de la maquette

Ce dossier `src` contient la maquette complète organisée par fonctionnalité.

## Installation

1. Remplacer le dossier `src` du frontend par ce dossier.
2. Vérifier que le projet contient les dépendances suivantes :

```bash
npm install react react-dom react-router-dom lucide-react
```

3. La maquette utilise les classes Tailwind CSS v4. Si Tailwind n'est pas encore installé :

```bash
npm install -D tailwindcss @tailwindcss/vite
```

Ajouter ensuite `tailwindcss()` dans les plugins du fichier `vite.config.js`.

4. Vérifier que `index.html` charge bien :

```html
<script type="module" src="/src/main.jsx"></script>
```

5. Démarrer le frontend :

```bash
npm run dev
```

## Connexion à Spring Boot

L'URL du backend est lue depuis :

```env
VITE_API_URL=http://localhost:8080/api
```

Tous les appels HTTP sont centralisés dans `src/api/`.

La maquette utilise encore `src/app/mockData.js` pour être immédiatement visible. Pour connecter
un écran au backend, remplacer progressivement les données simulées de cet écran par la fonction
correspondante de `src/api/`. Il n'est pas nécessaire de modifier les composants visuels.

## Organisation

- `api/` : appels HTTP vers Spring Boot.
- `app/` : configuration, providers et données de démonstration.
- `components/` : composants partagés.
- `features/` : écrans rangés par fonctionnalité métier.
- `hooks/` : logique React réutilisable.
- `layouts/` : structures Admin et Employé.
- `routes/` : routes publiques, privées et administrateur.
- `styles/` : thème et styles globaux.
- `utils/` : formatage des dates, montants et statuts.
