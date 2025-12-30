function mockLoadout(game, playstyle) {
  const weapons = {
    warzone: ["M4A1", "Kastov-762", "CR-56"],
    apex: ["R-301", "VK-47", "Flatline"],
    valorant: ["Vandal", "Phantom", "Operator"]
  }
  const attachments = ["Red Dot", "Foregrip", "Extended Mag", "Laser"]
  const perks = ["Fast Reload", "Steady Aim", "Lightweight"]

  const weaponList = weapons[game] || weapons.warzone
  const weapon = weaponList[Math.floor(Math.random()*weaponList.length)]

  return {
    weapon,
    attachments: attachments.sort(()=>0.5-Math.random()).slice(0,3),
    perks: perks.sort(()=>0.5-Math.random()).slice(0,2),
    source: playstyle === 'aggressive' ? 'preset' : 'ai'
  }
}

function renderLoadout(data){
  const result = document.getElementById('result')
  result.innerHTML = ''
  const wrapper = document.createElement('div')
  wrapper.className = 'loadout'

  const card = document.createElement('div')
  card.className = 'card'
  const title = document.createElement('h3')
  title.textContent = data.weapon
  card.appendChild(title)

  // source badge
  const badge = document.createElement('span')
  badge.className = 'badge'
  badge.textContent = data.source === 'ai' ? 'AI' : 'Preset'
  badge.style.float = 'right'
  title.appendChild(badge)

  const attTitle = document.createElement('div')
  attTitle.textContent = 'Attachments'
  const attList = document.createElement('ul')
  attList.className = 'list'
  data.attachments.forEach(a => { const li = document.createElement('li'); li.textContent = a; attList.appendChild(li) })
  card.appendChild(attTitle)
  card.appendChild(attList)

  const perksTitle = document.createElement('div')
  perksTitle.textContent = 'Perks'
  const perksList = document.createElement('ul')
  perksList.className = 'list'
  data.perks.forEach(p => { const li = document.createElement('li'); li.textContent = p; perksList.appendChild(li) })
  card.appendChild(perksTitle)
  card.appendChild(perksList)

  wrapper.appendChild(card)
  result.appendChild(wrapper)
}

// Navigation
function showPage(id){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('page-active'))
  const el = document.getElementById(id)
  if (el) el.classList.add('page-active')
}

// Home: generate loadout
function initHome(){
  const btn = document.getElementById('generate')
  if (!btn) return
  const gameSelect = document.getElementById('game')
  const platformSelect = document.getElementById('platform')
  if (gameSelect){
    gameSelect.addEventListener('change', ()=>{
      updateHomePlatforms(gameSelect.value)
    })
  }

  btn.addEventListener('click', ()=>{
    const gameId = document.getElementById('game').value
    const playstyle = document.getElementById('playstyle').value
    const platform = document.getElementById('platform') ? document.getElementById('platform').value : null
    btn.disabled = true
    btn.textContent = 'Generating...'

    setTimeout(()=>{
      // prefer platform-specific data from GAMES_DATA
      const dataSrc = window.GAMES_DATA || { games: [] }
      const game = dataSrc.games.find(g => g.id === gameId)
      let out
      if (game && game.platforms){
        const pf = (game.platforms.find(p => p.platform === platform) || game.platforms[0])
        // support playstyle-specific variants if provided
        const base = pf.recommendedLoadout || {}
        const variant = (base.variants && base.variants[playstyle]) ? base.variants[playstyle] : null
        const chosen = variant || base
        out = {
          weapon: chosen.primary || chosen.primary || 'Recommended Primary',
          attachments: chosen.attachments || [],
          perks: chosen.perks || [],
          source: playstyle === 'aggressive' ? 'preset' : 'ai'
        }
      } else {
        out = mockLoadout(gameId, playstyle)
      }

      renderLoadout(out)
      btn.disabled = false
      btn.textContent = 'Generate Loadout'
    }, 400)
  })
}

// Subscribe handlers
function initSubscribe(){
  document.querySelectorAll('.subscribe').forEach(b=>{
    b.addEventListener('click', ()=>{
      const plan = b.getAttribute('data-plan')
      const out = document.getElementById('subscribe-result')
      out.innerHTML = `<div class="panel">Selected plan: <strong>${plan}</strong>. (No payment connected in demo.)</div>`
    })
  })
}

