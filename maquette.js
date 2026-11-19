(() => {
  const racine = document.documentElement
  const app = document.getElementById('app')
  const voile = document.getElementById('voile')
  const CLE = 'carnet.maquette.v3'
  const ETATS = { nouvelle: 'À faire', 'en-cours': 'En cours', faite: 'Terminée' }
  const GROUPE = { nouvelle: 'À faire', 'en-cours': 'En cours', faite: 'Terminées' }
  const PRIOS = { haute: 'Haute', moyenne: 'Moyenne', basse: 'Basse', none: 'Sans priorité' }
  const COULEURS = { Homelab: 'c-ardoise', Carnet: 'c-terre', MonSuiviOrdo: 'c-mousse', 'Promos U': 'c-ocre', Maison: 'c-pierre' }

  // ---------------------------------------------------------------- apparence
  const boutonApparence = document.getElementById('apparence')
  const nomApparence = document.getElementById('apparence-nom')
  const ordre = ['auto', 'clair', 'sombre']
  const noms = { auto: 'Système', clair: 'Clair', sombre: 'Sombre' }
  const appliquerTheme = (choix) => {
    const sombre = matchMedia('(prefers-color-scheme: dark)').matches
    racine.dataset.choix = choix
    racine.dataset.theme = choix === 'auto' ? (sombre ? 'sombre' : 'clair') : choix
    if (boutonApparence) boutonApparence.setAttribute('aria-label', `Apparence : ${noms[choix].toLowerCase()}`)
    if (nomApparence) nomApparence.textContent = noms[choix]
  }
  appliquerTheme(racine.dataset.choix || 'auto')
  boutonApparence?.addEventListener('click', () => {
    const suivant = ordre[(ordre.indexOf(racine.dataset.choix) + 1) % ordre.length]
    if (suivant === 'auto') localStorage.removeItem('carnet.apparence')
    else localStorage.setItem('carnet.apparence', suivant)
    appliquerTheme(suivant)
  })

  // ---------------------------------------------------------------- stockage
  let memoire = {}
  try { memoire = JSON.parse(localStorage.getItem(CLE)) || {} } catch { memoire = {} }
  let minuteur
  const sauve = document.getElementById('sauve')
  let minuteurSauve
  const signaler = (texte) => {
    if (!sauve) return
    sauve.textContent = texte
    sauve.classList.add('visible')
    clearTimeout(minuteurSauve)
    minuteurSauve = setTimeout(() => sauve.classList.remove('visible'), 1800)
  }
  const retenir = (cle, donnees) => {
    memoire[cle] = { ...(memoire[cle] || {}), ...donnees }
    clearTimeout(minuteur)
    minuteur = setTimeout(() => {
      try { localStorage.setItem(CLE, JSON.stringify(memoire)) } catch { /* stockage plein */ }
      signaler('Enregistré')
    }, 400)
  }

  const ageTexte = (jours) => (jours <= 0 ? 'aujourd’hui' : jours === 1 ? 'hier' : `il y a ${jours} j`)

  // ---------------------------------------------------------------- éléments
  const toutesNotes = () => [...document.querySelectorAll('.file .note')]
  const noteCourante = () => document.querySelector('.note.est-active')
  const etatModele = {}
  toutesNotes().forEach((n) => {
    const st = n.dataset.statut
    if (!etatModele[st]) etatModele[st] = n.querySelector('.etat').innerHTML
  })
  const iconeEnvoyer = document.querySelector('.envoyer')?.innerHTML || ''
  const iconeAgent = document.querySelector('.meta-agent .ic')?.outerHTML || ''

  const metaHtml = (d) => {
    const morceaux = []
    if (d.avecProjet === '1') morceaux.push(`<span class="projet"><span class="pastille ${d.couleur}"></span>${d.projet}</span>`)
    if (d.statut !== 'faite' && d.prio && d.prio !== 'none') {
      morceaux.push(`<span class="meta-prio prio-${d.prio}"><span class="point"></span>${PRIOS[d.prio]}</span>`)
    }
    if (d.piece && d.piece !== '0') morceaux.push(`<span class="meta-piece">${iconeTrombone()}${d.piece}</span>`)
    if (d.envoyee && d.envoyee !== '' && d.statut !== 'faite') {
      morceaux.push(`<span class="meta-agent">${iconeAgent}Chez l’agent</span>`)
    }
    return morceaux.join('')
  }
  const iconeTrombone = () => '<svg class="ic" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 11.5l-7.6 7.6a4.5 4.5 0 0 1-6.4-6.4l7.7-7.6a3 3 0 0 1 4.3 4.3l-7.7 7.6a1.5 1.5 0 0 1-2.1-2.1l7-7"/></svg>'

  const peindreLigne = (note) => {
    const d = note.dataset
    note.querySelector('.note-titre').textContent = d.titre
    note.querySelector('.note-meta').innerHTML = metaHtml(d)
    note.querySelector('.note-age').textContent = ageTexte(Number(d.jours))
    const etat = note.querySelector('.etat')
    etat.className = `etat etat-${d.statut}`
    etat.innerHTML = etatModele[d.statut] || ''
  }

  // ---------------------------------------------------------------- groupes et comptes
  const listes = () => [...document.querySelectorAll('.file .notes-liste')]
  const listesParVue = () => listes().filter((l) => l.dataset.vue)

  const creerGroupe = (cle, statut, couleur, nom) => {
    const modele = document.getElementById('modele-groupe')
    const groupe = modele.content.firstElementChild.cloneNode(true)
    groupe.dataset.cle = cle
    groupe.dataset.statut = statut
    groupe.querySelector('.pastille').className = `pastille ${couleur}`
    groupe.querySelector('.groupe-nom').textContent = nom
    brancherGroupe(groupe.querySelector('.groupe-tete'))
    return groupe
  }

  const conteneurPour = (statut, projet) => {
    const vues = listesParVue()
    if (vues.length) {
      const vue = vues.find((v) => v.dataset.vue === statut) || vues[0]
      return { liste: vue, cle: projet, groupe: projet, couleur: COULEURS[projet] || 'c-pierre', statut }
    }
    return { liste: listes()[0], cle: statut, groupe: GROUPE[statut], couleur: `c-pastille-${statut.replace('-', '')}`, statut }
  }

  const deplacer = (note, statut, projet) => {
    const cible = conteneurPour(statut, projet)
    if (!cible.liste) return
    let groupe = cible.liste.querySelector(`.groupe[data-cle="${cible.cle}"]`)
    if (!groupe) {
      groupe = creerGroupe(cible.cle, cible.statut, cible.couleur, cible.groupe)
      cible.liste.appendChild(groupe)
    }
    groupe.querySelector('.notes').appendChild(note)
  }

  const recalculer = () => {
    if (!toutesNotes().length) return
    listes().forEach((liste) => {
      liste.querySelectorAll('.groupe').forEach((groupe) => {
        const items = [...groupe.querySelectorAll('.note')]
        groupe.querySelector('.groupe-compte').textContent = items.length
        if (items.length) {
          const vieux = Math.max(...items.map((n) => Number(n.dataset.jours)))
          groupe.querySelector('.groupe-age').textContent = `plus ancienne : ${ageTexte(vieux)}`
        }
      })
    })
    document.querySelectorAll('.carte').forEach((carte) => {
      const st = carte.dataset.filtre
      const items = toutesNotes().filter((n) => n.dataset.statut === st)
      carte.querySelector('.carte-nombre').textContent = items.length
      carte.querySelector('.carte-note').textContent = items.length
        ? `plus ancienne : ${ageTexte(Math.max(...items.map((n) => Number(n.dataset.jours))))}`
        : 'aucune note'
    })
    document.querySelectorAll('[data-total-ouvertes]').forEach((e) => {
      e.textContent = toutesNotes().filter((n) => n.dataset.statut === 'nouvelle').length
    })
    document.querySelectorAll('[data-total-encours]').forEach((e) => {
      e.textContent = toutesNotes().filter((n) => n.dataset.statut === 'en-cours').length
    })
    appliquerVisibilite()
  }

  // ---------------------------------------------------------------- fiche
  const detail = document.getElementById('detail')
  const champs = {
    repere: document.getElementById('detail-projet-repere'),
    age: document.getElementById('detail-age'),
    titre: document.getElementById('detail-titre'),
    projet: document.getElementById('detail-projet'),
    corps: document.getElementById('detail-corps'),
    pieces: document.getElementById('detail-pieces'),
    agent: document.getElementById('detail-agent'),
    etats: document.getElementById('detail-etats'),
    prios: document.getElementById('detail-prios'),
  }

  const activer = (conteneur, attribut, valeur) => {
    conteneur.querySelectorAll('button').forEach((b) => {
      b.setAttribute('aria-pressed', String(b.dataset[attribut] === valeur))
    })
  }

  const remplir = (note) => {
    const d = note.dataset
    app.dataset.note = d.cle
    champs.repere.textContent = d.projet
    champs.age.textContent = `créée ${ageTexte(Number(d.jours))}`
    champs.titre.value = d.titre
    ajuster(champs.titre)
    champs.corps.value = d.corps || ''
    champs.projet.value = d.projet
    activer(champs.etats, 'statut', d.statut)
    activer(champs.prios, 'prio', d.prio)
    champs.pieces.hidden = d.piece === '0' || d.piece === ''
    champs.agent.lastElementChild.textContent = d.envoyee && d.envoyee !== ''
      ? `Envoyée à l’agent il y a ${d.envoyee} j`
      : 'Pas encore envoyée à l’agent'
  }

  const ouvrir = (note) => {
    document.querySelectorAll('.note.est-active').forEach((n) => n.classList.remove('est-active'))
    note.classList.add('est-active')
    remplir(note)
    app.classList.add('detail-ouvert')
    detail.setAttribute('aria-hidden', 'false')
    requestAnimationFrame(() => ajuster(champs.titre))
    app.classList.remove('menu-ouvert')
  }

  const fermer = () => {
    app.classList.remove('detail-ouvert')
    detail.setAttribute('aria-hidden', 'true')
    document.querySelectorAll('.note.est-active').forEach((n) => n.classList.remove('est-active'))
  }

  const majNote = (note, donnees) => {
    Object.assign(note.dataset, donnees)
    if (donnees.statut || donnees.projet) {
      deplacer(note, note.dataset.statut, note.dataset.projet)
    }
    peindreLigne(note)
    recalculer()
  }

  const ajuster = (zone) => {
    if (!zone) return
    zone.style.height = 'auto'
    zone.style.height = `${zone.scrollHeight}px`
  }

  champs.titre?.addEventListener('input', () => {
    ajuster(champs.titre)
    const note = noteCourante()
    if (!note) return
    note.dataset.titre = champs.titre.value
    note.querySelector('.note-titre').textContent = champs.titre.value
    retenir(note.dataset.cle, { titre: champs.titre.value })
  })

  champs.corps?.addEventListener('input', () => {
    const note = noteCourante()
    if (!note) return
    note.dataset.corps = champs.corps.value
    retenir(note.dataset.cle, { corps: champs.corps.value })
  })

  champs.projet?.addEventListener('change', () => {
    const note = noteCourante()
    if (!note) return
    const projet = champs.projet.value
    majNote(note, { projet, couleur: COULEURS[projet] || 'c-pierre' })
    champs.repere.textContent = projet
    retenir(note.dataset.cle, { projet })
  })

  champs.etats?.addEventListener('click', (e) => {
    const bouton = e.target.closest('button[data-statut]')
    const note = noteCourante()
    if (!bouton || !note) return
    activer(champs.etats, 'statut', bouton.dataset.statut)
    majNote(note, { statut: bouton.dataset.statut })
    retenir(note.dataset.cle, { statut: bouton.dataset.statut })
    signaler('État mis à jour')
  })

  champs.prios?.addEventListener('click', (e) => {
    const bouton = e.target.closest('button[data-prio]')
    const note = noteCourante()
    if (!bouton || !note) return
    activer(champs.prios, 'prio', bouton.dataset.prio)
    majNote(note, { prio: bouton.dataset.prio })
    retenir(note.dataset.cle, { prio: bouton.dataset.prio })
  })

  document.querySelector('.detail-pied .principal')?.addEventListener('click', () => {
    const note = noteCourante()
    if (!note) return
    note.dataset.envoyee = '0'
    majNote(note, {})
    champs.agent.lastElementChild.textContent = 'Envoyée à l’agent à l’instant'
    retenir(note.dataset.cle, { envoyee: '0' })
    signaler('Envoyée à l’agent')
  })

  document.querySelectorAll('.detail-pied .bouton:not(.principal)').forEach((b) => {
    if (b.classList.contains('danger')) return
    b.addEventListener('click', () => {
      const note = noteCourante()
      if (!note) return
      activer(champs.etats, 'statut', 'faite')
      majNote(note, { statut: 'faite' })
      retenir(note.dataset.cle, { statut: 'faite' })
      signaler('Note terminée')
    })
  })

  document.getElementById('detail-fermer')?.addEventListener('click', fermer)

  // ---------------------------------------------------------------- groupes
  const brancherGroupe = (tete) => {
    tete.addEventListener('click', () => {
      const ouvert = tete.getAttribute('aria-expanded') === 'true'
      tete.setAttribute('aria-expanded', String(!ouvert))
      tete.nextElementSibling.hidden = ouvert
    })
  }
  document.querySelectorAll('.groupe-tete').forEach(brancherGroupe)

  // ---------------------------------------------------------------- filtres
  let filtreActif = document.querySelector('.carte[aria-pressed="true"]')?.dataset.filtre || null

  const appliquerVisibilite = () => {
    const q = (document.getElementById('filtre')?.value || '').trim().toLowerCase()
    const vues = listesParVue()
    vues.forEach((vue) => {
      vue.hidden = Boolean(filtreActif) && vue.dataset.vue !== filtreActif
    })
    let visibles = 0
    listes().forEach((liste) => {
      if (liste.hidden) return
      liste.querySelectorAll('.groupe').forEach((groupe) => {
        let n = 0
        groupe.querySelectorAll('.note').forEach((note) => {
          const ok = !q
            || note.dataset.titre.toLowerCase().includes(q)
            || (note.dataset.corps || '').toLowerCase().includes(q)
          note.hidden = !ok
          if (ok) n += 1
        })
        const parCarte = vues.length > 0 || !filtreActif || groupe.dataset.statut === filtreActif
        groupe.hidden = n === 0 || !parCarte
        if (q) groupe.querySelector('.groupe-compte').textContent = n
        visibles += n
      })
    })
    const vide = document.getElementById('file-vide')
    if (vide) vide.hidden = visibles > 0 || !q
  }

  document.querySelectorAll('.carte').forEach((carte) => {
    carte.addEventListener('click', () => {
      const statut = carte.dataset.filtre
      if (!listesParVue().length && filtreActif === statut) {
        filtreActif = null
        carte.setAttribute('aria-pressed', 'false')
      } else {
        filtreActif = statut
        document.querySelectorAll('.carte').forEach((c) => c.setAttribute('aria-pressed', String(c === carte)))
      }
      appliquerVisibilite()
    })
  })

  document.getElementById('filtre')?.addEventListener('input', () => appliquerVisibilite())

  // ---------------------------------------------------------------- saisie
  const composer = document.getElementById('note')
  const redimensionner = () => {
    if (!composer) return
    composer.style.height = 'auto'
    composer.style.height = `${Math.min(composer.scrollHeight, 200)}px`
  }
  composer?.addEventListener('input', redimensionner)

  const fabriquer = (d) => {
    const note = document.createElement('li')
    note.className = 'note'
    note.dataset.cle = d.cle
    note.dataset.statut = d.statut
    note.dataset.titre = d.titre
    note.dataset.projet = d.projet
    note.dataset.couleur = COULEURS[d.projet] || 'c-pierre'
    note.dataset.prio = d.prio
    note.dataset.jours = d.jours
    note.dataset.piece = d.piece || '0'
    note.dataset.envoyee = d.envoyee || ''
    note.dataset.corps = d.corps || ''
    note.dataset.avecProjet = d.avecProjet || '0'
    note.innerHTML = `<button type="button" class="etat etat-${d.statut}" aria-label="Changer l’état">${etatModele[d.statut] || ''}</button>
      <a class="note-lien" href="#fiche"><span class="note-titre"></span><span class="note-meta"></span></a>
      <span class="note-age"></span>
      <button type="button" class="envoyer" aria-label="Envoyer à l’agent" title="Envoyer à l’agent">${iconeEnvoyer}</button>`
    brancherNote(note)
    deplacer(note, d.statut, d.projet)
    peindreLigne(note)
    return note
  }

  const ajouter = () => {
    const texte = composer?.value.trim()
    if (!texte) return composer?.focus()
    const projet = document.getElementById('ajout-projet')?.value || 'Homelab'
    const prio = document.getElementById('ajout-prio')?.value || 'none'
    const cle = `local-${Date.now()}`
    const avecProjet = '0'
    const donnees = { cle, statut: 'nouvelle', titre: texte, projet, prio, jours: '0', piece: '0', envoyee: '', corps: '', avecProjet }
    const note = fabriquer(donnees)
    if (composer) { composer.value = ''; redimensionner() }
    retenir(cle, { titre: texte, projet, prio, corps: '', statut: 'nouvelle' })
    recalculer()
    appliquerVisibilite()
    note.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }

  document.getElementById('ajout')?.addEventListener('submit', (e) => {
    e.preventDefault()
    ajouter()
  })
  composer?.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); ajouter() }
  })

  // ---------------------------------------------------------------- notes
  const brancherNote = (note) => {
    note.querySelector('.note-lien')?.addEventListener('click', (e) => {
      e.preventDefault()
      ouvrir(note)
    })
    note.querySelector('.etat')?.addEventListener('click', (e) => {
      e.stopPropagation()
      const suivant = { nouvelle: 'en-cours', 'en-cours': 'faite', faite: 'nouvelle' }[note.dataset.statut]
      majNote(note, { statut: suivant })
      retenir(note.dataset.cle, { statut: suivant })
      if (note === noteCourante()) remplir(note)
      signaler(`État : ${ETATS[suivant].toLowerCase()}`)
    })
    note.querySelector('.envoyer')?.addEventListener('click', (e) => {
      e.stopPropagation()
      note.dataset.envoyee = '0'
      majNote(note, {})
      retenir(note.dataset.cle, { envoyee: '0' })
      signaler('Envoyée à l’agent')
    })
  }
  toutesNotes().forEach(brancherNote)

  // ---------------------------------------------------------------- reprise
  toutesNotes().forEach((note) => {
    const m = memoire[note.dataset.cle]
    if (!m) return
    const donnees = {}
    ;['titre', 'corps', 'prio', 'statut', 'projet', 'envoyee'].forEach((k) => {
      if (m[k] !== undefined) donnees[k] = m[k]
    })
    if (donnees.projet && COULEURS[donnees.projet]) donnees.couleur = COULEURS[donnees.projet]
    Object.assign(note.dataset, donnees)
    if (donnees.statut || donnees.projet) deplacer(note, note.dataset.statut, note.dataset.projet)
    peindreLigne(note)
  })
  Object.entries(memoire).forEach(([cle, m]) => {
    if (!cle.startsWith('local-') || document.querySelector(`.note[data-cle="${cle}"]`)) return
    fabriquer({
      cle, statut: m.statut || 'nouvelle', titre: m.titre || 'Note sans titre',
      projet: m.projet || 'Homelab', prio: m.prio || 'none', jours: '0',
      piece: '0', envoyee: '', corps: m.corps || '',
    })
  })
  recalculer()

  // ---------------------------------------------------------------- clavier et voile
  document.getElementById('ouvrir-menu')?.addEventListener('click', () => app.classList.add('menu-ouvert'))
  document.getElementById('fermer-menu')?.addEventListener('click', () => app.classList.remove('menu-ouvert'))
  document.getElementById('nouvelle')?.addEventListener('click', () => {
    composer?.focus()
    document.getElementById('contenu')?.scrollTo({ top: 0, behavior: 'smooth' })
  })

  voile?.addEventListener('click', () => {
    fermer()
    app.classList.remove('menu-ouvert')
  })

  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault()
      document.getElementById('filtre')?.focus()
      return
    }
    if (e.key !== 'Escape') return
    if (app.classList.contains('detail-ouvert')) fermer()
    else app.classList.remove('menu-ouvert')
  })
})()
