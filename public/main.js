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
  // Remove hint if present, but never clear the stack except by explicit user action or navigation
  const hint = result.querySelector('.hint')
  if (hint) hint.remove()
  // Create or find the loadout stack container
  let stack = result.querySelector('.loadout-stack')
  if (!stack) {
    stack = document.createElement('div')
    stack.className = 'loadout-stack'
    result.appendChild(stack)
  }
  // Save to history
  window.LOADOUT_HISTORY = window.LOADOUT_HISTORY || []
  window.LOADOUT_HISTORY.push(data)
  localStorage.setItem('loadout_history', JSON.stringify(window.LOADOUT_HISTORY))
  // Create a new loadout card
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
  stack.appendChild(wrapper)
  // Also update the history viewer
  updateHistoryViewer()
}
function updateHistoryViewer(){
  const viewer = document.getElementById('history-viewer')
  const list = document.getElementById('history-list')
  if (!viewer || !list) return
  const hist = window.LOADOUT_HISTORY || []
  if (hist.length === 0) {
    viewer.style.display = 'none'
    return
  }
  viewer.style.display = 'block'
  list.innerHTML = ''
  hist.forEach((data, idx) => {
    const card = document.createElement('div')
    card.className = 'card'
    card.style.minWidth = '180px'
    card.innerHTML = `<h4>${data.weapon}</h4><div>Attachments: ${(data.attachments||[]).join(', ')}</div><div>Perks: ${(data.perks||[]).join(', ')}</div><div class='badge'>${data.source||''}</div>`
    list.appendChild(card)
  })
}
// History and sign-in will be initialized after DOMContentLoaded at the bottom

// Navigation
function showPage(id){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('page-active'))
  const el = document.getElementById(id)
  if (el) el.classList.add('page-active')
  // If navigating away from home, clear the loadout stack
  if (id !== 'home') {
    const result = document.getElementById('result')
    if (result) {
      const stack = result.querySelector('.loadout-stack')
      if (stack) stack.remove()
      // Optionally restore the hint
      if (!result.querySelector('.hint')) {
        const hint = document.createElement('p')
        hint.className = 'hint'
        hint.textContent = 'Click "Generate Loadout" to see a mock build.'
        result.appendChild(hint)
      }
    }
  }
}

// Home: generate loadout
function initHome(){
  const btn = document.getElementById('generate')
  const clearBtn = document.getElementById('clear-loadouts')
  if (!btn) return
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        const result = document.getElementById('result')
        const stack = result.querySelector('.loadout-stack')
        if (stack) stack.remove()
        // Optionally restore the hint
        if (!result.querySelector('.hint')) {
          const hint = document.createElement('p')
          hint.className = 'hint'
          hint.textContent = 'Click "Generate Loadout" to see a mock build.'
          result.appendChild(hint)
        }
      })
    }
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

