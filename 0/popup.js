// Função para gerenciar cookies
function setCookie(name, value, days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${value};expires=${date.toUTCString()};path=/`;
}

function getCookie(name) {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
        const [key, value] = cookie.trim().split('=');
        if (key === name) return value;
    }
    return null;
}

// Gerenciar o pop-up
const popup = document.getElementById('popup2');
const closePopupButton = document.getElementById('close-popup');

if (getCookie('popupClosed') !== 'true') {
    popup.style.display = 'flex';
    document.body.classList.add('hidden');
} else {
    popup.style.display = 'none';
}

closePopupButton.addEventListener('click', () => {
    popup.style.display = 'none';
    document.body.classList.remove('hidden');
    setCookie('popupClosed', 'true', 30); // Salva por 1 mês
});
