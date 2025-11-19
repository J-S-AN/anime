document.addEventListener("DOMContentLoaded", function () {
    // Criar o pop-up dinamicamente e adicioná-lo ao body
    const popup = document.createElement("div");
    popup.id = "popup";
    popup.innerHTML = `
        <div class="popup-content">
            <p>EM BREVE EPISÓDIO DISPONÍVEL NO SITE</p>
            <button id="closePopup">Fechar</button>
        </div>
    `;
    document.body.appendChild(popup);

    // Adicionar estilos ao pop-up
    const style = document.createElement("style");
    style.innerHTML = `
        #popup {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8); /* Fundo preto com transparência */
            justify-content: center;
            align-items: center;
        }
        .popup-content {
            background: rgba(20, 20, 20, 0.95); /* Fundo escuro elegante */
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 0 15px rgba(255, 255, 255, 0.2);
            text-align: center;
            color: #fff; /* Texto branco */
            font-family: Arial, sans-serif;
            width: 300px;
        }
        .popup-content p {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 15px;
        }
        .popup-content button {
            background: #007bff; /* Azul bonito */
            color: #fff;
            border: none;
            padding: 8px 15px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            transition: background 0.3s;
        }
        .popup-content button:hover {
            background: #0056b3; /* Azul mais escuro no hover */
        }
    `;
    document.head.appendChild(style);

    const closePopup = popup.querySelector("#closePopup");

    // Detectar clique em qualquer link que tenha href="#EM-BREVE"
    document.body.addEventListener("click", function (event) {
        if (event.target.closest('a[href="#EM-BREVE"]')) {
            event.preventDefault();
            popup.style.display = "flex";
        }
    });

    // Fechar pop-up ao clicar no botão
    closePopup.addEventListener("click", function () {
        popup.style.display = "none";
    });

    // Fechar pop-up ao clicar fora dele
    popup.addEventListener("click", function (event) {
        if (event.target === popup) {
            popup.style.display = "none";
        }
    });
});