// Settings Generator
function initSettingsGenerator(){
  const settingsGameSelect = document.getElementById('settings-game')
  const settingsPlatformSelect = document.getElementById('settings-platform')
  const settingsInputTypeSelect = document.getElementById('settings-input-type')
  const generateBtn = document.getElementById('generate-settings')
  const clearBtn = document.getElementById('clear-settings')
  
  if (!settingsGameSelect || !generateBtn) return

  // Populate games
  function populateSettingsGames(){
    if (!settingsGameSelect) return
    const dataSrc = window.GAMES_DATA || { games: [] }
    settingsGameSelect.innerHTML = '<option value="">Select a game...</option>'
    dataSrc.games.forEach(g => {
      const o = document.createElement('option')
      o.value = g.id
      o.textContent = g.name
      settingsGameSelect.appendChild(o)
    })
  }

  // Update platforms when game changes
  settingsGameSelect.addEventListener('change', () => {
    const gameId = settingsGameSelect.value
    if (!gameId) {
      settingsPlatformSelect.innerHTML = '<option value="">Select a platform...</option>'
      return
    }
    const dataSrc = window.GAMES_DATA || { games: [] }
    const game = dataSrc.games.find(g => g.id === gameId)
    settingsPlatformSelect.innerHTML = '<option value="">Select a platform...</option>'
    if (game && game.platforms) {
      game.platforms.forEach(pf => {
        const o = document.createElement('option')
        const val = (typeof pf === 'string') ? pf : (pf.platform || '')
        o.value = val
        o.textContent = val
        settingsPlatformSelect.appendChild(o)
      })
    }
  })

  // Generate settings display
  generateBtn.addEventListener('click', () => {
    const gameId = settingsGameSelect.value
    const platform = settingsPlatformSelect.value
    const inputType = settingsInputTypeSelect.value
    
    if (!gameId || !platform) {
      alert('Please select a game and platform')
      return
    }

    const dataSrc = window.GAMES_DATA || { games: [] }
    const game = dataSrc.games.find(g => g.id === gameId)
    if (!game) return

    const pf = (game.platforms.find(p => (typeof p === 'string') ? p === platform : (p.platform === platform)) || game.platforms[0])
    if (!pf || !pf.controlSettings) {
      alert('No control settings available for this game')
      return
    }

    renderControlSettings(game.name, platform, pf.controlSettings, inputType)
  })

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      const stack = document.getElementById('settings-stack')
      if (stack) stack.innerHTML = ''
    })
  }

  populateSettingsGames()
}