// Games page
async function initGames(){
  const listEl = document.getElementById('games-list')
  const detailEl = document.getElementById('game-detail')
  const search = document.getElementById('game-search')
  if (!listEl || !detailEl || !search) return

  let data = { games: [] }
  try {
    const res = await fetch('/data/games.json')
    data = await res.json()
    // expose globally for other functions
    window.GAMES_DATA = data
  } catch (e) {
    listEl.innerHTML = '<div class="muted">Failed to load games data.</div>'
    return
  }

  function renderList(filter=''){
    listEl.innerHTML = ''
    const items = data.games.filter(g => g.name.toLowerCase().includes(filter.toLowerCase()))
    items.forEach(g => {
      const card = document.createElement('div')
      card.className = 'game-card'
      const title = document.createElement('h4')
      title.textContent = g.name
      const desc = document.createElement('p')
      // safely derive a primary description from top-level or first platform
      let primaryDesc = ''
      try {
        if (g.recommendedLoadout && g.recommendedLoadout.primary) primaryDesc = g.recommendedLoadout.primary
        else if (g.platforms && g.platforms.length){
          const first = g.platforms[0]
          const firstObj = (typeof first === 'string') ? null : first
          if (firstObj && firstObj.recommendedLoadout && firstObj.recommendedLoadout.primary) primaryDesc = firstObj.recommendedLoadout.primary
        }
      } catch (e){ primaryDesc = '' }
      desc.textContent = primaryDesc || ''
      card.appendChild(title)
      card.appendChild(desc)
      card.addEventListener('click', ()=> showDetail(g))
      listEl.appendChild(card)
    })
    if (items.length === 0) listEl.innerHTML = '<div class="muted">No games found.</div>'
  }

  function showDetail(g){
    detailEl.innerHTML = ''
    const wrap = document.createElement('div')
    wrap.className = 'game-detail'
    const h = document.createElement('h3')
    h.textContent = g.name
    wrap.appendChild(h)

    // platform selector
    const platformWrapper = document.createElement('div')
    platformWrapper.style.marginBottom = '8px'
    const pfLabel = document.createElement('label')
    pfLabel.textContent = 'Platform'
    pfLabel.style.display = 'block'
    const pfSelect = document.createElement('select')
    pfSelect.style.marginTop = '6px'
    (g.platforms || []).forEach(p => {
      const o = document.createElement('option')
      const val = (typeof p === 'string') ? p : (p.platform || '')
      o.value = val
      o.textContent = val
      pfSelect.appendChild(o)
    })
    platformWrapper.appendChild(pfLabel)
    platformWrapper.appendChild(pfSelect)
    wrap.appendChild(platformWrapper)

    const settingsTitle = document.createElement('h4')
    settingsTitle.textContent = 'Recommended Settings'
    wrap.appendChild(settingsTitle)
    const settingsContainer = document.createElement('div')
    settingsContainer.className = 'settings'
    wrap.appendChild(settingsContainer)

    const loadTitle = document.createElement('h4')
    loadTitle.textContent = 'Recommended Loadout'
    wrap.appendChild(loadTitle)
    const rl = document.createElement('div')
    rl.className = 'recommended-loadout'
    wrap.appendChild(rl)

    const actions = document.createElement('div')
    actions.style.marginTop = '10px'
    const loadBtn = document.createElement('button')
    loadBtn.textContent = 'Load into Generator'
    loadBtn.className = 'load-into'
    actions.appendChild(loadBtn)
    wrap.appendChild(actions)

    function renderPlatform(pf){
      settingsContainer.innerHTML = ''
      (pf.bestSettings || []).forEach(s => {
        const div = document.createElement('div')
        div.className = 'setting'
        div.textContent = s
        settingsContainer.appendChild(div)
      })

      rl.innerHTML = ''
      const primary = document.createElement('p')
      primary.innerHTML = `<strong>Primary:</strong> ${pf.recommendedLoadout.primary || '—'}`
      rl.appendChild(primary)
      const secondary = document.createElement('p')
      secondary.innerHTML = `<strong>Secondary:</strong> ${pf.recommendedLoadout.secondary || '—'}`
      rl.appendChild(secondary)
      if (pf.recommendedLoadout.attachments && pf.recommendedLoadout.attachments.length){
        const at = document.createElement('p')
        at.innerHTML = '<strong>Attachments:</strong> ' + pf.recommendedLoadout.attachments.join(', ')
        rl.appendChild(at)
      }
      if (pf.recommendedLoadout.perks && pf.recommendedLoadout.perks.length){
        const pk = document.createElement('p')
        pk.innerHTML = '<strong>Perks:</strong> ' + pf.recommendedLoadout.perks.join(', ')
        rl.appendChild(pk)
      }
    }

    pfSelect.addEventListener('change', ()=>{
      const sel = pfSelect.value
      const pf = (g.platforms || []).find(x => (typeof x === 'string') ? x === sel : (x.platform === sel))
      if (pf) renderPlatform((typeof pf === 'string') ? { platform: pf, recommendedLoadout: {} } : pf)
    })

    loadBtn.addEventListener('click', ()=>{
      const sel = pfSelect.value
      loadIntoGenerator(g.id, sel)
    })

    const initial = (g.platforms || [])[0]
    if (initial){
      renderPlatform(initial)
    }

    detailEl.appendChild(wrap)
    detailEl.scrollIntoView({behavior:'smooth'})
  }

  function populateHomeGames(){
    const homeSelect = document.getElementById('game')
    if (!homeSelect) return
    // add a placeholder then populate
    homeSelect.innerHTML = ''
    const ph = document.createElement('option')
    ph.value = ''
    ph.textContent = 'Choose a game...'
    ph.disabled = true
    ph.selected = true
    homeSelect.appendChild(ph)

    data.games.forEach(g => {
      const opt = document.createElement('option')
      opt.value = g.id
      opt.textContent = g.name
      homeSelect.appendChild(opt)
    })

    // if no selection yet, select the first game and update platforms
    if (data.games.length && (!homeSelect.value || homeSelect.value === '')){
      homeSelect.selectedIndex = 1
      updateHomePlatforms(homeSelect.value)
    }
  }
  // expose for manual re-population if needed
  window.populateHomeGames = populateHomeGames

  // ensure change listener so selecting a game updates platforms
  function attachHomeChange(){
    const h = document.getElementById('game')
    if (!h) return
    h.removeEventListener('change', updateHomePlatforms)
    h.addEventListener('change', function onChange(){
      updateHomePlatforms(h.value)
    })
  }
  window.attachHomeChange = attachHomeChange

  search.addEventListener('input', (e)=> renderList(e.target.value))
  renderList()
  // expose renderList so DOMContentLoaded can force a refresh if needed
  window.renderGamesList = renderList
  populateHomeGames()
}

