let mapInstance = null;
let animacaoAtiva = null;

document.getElementById('btn-rastrear').addEventListener('click', function () {
  const codigoInput = document.getElementById('codigo-rastreio');
  const codigo = codigoInput.value.toUpperCase().trim();

  if (codigo === "") {
    mostrarToast("⚠️ Digite um código de rastreio!", "aviso");
    return;
  }

  // Se já tem mapa ativo, destroi antes de recriar
  if (mapInstance) {
    mapInstance.remove();
    mapInstance = null;
  }
  if (animacaoAtiva) {
    clearInterval(animacaoAtiva);
    animacaoAtiva = null;
  }

  // Limpa o container do mapa preservando o painel de status
  const mapaDiv = document.getElementById('mapa-drone');
  mapaDiv.innerHTML = "";
  mapaDiv.style.position = "relative";

  // Recria o painel de status dentro do mapa
  const painelHTML = `
    <div id="status-painel" style="
      display: none;
      position: absolute;
      top: 12px;
      right: 12px;
      background: rgba(5, 20, 40, 0.92);
      color: #00f2ff;
      padding: 14px 18px;
      border-radius: 10px;
      border: 1px solid #00f2ff;
      box-shadow: 0 0 15px rgba(0,242,255,0.3);
      z-index: 1000;
      font-family: 'Roboto', sans-serif;
      min-width: 200px;
      backdrop-filter: blur(6px);
    ">
      <div style="font-weight: 700; font-size: 0.75rem; letter-spacing: 2px; margin-bottom: 8px; opacity: 0.7;">STATUS DA MISSÃO</div>
      <div id="status-codigo" style="font-size: 0.85rem; color: #fff; margin-bottom: 6px;">📦 ${codigo}</div>
      <div id="status-texto" style="font-size: 0.95rem; font-weight: 500;">Iniciando decolagem...</div>
      <div id="status-barra" style="
        margin-top: 10px;
        height: 4px;
        background: rgba(0,242,255,0.2);
        border-radius: 2px;
        overflow: hidden;
      ">
        <div id="barra-progresso" style="
          height: 100%;
          width: 0%;
          background: linear-gradient(90deg, #00f2ff, #0099aa);
          border-radius: 2px;
          transition: width 0.3s ease;
        "></div>
      </div>
    </div>
  `;
  mapaDiv.insertAdjacentHTML('beforeend', painelHTML);

  // Inicializa o mapa
  mapInstance = L.map('mapa-drone').setView([-24.008, -46.412], 15);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
  }).addTo(mapInstance);

  // Ícone drone SVG neon estilizado
  var droneSVG = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" width="60" height="60">
      <defs>
        <filter id="neon" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.5" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <!-- Hélice TL -->
      <ellipse cx="16" cy="16" rx="11" ry="4" fill="none" stroke="#00f2ff" stroke-width="2" filter="url(#neon)" opacity="0.9" transform="rotate(-30 16 16)"/>
      <!-- Hélice TR -->
      <ellipse cx="64" cy="16" rx="11" ry="4" fill="none" stroke="#00f2ff" stroke-width="2" filter="url(#neon)" opacity="0.9" transform="rotate(30 64 16)"/>
      <!-- Hélice BL -->
      <ellipse cx="16" cy="64" rx="11" ry="4" fill="none" stroke="#00f2ff" stroke-width="2" filter="url(#neon)" opacity="0.9" transform="rotate(30 16 64)"/>
      <!-- Hélice BR -->
      <ellipse cx="64" cy="64" rx="11" ry="4" fill="none" stroke="#00f2ff" stroke-width="2" filter="url(#neon)" opacity="0.9" transform="rotate(-30 64 64)"/>
      <!-- Braços -->
      <line x1="16" y1="16" x2="40" y2="40" stroke="#0099bb" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="64" y1="16" x2="40" y2="40" stroke="#0099bb" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="16" y1="64" x2="40" y2="40" stroke="#0099bb" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="64" y1="64" x2="40" y2="40" stroke="#0099bb" stroke-width="2.5" stroke-linecap="round"/>
      <!-- Corpo central -->
      <rect x="30" y="30" width="20" height="20" rx="5" fill="#051428" stroke="#00f2ff" stroke-width="2" filter="url(#neon)"/>
      <!-- Luz central -->
      <circle cx="40" cy="40" r="4" fill="#00f2ff" filter="url(#neon)" opacity="0.95"/>
      <!-- Motor corners -->
      <circle cx="16" cy="16" r="4" fill="#051428" stroke="#00f2ff" stroke-width="1.5"/>
      <circle cx="64" cy="16" r="4" fill="#051428" stroke="#00f2ff" stroke-width="1.5"/>
      <circle cx="16" cy="64" r="4" fill="#051428" stroke="#00f2ff" stroke-width="1.5"/>
      <circle cx="64" cy="64" r="4" fill="#051428" stroke="#00f2ff" stroke-width="1.5"/>
    </svg>
  `;
  var droneSVGUrl = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(droneSVG);
  var droneIcon = L.icon({
    iconUrl: droneSVGUrl,
    iconSize: [60, 60],
    iconAnchor: [30, 30]
  });

  // Ícone destino
  var destinoIcon = L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
    iconSize: [35, 35],
    iconAnchor: [17, 35]
  });

  var pontoInicio = [-24.012, -46.418];
  var pontoFim = [-24.005, -46.405];

  var marker = L.marker(pontoInicio, { icon: droneIcon }).addTo(mapInstance);
  L.marker(pontoFim, { icon: destinoIcon }).addTo(mapInstance)
    .bindPopup('<b>Destino</b>').openPopup();

  // Linha da rota
  L.polyline([pontoInicio, pontoFim], {
    color: '#00f2ff',
    weight: 2,
    dashArray: '8, 8',
    opacity: 0.6
  }).addTo(mapInstance);

  const painel = document.getElementById('status-painel');
  const textoStatus = document.getElementById('status-texto');
  const barraProgresso = document.getElementById('barra-progresso');

  painel.style.display = 'block';

  let lat = pontoInicio[0];
  let lng = pontoInicio[1];
  const latTotal = pontoFim[0] - pontoInicio[0];
  const lngTotal = pontoFim[1] - pontoInicio[1];
  const passos = 70;
  let passo = 0;

  animacaoAtiva = setInterval(function () {
    passo++;
    const progresso = passo / passos;

    lat = pontoInicio[0] + latTotal * progresso;
    lng = pontoInicio[1] + lngTotal * progresso;
    marker.setLatLng([lat, lng]);

    // Atualiza barra de progresso
    barraProgresso.style.width = (progresso * 100) + '%';

    // Atualiza status por fase
    if (progresso < 0.3) {
      textoStatus.innerText = "🚀 Decolagem — Rota A12";
    } else if (progresso < 0.6) {
      textoStatus.innerText = "✈️ Em trânsito — 850m";
    } else if (progresso < 0.9) {
      textoStatus.innerText = "📍 Aproximando destino...";
    } else {
      textoStatus.innerText = "🔽 Pousando...";
    }

    // Chegou ao destino
    if (passo >= passos) {
      clearInterval(animacaoAtiva);
      animacaoAtiva = null;

      barraProgresso.style.width = '100%';
      barraProgresso.style.background = 'linear-gradient(90deg, #00ff88, #00cc66)';
      textoStatus.innerHTML = "<span style='color:#00ff88; font-weight:700;'>✓ ENCOMENDA ENTREGUE</span>";

      marker.setLatLng(pontoFim);

      // Notificação bonita de entrega
      mostrarNotificacaoEntrega(codigo);
    }
  }, 200);
});

function mostrarNotificacaoEntrega(codigo) {
  // Remove notificação antiga se existir
  const antiga = document.getElementById('notif-entrega');
  if (antiga) antiga.remove();

  const notif = document.createElement('div');
  notif.id = 'notif-entrega';
  notif.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) scale(0.8);
    background: linear-gradient(135deg, rgb(5, 25, 50), rgb(10, 55, 90));
    border: 2px solid #00f2ff;
    box-shadow: 0 0 40px rgba(0,242,255,0.4), 0 20px 60px rgba(0,0,0,0.6);
    border-radius: 16px;
    padding: 40px 50px;
    text-align: center;
    z-index: 9999;
    color: white;
    font-family: 'Roboto', sans-serif;
    min-width: 320px;
    opacity: 0;
    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  `;

  notif.innerHTML = `
    <div style="font-size: 3rem; margin-bottom: 12px;">✅</div>
    <div style="font-size: 1.5rem; font-weight: 700; color: #00f2ff; letter-spacing: 1px; margin-bottom: 8px;">ENTREGA CONCLUÍDA</div>
    <div style="font-size: 0.9rem; opacity: 0.7; margin-bottom: 16px;">Código: <span style="color:#fff; font-weight:600;">${codigo}</span></div>
    <div style="font-size: 1rem; opacity: 0.85; line-height: 1.5; margin-bottom: 24px;">Seu drone pousou com sucesso.<br>Encomenda entregue no destino!</div>
    <div style="
      width: 60px; height: 4px;
      background: linear-gradient(90deg, #00f2ff, #00ff88);
      border-radius: 2px;
      margin: 0 auto 24px auto;
    "></div>
    <button onclick="fecharNotificacao()" style="
      background: linear-gradient(90deg, #00f2ff, #0099aa);
      color: #000;
      font-weight: 700;
      font-size: 1rem;
      padding: 12px 35px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      letter-spacing: 1px;
      transition: opacity 0.2s;
    " onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'">OK</button>
  `;

  document.body.appendChild(notif);

  // Fundo escurecido
  const overlay = document.createElement('div');
  overlay.id = 'notif-overlay';
  overlay.style.cssText = `
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.5);
    z-index: 9998;
    opacity: 0;
    transition: opacity 0.3s;
    backdrop-filter: blur(3px);
  `;
  overlay.onclick = fecharNotificacao;
  document.body.appendChild(overlay);

  // Anima entrada
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      notif.style.opacity = '1';
      notif.style.transform = 'translate(-50%, -50%) scale(1)';
      overlay.style.opacity = '1';
    });
  });
}

function fecharNotificacao() {
  const notif = document.getElementById('notif-entrega');
  const overlay = document.getElementById('notif-overlay');
  if (notif) {
    notif.style.opacity = '0';
    notif.style.transform = 'translate(-50%, -50%) scale(0.8)';
    setTimeout(() => notif.remove(), 400);
  }
  if (overlay) {
    overlay.style.opacity = '0';
    setTimeout(() => overlay.remove(), 400);
  }
}

function mostrarToast(msg, tipo) {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    bottom: 30px;
    left: 50%;
    transform: translateX(-50%) translateY(20px);
    background: rgba(5, 20, 40, 0.95);
    color: ${tipo === 'aviso' ? '#ffcc00' : '#00f2ff'};
    border: 1px solid ${tipo === 'aviso' ? '#ffcc00' : '#00f2ff'};
    padding: 14px 28px;
    border-radius: 8px;
    font-family: 'Roboto', sans-serif;
    font-size: 1rem;
    z-index: 9999;
    opacity: 0;
    transition: all 0.3s ease;
    box-shadow: 0 5px 20px rgba(0,0,0,0.4);
  `;
  toast.innerText = msg;
  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(-50%) translateY(0)';
    });
  });

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}