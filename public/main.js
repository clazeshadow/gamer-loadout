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

document.getElementById('generate').addEventListener('click', ()=>{
  const game = document.getElementById('game').value
  const playstyle = document.getElementById('playstyle').value
  const btn = document.getElementById('generate')
  btn.disabled = true
  btn.textContent = 'Generating...'

  setTimeout(()=>{
    const data = mockLoadout(game, playstyle)
    renderLoadout(data)
    btn.disabled = false
    btn.textContent = 'Generate Loadout'
  }, 700)
})
