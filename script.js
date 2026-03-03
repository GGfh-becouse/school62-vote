// ЕДИНСТВЕННОЕ объявление supabase
const supabase = window.supabase.createClient(
    'https://idmeikdzxpjacpvtkdfc.supabase.co',
    'sb_publishable_h8RzRh8uNmW70mNEaKbXWw_zakpJS5M'
);

// Текущий пользователь
let currentUser = null;
let currentPair = [];

// DOM элементы
const authDiv = document.getElementById('auth');
const voteDiv = document.getElementById('vote');
const logoutBtn = document.getElementById('logout');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');

// Проверка авторизации при загрузке
checkUser();

// ========== ФУНКЦИИ АВТОРИЗАЦИИ ==========
async function signUp() {
    const email = emailInput.value;
    const password = passwordInput.value;
    
    if (!email || !password) {
        alert('Введите email и пароль');
        return;
    }
    
    const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password
    });
    
    if (error) {
        alert('Ошибка: ' + error.message);
    } else {
        alert('Регистрация успешна! Проверьте email для подтверждения.');
    }
}

async function signIn() {
    const email = emailInput.value;
    const password = passwordInput.value;
    
    if (!email || !password) {
        alert('Введите email и пароль');
        return;
    }
    
    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
    });
    
    if (error) {
        alert('Ошибка: ' + error.message);
    } else {
        currentUser = data.user;
        showVoteInterface();
        loadRandomPair();
        loadTopCharacters();
    }
}

async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
        alert('Ошибка: ' + error.message);
    } else {
        currentUser = null;
        showAuthInterface();
    }
}

async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        currentUser = user;
        showVoteInterface();
        loadRandomPair();
        loadTopCharacters();
    } else {
        showAuthInterface();
    }
}

function showAuthInterface() {
    authDiv.style.display = 'block';
    voteDiv.style.display = 'none';
    logoutBtn.style.display = 'none';
}

function showVoteInterface() {
    authDiv.style.display = 'none';
    voteDiv.style.display = 'block';
    logoutBtn.style.display = 'inline-block';
}

async function loadRandomPair() {
    const { data: characters, error } = await supabase
        .from('characters')
        .select('*')
        .limit(2);
    
    if (error) {
        console.error('Error:', error);
        return;
    }
    
    if (characters && characters.length === 2) {
        currentPair = characters;
        
        document.getElementById('name1').textContent = characters[0].name;
        document.getElementById('img1').src = characters[0].image_url || 'https://via.placeholder.com/200';
        document.getElementById('img1').dataset.id = characters[0].id;
        
        document.getElementById('name2').textContent = characters[1].name;
        document.getElementById('img2').src = characters[1].image_url || 'https://via.placeholder.com/200';
        document.getElementById('img2').dataset.id = characters[1].id;
    }
}

async function vote(characterId) {
    if (!currentUser) {
        alert('Сначала войдите в систему');
        return;
    }
    
    // Записываем голос
    const { error: voteError } = await supabase
        .from('votes')
        .insert([
            { 
                user_id: currentUser.id, 
                character_id: characterId,
                created_at: new Date().toISOString()
            }
        ]);
    
    if (voteError) {
        alert('Ошибка голосования: ' + voteError.message);
        return;
    }
    
    // Увеличиваем счетчик
    const { error: updateError } = await supabase
        .from('characters')
        .update({ wins: supabase.sql`wins + 1` })
        .eq('id', characterId);
    
    if (updateError) {
        console.error('Error updating wins:', updateError);
    }
    
    loadRandomPair();
    loadTopCharacters();
}

async function loadTopCharacters() {
    const { data: topCharacters, error } = await supabase
        .from('characters')
        .select('*')
        .order('wins', { ascending: false })
        .limit(5);
    
    if (error) {
        console.error('Error:', error);
        return;
    }
    
    const topDiv = document.getElementById('top');
    if (topCharacters && topCharacters.length > 0) {
        topDiv.innerHTML = '<h3>Топ персонажей:</h3>' +
            '<ul>' + 
            topCharacters.map(c => `<li>${c.name}: ${c.wins} побед</li>`).join('') +
            '</ul>';
    }
}

// Обработчики событий
document.getElementById('signup').onclick = signUp;
document.getElementById('login').onclick = signIn;
document.getElementById('logout').onclick = signOut;
document.getElementById('vote1').onclick = () => {
    const id = document.getElementById('img1').dataset.id;
    if (id) vote(id);
};
document.getElementById('vote2').onclick = () => {
    const id = document.getElementById('img2').dataset.id;
    if (id) vote(id);
};
