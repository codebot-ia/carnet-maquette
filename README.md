# Maquette de refonte de Carnet

Proposition de refonte de l'interface de Carnet, à valider avant toute implémentation :

- `index.html` — accueil : recherche, cartes de statut, saisie rapide, file de notes groupée par projet (dépliable), fiche latérale.
- `projet.html` — page projet : même kit, liste groupée par état (À faire / En cours / Terminées).
- `composants.html` — les briques bas niveau (boutons, champs, segments, étiquettes, cartes, en-tête de groupe, ligne de note).

La fiche latérale est éditable sur place : titre, note, projet, priorité et état s'y modifient, l'enregistrement est automatique et les compteurs suivent. Saisie, recherche, changement d'état, repli des groupes, bascule de thème et tiroir mobile fonctionnent pareillement. Les modifications restent dans le navigateur (`localStorage`), rien n'est envoyé.

Thème clair, sombre et système (bascule en bas de la colonne, choix mémorisé). Pages statiques sans dépendance : `styles.css`, `maquette.js`, polices Host Grotesk et JetBrains Mono auto-hébergées dans `polices/`.

Les notes affichées sont des exemples, pas des données réelles. URL provisoire, supprimée une fois la maquette validée.

Publié sur GitHub Pages : https://codebot-ia.github.io/carnet-maquette/
