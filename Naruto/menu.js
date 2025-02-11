function toggleSection(id, button) {
    const section = document.getElementById(id);
    const isOpen = section.style.display === 'block';

    // Fechar todas as seções e remover estilo ativo de todos os botões
    document.querySelectorAll('.toggle-section').forEach(sec => sec.style.display = 'none');
    document.querySelectorAll('.toggle-button').forEach(btn => btn.classList.remove('active'));

    // Alternar exibição da seção selecionada
    if (!isOpen) {
        section.style.display = 'block';
        button.classList.add('active');
    }
}
