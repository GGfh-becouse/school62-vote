// Проверяем, что Supabase загружен
if (typeof window.supabase === 'undefined') {
    console.error('Supabase library not loaded!');
} else {
    console.log('Supabase loaded successfully');
}

// Инициализация Supabase - ЗАМЕНИ НА СВОИ ДАННЫЕ
const supabase = window.supabase.createClient(
    'https://your-project.supabase.co',  // Твой URL
    'your-public-anon-key'                // Твой anon key
);

// Текущий пользователь
let currentUser = null;

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
        loadCharacters();
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
        loadCharacters();
    } else {
        showAuthInterface();
    }
}

// ========== УПРАВЛЕНИЕ ИНТЕРФЕЙСОМ ==========
function showAuthInterface() {
    authDiv.style.display = 'block';
    voteDiv.style.display = 'none';
    logoutBtn.style.display = 'none';
    document.getElementById('email').value = '';
    document.getElementById('password').value = '';
}

function showVoteInterface() {
    authDiv.style.display = 'none';
    voteDiv.style.display = 'block';
    logoutBtn.style.display = 'inline-block';
}

// ========== РАБОТА С ПЕРСОНАЖАМИ ==========
async function loadCharacters() {
    try {
        // Получаем двух случайных персонажей
        const { data: characters, error } = await supabase
            .from('characters')
            .select('*')
            .limit(2);
        
        if (error) throw error;
        
        if (characters && characters.length === 2) {
            // Обновляем карточки
            document.getElementById('name1').textContent = characters[0].name;
            document.getElementById('img1').src = characters[0].image_url || 'https://via.placeholder.com/200';
            document.getElementById('img1').dataset.id = characters[0].id;
            
            document.getElementById('name2').textContent = characters[1].name;
            document.getElementById('img2').src = characters[1].image_url || 'https://via.placeholder.com/200';
            document.getElementById('img2').dataset.id = characters[1].id;
        }
        
        // Загружаем топ
        loadTopCharacters();
        
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
        // Увеличиваем счетчик побед
        const { error } = await supabase
            .from('characters')
            .update({ wins: supabase.sql`wins + 1` })
            .eq('id', characterId);
        
        if (error) throw error;
        
        // Загружаем новых персонажей
        loadCharacters();
        
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
        topDiv.innerHTML = '<ul>' + 
            topCharacters.map(c => `<li>${c.name}: ${c.wins} побед</li>`).join('') +
            '</ul>';
            
    } catch (error) {
        console.error('Error loading top:', error);
    }
}

// ========== ОБРАБОТЧИКИ СОБЫТИЙ ==========
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
