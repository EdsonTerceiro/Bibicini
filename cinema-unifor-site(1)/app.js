/* Cinema UNIFOR — protótipo front-end. Catálogo via TMDB; compra e administração são demonstrativas. */
const API_BASE = "https://api.themoviedb.org/3";
const IMG_BASE = "https://image.tmdb.org/t/p/";
const $ = (s) => document.querySelector(s);
const state = {
  movies: [],
  filtered: [],
  page: 1,
  totalPages: 1,
  genreMap: {},
  selectedMovie: null,
  selectedSeats: [],
  selectedSession: null,
  activeAdmin: "Visão geral",
};
const fallbackMovies = [
  {
    id: 101,
    title: "Duna: Parte Dois",
    overview:
      "Paul Atreides une forças com Chani e os Fremen enquanto busca vingança contra os conspiradores que destruíram sua família.",
    poster_path: null,
    vote_average: 8.2,
    release_date: "2024-02-27",
    genre_ids: [878, 12],
    runtime: 166,
    tagline: "O destino de um império.",
    genres: [{ name: "Ficção científica" }, { name: "Aventura" }],
  },
  {
    id: 102,
    title: "Ainda Estou Aqui",
    overview:
      "Uma família enfrenta mudanças profundas em um período marcante da história brasileira, em uma narrativa sobre memória e resistência.",
    poster_path: null,
    vote_average: 8.4,
    release_date: "2024-09-19",
    genre_ids: [18],
    runtime: 136,
    genres: [{ name: "Drama" }],
  },
  {
    id: 103,
    title: "Divertida Mente 2",
    overview:
      "Riley está entrando na adolescência e a sede de comando passa por uma transformação para dar lugar a novas emoções.",
    poster_path: null,
    vote_average: 7.6,
    release_date: "2024-06-11",
    genre_ids: [16, 10751],
    runtime: 96,
    genres: [{ name: "Animação" }, { name: "Família" }],
  },
  {
    id: 104,
    title: "Oppenheimer",
    overview:
      "A história do físico J. Robert Oppenheimer e seu papel no desenvolvimento da bomba atômica.",
    poster_path: null,
    vote_average: 8.1,
    release_date: "2023-07-19",
    genre_ids: [18, 36],
    runtime: 180,
    genres: [{ name: "Drama" }, { name: "História" }],
  },
  {
    id: 105,
    title: "Pobres Criaturas",
    overview:
      "Uma jovem trazida de volta à vida embarca em uma jornada de descoberta, liberdade e transformação.",
    poster_path: null,
    vote_average: 7.8,
    release_date: "2023-12-07",
    genre_ids: [878, 10749],
    runtime: 141,
    genres: [{ name: "Ficção científica" }, { name: "Romance" }],
  },
  {
    id: 106,
    title: "Homem-Aranha: Através do Aranhaverso",
    overview:
      "Miles Morales atravessa o multiverso e encontra uma equipe de pessoas-aranha encarregada de proteger sua existência.",
    poster_path: null,
    vote_average: 8.4,
    release_date: "2023-05-31",
    genre_ids: [16, 28],
    runtime: 140,
    genres: [{ name: "Animação" }, { name: "Ação" }],
  },
  {
    id: 107,
    title: "Wonka",
    overview:
      "Acompanhe o início da trajetória do maior inventor, mágico e chocolateiro do mundo.",
    poster_path: null,
    vote_average: 7.1,
    release_date: "2023-12-06",
    genre_ids: [35, 10751],
    runtime: 116,
    genres: [{ name: "Comédia" }, { name: "Família" }],
  },
  {
    id: 108,
    title: "Interestelar",
    overview:
      "Uma equipe de exploradores viaja além desta galáxia para descobrir se a humanidade tem futuro entre as estrelas.",
    poster_path: null,
    vote_average: 8.4,
    release_date: "2014-11-05",
    genre_ids: [12, 18, 878],
    runtime: 169,
    genres: [{ name: "Aventura" }, { name: "Drama" }],
  },
];
const defaultGenres = [
  { id: 28, name: "Ação" },
  { id: 12, name: "Aventura" },
  { id: 16, name: "Animação" },
  { id: 35, name: "Comédia" },
  { id: 80, name: "Crime" },
  { id: 99, name: "Documentário" },
  { id: 18, name: "Drama" },
  { id: 14, name: "Fantasia" },
  { id: 27, name: "Terror" },
  { id: 10749, name: "Romance" },
  { id: 878, name: "Ficção científica" },
];
function escapeHTML(s = "") {
  return String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
}
function toast(message) {
  const el = $("#toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove("show"), 3000);
}
function getKey() {
  return localStorage.getItem("unifor_tmdb_key") || "";
}
async function tmdb(path, params = {}) {
  const key = getKey();
  if (!key) throw new Error("API key ausente");
  const url = new URL(API_BASE + path);
  url.searchParams.set("api_key", key);
  url.searchParams.set("language", "pt-BR");
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url);
  if (!res.ok)
    throw new Error(
      res.status === 401
        ? "Chave TMDB inválida."
        : "Não foi possível consultar o TMDB.",
    );
  return res.json();
}
function genreName(id) {
  return (
    state.genreMap[id] ||
    defaultGenres.find((g) => g.id === id)?.name ||
    "Filme"
  );
}
function posterUrl(path, size = "w500") {
  return path ? IMG_BASE + size + path : "";
}
function fmtDate(date) {
  if (!date) return "Data não informada";
  const d = new Date(date + "T12:00:00");
  return Number.isNaN(+d)
    ? "Data não informada"
    : d
        .toLocaleDateString("pt-BR", { month: "short", year: "numeric" })
        .replace(".", "");
}
function movieGenres(m) {
  return (
    (m.genres || m.genre_ids?.map((id) => ({ name: genreName(id) })) || [])
      .map((g) => g.name)
      .slice(0, 2)
      .join(" · ") || "Cinema"
  );
}
function renderMovies(list = state.filtered) {
  const grid = $("#movieGrid");
  $("#resultsCount").textContent =
    `${list.length} ${list.length === 1 ? "filme" : "filmes"}`;
  if (!list.length) {
    grid.innerHTML =
      '<div class="empty-state"><b>Nenhum filme encontrado</b>Tente outro título ou remova os filtros.</div>';
    return;
  }
  grid.innerHTML = list
    .map(
      (m) =>
        `<article class="movie-card" tabindex="0" role="button" aria-label="Ver detalhes de ${escapeHTML(m.title || m.name)}" data-id="${m.id}"><div class="poster-wrap">${m.poster_path ? `<img loading="lazy" src="${posterUrl(m.poster_path)}" alt="Cartaz de ${escapeHTML(m.title || m.name)}" onerror="this.outerHTML='<div class=&quot;poster-placeholder&quot;>UNIFOR</div>'">` : '<div class="poster-placeholder">UNIFOR</div>'}<span class="rating"><span>★</span>${Number(m.vote_average || 0).toFixed(1)}</span><span class="movie-type">DESTAQUE</span></div><h3 class="movie-title">${escapeHTML(m.title || m.name)}</h3><div class="movie-meta"><span>${escapeHTML(movieGenres(m))}</span><span>${fmtDate(m.release_date || m.first_air_date)}</span></div><div class="movie-cta"><span>Ver detalhes e sessões</span><span>↗</span></div></article>`,
    )
    .join("");
  grid.querySelectorAll(".movie-card").forEach((card) => {
    const open = () => showDetails(Number(card.dataset.id));
    card.addEventListener("click", open);
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        open();
      }
    });
  });
}
function applyFilters() {
  const q = $("#movieSearch").value.trim().toLocaleLowerCase("pt-BR"),
    g = $("#genreFilter").value;
  state.filtered = state.movies.filter(
    (m) =>
      (m.title || m.name || "").toLocaleLowerCase("pt-BR").includes(q) &&
      (!g ||
        (m.genre_ids || m.genres?.map((x) => x.id) || []).includes(Number(g))),
  );
  renderMovies();
}
function fillGenres(genres) {
  const select = $("#genreFilter");
  select.innerHTML = '<option value="">Todos os gêneros</option>';
  genres.forEach((g) => {
    state.genreMap[g.id] = g.name;
    const o = document.createElement("option");
    o.value = g.id;
    o.textContent = g.name;
    select.appendChild(o);
  });
}
async function loadMovies(reset = true) {
  if (reset) state.page = 1;
  const grid = $("#movieGrid");
  if (reset)
    grid.innerHTML =
      '<div class="loading-card"></div><div class="loading-card"></div><div class="loading-card"></div><div class="loading-card"></div>';
  try {
    const data = await tmdb("/movie/now_playing", {
      region: "BR",
      page: state.page,
    });
    state.totalPages = data.total_pages || 1;
    if (reset) state.movies = data.results || [];
    else state.movies.push(...(data.results || []));
    if (!state.movies.length)
      throw new Error("Sem resultados de filmes em cartaz.");
    state.filtered = [...state.movies];
    applyFilters();
    $("#loadMore").hidden = state.page >= state.totalPages;
  } catch (err) {
    if (reset) {
      state.movies = fallbackMovies;
      state.filtered = [...state.movies];
      fillGenres(defaultGenres);
      applyFilters();
      $("#loadMore").hidden = false;
      if (getKey()) toast(err.message + " Exibindo catálogo de demonstração.");
      else
        setTimeout(
          () =>
            toast(
              "Modo demonstração ativo. Configure sua chave TMDB no botão Entrar para carregar dados ao vivo.",
            ),
          600,
        );
    } else toast("Não foi possível carregar mais filmes.");
  }
}
function openModal(html) {
  $("#modalContent").innerHTML = html;
  $("#modalBackdrop").hidden = false;
  document.body.style.overflow = "hidden";
  $("#modalClose").focus();
}
function closeModal() {
  $("#modalBackdrop").hidden = true;
  document.body.style.overflow = "";
  state.selectedSeats = [];
}
async function showDetails(id) {
  let m = state.movies.find((x) => x.id === id);
  if (!m) return;
  try {
    if (getKey()) m = await tmdb("/movie/" + id);
  } catch {}
  state.selectedMovie = m;
  const title = m.title || m.name;
  const poster = posterUrl(m.poster_path);
  openModal(
    `<div class="detail-layout"><div>${poster ? `<img class="detail-poster" src="${poster}" alt="Cartaz de ${escapeHTML(title)}">` : '<div class="detail-poster poster-placeholder">UNIFOR</div>'}</div><div><span class="kicker">CINEMA UNIFOR · EM DESTAQUE</span><h2 id="modalTitle">${escapeHTML(title)}</h2><div class="detail-meta"><span class="pill">★ ${Number(m.vote_average || 0).toFixed(1)} / 10</span><span class="pill">${escapeHTML(fmtDate(m.release_date))}</span>${m.runtime ? `<span class="pill">${m.runtime} min</span>` : ""}</div><p>${escapeHTML(m.overview || "Sinopse não disponível para este título.")}</p><p><b>Gêneros:</b> ${escapeHTML(movieGenres(m))}</p><div class="detail-actions"><button class="btn" style="background:var(--blue);color:white" id="chooseSession">Escolher sessão <span>→</span></button><button class="btn btn-outline" id="trailerBtn">Ver trailer ↗</button></div></div></div><div id="sessionsArea" hidden></div>`,
  );
  $("#chooseSession").onclick = () => showSessions(m);
  $("#trailerBtn").onclick = async () => {
    try {
      const d = await tmdb(`/movie/${m.id}/videos`);
      const v =
        d.results?.find((x) => x.site === "YouTube" && x.type === "Trailer") ||
        d.results?.find((x) => x.site === "YouTube");
      if (v)
        window.open(
          "https://www.youtube.com/watch?v=" + encodeURIComponent(v.key),
          "_blank",
          "noopener",
        );
      else toast("Trailer não disponível para este filme.");
    } catch {
      toast("Configure uma chave TMDB válida para consultar trailers.");
    }
  };
}
function showSessions(m) {
  const area = $("#sessionsArea");
  area.hidden = false;
  area.innerHTML = `<h2 style="font-size:18px;margin-top:25px">Escolha sua sessão</h2><p>Horários ilustrativos para o protótipo. A disponibilidade real exige integração com o backend do cinema.</p><div class="session-list">${[
    { time: "14:00", room: "Sala 1", format: "Legendado" },
    { time: "17:30", room: "Sala 1", format: "Dublado" },
    { time: "20:00", room: "Sala 2", format: "Legendado" },
  ]
    .map(
      (s, i) =>
        `<div class="session-option"><div><b>${s.time} · ${s.room}</b><small>${s.format} · Ingresso demonstrativo a partir de R$ 16,00</small></div><button class="btn" style="background:var(--blue);color:white" data-session="${i}">Selecionar</button></div>`,
    )
    .join("")}</div>`;
  area.querySelectorAll("[data-session]").forEach(
    (b) =>
      (b.onclick = () => {
        state.selectedSession = {
          ...[
            { time: "14:00", room: "Sala 1", format: "Legendado" },
            { time: "17:30", room: "Sala 1", format: "Dublado" },
            { time: "20:00", room: "Sala 2", format: "Legendado" },
          ][Number(b.dataset.session)],
          movie: m,
        };
        showSeats();
      }),
  );
  area.scrollIntoView({ behavior: "smooth", block: "nearest" });
}
function showSeats() {
  state.selectedSeats = [];
  const m = state.selectedSession.movie;
  openModal(
    `<span class="kicker">ETAPA 1 DE 3 · ESCOLHA SEU LUGAR</span><h2 id="modalTitle">Selecione seus assentos</h2><p>${escapeHTML(m.title)} · Hoje, ${state.selectedSession.time} · ${state.selectedSession.room}</p><div class="seat-layout"><div><div class="screen-label">TELA</div><div class="seat-grid">${Array.from(
      { length: 40 },
      (_, i) => {
        const occupied = [2, 5, 9, 14, 19, 24, 28, 33].includes(i);
        return `<button class="seat ${occupied ? "occupied" : ""}" data-seat="${String.fromCharCode(65 + Math.floor(i / 8))}${(i % 8) + 1}" ${occupied ? 'disabled aria-label="Ocupado"' : 'aria-label="Assento ' + String.fromCharCode(65 + Math.floor(i / 8)) + ((i % 8) + 1) + '"'}>${String.fromCharCode(65 + Math.floor(i / 8))}${(i % 8) + 1}</button>`;
      },
    ).join(
      "",
    )}</div><div class="legend"><span><i></i>Disponível</span><span><i class="leg-selected"></i>Selecionado</span><span><i class="leg-taken"></i>Ocupado</span></div></div><aside class="seat-summary"><h3>Seu pedido</h3><p id="seatNames">Nenhum assento selecionado</p><p>Ingresso demonstrativo</p><div class="total" id="seatTotal">R$ 0,00</div><button class="btn" style="background:var(--blue);color:white;width:100%;margin-top:14px" id="continueSeats" disabled>Continuar →</button></aside></div><p class="modal-note">Mapa ilustrativo. A reserva real de assentos exige backend com controle de concorrência.</p>`,
  );
  $("#modalContent")
    .querySelectorAll(".seat:not(.occupied)")
    .forEach(
      (btn) =>
        (btn.onclick = () => {
          const seat = btn.dataset.seat;
          if (state.selectedSeats.includes(seat)) {
            state.selectedSeats = state.selectedSeats.filter((s) => s !== seat);
            btn.classList.remove("selected");
          } else if (state.selectedSeats.length < 6) {
            state.selectedSeats.push(seat);
            btn.classList.add("selected");
          } else toast("Limite demonstrativo de 6 assentos por pedido.");
          $("#seatNames").textContent =
            state.selectedSeats.join(", ") || "Nenhum assento selecionado";
          $("#seatTotal").textContent = (
            state.selectedSeats.length * 16
          ).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
          $("#continueSeats").disabled = !state.selectedSeats.length;
        }),
    );
  $("#continueSeats").onclick = showCheckout;
}
function showCheckout() {
  const m = state.selectedSession.movie;
  const seats = [...state.selectedSeats];
  const total = seats.length * 16;
  openModal(
    `<span class="kicker">ETAPA 2 DE 3 · REVISÃO DO PEDIDO</span><h2 id="modalTitle">Quase na hora do filme.</h2><p>Confira os detalhes antes de gerar seu ingresso demonstrativo.</p><div class="ticket"><b>${escapeHTML(m.title)}</b><p>${escapeHTML(state.selectedSession.time)} · ${escapeHTML(state.selectedSession.room)} · ${escapeHTML(state.selectedSession.format)}</p><p>Assentos: <b>${seats.join(", ")}</b></p><p>Ingresso(s): ${seats.length} × R$ 16,00</p><div class="ticket-code">${total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</div></div><form class="form-stack" id="checkoutForm"><label>Nome completo<input name="name" required placeholder="Como aparece no ingresso"></label><label>E-mail<input name="email" type="email" required placeholder="voce@exemplo.com"></label><label>Tipo de ingresso<select name="type"><option>Inteira</option><option>Meia-entrada (com comprovação)</option><option>Comunidade UNIFOR (benefício não validado)</option></select></label><label>Forma de pagamento<select name="payment"><option>PIX (simulação)</option><option>Cartão de crédito (simulação)</option></select></label><button class="btn" style="background:var(--blue);color:white">Gerar ingresso demonstrativo →</button></form><p class="modal-note">Nenhum pagamento real será processado. Não informe dados de cartão.</p>`,
  );
  $("#checkoutForm").onsubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const order = {
      id: "UNF-" + Math.random().toString(36).slice(2, 8).toUpperCase(),
      title: m.title,
      time: state.selectedSession.time,
      room: state.selectedSession.room,
      seats,
      type: fd.get("type"),
      payment: fd.get("payment"),
      name: fd.get("name"),
      email: fd.get("email"),
      total,
      status: "Demonstrativo",
      created: new Date().toISOString(),
    };
    const orders = JSON.parse(localStorage.getItem("unifor_orders") || "[]");
    orders.unshift(order);
    localStorage.setItem("unifor_orders", JSON.stringify(orders));
    showTicket(order);
  };
}
function showTicket(order) {
  openModal(
    `<div style="text-align:center;padding:10px 0"><div style="font-size:42px;color:#079a69">✓</div><span class="kicker">ETAPA 3 DE 3 · CONFIRMAÇÃO DEMONSTRATIVA</span><h2 id="modalTitle">Seu ingresso está pronto!</h2><p>Esta confirmação é apenas uma simulação acadêmica, sem validade para entrada no cinema.</p></div><div class="ticket"><div style="display:flex;justify-content:space-between;gap:15px"><div><span class="kicker">CINEMA UNIFOR</span><b>${escapeHTML(order.title)}</b><p>${escapeHTML(order.time)} · ${escapeHTML(order.room)}</p><p>Assentos: <b>${escapeHTML(order.seats.join(", "))}</b></p></div><div style="font-size:50px;color:var(--blue)">▦</div></div><div class="ticket-code">${escapeHTML(order.id)}</div><p>${escapeHTML(order.name)} · ${escapeHTML(order.type)}</p><b>${order.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</b><p class="modal-note">Código ilustrativo — não é um QR Code de validação.</p></div><div class="detail-actions"><button class="btn" style="background:var(--blue);color:white" id="saveTicket">Salvar comprovante</button><button class="btn btn-outline" id="doneTicket">Concluir</button></div>`,
  );
  $("#saveTicket").onclick = () => {
    const blob = new Blob(
      [
        `CINEMA UNIFOR — COMPROVANTE DEMONSTRATIVO\\nPedido: ${order.id}\\nFilme: ${order.title}\\nSessão: ${order.time} — ${order.room}\\nAssentos: ${order.seats.join(", ")}\\nCliente: ${order.name}\\nTotal simulado: ${order.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}\\n\\nSEM VALIDADE PARA ENTRADA. PROTÓTIPO ACADÊMICO.`,
      ],
      { type: "text/plain" },
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `ingresso-${order.id}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  $("#doneTicket").onclick = () => {
    closeModal();
    toast("Comprovante demonstrativo salvo neste navegador.");
  };
}
function showLogin() {
  openModal(
    `<span class="kicker">BEM-VINDO AO CINEMA UNIFOR</span><h2 id="modalTitle">Entre para continuar.</h2><p>Esta interface é um protótipo. A autenticação real deve ser implementada no backend.</p><form class="form-stack" id="loginForm"><label>E-mail<input type="email" name="email" required placeholder="voce@exemplo.com"></label><label>Senha<input type="password" name="password" required placeholder="Sua senha"></label><button class="btn" style="background:var(--blue);color:white">Entrar (demonstração)</button></form><div class="detail-actions"><button class="btn btn-outline" id="registerDemo">Criar conta</button><button class="btn btn-outline" id="apiSettings">Configurar API TMDB</button></div><p class="modal-note">Não use senhas reais. Os dados não são enviados para servidor.</p>`,
  );
  $("#loginForm").onsubmit = (e) => {
    e.preventDefault();
    const email = new FormData(e.currentTarget).get("email");
    closeModal();
    toast("Login não conectado ao backend. Olá, " + email + "!");
  };
  $("#registerDemo").onclick = showRegister;
  $("#apiSettings").onclick = showApiSettings;
}
function showRegister() {
  openModal(
    `<span class="kicker">CRIE SUA CONTA</span><h2 id="modalTitle">Faça parte da experiência.</h2><form class="form-stack" id="registerForm"><label>Nome completo<input required name="name" placeholder="Seu nome"></label><label>E-mail<input required name="email" type="email" placeholder="voce@exemplo.com"></label><label>Senha<input required name="password" type="password" minlength="8" placeholder="Mínimo de 8 caracteres"></label><label><span><input type="checkbox" required style="width:auto"> Li e aceito a política de privacidade demonstrativa.</span></label><button class="btn" style="background:var(--blue);color:white">Criar conta (demonstração)</button></form><p class="modal-note">Cadastro não é enviado nem autenticado por servidor neste protótipo.</p>`,
  );
  $("#registerForm").onsubmit = (e) => {
    e.preventDefault();
    closeModal();
    toast(
      "Formulário validado localmente. Backend de cadastro ainda necessário.",
    );
  };
}
function showApiSettings() {
  openModal(
    `<span class="kicker">INTEGRAÇÃO DE CATÁLOGO</span><h2 id="modalTitle">Conectar ao TMDB</h2><p>Insira sua chave de API do The Movie Database para buscar filmes, cartazes, gêneros e trailers ao vivo.</p><form class="form-stack" id="apiForm"><label>Chave API (v3 auth)<input name="key" value="${escapeHTML(getKey())}" required placeholder="Cole sua chave do TMDB"></label><button class="btn" style="background:var(--blue);color:white">Salvar chave e carregar filmes</button></form><p class="modal-note">A chave fica no armazenamento local deste navegador. Para produção, prefira chamadas por backend/proxy para não expor credenciais no cliente.</p><p><a href="https://www.themoviedb.org/settings/api" target="_blank" rel="noopener" style="color:var(--blue);font-size:12px;font-weight:700">Solicitar chave no TMDB ↗</a></p>`,
  );
  $("#apiForm").onsubmit = async (e) => {
    e.preventDefault();
    const key = new FormData(e.currentTarget).get("key").trim();
    localStorage.setItem("unifor_tmdb_key", key);
    try {
      await tmdb("/configuration");
      closeModal();
      fillGenres(defaultGenres);
      await loadGenres();
      await loadMovies(true);
      toast("TMDB conectado.");
    } catch (err) {
      localStorage.removeItem("unifor_tmdb_key");
      toast("Não foi possível validar a chave: " + err.message);
    }
  };
}
async function loadGenres() {
  try {
    const d = await tmdb("/genre/movie/list");
    if (d.genres?.length) fillGenres(d.genres);
  } catch {}
}
function showAdmin() {
  openModal(
    `<span class="kicker">PAINEL ADMINISTRATIVO</span><h2 id="modalTitle">Visão geral do cinema</h2><p>Área ilustrativa para apresentação da estrutura administrativa. O acesso e os dados reais precisam de backend e permissões.</p><div class="admin-tabs">${["Visão geral", "Filmes", "Sessões", "Vendas", "Ingressos"].map((x) => `<button class="${state.activeAdmin === x ? "active" : ""}" data-admin="${x}">${x}</button>`).join("")}</div><div id="adminContent"></div><p class="modal-note">Dados abaixo são demonstrativos e não representam operações reais do Cinema UNIFOR.</p>`,
  );
  renderAdminPanel();
  $("#modalContent")
    .querySelectorAll("[data-admin]")
    .forEach(
      (b) =>
        (b.onclick = () => {
          state.activeAdmin = b.dataset.admin;
          $("#modalContent")
            .querySelectorAll("[data-admin]")
            .forEach((x) => x.classList.toggle("active", x === b));
          renderAdminPanel();
        }),
    );
}
function renderAdminPanel() {
  const target = $("#adminContent");
  if (state.activeAdmin === "Visão geral") {
    const orders = JSON.parse(localStorage.getItem("unifor_orders") || "[]");
    target.innerHTML = `<div class="admin-stat-grid"><div class="admin-stat"><small>Pedidos demonstrativos</small><b>${orders.length}</b></div><div class="admin-stat"><small>Filmes no catálogo</small><b>${state.movies.length}</b></div><div class="admin-stat"><small>Receita simulada</small><b>${orders.reduce((a, o) => a + o.total, 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</b></div></div>`;
  } else if (state.activeAdmin === "Filmes") {
    target.innerHTML = `<button class="btn" id="adminAddMovie" style="background:var(--blue);color:white">+ Cadastrar filme demonstrativo</button><table class="admin-table"><thead><tr><th>Filme</th><th>Avaliação</th><th>Status</th></tr></thead><tbody>${state.movies
      .slice(0, 8)
      .map(
        (m) =>
          `<tr><td>${escapeHTML(m.title || m.name)}</td><td>${Number(m.vote_average || 0).toFixed(1)}</td><td><span class="status-demo">Catálogo</span></td></tr>`,
      )
      .join("")}</tbody></table>`;
    $("#adminAddMovie").onclick = () =>
      toast("Cadastro persistente exige API administrativa/backend.");
  } else if (state.activeAdmin === "Sessões") {
    target.innerHTML =
      '<table class="admin-table"><thead><tr><th>Horário</th><th>Sala</th><th>Formato</th></tr></thead><tbody><tr><td>14:00</td><td>Sala 1</td><td>Legendado</td></tr><tr><td>17:30</td><td>Sala 1</td><td>Dublado</td></tr><tr><td>20:00</td><td>Sala 2</td><td>Legendado</td></tr></tbody></table>';
  } else {
    const orders = JSON.parse(localStorage.getItem("unifor_orders") || "[]");
    target.innerHTML = orders.length
      ? `<table class="admin-table"><thead><tr><th>Pedido</th><th>Filme</th><th>Total</th></tr></thead><tbody>${orders.map((o) => `<tr><td>${escapeHTML(o.id)}</td><td>${escapeHTML(o.title)}</td><td>${o.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</td></tr>`).join("")}</tbody></table>`
      : '<div class="empty-state"><b>Nenhum pedido demonstrativo</b>Pedidos criados nesta sessão de demonstração aparecerão aqui.</div>';
  }
}
$("#movieSearch").addEventListener("input", applyFilters);
$("#genreFilter").addEventListener("change", applyFilters);
$("#loadMore").addEventListener("click", () => {
  if (state.page < state.totalPages) {
    state.page++;
    loadMovies(false);
  } else {
    state.movies.push(
      ...fallbackMovies.map((m, i) => ({
        ...m,
        id: m.id + 1000 + state.movies.length + i,
      })),
    );
    state.filtered = [...state.movies];
    applyFilters();
    toast("Mais títulos demonstrativos adicionados.");
  }
});
$("#searchToggle").onclick = () => {
  $("#searchRow").scrollIntoView({ behavior: "smooth", block: "center" });
  $("#movieSearch").focus();
};
$("#loginBtn").onclick = showLogin;
$("#adminBtn").onclick = showAdmin;
$("#modalClose").onclick = closeModal;
$("#modalBackdrop").addEventListener("click", (e) => {
  if (e.target === $("#modalBackdrop")) closeModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !$("#modalBackdrop").hidden) closeModal();
  if (
    e.key === "/" &&
    !["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)
  ) {
    e.preventDefault();
    $("#movieSearch").focus();
  }
});
$("#menuToggle").onclick = () => $(".main-nav").classList.toggle("open");
$(".main-nav")
  .querySelectorAll("a")
  .forEach((a) =>
    a.addEventListener("click", () => $(".main-nav").classList.remove("open")),
  );
$("#newsletterForm").onsubmit = (e) => {
  e.preventDefault();
  e.currentTarget.reset();
  toast("Obrigado! O cadastro de novidades é ilustrativo neste protótipo.");
};
const now = new Date();
$("#todayDay").textContent = String(now.getDate()).padStart(2, "0");
$("#todayMonth").textContent = now
  .toLocaleDateString("pt-BR", { month: "long" })
  .toLocaleUpperCase("pt-BR");
fillGenres(defaultGenres);
loadMovies(true);