function updateHomePlatforms(gameId){
  const platformSelect = document.getElementById('platform')
  if (!platformSelect) return
  platformSelect.innerHTML = ''
  const data = window.GAMES_DATA || { games: [] }
  const g = data.games.find(x=>x.id===gameId)
  const rawPlatforms = (g && g.platforms) ? g.platforms.map(p=>p.platform) : ['PC']

  // normalize and infer common console platforms
  const set = new Set()
  rawPlatforms.forEach(praw => {
    const p = (praw || '').toLowerCase()
    if (p.includes('pc')) set.add('PC')
    if (p.includes('playstation')) set.add('PlayStation')
    if (p.includes('xbox')) set.add('Xbox')
    // treat switch mentions as both legacy Switch and Nintendo Switch 2
    if (p.includes('switch')){
      set.add('Switch')
      set.add('Nintendo Switch 2')
    }
    if (p.includes('console')) {
      // if generic 'Console' is present, offer main consoles
      set.add('PlayStation')
      set.add('Xbox')
      set.add('Switch')
      set.add('Nintendo Switch 2')
    }
    // fallback to verbatim if nothing matched
    if (!p.includes('pc') && !p.includes('playstation') && !p.includes('xbox') && !p.includes('switch') && !p.includes('console')){
      if (praw && praw.trim()) set.add(praw)
    }
  })

  // prefer ordering: PC, PlayStation, Xbox, Switch, then others
  const order = ['PC','PlayStation','Xbox','Switch','Nintendo Switch 2']
  const final = []
  // ensure Xbox and Nintendo Switch 2 are available as options
  if (!set.has('Xbox')) set.add('Xbox')
  if (!set.has('Nintendo Switch 2')) set.add('Nintendo Switch 2')
  order.forEach(k=>{ if (set.has(k)) final.push(k); set.delete(k) })
  Array.from(set).forEach(x=> final.push(x))

  final.forEach(p => {
    const o = document.createElement('option')
    o.value = p
    o.textContent = p
    platformSelect.appendChild(o)
  })
  // select first available platform
  if (platformSelect.options.length) platformSelect.selectedIndex = 0
}

