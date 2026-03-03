// Проверка загрузки Supabase
if (typeof window.supabase === 'undefined') {
    console.error('Supabase library not loaded!');
} else {
    console.log('Supabase loaded successfully');
}

// Инициализация Supabase - ЗАМЕНИ НА СВОИ ДАННЫЕ
const supabase = window.supabase.createClient(
    'https://idmeikdzxpjacpvtkdfc.supabase.co',  // Твой URL
    'sb_publishable_h8RzRh8uNmW70mNEaKbXWw_zakpJS5M'                // Твой anon key
);

// Текущий пользователь
let currentUser = null;
let currentPair = []; // Текущая пара для голосования

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
    
    try {
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password
        });
        
        if (error) throw error;
        
        // Пользователь автоматически попадает в таблицу users через Auth
        alert('Регистрация успешна! Проверьте email для подтверждения.');
        
    } catch (error) {
        alert('Ошибка: ' + error.message);
    }
}

async function signIn() {
    const email = emailInput.value;
    const password = passwordInput.value;
    
    if (!email || !password) {
        alert('Введите email и пароль');
        return;
    }
    
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) throw error;
        
        currentUser = data.user;
        showVoteInterface();
        loadRandomPair();
        loadTopCharacters();
        
    } catch (error) {
        alert('Ошибка: ' + error.message);
    }
}

async function signOut() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        
        currentUser = null;
        showAuthInterface();
        
    } catch (error) {
        alert('Ошибка: ' + error.message);
    }
}

async function checkUser() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            currentUser = user;
            showVoteInterface();
            loadRandomPair();
            loadTopCharacters();
        } else {
            showAuthInterface();
        }
    } catch (error) {
        console.error('Error checking user:', error);
        showAuthInterface();
    }
}

// ========== УПРАВЛЕНИЕ ИНТЕРФЕЙСОМ ==========
function showAuthInterface() {
    authDiv.style.display = 'block';
    voteDiv.style.display = 'none';
    logoutBtn.style.display = 'none';
    emailInput.value = '';
    passwordInput.value = '';
}

function showVoteInterface() {
    authDiv.style.display = 'none';
    voteDiv.style.display = 'block';
    logoutBtn.style.display = 'inline-block';
}

// ========== РАБОТА С ПЕРСОНАЖАМИ ==========
async function loadRandomPair() {
    try {
        // Получаем двух случайных персонажей
        const { data: characters, error } = await supabase
            .from('characters')
            .select('*')
            .limit(2);
        
        if (error) throw error;
        
        if (characters && characters.length === 2) {
            currentPair = characters;
            
            // Обновляем карточки
            document.getElementById('name1').textContent = characters[0].name;
            document.getElementById('img1').src = characters[0].image_url || 'https://via.placeholder.com/200';
            document.getElementById('img1').dataset.id = characters[0].id;
            
            document.getElementById('name2').textContent = characters[1].name;
            document.getElementById('img2').src = characters[1].image_url || 'https://via.placeholder.com/200';
            document.getElementById('img2').dataset.id = characters[1].id;
        } else {
            alert('Недостаточно персонажей для голосования');
        }
        
    } catch (error) {
        console.error('Error loading characters:', error);
        alert('Ошибка загрузки персонажей: ' + error.message);
    }
}

async function vote(characterId) {
    if (!currentUser) {
        alert('Сначала войдите в систему');
        return;
    }
    
    try {
        // 1. Записываем голос в таблицу votes
        const { error: voteError } = await supabase
            .from('votes')
            .insert([
                { 
                    user_id: currentUser.id, 
                    character_id: characterId,
                    created_at: new Date().toISOString()
                }
            ]);
        
        if (voteError) throw voteError;
        
        // 2. Увеличиваем счетчик побед персонажа
        const { error: updateError } = await supabase
            .from('characters')
            .update({ wins: supabase.sql`wins + 1` })
            .eq('id', characterId);
        
        if (updateError) throw updateError;
        
        // 3. Загружаем новую пару
        await loadRandomPair();
        
        // 4. Обновляем топ
        await loadTopCharacters();
        
    } catch (error) {
        console.error('Error voting:', error);
        alert('Ошибка голосования: ' + error.message);
    }
}

async function loadTopCharacters() {
    try {
        const { data: topCharacters, error } = await supabase
            .from('characters')
            .select('*')
            .order('wins', { ascending: false })
            .limit(5);
        
        if (error) throw error;
        
        const topDiv = document.getElementById('top');
        topDiv.innerHTML = '<h3>Топ-5 персонажей</h3>';
        
        if (topCharacters && topCharacters.length > 0) {
            const list = document.createElement('ul');
            topCharacters.forEach((char, index) => {
                const item = document.createElement('li');
                item.innerHTML = `${index + 1}. ${char.name} — ${char.wins} ${getWinsWord(char.wins)}`;
                list.appendChild(item);
            });
            topDiv.appendChild(list);
        } else {
            topDiv.innerHTML += '<p>Пока нет голосов</p>';
        }
        
    } catch (error) {
        console.error('Error loading top:', error);
    }
}

// Склонение слова "победа"
function getWinsWord(count) {
    if (count % 10 === 1 && count % 100 !== 11) return 'победа';
    if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) return 'победы';
    return 'побед';
}

// ========== ДОПОЛНИТЕЛЬНЫЕ ФУНКЦИИ ==========

// Получить историю голосов пользователя
async function getUserVotes() {
    if (!currentUser) return;
    
    try {
        const { data, error } = await supabase
            .from('votes')
            .select(`
                *,
                characters:character_id (name)
            `)
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false })
            .limit(10);
        
        if (error) throw error;
        
        console.log('История голосов:', data);
        return data;
        
    } catch (error) {
        console.error('Error loading user votes:', error);
    }
}

// Проверить, голосовал ли пользователь сегодня
async function hasVotedToday(characterId) {
    if (!currentUser) return false;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    try {
        const { data, error } = await supabase
            .from('votes')
            .select('*')
            .eq('user_id', currentUser.id)
            .eq('character_id', characterId)
            .gte('created_at', today.toISOString());
        
        if (error) throw error;
        
        return data.length > 0;
        
    } catch (error) {
        console.error('Error checking vote:', error);
        return false;
    }
}

// ========== ОБРАБОТЧИКИ СОБЫТИЙ ==========
document.getElementById('signup').addEventListener('click', signUp);
document.getElementById('login').addEventListener('click', signIn);
document.getElementById('logout').addEventListener('click', signOut);

document.getElementById('vote1').addEventListener('click', () => {
    const id = document.getElementById('img1').dataset.id;
    if (id) vote(id);
});

document.getElementById('vote2').addEventListener('click', () => {
    const id = document.getElementById('img2').dataset.id;
    if (id) vote(id);
});

// Загружаем топ при старте (если пользователь уже авторизован)
loadTopCharacters();
