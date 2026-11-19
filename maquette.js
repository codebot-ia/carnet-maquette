(() => {
  const racine = document.documentElement
  const app = document.getElementById('app')
  const voile = document.getElementById('voile')

  // ---------- Apparence ----------
  const boutonApparence = document.getElementById('apparence')
  const ordre = ['auto', 'clair', 'sombre']
  const noms = { auto: 'système', clair: 'clair', sombre: 'sombre' }
  const appliquer = (choix) => {
    const sombre = matchMedia('(prefers-color-scheme: dark)').matches
    racine.dataset.choix = choix
    racine.dataset.theme = choix === 'auto' ? (sombre ? 'sombre' : 'clair') : choix
    if (boutonApparence) boutonApparence.setAttribute('aria-label', `Apparence : ${noms[choix]}`)
  }
  appliquer(racine.dataset.choix || 'auto')
  boutonApparence?.addEventListener('click', () => {
    const suivant = ordre[(ordre.indexOf(racine.dataset.choix) + 1) % ordre.length]
    if (suivant === 'auto') localStorage.removeItem('carnet.apparence')
    else localStorage.setItem('carnet.apparence', suivant)
    appliquer(suivant)
  })

  // ---------- Groupes dépliables ----------
  document.querySelectorAll('.groupe-tete').forEach((tete) => {
    tete.addEventListener('click', () => {
      const ouvert = tete.getAttribute('aria-expanded') === 'true'
      tete.setAttribute('aria-expanded', String(!ouvert))
      tete.nextElementSibling.hidden = ouvert
    })
  })

  // ---------- Cartes de statut ----------
  const cartes = [...document.querySelectorAll('.carte')]
  const listesParVue = [...document.querySelectorAll('.notes[data-vue]')]
  const groupesFiltrables = [...document.querySelectorAll('.groupe[data-statut]')]

  cartes.forEach((carte) => {
    carte.addEventListener('click', () => {
      const filtre = carte.dataset.filtre
      cartes.forEach((c) => c.setAttribute('aria-pressed', String(c === carte)))
      if (listesParVue.length) {
        listesParVue.forEach((liste) => { liste.hidden = liste.dataset.vue !== filtre })
        return
      }
      groupesFiltrables.forEach((groupe) => { groupe.hidden = groupe.dataset.statut !== filtre })
    })
  })

  // ---------- Détail ----------
  const detail = document.getElementById('detail')
  const fermer = document.getElementById('detail-fermer')
  const LETTRES = { nouvelle: 'À faire', 'en-cours': 'En cours', faite: 'Terminée' }
  const CLASSES = { nouvelle: 'nouvelle', 'en-cours': 'encours', faite: 'faite' }
  const PRIO_CLASSES = { Haute: 'prio-haute', Moyenne: 'prio-moyenne', Basse: 'prio-basse', 'Sans priorité': 'prio-none' }

  const remplir = (note) => {
    const d = note.dataset
    const titre = document.getElementById('detail-titre')
    titre.textContent = d.titre
    const etiquette = document.getElementById('detail-statut')
    etiquette.textContent = LETTRES[d.statut]
    etiquette.className = `etiquette ${CLASSES[d.statut]}`
    document.getElementById('detail-age').textContent = d.age
    const projet = document.getElementById('detail-projet')
    projet.innerHTML = `<span class="pastille ${d.couleur}"></span> ${d.projet}`
    const prio = document.getElementById('detail-prio')
    prio.textContent = d.prio
    prio.className = `fiche-val ${PRIO_CLASSES[d.prio] || ''}`
    document.getElementById('detail-creee').textContent = d.age
    document.getElementById('detail-agent').textContent = d.envoyee
      ? `envoyée il y a ${d.envoyee} j`
      : 'pas encore envoyée'
    document.getElementById('detail-corps').textContent = d.corps || 'Pas de texte.'
    document.getElementById('detail-pieces').hidden = d.piece === '0'
  }

  const ouvrirDetail = (note) => {
    document.querySelectorAll('.note.est-active').forEach((n) => n.classList.remove('est-active'))
    note.classList.add('est-active')
    remplir(note)
    app.classList.add('detail-ouvert')
  }

  document.querySelectorAll('.note').forEach((note) => {
    note.querySelector('.note-lien')?.addEventListener('click', (e) => {
      e.preventDefault()
      ouvrirDetail(note)
    })
  })

  const fermerDetail = () => app.classList.remove('detail-ouvert')
  fermer?.addEventListener('click', fermerDetail)
  voile?.addEventListener('click', () => {
    fermerDetail()
    app.classList.remove('menu-ouvert')
  })
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return
    if (app.classList.contains('detail-ouvert')) fermerDetail()
    else app.classList.remove('menu-ouvert')
  })

  // ---------- Menu mobile ----------
  document.getElementById('ouvrir-menu')?.addEventListener('click', () => app.classList.add('menu-ouvert'))

  // ---------- Saisie ----------
  const note = document.getElementById('note')
  const redimensionner = () => {
    if (!note) return
    note.style.height = 'auto'
    note.style.height = `${Math.min(note.scrollHeight, 200)}px`
  }
  note?.addEventListener('input', redimensionner)

  document.querySelectorAll('.note').forEach((n) => {
    n.querySelector('.etat')?.addEventListener('click', (e) => e.stopPropagation())
    n.querySelector('.envoyer')?.addEventListener('click', (e) => e.stopPropagation())
  })
})()
