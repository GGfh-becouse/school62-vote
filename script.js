const supabase = window.supabase.createClient(
  'https://idmeikdzxpjacpvtkdfc.supabase.co',
  'sb_publishable_h8RzRh8uNmW70mNEaKbXWw_zakpJS5M'
)
// 🔴 ВСТАВЬ СВОИ ДАННЫЕ
const supabaseUrl = 'https://idmeikdzxpjacpvtkdfc.supabase.co'
const supabaseKey = 'sb_publishable_h8RzRh8uNmW70mNEaKbXWw_zakpJS5M'

const supabase = createClient(supabaseUrl, supabaseKey)

let currentUser = null
let characters = []

// ---------------- AUTH ----------------

document.getElementById('signup').onclick = async () => {
  const email = emailInput()
  const password = passInput()

  const { error } = await supabase.auth.signUp({ email, password })

  if (error) alert(error.message)
  else alert('Проверь почту для подтверждения')
}

document.getElementById('login').onclick = async () => {
  const email = emailInput()
  const password = passInput()

  const { data, error } =
    await supabase.auth.signInWithPassword({ email, password })

  if (error) return alert(error.message)

  currentUser = data.user

  document.getElementById('auth').style.display = 'none'
  document.getElementById('vote').style.display = 'flex'

  loadCharacters()
  loadTop()
}

function emailInput() {
  return document.getElementById('email').value
}
function passInput() {
  return document.getElementById('password').value
}

// ---------------- CHARACTERS ----------------

async function loadCharacters() {
  const { data } = await supabase
    .from('characters')
    .select('*')
    .limit(2)

  characters = data

  setCard(0)
  setCard(1)
}

function setCard(i) {
  document.getElementById(`img${i+1}`).src = characters[i].image
  document.getElementById(`name${i+1}`).textContent = characters[i].name
}

// ---------------- VOTE ----------------

document.getElementById('vote1').onclick = () => vote(0)
document.getElementById('vote2').onclick = () => vote(1)

async function vote(winnerIndex) {
  const winner = characters[winnerIndex]

  await supabase
    .from('characters')
    .update({ wins: winner.wins + 1 })
    .eq('id', winner.id)

  loadCharacters()
  loadTop()
}

// ---------------- TOP ----------------

async function loadTop() {
  const { data } = await supabase
    .from('characters')
    .select('*')
    .order('wins', { ascending: false })

  const top = document.getElementById('top')
  top.innerHTML = ''

  data.forEach((c, i) => {
    top.innerHTML += `${i+1}. ${c.name} — ${c.wins}<br>`
  })
}
