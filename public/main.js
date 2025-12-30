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

// Home: generate loadout
function initHome(){
  const btn = document.getElementById('generate')
  if (!btn) return
  btn.addEventListener('click', ()=>{
    const game = document.getElementById('game').value
    const playstyle = document.getElementById('playstyle').value
    btn.disabled = true
    btn.textContent = 'Generating...'

    setTimeout(()=>{
      const data = mockLoadout(game, playstyle)
      renderLoadout(data)
      btn.disabled = false
      btn.textContent = 'Generate Loadout'
    }, 700)
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
      desc.textContent = g.recommendedLoadout.primary || ''
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
      o.value = p.platform
      o.textContent = p.platform
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
      const pf = (g.platforms || []).find(x=>x.platform===sel)
      if (pf) renderPlatform(pf)
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
    homeSelect.innerHTML = ''
    data.games.forEach(g => {
      const opt = document.createElement('option')
      opt.value = g.id
      opt.textContent = g.name
      homeSelect.appendChild(opt)
    })
  }

  search.addEventListener('input', (e)=> renderList(e.target.value))
  renderList()
  populateHomeGames()
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

    const data = {
      weapon: pf.recommendedLoadout.primary || 'Recommended Primary',
      attachments: pf.recommendedLoadout.attachments || [],
      perks: pf.recommendedLoadout.perks || [],
      source: 'preset'
    }
    showPage('home')
    renderLoadout(data)
  })
}

search.addEventListener('input', (e)=> renderList(e.target.value))
renderList()
}

// Contact page removed — no handlers

// Init on load
document.addEventListener('DOMContentLoaded', ()=>{
  const start = location.hash.replace('#','') || 'home'
  history.replaceState({page:start}, '', `#${start}`)
  showPage(start)
  initHome()
  initSubscribe()
  initGames()

