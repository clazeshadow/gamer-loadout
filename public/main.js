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

    const settingsTitle = document.createElement('h4')
    settingsTitle.textContent = 'Recommended Settings'
    wrap.appendChild(settingsTitle)
    const ul = document.createElement('ul')
    g.bestSettings.forEach(s => { const li = document.createElement('li'); li.className='setting'; li.textContent = s; ul.appendChild(li) })
    wrap.appendChild(ul)

    const loadTitle = document.createElement('h4')
    loadTitle.textContent = 'Recommended Loadout'
    wrap.appendChild(loadTitle)
    const rl = document.createElement('div')
    rl.innerHTML = `<p><strong>Primary:</strong> ${g.recommendedLoadout.primary || '—'}</p>
                    <p><strong>Secondary:</strong> ${g.recommendedLoadout.secondary || '—'}</p>`
    if (g.recommendedLoadout.attachments && g.recommendedLoadout.attachments.length){
      const at = document.createElement('p')
      at.innerHTML = '<strong>Attachments:</strong> ' + g.recommendedLoadout.attachments.join(', ')
      rl.appendChild(at)
    }
    if (g.recommendedLoadout.perks && g.recommendedLoadout.perks.length){
      const pk = document.createElement('p')
      pk.innerHTML = '<strong>Perks:</strong> ' + g.recommendedLoadout.perks.join(', ')
      rl.appendChild(pk)
    }
    wrap.appendChild(rl)

    detailEl.appendChild(wrap)
    detailEl.scrollIntoView({behavior:'smooth'})
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