function renderControlSettings(gameName, platform, cs, inputType = 'all'){
  const stack = document.getElementById('settings-stack')
  if (!stack) return
  
  stack.innerHTML = ''
  
  const card = document.createElement('div')
  card.className = 'card'
  card.style.minWidth = '280px'
  card.style.maxWidth = '400px'
  
  const title = document.createElement('h3')
  title.textContent = gameName
  const subtitle = document.createElement('p')
  subtitle.style.fontSize = '13px'
  subtitle.style.color = 'var(--muted)'
  subtitle.style.marginTop = '4px'
  subtitle.textContent = platform
  card.appendChild(title)
  card.appendChild(subtitle)
  
  // Keyboard & Mouse settings
  if ((inputType === 'all' || inputType === 'keyboard') && (cs.mouseSensitivity || cs.dpi || cs.keybinds)) {
    const kbSection = document.createElement('div')
    kbSection.style.marginTop = '16px'
    kbSection.style.paddingTop = '12px'
    kbSection.style.borderTop = '1px solid rgba(255,255,255,0.1)'
    
    const kbTitle = document.createElement('div')
    kbTitle.style.fontWeight = 'bold'
    kbTitle.style.color = 'var(--accent)'
    kbTitle.style.marginBottom = '10px'
    kbTitle.style.fontSize = '14px'
    kbTitle.textContent = '⌨️ Keyboard & Mouse'
    kbSection.appendChild(kbTitle)
    
    if (cs.mouseSensitivity) {
      const p = document.createElement('p')
      p.style.margin = '6px 0'
      p.style.fontSize = '13px'
      p.innerHTML = `<strong>Sensitivity:</strong> ${cs.mouseSensitivity}`
      kbSection.appendChild(p)
    }
    if (cs.dpi) {
      const p = document.createElement('p')
      p.style.margin = '6px 0'
      p.style.fontSize = '13px'
      p.innerHTML = `<strong>DPI:</strong> ${cs.dpi}`
      kbSection.appendChild(p)
    }
    if (cs.adsMultiplier || cs.adsSensitivity) {
      const p = document.createElement('p')
      p.style.margin = '6px 0'
      p.style.fontSize = '13px'
      p.innerHTML = `<strong>ADS Sens:</strong> ${cs.adsMultiplier || cs.adsSensitivity}`
      kbSection.appendChild(p)
    }
    if (cs.keybinds) {
      const p = document.createElement('p')
      p.style.margin = '8px 0 4px 0'
      p.style.fontSize = '13px'
      p.innerHTML = '<strong>Keybinds:</strong>'
      kbSection.appendChild(p)
      
      const list = document.createElement('ul')
      list.style.fontSize = '12px'
      list.style.margin = '4px 0'
      list.style.paddingLeft = '18px'
      Object.entries(cs.keybinds).forEach(([key, val]) => {
        const li = document.createElement('li')
        li.textContent = `${key}: ${val}`
        list.appendChild(li)
      })
      kbSection.appendChild(list)
    }
    if (cs.recommendations) {
      const p = document.createElement('p')
      p.style.margin = '8px 0 0 0'
      p.style.fontSize = '12px'
      p.style.color = 'var(--muted)'
      p.innerHTML = '<strong>💡 Tips:</strong> ' + cs.recommendations.join(', ')
      kbSection.appendChild(p)
    }
    
    card.appendChild(kbSection)
  }
  
  // Controller settings
  if ((inputType === 'all' || inputType === 'controller') && cs.controller) {
    const ctrlSection = document.createElement('div')
    ctrlSection.style.marginTop = '16px'
    ctrlSection.style.paddingTop = '12px'
    ctrlSection.style.borderTop = '1px solid rgba(255,255,255,0.1)'
    
    const ctrlTitle = document.createElement('div')
    ctrlTitle.style.fontWeight = 'bold'
    ctrlTitle.style.color = 'var(--accent)'
    ctrlTitle.style.marginBottom = '10px'
    ctrlTitle.style.fontSize = '14px'
    ctrlTitle.textContent = '🎮 Controller'
    ctrlSection.appendChild(ctrlTitle)
    
    const ctrl = cs.controller
    if (ctrl.lookSensitivity || ctrl.lookSensitivityX || ctrl.sensitivity) {
      const p = document.createElement('p')
      p.style.margin = '6px 0'
      p.style.fontSize = '13px'
      p.innerHTML = `<strong>Look Sensitivity:</strong> ${ctrl.lookSensitivity || ctrl.lookSensitivityX || ctrl.sensitivity}`
      ctrlSection.appendChild(p)
    }
    if (ctrl.adsMultiplier) {
      const p = document.createElement('p')
      p.style.margin = '6px 0'
      p.style.fontSize = '13px'
      p.innerHTML = `<strong>ADS Multiplier:</strong> ${ctrl.adsMultiplier}`
      ctrlSection.appendChild(p)
    }
    if (ctrl.deadzone) {
      const p = document.createElement('p')
      p.style.margin = '6px 0'
      p.style.fontSize = '13px'
      p.innerHTML = `<strong>Deadzone:</strong> ${typeof ctrl.deadzone === 'object' ? JSON.stringify(ctrl.deadzone) : ctrl.deadzone}`
      ctrlSection.appendChild(p)
    }
    if (ctrl.buttonLayout) {
      const p = document.createElement('p')
      p.style.margin = '6px 0'
      p.style.fontSize = '13px'
      p.innerHTML = `<strong>Button Layout:</strong> ${ctrl.buttonLayout}`
      ctrlSection.appendChild(p)
    }
    
    card.appendChild(ctrlSection)
  }
  
  stack.appendChild(card)
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

const VERSION_TAG = 'v20251231a'

// Games page
async function initGames(){
  const listEl = document.getElementById('games-list')
  const detailEl = document.getElementById('game-detail')
  const search = document.getElementById('game-search')
  if (!listEl || !detailEl || !search) return

  let data = { games: [] }
  const q = `?${VERSION_TAG}`
  const fallbacks = [`/data/games.json${q}`, `./data/games.json${q}`, `/public/data/games.json${q}`]
  let loaded = false
  for (const path of fallbacks){
    if (loaded) break
    try {
      const res = await fetch(path)
      if (res.ok){
        data = await res.json()
        loaded = true
        break
      }
    } catch (e) {
      // continue to next fallback
    }
  }
  if (!loaded){
    // minimal inline fallback so UI still works
    data = { games: [ { id:'fallback', name:'Fallback Game', platforms:[{ platform:'PC', bestSettings:['FPS:60+'], recommendedLoadout:{ primary:'Sample', secondary:'Sample', attachments:[], perks:[] } }] } ] }
    listEl.innerHTML = '<div class="muted">Using fallback data (games.json not reachable).</div>'
  }
  window.GAMES_DATA = data

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
    
    // input type selector
    const inputWrapper = document.createElement('div')
    inputWrapper.style.marginBottom = '8px'
    const inputLabel = document.createElement('label')
    inputLabel.textContent = 'Input Type'
    inputLabel.style.display = 'block'
    const inputSelect = document.createElement('select')
    inputSelect.style.marginTop = '6px'
    const inputOptions = [['all', 'All Settings'], ['keyboard', 'Keyboard & Mouse'], ['controller', 'Controller']]
    inputOptions.forEach(([val, text]) => {
      const o = document.createElement('option')
      o.value = val
      o.textContent = text
      inputSelect.appendChild(o)
    })
    inputWrapper.appendChild(inputLabel)
    inputWrapper.appendChild(inputSelect)
    wrap.appendChild(inputWrapper)

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

    function renderPlatform(pf, inputType = 'all'){
      settingsContainer.innerHTML = ''
      (pf.bestSettings || []).forEach(s => {
        const div = document.createElement('div')
        div.className = 'setting'
        div.textContent = s
        settingsContainer.appendChild(div)
      })
      
      // Add control settings section with input type filtering
      if (pf.controlSettings) {
        const ctrlTitle = document.createElement('h4')
        ctrlTitle.textContent = 'Control Settings'
        ctrlTitle.style.marginTop = '16px'
        ctrlTitle.style.marginBottom = '10px'
        settingsContainer.appendChild(ctrlTitle)
        
        const cs = pf.controlSettings
        
        // Show keyboard/mouse settings
        if ((inputType === 'all' || inputType === 'keyboard') && (cs.mouseSensitivity || cs.dpi || cs.keybinds)) {
          const kbSection = document.createElement('div')
          kbSection.className = 'control-section'
          kbSection.style.marginBottom = '12px'
          const kbTitle = document.createElement('div')
          kbTitle.style.fontWeight = 'bold'
          kbTitle.style.color = 'var(--accent)'
          kbTitle.style.marginBottom = '8px'
          kbTitle.textContent = '⌨️ Keyboard & Mouse'
          kbSection.appendChild(kbTitle)
          
          if (cs.mouseSensitivity) {
            const div = document.createElement('div')
            div.className = 'setting'
            div.innerHTML = `<strong>Sensitivity:</strong> ${cs.mouseSensitivity}`
            kbSection.appendChild(div)
          }
          if (cs.dpi) {
            const div = document.createElement('div')
            div.className = 'setting'
            div.innerHTML = `<strong>DPI:</strong> ${cs.dpi}`
            kbSection.appendChild(div)
          }
          if (cs.adsMultiplier || cs.adsSensitivity) {
            const div = document.createElement('div')
            div.className = 'setting'
            div.innerHTML = `<strong>ADS Sens:</strong> ${cs.adsMultiplier || cs.adsSensitivity}`
            kbSection.appendChild(div)
          }
          if (cs.keybinds) {
            const div = document.createElement('div')
            div.className = 'setting'
            div.innerHTML = '<strong>Key Binds:</strong>'
            const list = document.createElement('ul')
            list.style.fontSize = '13px'
            list.style.marginTop = '4px'
            list.style.marginBottom = '0'
            Object.entries(cs.keybinds).slice(0, 5).forEach(([key, val]) => {
              const li = document.createElement('li')
              li.textContent = `${key}: ${val}`
              list.appendChild(li)
            })
            div.appendChild(list)
            kbSection.appendChild(div)
          }
          if (cs.recommendations) {
            const div = document.createElement('div')
            div.className = 'setting'
            div.innerHTML = '<strong>💡 Tips:</strong> ' + cs.recommendations.slice(0, 2).join(', ')
            kbSection.appendChild(div)
          }
          settingsContainer.appendChild(kbSection)
        }
        
        // Show controller settings
        if ((inputType === 'all' || inputType === 'controller') && cs.controller) {
          const ctrlSection = document.createElement('div')
          ctrlSection.className = 'control-section'
          ctrlSection.style.marginBottom = '12px'
          const ctrlTitle = document.createElement('div')
          ctrlTitle.style.fontWeight = 'bold'
          ctrlTitle.style.color = 'var(--accent)'
          ctrlTitle.style.marginBottom = '8px'
          ctrlTitle.textContent = '🎮 Controller'
          ctrlSection.appendChild(ctrlTitle)
          
          const ctrl = cs.controller
          if (ctrl.lookSensitivity || ctrl.lookSensitivityX || ctrl.sensitivity) {
            const div = document.createElement('div')
            div.className = 'setting'
            div.innerHTML = `<strong>Look Sensitivity:</strong> ${ctrl.lookSensitivity || ctrl.lookSensitivityX || ctrl.sensitivity}`
            ctrlSection.appendChild(div)
          }
          if (ctrl.adsMultiplier) {
            const div = document.createElement('div')
            div.className = 'setting'
            div.innerHTML = `<strong>ADS Multiplier:</strong> ${ctrl.adsMultiplier}`
            ctrlSection.appendChild(div)
          }
          if (ctrl.deadzone) {
            const div = document.createElement('div')
            div.className = 'setting'
            div.innerHTML = `<strong>Deadzone:</strong> ${typeof ctrl.deadzone === 'object' ? JSON.stringify(ctrl.deadzone) : ctrl.deadzone}`
            ctrlSection.appendChild(div)
          }
          if (ctrl.buttonLayout) {
            const div = document.createElement('div')
            div.className = 'setting'
            div.innerHTML = `<strong>Button Layout:</strong> ${ctrl.buttonLayout}`
            ctrlSection.appendChild(div)
          }
          settingsContainer.appendChild(ctrlSection)
        }
        
        // Show general controller settings if no nested controller object
        if ((inputType === 'all' || inputType === 'controller') && !cs.controller && (cs.lookSensitivityX || cs.horizontalSensitivity)) {
          const ctrlSection = document.createElement('div')
          ctrlSection.className = 'control-section'
          const ctrlTitle = document.createElement('div')
          ctrlTitle.style.fontWeight = 'bold'
          ctrlTitle.style.color = 'var(--accent)'
          ctrlTitle.style.marginBottom = '8px'
          ctrlTitle.textContent = '🎮 Controller'
          ctrlSection.appendChild(ctrlTitle)
          
          if (cs.lookSensitivityX) {
            const div = document.createElement('div')
            div.className = 'setting'
            div.innerHTML = `<strong>Sensitivity:</strong> X: ${cs.lookSensitivityX}, Y: ${cs.lookSensitivityY || cs.lookSensitivityX}`
            ctrlSection.appendChild(div)
          }
          if (cs.buttonLayout) {
            const div = document.createElement('div')
            div.className = 'setting'
            div.innerHTML = `<strong>Button Layout:</strong> ${cs.buttonLayout}`
            ctrlSection.appendChild(div)
          }
          settingsContainer.appendChild(ctrlSection)
        }
      }

      rl.innerHTML = ''
      
      // Handle variant-based loadouts (with aggressive/balanced/defensive)
      if (pf.recommendedLoadout.variants) {
        const variants = pf.recommendedLoadout.variants
        Object.entries(variants).forEach(([variantName, variantData]) => {
          const h = document.createElement('h5')
          h.textContent = variantName.charAt(0).toUpperCase() + variantName.slice(1)
          h.style.marginTop = '10px'
          h.style.marginBottom = '6px'
          rl.appendChild(h)
          
          // Display all variant properties
          Object.entries(variantData).forEach(([key, value]) => {
            if (key === 'perks' || key === 'attachments' || key === 'armor' || key === 'mods') {
              if (Array.isArray(value) && value.length) {
                const p = document.createElement('p')
                p.style.margin = '4px 0'
                p.innerHTML = `<strong>${key.charAt(0).toUpperCase() + key.slice(1)}:</strong> ${value.join(', ')}`
                rl.appendChild(p)
              } else if (typeof value === 'object' && value !== null) {
                const p = document.createElement('p')
                p.style.margin = '4px 0'
                p.innerHTML = `<strong>${key.charAt(0).toUpperCase() + key.slice(1)}:</strong> ${JSON.stringify(value).replace(/[{}"/]/g, '')}`
                rl.appendChild(p)
              }
            } else if (key !== 'variants') {
              const p = document.createElement('p')
              p.style.margin = '4px 0'
              p.innerHTML = `<strong>${key.charAt(0).toUpperCase() + key.slice(1)}:</strong> ${value}`
              rl.appendChild(p)
            }
          })
        })
      } else {
        // Original logic for simple loadouts (without variants)
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
      const inputType = inputSelect.value
      const pf = (g.platforms || []).find(x => (typeof x === 'string') ? x === sel : (x.platform === sel))
      if (pf) renderPlatform((typeof pf === 'string') ? { platform: pf, recommendedLoadout: {} } : pf, inputType)
    })
    
    inputSelect.addEventListener('change', ()=>{
      const sel = pfSelect.value
      const inputType = inputSelect.value
      const pf = (g.platforms || []).find(x => (typeof x === 'string') ? x === sel : (x.platform === sel))
      if (pf) renderPlatform((typeof pf === 'string') ? { platform: pf, recommendedLoadout: {} } : pf, inputType)
    })

    loadBtn.addEventListener('click', ()=>{
      const sel = pfSelect.value
      loadIntoGenerator(g.id, sel)
    })

    const initial = (g.platforms || [])[0]
    if (initial){
      renderPlatform(initial, 'all')
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
  // Do not clear the result area or stack here
  platformSelect.innerHTML = ''
  const data = window.GAMES_DATA || { games: [] }
  const g = data.games.find(x=>x.id===gameId)
  const rawPlatforms = (g && g.platforms) ? g.platforms.map(p=>p.platform) : ['PC']

  // normalize and infer common console platforms
  const set = new Set()
  rawPlatforms.forEach(praw => {
    const p = (praw || '').toString().trim().toLowerCase()
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
      if (praw && praw.toString().trim()) set.add(praw.toString().trim())
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

// Populate games and platforms globally
function populateGames(){
  const gameSelect = document.getElementById('game')
  if (!gameSelect || !window.GAMES_DATA || !window.GAMES_DATA.games) return
  gameSelect.innerHTML = ''
  const ph = document.createElement('option')
  ph.value = ''
  ph.textContent = 'Choose a game...'
  ph.disabled = true
  ph.selected = true
  gameSelect.appendChild(ph)
  window.GAMES_DATA.games.forEach(g => {
    const opt = document.createElement('option')
    opt.value = g.id
    opt.textContent = g.name
    gameSelect.appendChild(opt)
  })
  if (gameSelect.options.length > 1){
    gameSelect.selectedIndex = 1
    updateHomePlatforms(gameSelect.value)
  }
}


// Load a game's platform-specific loadout into the Home generator
function loadIntoGenerator(gameId, platform){
  fetch(`/data/games.json?${VERSION_TAG}`).then(r=>r.json()).then(d=>{
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

  // Restore history and sign-in after DOM ready
  window.LOADOUT_HISTORY = JSON.parse(localStorage.getItem('loadout_history') || '[]');
  updateHistoryViewer();
  const form = document.getElementById('signin-form');
  const status = document.getElementById('signin-status');
  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const email = document.getElementById('signin-email').value;
      const pw = document.getElementById('signin-password').value;
      if (email && pw) {
        status.textContent = 'Signed in as ' + email + ' (demo only)';
        form.reset();
      } else {
        status.textContent = 'Please enter email and password.';
      }
    });
  }

  // Initial population after data load
  if (window.GAMES_DATA && window.GAMES_DATA.games) populateGames();
  initHome();
  initSettingsGenerator();
  initSubscribe();

});

