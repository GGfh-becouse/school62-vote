// 1️⃣ Подключаем Supabase
const supabaseUrl = 'ВАШ_SUPABASE_URL'          // вставь свой URL
const supabaseKey = 'ВАШ_SUPABASE_ANON_KEY'     // вставь свой anon key
const supabase = supabase.createClient(supabaseUrl, supabaseKey)

let currentUser = null
let characters = []

// 2️⃣ Регистрация и вход
document.getElementById('signup').addEventListener('click', async () => {
  const email = document.getElementById('email').value
  const password = document.getElementById('password').value
  const { data, error } = await supabase.auth.signUp({ email, password })
  if(error) alert(error.message)
  else alert('Регистрация успешна! Проверьте почту для подтверждения.')
})

document.getElementById('login').addEventListener('click', async () => {
  const email = document.getElementById('email').value
  const password = document.getElementById('password').value
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if(error) alert(error.message)
  else {
    alert('Вы вошли!')
    currentUser = data.user
    document.getElementById('auth').style.display = 'none'
    document.getElementById('vote').style.display = 'block'
    loadCharacters()
    loadTop()
  }
})

// 3️⃣ Загружаем персонажей случайно для голосования
async function loadCharacters() {
  const { data } = await supabase
    .from('characters')
    .select('*')
    .order('RANDOM()')
    .limit(2)
  characters = data
  document.getElementById('img1').src = characters[0].image
  document.getElementById('name1').textContent = characters[0].name
  document.getElementById('img2').src = characters[1].image
  document.getElementById('name2').textContent = characters[1].name
}

// 4️⃣ Голосование
async function vote(winnerIndex) {
  const winner = characters[winnerIndex]
  const loser = characters[1 - winnerIndex]

  // Записываем голос
  await supabase.from('votes').insert([
    { winner_id: winner.id, loser_id: loser.id, user_id: currentUser.id }
  ])

  // Обновляем счётчики
  await supabase.from('characters')
    .update({ wins: winner.wins + 1 })
    .eq('id', winner.id)
  await supabase.from('characters')
    .update({ losses: loser.losses + 1 })
    .eq('id', loser.id)

  loadCharacters()
  loadTop()
}

// Кнопки выбора
document.getElementById('vote1').addEventListener('click', () => vote(0))
document.getElementById('vote2').addEventListener('click', () => vote(1))

// 5️⃣ Загружаем топ-100 персонажей
async function loadTop() {
  const { data } = await supabase
    .from('characters')
    .select('*')
    .order('wins', { ascending: false })
    .limit(100)
  const topDiv = document.getElementById('top')
  topDiv.innerHTML = ''
  data.forEach((c, i) => {
    topDiv.innerHTML += `${i+1}. ${c.name} (Wins: ${c.wins})<br>`
  })
}