// Load a game's platform-specific loadout into the Home generator
function loadIntoGenerator(gameId, platform){
  fetch('/data/games.json').then(r=>r.json()).then(d=>{
    const g = d.games.find(x=>x.id===gameId)
    if (!g) return
    const pf = (g.platforms||[]).find(p=>p.platform===platform) || (g.platforms||[])[0]
    const homeSelect = document.getElementById('game')
    if (homeSelect){ homeSelect.value = g.id }
    const playSelect = document.getElementById('playstyle')
    if (playSelect) playSelect.value = 'balanced'
    // prefer variants per playstyle if available
    const base = pf.recommendedLoadout || {}
    const variant = (base.variants && base.variants['balanced']) ? base.variants['balanced'] : null
    const chosen = variant || base
    const data = {
      weapon: chosen.primary || 'Recommended Primary',
      attachments: chosen.attachments || [],
      perks: chosen.perks || [],
      source: 'preset'
    }
    showPage('home')
    renderLoadout(data)
  })
}

// Contact page removed — no handlers

// Init on load
document.addEventListener('DOMContentLoaded', async ()=>{
  // attach nav handlers
  document.querySelectorAll('[data-route]').forEach(a=>{
    a.addEventListener('click', (e)=>{
      e.preventDefault()
      const href = a.getAttribute('href') || '#home'
      const id = href.replace('#','')
      history.pushState({page:id}, '', href)
      showPage(id)
    })
  })

  window.addEventListener('popstate', (e)=>{
    const id = (e.state && e.state.page) || location.hash.replace('#','') || 'home'
    showPage(id)
  })

  const start = location.hash.replace('#','') || 'home'
  history.replaceState({page:start}, '', `#${start}`)
  showPage(start)

  // load games data first (populates Home selects)
  await initGames()

  // sanity check: if home select empty, repopulate and attach change listener
  const gsCheck = document.getElementById('game')
  if (gsCheck && gsCheck.options.length <= 1){
    console.warn('Home game select appears empty; repopulating from GAMES_DATA')
    if (window.populateHomeGames) window.populateHomeGames()
  }
  if (window.attachHomeChange) window.attachHomeChange()

  // ensure platform select is set for current game
  const gs = document.getElementById('game')
  if (gs && gs.value) updateHomePlatforms(gs.value)

  initHome()
  initSubscribe()
  // games already initialized by initGames
  // debug status panel (helps verify dropdown population)
  try {
    const dbg = document.createElement('div')
    dbg.id = 'debug-status'
    dbg.style.position = 'fixed'
    dbg.style.right = '12px'
    dbg.style.bottom = '12px'
    dbg.style.padding = '8px 10px'
    dbg.style.background = 'rgba(0,0,0,0.6)'
    dbg.style.color = '#fff'
    dbg.style.fontSize = '12px'
    dbg.style.borderRadius = '8px'
    dbg.style.zIndex = 9999
    dbg.style.cursor = 'pointer'
    dbg.title = 'Click to dump debug info to console'
    dbg.addEventListener('click', ()=>{
      console.log('GAMES_DATA', window.GAMES_DATA)
      console.log('home select', document.getElementById('game'))
      console.log('platform select', document.getElementById('platform'))
      alert('Debug info printed to console')
    })
    document.body.appendChild(dbg)
    function _refreshDbg(){
      const gd = (window.GAMES_DATA && window.GAMES_DATA.games) ? window.GAMES_DATA.games.length : 0
      const gameEl = document.getElementById('game')
      const optCount = gameEl ? gameEl.options.length : 0
      const platEl = document.getElementById('platform')
      const platCount = platEl ? platEl.options.length : 0
      dbg.textContent = `Games:${gd} • HomeOptions:${optCount} • Platforms:${platCount}`
    }
    setInterval(_refreshDbg, 1000)
    _refreshDbg()
  } catch (e){ console.warn('debug panel failed', e) }

});

