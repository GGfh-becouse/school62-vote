const Url = 'ВАШ_SUPABASE_URL';
const Key = 'ВАШ_PUBLISHABLE_KEY';

// Создание клиента Supabase — только один раз
const supabase = window.supabase.createClient(Url,Key);

let currentUser = null;

// ---------------- AUTH ----------------
document.getElementById('signup').onclick = async () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  const { error } = await supabase.auth.signUp({ email, password });
  if (error) alert(error.message);
  else alert('Проверьте почту для подтверждения регистрации.');
};

document.getElementById('login').onclick = async () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return alert(error.message);

  currentUser = data.user;
  alert('Вход успешен!');

  document.getElementById('auth').style.display = 'none';
  document.getElementById('vote').style.display = 'block';
};

// ---------------- VOTE ----------------
document.getElementById('vote1').onclick = () => alert('Выбрали 1!');
document.getElementById('vote2').onclick = () => alert('Выбрали 2!');
