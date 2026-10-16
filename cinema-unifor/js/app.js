// ==========================================================================
// CINEMA UNIFOR - Controlador Geral da Aplicação Web
// Orquestrador das 36 Telas (20 Cliente + 16 Admin)
// Integração TMDb + Regras de Negócio UNIFOR
// ==========================================================================

const CinemaApp = {
  // Estado transitório da sessão de navegação e compra
  state: {
    currentScreen: 'screen-home',
    selectedMovie: null,
    selectedSession: null,
    selectedSeats: [],
    seatLockTimer: null,
    seatLockExpiresAt: null,
    ticketTypesSelection: {}, // { 'C4': 'Meia Aluno UNIFOR', 'C5': 'Inteira' }
    appliedCoupon: null,
    tempOrderId: null,
    searchFilter: '',
    genreFilter: 'todos',
    scheduleDate: null
  },

  init() {
    this.setupPrototypeBar();
    this.setupHeader();
    this.setupRouting();
    this.setupTmdbKeyInput();

    // Inicia na tela home ou recupera da hash da URL
    const hash = window.location.hash.replace('#', '');
    if (hash && document.getElementById(hash)) {
      this.navigateTo(hash);
    } else {
      this.navigateTo('screen-home');
    }

    // Inicializa data da programação para hoje
    this.state.scheduleDate = window.dataStore.getDateOffset(0);

    // Carrega dados e listeners
    this.renderHome();
  },

  // ==========================================================================
  // BARRA DE HOMOLOGAÇÃO DE TELAS (Fase 4 - Protótipo 1 a 36)
  // ==========================================================================
  setupPrototypeBar() {
    const protoSelect = document.getElementById('proto-screen-select');
    if (!protoSelect) return;

    protoSelect.addEventListener('change', (e) => {
      this.navigateTo(e.target.value);
    });

    // Quick switch buttons
    const btnUser = document.getElementById('proto-user-flow-btn');
    const btnAdmin = document.getElementById('proto-admin-flow-btn');

    if (btnUser) {
      btnUser.addEventListener('click', () => this.navigateTo('screen-home'));
    }
    if (btnAdmin) {
      btnAdmin.addEventListener('click', () => this.navigateTo('screen-admin-dashboard'));
    }
  },

  setupHeader() {
    this.updateUserHeader();

    // Links de navegação do menu
    document.querySelectorAll('.main-nav .nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        const target = link.getAttribute('data-screen');
        if (target) {
          document.querySelectorAll('.main-nav .nav-link').forEach(l => l.classList.remove('active'));
          link.classList.add('active');
          this.navigateTo(target);
        }
      });
    });

    // Botão de login/perfil no cabeçalho
    const userBtn = document.getElementById('header-user-btn');
    if (userBtn) {
      userBtn.addEventListener('click', () => {
        const user = window.dataStore.getCurrentUser();
        if (user) {
          this.navigateTo('screen-profile');
        } else {
          this.navigateTo('screen-login');
        }
      });
    }

    // Botão de alternar usuário rápido para facilitar testes
    const userRoleSelect = document.getElementById('header-role-switch');
    if (userRoleSelect) {
      userRoleSelect.addEventListener('change', (e) => {
        const role = e.target.value;
        const users = window.dataStore.getUsers();
        const found = users.find(u => u.role === role);
        if (found) {
          window.dataStore.setCurrentUser(found);
          this.showToast(`Perfil alterado para: ${found.name} (${found.role.toUpperCase()})`, 'success');
          this.updateUserHeader();
          // Se estiver na tela do perfil ou admin, atualiza
          if (this.state.currentScreen === 'screen-profile') this.renderProfile();
          if (this.state.currentScreen.startsWith('screen-admin-')) this.renderAdminDashboard();
        }
      });
    }
  },

  updateUserHeader() {
    const user = window.dataStore.getCurrentUser();
    const userBtn = document.getElementById('header-user-btn');
    const roleSelect = document.getElementById('header-role-switch');
    if (!userBtn) return;

    if (user) {
      userBtn.innerHTML = `
        <div class="user-avatar">${user.name.charAt(0)}</div>
        <div style="text-align: left; line-height: 1.1">
          <div style="font-size: 0.82rem; font-weight: 700; max-width: 130px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap">${user.name.split(' ')[0]}</div>
          <div style="font-size: 0.68rem; color: #93c5fd">${user.role === 'aluno' ? 'Aluno UNIFOR' : user.role === 'admin' ? 'Administrador' : user.role}</div>
        </div>
      `;
      if (roleSelect) roleSelect.value = user.role;
    } else {
      userBtn.innerHTML = `<span class="btn btn-sm btn-primary">Entrar</span>`;
    }
  },

  setupRouting() {
    window.addEventListener('hashchange', () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && document.getElementById(hash)) {
        this.navigateTo(hash, false);
      }
    });
  },

  setupTmdbKeyInput() {
    const key = window.tmdbService.getApiKey();
    const input = document.getElementById('admin-tmdb-key-input');
    if (input) input.value = key;
  },

  // ==========================================================================
  // NAVEGAÇÃO PRINCIPAL ENTRE AS 36 TELAS
  // ==========================================================================
  navigateTo(screenId, updateHash = true) {
    const screens = document.querySelectorAll('.screen-container');
    const target = document.getElementById(screenId);

    if (!target) {
      console.warn(`Tela não encontrada: ${screenId}`);
      return;
    }

    screens.forEach(s => s.classList.remove('active'));
    target.classList.add('active');
    this.state.currentScreen = screenId;

    if (updateHash) {
      window.location.hash = screenId;
    }

    // Atualiza o select do protótipo no topo
    const protoSelect = document.getElementById('proto-screen-select');
    if (protoSelect) {
      protoSelect.value = screenId;
    }

    // Scroll suave para o topo
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Roteamento dos dados específicos de cada tela
    this.handleScreenRender(screenId);
  },

  handleScreenRender(screenId) {
    switch (screenId) {
      case 'screen-home':
        this.renderHome();
        break;
      case 'screen-catalog':
        this.renderCatalog();
        break;
      case 'screen-upcoming':
        this.renderUpcoming();
        break;
      case 'screen-movie-details':
        this.renderMovieDetails();
        break;
      case 'screen-schedule':
        this.renderSchedule();
        break;
      case 'screen-session-select':
        this.renderSessionSelect();
        break;
      case 'screen-seat-selection':
        this.renderSeatSelection();
        break;
      case 'screen-checkout-summary':
        this.renderCheckoutSummary();
        break;
      case 'screen-login':
        this.renderLogin();
        break;
      case 'screen-register':
        this.renderRegister();
        break;
      case 'screen-forgot-password':
        this.renderForgotPassword();
        break;
      case 'screen-payment':
        this.renderPayment();
        break;
      case 'screen-confirmation':
        this.renderConfirmation();
        break;
      case 'screen-my-tickets':
        this.renderMyTickets();
        break;
      case 'screen-order-history':
        this.renderOrderHistory();
        break;
      case 'screen-profile':
        this.renderProfile();
        break;
      case 'screen-contact':
        this.renderContact();
        break;
      case 'screen-faq':
        this.renderFaq();
        break;
      case 'screen-privacy':
      case 'screen-terms':
        break;

      // Telas Administrativas (21 a 36)
      case 'screen-admin-login':
        this.renderAdminLogin();
        break;
      case 'screen-admin-dashboard':
        this.renderAdminDashboard();
        break;
      case 'screen-admin-movies':
        this.renderAdminMovies();
        break;
      case 'screen-admin-sessions':
        this.renderAdminSessions();
        break;
      case 'screen-admin-rooms':
        this.renderAdminRooms();
        break;
      case 'screen-admin-seats':
        this.renderAdminSeats();
        break;
      case 'screen-admin-prices':
        this.renderAdminPrices();
        break;
      case 'screen-admin-promotions':
        this.renderAdminPromotions();
        break;
      case 'screen-admin-orders':
        this.renderAdminOrders();
        break;
      case 'screen-admin-payments':
        this.renderAdminPayments();
        break;
      case 'screen-admin-users':
        this.renderAdminUsers();
        break;
      case 'screen-admin-reports':
        this.renderAdminReports();
        break;
      case 'screen-admin-banners':
        this.renderAdminBanners();
        break;
      case 'screen-admin-config':
        this.renderAdminConfig();
        break;
      case 'screen-admin-audit':
        this.renderAdminAudit();
        break;
      case 'screen-admin-validator':
        this.renderAdminValidator();
        break;
    }
  },

  // ==========================================================================
  // TELA 1: PÁGINA INICIAL (RF001)
  // ==========================================================================
  renderHome() {
    const movies = window.dataStore.getMovies();
    const inCartaz = movies.filter(m => m.status === 'cartaz');
    const upcoming = movies.filter(m => m.status === 'breve');

    // Carrossel Hero
    const heroEl = document.getElementById('home-hero-banner');
    if (heroEl && inCartaz.length > 0) {
      const topMovie = inCartaz[0];
      heroEl.style.backgroundImage = `url('${topMovie.backdropPath}')`;
      heroEl.innerHTML = `
        <div class="hero-overlay">
          <div class="hero-content">
            <span class="hero-tag">★ Destaque Cinema UNIFOR</span>
            <h1 class="hero-title">${topMovie.title}</h1>
            <p class="hero-description">${topMovie.overview}</p>
            <div class="hero-actions">
              <button class="btn btn-primary btn-lg" onclick="CinemaApp.startBookingMovie(${topMovie.id})">
                <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"></path></svg>
                Comprar Ingressos
              </button>
              <button class="btn btn-secondary btn-lg" onclick="CinemaApp.viewMovieDetails(${topMovie.id})">
                Mais Detalhes & Trailer
              </button>
            </div>
          </div>
        </div>
      `;
    }

    // Grid de Filmes em Cartaz
    const gridCartaz = document.getElementById('home-now-playing-grid');
    if (gridCartaz) {
      gridCartaz.innerHTML = inCartaz.slice(0, 6).map(m => this.createMovieCardHtml(m)).join('');
    }

    // Grid de Filmes Em Breve
    const gridBreve = document.getElementById('home-upcoming-grid');
    if (gridBreve) {
      gridBreve.innerHTML = upcoming.slice(0, 3).map(m => this.createMovieCardHtml(m, true)).join('');
    }
  },

  createMovieCardHtml(movie, isUpcoming = false) {
    const ageClass = `age-${movie.ageRating}`;
    return `
      <div class="movie-card">
        <div class="movie-poster-wrap" onclick="CinemaApp.viewMovieDetails(${movie.id})">
          <img class="movie-poster-img" src="${movie.posterPath}" alt="${movie.title}" loading="lazy" />
          <span class="movie-age-badge ${ageClass}">${movie.ageRating === 'Livre' ? 'L' : movie.ageRating}</span>
          <span class="movie-rating-badge">★ ${movie.voteAverage}</span>
        </div>
        <div class="movie-info">
          <h3 class="movie-title">${movie.title}</h3>
          <div class="movie-meta">
            <span class="movie-meta-item">${movie.runtime} min</span> • 
            <span class="movie-meta-item">${movie.genres.slice(0, 2).join(', ')}</span>
          </div>
          <div class="movie-card-footer">
            ${isUpcoming 
              ? `<button class="btn btn-secondary btn-sm" style="width: 100%" onclick="CinemaApp.notifyMe(${movie.id})">🔔 Avise-me na Estreia</button>`
              : `<button class="btn btn-primary btn-sm" style="width: 100%" onclick="CinemaApp.startBookingMovie(${movie.id})">Ingressos</button>`
            }
          </div>
        </div>
      </div>
    `;
  },

  // ==========================================================================
  // TELA 2: CATÁLOGO DE FILMES EM CARTAZ (RF002, RF003)
  // ==========================================================================
  renderCatalog() {
    const movies = window.dataStore.getMovies().filter(m => m.status === 'cartaz');
    const search = this.state.searchFilter.toLowerCase();
    const genre = this.state.genreFilter;

    const filtered = movies.filter(m => {
      const matchSearch = m.title.toLowerCase().includes(search) || m.overview.toLowerCase().includes(search);
      const matchGenre = genre === 'todos' || m.genres.some(g => g.toLowerCase() === genre.toLowerCase());
      return matchSearch && matchGenre;
    });

    const grid = document.getElementById('catalog-grid');
    if (grid) {
      if (filtered.length === 0) {
        grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--gray-400)">Nenhum filme localizado com os filtros selecionados.</div>`;
      } else {
        grid.innerHTML = filtered.map(m => this.createMovieCardHtml(m)).join('');
      }
    }
  },

  filterCatalogSearch(val) {
    this.state.searchFilter = val;
    this.renderCatalog();
  },

  filterCatalogGenre(genre) {
    this.state.genreFilter = genre;
    this.renderCatalog();
  },

  // ==========================================================================
  // TELA 3: EM BREVE / LANÇAMENTOS (RF001)
  // ==========================================================================
  renderUpcoming() {
    const movies = window.dataStore.getMovies().filter(m => m.status === 'breve');
    const grid = document.getElementById('upcoming-grid');
    if (grid) {
      grid.innerHTML = movies.map(m => this.createMovieCardHtml(m, true)).join('');
    }
  },

  notifyMe(movieId) {
    const movie = window.dataStore.getMovieById(movieId);
    this.showToast(`Lembrete ativado para "${movie ? movie.title : 'o filme'}"! Você receberá aviso institucional quando as sessões abrirem.`, 'success');
  },

  // ==========================================================================
  // TELA 4: DETALHES DO FILME (RF004)
  // ==========================================================================
  viewMovieDetails(movieId) {
    const movie = window.dataStore.getMovieById(movieId);
    if (!movie) return;
    this.state.selectedMovie = movie;
    this.navigateTo('screen-movie-details');
  },

  renderMovieDetails() {
    const movie = this.state.selectedMovie;
    if (!movie) {
      const all = window.dataStore.getMovies();
      this.state.selectedMovie = all[0];
    }
    const cur = this.state.selectedMovie;
    const container = document.getElementById('movie-details-content');
    if (!container || !cur) return;

    // Busca sessões disponíveis para este filme
    const today = window.dataStore.getDateOffset(0);
    const sessions = window.dataStore.getSessions().filter(s => s.movieId == cur.id);

    container.innerHTML = `
      <div class="movie-details-hero" style="background-image: url('${cur.backdropPath}')">
        <div class="details-overlay">
          <div>
            <img class="details-poster" src="${cur.posterPath}" alt="${cur.title}" />
          </div>
          <div>
            <div style="display: flex; gap: 8px; margin-bottom: 8px">
              <span class="movie-age-badge age-${cur.ageRating}">${cur.ageRating === 'Livre' ? 'Classificação Livre' : `${cur.ageRating} anos`}</span>
              <span class="hero-tag">Nota TMDb: ★ ${cur.voteAverage}</span>
            </div>
            <h1 style="font-size: 2.2rem; font-weight: 900; margin-bottom: 6px">${cur.title}</h1>
            <p style="font-style: italic; color: #93c5fd; margin-bottom: 16px">${cur.tagline || ''}</p>
            <p style="color: var(--gray-200); line-height: 1.6; font-size: 0.98rem">${cur.overview}</p>

            <div class="details-meta-grid">
              <div>
                <small style="color: var(--gray-400); display: block">Duração</small>
                <b>${cur.runtime} minutos</b>
              </div>
              <div>
                <small style="color: var(--gray-400); display: block">Gêneros</small>
                <b>${cur.genres.join(', ')}</b>
              </div>
              <div>
                <small style="color: var(--gray-400); display: block">Direção</small>
                <b>${cur.director || 'Direção Geral'}</b>
              </div>
              <div>
                <small style="color: var(--gray-400); display: block">Elenco Principal</small>
                <b>${(cur.cast || []).slice(0, 3).join(', ')}</b>
              </div>
            </div>

            <!-- Sessões disponíveis -->
            <div style="margin-top: 24px">
              <h3 style="font-size: 1.2rem; font-weight: 700; margin-bottom: 12px">Sessões Programadas no Cinema UNIFOR:</h3>
              <div style="display: flex; flex-wrap: wrap; gap: 12px">
                ${sessions.length > 0 
                  ? sessions.map(s => {
                      const room = window.dataStore.getRoomById(s.roomId);
                      return `
                        <div class="session-chip" onclick="CinemaApp.selectSession('${s.id}')">
                          <span class="session-time">${s.time}</span>
                          <span class="session-type">${s.format}</span>
                          <span class="session-price">R$ ${s.basePrice.toFixed(2)}</span>
                          <small style="font-size: 0.68rem; color: var(--gray-300)">${room ? room.name.split('-')[0] : 'Sala'}</small>
                        </div>
                      `;
                    }).join('')
                  : `<p style="color: var(--gray-400)">Não há sessões abertas hoje para este filme.</p>`
                }
              </div>
            </div>

            <!-- Player de Trailer YouTube TMDb -->
            ${cur.trailerUrl ? `
              <div style="margin-top: 32px">
                <h3 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 10px">Trailer Oficial (The Movie Database):</h3>
                <div class="trailer-container">
                  <iframe src="${cur.trailerUrl}" title="${cur.title} Trailer" allowfullscreen></iframe>
                </div>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  },

  // ==========================================================================
  // TELA 5: PROGRAMAÇÃO POR DATA (RF005)
  // ==========================================================================
  renderSchedule() {
    const daysContainer = document.getElementById('schedule-days-nav');
    const listContainer = document.getElementById('schedule-movies-list');
    if (!daysContainer || !listContainer) return;

    // Constrói os próximos 7 dias
    const days = [];
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const iso = d.toISOString().split('T')[0];
      days.push({
        iso,
        dayName: i === 0 ? 'Hoje' : dayNames[d.getDay()],
        dayNum: d.getDate()
      });
    }

    daysContainer.innerHTML = days.map(d => `
      <div class="day-pill ${d.iso === this.state.scheduleDate ? 'active' : ''}" onclick="CinemaApp.changeScheduleDate('${d.iso}')">
        <div class="day-name">${d.dayName}</div>
        <div class="day-num">${d.dayNum}</div>
      </div>
    `).join('');

    // Filtra sessões da data selecionada
    const sessions = window.dataStore.getSessions().filter(s => s.date === this.state.scheduleDate);
    if (sessions.length === 0) {
      listContainer.innerHTML = `<div style="text-align: center; padding: 50px; color: var(--gray-400)">Nenhuma sessão agendada para esta data no Cinema UNIFOR.</div>`;
      return;
    }

    // Agrupa sessões por filme
    const grouped = {};
    for (const sess of sessions) {
      if (!grouped[sess.movieId]) grouped[sess.movieId] = [];
      grouped[sess.movieId].push(sess);
    }

    listContainer.innerHTML = Object.keys(grouped).map(movieId => {
      const movie = window.dataStore.getMovieById(movieId);
      if (!movie) return '';
      const movieSessions = grouped[movieId];

      return `
        <div class="schedule-movie-row">
          <div>
            <img src="${movie.posterPath}" alt="${movie.title}" style="width: 100%; border-radius: var(--radius-md);" />
          </div>
          <div>
            <div style="display: flex; align-items: center; gap: 8px">
              <span class="movie-age-badge age-${movie.ageRating}">${movie.ageRating}</span>
              <h3 style="font-size: 1.25rem; font-weight: 800">${movie.title}</h3>
            </div>
            <p style="font-size: 0.85rem; color: var(--gray-400); margin: 6px 0">${movie.genres.join(', ')} • ${movie.runtime} min</p>
            <p style="font-size: 0.9rem; color: var(--gray-200); margin-bottom: 12px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${movie.overview}</p>
            <div class="schedule-sessions">
              ${movieSessions.map(s => {
                const room = window.dataStore.getRoomById(s.roomId);
                return `
                  <div class="session-chip" onclick="CinemaApp.selectSession('${s.id}')">
                    <span class="session-time">${s.time}</span>
                    <span class="session-type">${s.format}</span>
                    <span class="session-price">R$ ${s.basePrice.toFixed(2)}</span>
                    <small style="font-size: 0.68rem; color: var(--gray-300)">${room ? room.name.split('-')[0] : 'Sala'}</small>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  changeScheduleDate(dateIso) {
    this.state.scheduleDate = dateIso;
    this.renderSchedule();
  },

  // ==========================================================================
  // TELA 6: SELEÇÃO DE SESSÃO (RF006, RF007)
  // ==========================================================================
  startBookingMovie(movieId) {
    const movie = window.dataStore.getMovieById(movieId);
    if (!movie) return;
    this.state.selectedMovie = movie;

    // Busca sessões deste filme
    const sessions = window.dataStore.getSessions().filter(s => s.movieId == movieId);
    if (sessions.length === 1) {
      this.selectSession(sessions[0].id);
    } else {
      this.navigateTo('screen-session-select');
    }
  },

  renderSessionSelect() {
    const movie = this.state.selectedMovie;
    const container = document.getElementById('session-select-list');
    if (!movie || !container) return;

    const movieTitleEl = document.getElementById('session-select-movie-title');
    if (movieTitleEl) movieTitleEl.textContent = movie.title;

    const sessions = window.dataStore.getSessions().filter(s => s.movieId == movie.id);
    if (sessions.length === 0) {
      container.innerHTML = `<p style="color: var(--gray-400)">Não há sessões abertas no momento para este filme.</p>`;
      return;
    }

    container.innerHTML = sessions.map(s => {
      const room = window.dataStore.getRoomById(s.roomId);
      const availableCount = (room ? room.capacity : 60) - (s.occupiedSeats ? s.occupiedSeats.length : 0);
      return `
        <div style="background: var(--unifor-card-bg); border: 1px solid var(--unifor-border); border-radius: var(--radius-md); padding: 18px; margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 14px;">
          <div>
            <div style="font-size: 1.15rem; font-weight: 800; color: var(--white);">${s.time} - ${s.format}</div>
            <div style="font-size: 0.85rem; color: #93c5fd; margin-top: 2px;">${room ? room.name : 'Sala UNIFOR'}</div>
            <div style="font-size: 0.8rem; color: var(--gray-400); margin-top: 4px;">Data: ${s.date} • ${availableCount} assentos livres</div>
          </div>
          <div style="display: flex; align-items: center; gap: 16px;">
            <div style="text-align: right">
              <span style="font-size: 0.8rem; color: var(--gray-400); display: block">a partir de</span>
              <b style="font-size: 1.25rem; color: var(--white)">R$ ${(s.basePrice / 2).toFixed(2)}</b>
              <small style="color: #93c5fd; display: block">Meia UNIFOR</small>
            </div>
            <button class="btn btn-primary" onclick="CinemaApp.selectSession('${s.id}')">
              Escolher Assentos
            </button>
          </div>
        </div>
      `;
    }).join('');
  },

  selectSession(sessionId) {
    const session = window.dataStore.getSessionById(sessionId);
    if (!session) return;
    this.state.selectedSession = session;
    this.state.selectedMovie = window.dataStore.getMovieById(session.movieId);
    this.state.selectedSeats = [];
    this.state.ticketTypesSelection = {};
    this.navigateTo('screen-seat-selection');
  },

  // ==========================================================================
  // TELA 7: SELEÇÃO DE ASSENTOS COM TELA & TIMER REGRESSIVO (RF008-010, RN002-003, RNF014)
  // ==========================================================================
  renderSeatSelection() {
    const session = this.state.selectedSession;
    const movie = this.state.selectedMovie;
    if (!session || !movie) {
      this.navigateTo('screen-home');
      return;
    }

    const room = window.dataStore.getRoomById(session.roomId);
    const roomConfig = window.dataStore.getSeatsConfig(session.roomId);
    const occupied = session.occupiedSeats || [];
    const reserved = session.reservedSeats || {};
    const currentUser = window.dataStore.getCurrentUser();
    const currentUserId = currentUser ? currentUser.id : 'temp-guest';

    // Atualiza cabeçalho da sessão
    document.getElementById('seat-screen-movie').textContent = movie.title;
    document.getElementById('seat-screen-info').textContent = `${room ? room.name : 'Sala'} • ${session.date} às ${session.time} (${session.format})`;

    // Inicia o timer de 10 minutos para reserva temporária
    this.startSeatLockTimer();

    // Renderiza a grade de assentos
    const rows = room ? room.rows : 8; // A, B, C...
    const cols = room ? room.cols : 8; // 1, 2, 3...
    const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

    const gridEl = document.getElementById('cinema-seats-grid');
    if (!gridEl) return;

    let html = '';
    for (let r = 0; r < rows; r++) {
      const rowLetter = letters[r];
      html += `<div class="seat-row"><div class="seat-row-letter">${rowLetter}</div>`;
      for (let c = 1; c <= cols; c++) {
        const seatId = `${rowLetter}${c}`;
        const isOccupied = occupied.includes(seatId);
        const lock = reserved[seatId];
        const isLockedByOther = lock && lock.userId !== currentUserId && Date.now() < lock.expiresAt;
        const isSelected = this.state.selectedSeats.includes(seatId);
        const customType = roomConfig[seatId] || 'normal';

        let seatClass = 'available';
        if (isOccupied || isLockedByOther) {
          seatClass = 'occupied';
        } else if (isSelected) {
          seatClass = 'selected';
        } else if (customType === 'pcd') {
          seatClass = 'available pcd';
        } else if (customType === 'blocked') {
          seatClass = 'blocked';
        }

        html += `
          <div 
            class="seat ${seatClass}" 
            title="${seatId}${customType === 'pcd' ? ' (Assento PCD Acessível)' : ''}${isOccupied ? ' (Ocupado)' : ''}"
            onclick="CinemaApp.toggleSeat('${seatId}', '${seatClass}')"
          >
            ${seatId}
          </div>
        `;
      }
      html += `<div class="seat-row-letter">${rowLetter}</div></div>`;
    }

    gridEl.innerHTML = html;
    this.updateSeatSelectionSummary();
  },

  toggleSeat(seatId, seatClass) {
    if (seatClass.includes('occupied') || seatClass.includes('blocked')) {
      this.showToast('Este assento já está ocupado ou indisponível.', 'error');
      return;
    }

    const index = this.state.selectedSeats.indexOf(seatId);
    if (index >= 0) {
      this.state.selectedSeats.splice(index, 1);
      delete this.state.ticketTypesSelection[seatId];
    } else {
      if (this.state.selectedSeats.length >= 8) {
        this.showToast('Limite máximo de 8 ingressos por compra institucional.', 'error');
        return;
      }
      this.state.selectedSeats.push(seatId);
      // Padrão: Meia Aluno UNIFOR se for aluno, ou Meia Geral
      const user = window.dataStore.getCurrentUser();
      const defaultType = (user && user.role === 'aluno') 
        ? 'Meia Aluno UNIFOR' 
        : (user && user.role === 'professor') 
        ? 'Meia Professor / Colaborador UNIFOR' 
        : 'Inteira';
      this.state.ticketTypesSelection[seatId] = defaultType;
    }

    // Tenta aplicar a trava temporária via dataStore
    try {
      const user = window.dataStore.getCurrentUser();
      const userId = user ? user.id : 'temp-guest';
      window.dataStore.lockSeats(this.state.selectedSession.id, this.state.selectedSeats, userId);
    } catch (err) {
      this.showToast(err.message, 'error');
      // Reverte se falhou na concorrência
      this.state.selectedSeats = this.state.selectedSeats.filter(s => s !== seatId);
      this.renderSeatSelection();
      return;
    }

    this.renderSeatSelection();
  },

  updateSeatSelectionSummary() {
    const session = this.state.selectedSession;
    const countEl = document.getElementById('selected-seats-count');
    const listEl = document.getElementById('selected-seats-list');
    const totalEl = document.getElementById('selected-seats-total');
    const continueBtn = document.getElementById('btn-continue-to-summary');

    if (!session || !countEl || !listEl || !totalEl || !continueBtn) return;

    const count = this.state.selectedSeats.length;
    countEl.textContent = count;
    listEl.textContent = count > 0 ? this.state.selectedSeats.join(', ') : 'Nenhum';

    // Estimativa inicial
    const user = window.dataStore.getCurrentUser();
    const isDiscount = user && (user.role === 'aluno' || user.role === 'professor');
    const unitEst = isDiscount ? session.basePrice / 2 : session.basePrice;
    const totalEst = count * unitEst;

    totalEl.textContent = `R$ ${totalEst.toFixed(2)}`;
    continueBtn.disabled = count === 0;
  },

  // Cronômetro da Trava Temporária de 10 minutos (RN002, RN003)
  startSeatLockTimer() {
    if (this.state.seatLockTimer) clearInterval(this.state.seatLockTimer);

    const config = window.dataStore.getConfig();
    const lockMinutes = config.tempLockMinutes || 10;
    this.state.seatLockExpiresAt = Date.now() + (lockMinutes * 60 * 1000);

    const updateTimerDisplay = () => {
      const remainingMs = this.state.seatLockExpiresAt - Date.now();
      const timerEl = document.getElementById('seat-countdown-timer');

      if (remainingMs <= 0) {
        clearInterval(this.state.seatLockTimer);
        if (timerEl) timerEl.textContent = '00:00';
        this.showToast('Tempo de reserva esgotado! Os assentos foram liberados para outros usuários.', 'error');
        // Libera trava
        const user = window.dataStore.getCurrentUser();
        window.dataStore.releaseLocks(this.state.selectedSession.id, user ? user.id : 'temp-guest');
        this.state.selectedSeats = [];
        this.renderSeatSelection();
        return;
      }

      const totalSec = Math.floor(remainingMs / 1000);
      const mins = Math.floor(totalSec / 60).toString().padStart(2, '0');
      const secs = (totalSec % 60).toString().padStart(2, '0');
      if (timerEl) timerEl.textContent = `${mins}:${secs}`;
    };

    updateTimerDisplay();
    this.state.seatLockTimer = setInterval(updateTimerDisplay, 1000);
  },

  // ==========================================================================
  // TELA 8: RESUMO DA COMPRA & TIPO DE INGRESSO (RF011, RF012, RF017)
  // ==========================================================================
  proceedToCheckoutSummary() {
    if (this.state.selectedSeats.length === 0) {
      this.showToast('Por favor, selecione pelo menos um assento para continuar.', 'error');
      return;
    }
    this.navigateTo('screen-checkout-summary');
  },

  renderCheckoutSummary() {
    const session = this.state.selectedSession;
    const movie = this.state.selectedMovie;
    const seats = this.state.selectedSeats;
    const user = window.dataStore.getCurrentUser();
    if (!session || !movie || seats.length === 0) {
      this.navigateTo('screen-home');
      return;
    }

    // Informações da sessão
    document.getElementById('summary-movie-title').textContent = movie.title;
    document.getElementById('summary-session-info').textContent = `${session.date} às ${session.time} (${session.format})`;
    const room = window.dataStore.getRoomById(session.roomId);
    document.getElementById('summary-room-name').textContent = room ? room.name : 'Sala UNIFOR';

    // Lista de assentos com seletor de tipo de ingresso
    const itemsContainer = document.getElementById('summary-ticket-items');
    if (!itemsContainer) return;

    itemsContainer.innerHTML = seats.map(seatId => {
      const currentType = this.state.ticketTypesSelection[seatId] || 'Inteira';
      return `
        <div style="background: #031442; border: 1px solid var(--unifor-border); border-radius: var(--radius-md); padding: 14px; margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px">
          <div>
            <b style="font-size: 1.1rem; color: var(--white); display: flex; align-items: center; gap: 6px">
              <span style="background: var(--unifor-blue); padding: 2px 8px; border-radius: 4px; font-size: 0.85rem">Assento ${seatId}</span>
            </b>
            <small style="color: var(--gray-400); display: block; margin-top: 4px">Selecione a tarifa ou benefício correspondente:</small>
          </div>
          <div style="display: flex; align-items: center; gap: 12px">
            <select class="form-control" style="width: auto; font-size: 0.88rem" onchange="CinemaApp.changeTicketType('${seatId}', this.value)">
              <option value="Inteira" ${currentType === 'Inteira' ? 'selected' : ''}>Inteira - R$ ${session.basePrice.toFixed(2)}</option>
              <option value="Meia Aluno UNIFOR" ${currentType === 'Meia Aluno UNIFOR' ? 'selected' : ''}>Meia Aluno UNIFOR (50%) - R$ ${(session.basePrice * 0.5).toFixed(2)}</option>
              <option value="Meia Professor / Colaborador UNIFOR" ${currentType === 'Meia Professor / Colaborador UNIFOR' ? 'selected' : ''}>Meia Docente/Colab UNIFOR (50%) - R$ ${(session.basePrice * 0.5).toFixed(2)}</option>
              <option value="Meia Estudante Geral" ${currentType === 'Meia Estudante Geral' ? 'selected' : ''}>Meia Estudante Federal (50%) - R$ ${(session.basePrice * 0.5).toFixed(2)}</option>
              <option value="Cortesia Cultural UNIFOR" ${currentType === 'Cortesia Cultural UNIFOR' ? 'selected' : ''}>Cortesia Institucional - R$ 0,00</option>
            </select>
          </div>
        </div>
      `;
    }).join('');

    // Dados do Usuário / Vínculo
    const userInfoBox = document.getElementById('summary-user-box');
    if (userInfoBox) {
      if (user) {
        userInfoBox.innerHTML = `
          <div style="background: rgba(4, 76, 244, 0.12); border: 1px solid var(--unifor-blue); padding: 14px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: space-between;">
            <div>
              <div style="font-size: 0.82rem; color: #93c5fd; font-weight: 700">COMPRADOR IDENTIFICADO:</div>
              <b style="color: var(--white); font-size: 1rem">${user.name}</b> (${user.email})
              <div style="font-size: 0.82rem; color: var(--gray-300); margin-top: 2px">
                ${user.role === 'aluno' ? `Matrícula UNIFOR: <b>${user.institutionalId}</b> (${user.academicStatus})` : `Perfil: <b>${user.role.toUpperCase()}</b>`}
              </div>
            </div>
            <span class="btn btn-sm btn-secondary" onclick="CinemaApp.navigateTo('screen-login')">Trocar</span>
          </div>
        `;
      } else {
        userInfoBox.innerHTML = `
          <div style="background: rgba(245, 158, 11, 0.15); border: 1px solid var(--warning); padding: 14px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: space-between;">
            <div>
              <b style="color: #fde68a">Você está comprando como Convidado</b>
              <p style="font-size: 0.82rem; color: var(--gray-200)">Faça login para utilizar seu desconto de aluno UNIFOR automaticamente.</p>
            </div>
            <span class="btn btn-sm btn-primary" onclick="CinemaApp.navigateTo('screen-login')">Fazer Login</span>
          </div>
        `;
      }
    }

    this.calculateCheckoutTotals();
  },

  changeTicketType(seatId, newType) {
    this.state.ticketTypesSelection[seatId] = newType;
    this.calculateCheckoutTotals();
  },

  applyCoupon() {
    const input = document.getElementById('coupon-code-input');
    if (!input) return;
    const code = input.value.trim().toUpperCase();
    if (!code) return;

    const coupon = window.dataStore.validateCoupon(code);
    if (!coupon) {
      this.showToast('Cupom inválido ou expirado.', 'error');
      return;
    }

    this.state.appliedCoupon = coupon;
    this.showToast(`Cupom "${coupon.code}" aplicado com sucesso! Desconto de ${coupon.discountPercent}%.`, 'success');
    this.calculateCheckoutTotals();
  },

  calculateCheckoutTotals() {
    const session = this.state.selectedSession;
    if (!session) return;

    let subtotal = 0;
    const seats = this.state.selectedSeats;

    for (const seatId of seats) {
      const type = this.state.ticketTypesSelection[seatId] || 'Inteira';
      let price = session.basePrice;
      if (type.includes('Meia') || type.includes('50%')) {
        price = session.basePrice * 0.5;
      } else if (type.includes('Cortesia')) {
        price = 0;
      }
      subtotal += price;
    }

    let couponDiscount = 0;
    if (this.state.appliedCoupon) {
      couponDiscount = subtotal * (this.state.appliedCoupon.discountPercent / 100);
    }

    const total = Math.max(0, subtotal - couponDiscount);

    document.getElementById('summary-subtotal').textContent = `R$ ${subtotal.toFixed(2)}`;
    document.getElementById('summary-discount').textContent = couponDiscount > 0 ? `- R$ ${couponDiscount.toFixed(2)}` : 'R$ 0,00';
    document.getElementById('summary-total').textContent = `R$ ${total.toFixed(2)}`;

    this.state.currentCheckoutTotal = {
      subtotal,
      discount: couponDiscount,
      total
    };
  },

  // ==========================================================================
  // TELA 9: LOGIN (RF014) & TELA 10: CADASTRO (RF013) & TELA 11: RECUPERAÇÃO (RF015)
  // ==========================================================================
  renderLogin() {
    // Tela estática já montada no HTML
  },

  handleLoginSubmit(e) {
    if (e) e.preventDefault();
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-password').value;

    try {
      const user = window.dataStore.login(email, pass);
      this.showToast(`Bem-vindo(a), ${user.name}!`, 'success');
      this.updateUserHeader();

      // Se tinha assento selecionado, volta ao fluxo de compra
      if (this.state.selectedSeats.length > 0) {
        this.navigateTo('screen-checkout-summary');
      } else if (user.role === 'admin') {
        this.navigateTo('screen-admin-dashboard');
      } else {
        this.navigateTo('screen-home');
      }
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  },

  quickLogin(role) {
    const users = window.dataStore.getUsers();
    const user = users.find(u => u.role === role);
    if (user) {
      document.getElementById('login-email').value = user.email;
      document.getElementById('login-password').value = user.password;
      this.handleLoginSubmit();
    }
  },

  renderRegister() {
    // Formulário com aceite LGPD
  },

  handleRegisterSubmit(e) {
    if (e) e.preventDefault();
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const cpf = document.getElementById('reg-cpf').value;
    const birthDate = document.getElementById('reg-birth').value;
    const phone = document.getElementById('reg-phone').value;
    const password = document.getElementById('reg-password').value;
    const role = document.getElementById('reg-role').value;
    const institutionalId = document.getElementById('reg-matricula').value;
    const lgpd = document.getElementById('reg-lgpd').checked;

    if (!lgpd) {
      this.showToast('Você deve concordar com os Termos de Uso e Política de Privacidade (LGPD).', 'error');
      return;
    }

    try {
      const newUser = window.dataStore.registerUser({
        name,
        email,
        cpf,
        birthDate,
        phone,
        password,
        role,
        institutionalId,
        academicStatus: role === 'aluno' ? 'Aluno Regular Matriculado' : 'Comunidade UNIFOR'
      });

      this.showToast('Cadastro realizado com sucesso! Vínculo UNIFOR registrado.', 'success');
      this.updateUserHeader();

      if (this.state.selectedSeats.length > 0) {
        this.navigateTo('screen-checkout-summary');
      } else {
        this.navigateTo('screen-home');
      }
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  },

  renderForgotPassword() {
    // Redefinição
  },

  handleForgotPasswordSubmit(e) {
    if (e) e.preventDefault();
    const email = document.getElementById('forgot-email').value;
    this.showToast(`Instruções de redefinição de senha enviadas para o e-mail: ${email}. Verifique sua caixa de entrada.`, 'success');
    this.navigateTo('screen-login');
  },

  // ==========================================================================
  // TELA 12: PAGAMENTO PIX & CARTÃO (RF018)
  // ==========================================================================
  proceedToPayment() {
    const user = window.dataStore.getCurrentUser();
    if (!user) {
      this.showToast('Por favor, efetue login ou crie sua conta para concluir a compra.', 'warning');
      this.navigateTo('screen-login');
      return;
    }
    this.navigateTo('screen-payment');
  },

  renderPayment() {
    const totals = this.state.currentCheckoutTotal || { total: 32.00 };
    document.getElementById('payment-amount-display').textContent = `R$ ${totals.total.toFixed(2)}`;

    // Gera código PIX copia e cola fictício mas estruturado
    const pixCode = `00020126580014BR.GOV.BCB.PIX0136cinema-unifor-${Math.floor(Date.now() / 1000)}520400005303986540${totals.total.toFixed(2).replace('.', '')}5802BR5915CINEMA UNIFOR6009FORTALEZA62070503***6304`;
    const pixInput = document.getElementById('pix-code-str');
    if (pixInput) pixInput.value = pixCode;
  },

  switchPaymentTab(tabName) {
    document.querySelectorAll('.pay-tab').forEach(t => t.classList.remove('active'));
    document.getElementById(`tab-btn-${tabName}`).classList.add('active');

    document.getElementById('pay-section-pix').style.display = tabName === 'pix' ? 'block' : 'none';
    document.getElementById('pay-section-credit').style.display = tabName === 'credit' ? 'block' : 'none';
    document.getElementById('pay-section-debit').style.display = tabName === 'debit' ? 'block' : 'none';
  },

  copyPixCode() {
    const pixInput = document.getElementById('pix-code-str');
    if (pixInput) {
      navigator.clipboard.writeText(pixInput.value);
      this.showToast('Código PIX Copia e Cola copiado para a área de transferência!', 'success');
    }
  },

  // Processa o pagamento e conclui a compra (RF019, RF020)
  processPayment(method = 'PIX') {
    const user = window.dataStore.getCurrentUser();
    const session = this.state.selectedSession;
    const movie = this.state.selectedMovie;
    const seats = this.state.selectedSeats;
    const totals = this.state.currentCheckoutTotal;
    const room = window.dataStore.getRoomById(session.roomId);

    if (!user || !session || !movie || seats.length === 0) {
      this.showToast('Erro ao processar compra. Tente novamente.', 'error');
      this.navigateTo('screen-home');
      return;
    }

    try {
      const items = seats.map(seatId => {
        const ticketType = this.state.ticketTypesSelection[seatId] || 'Inteira';
        let price = session.basePrice;
        if (ticketType.includes('Meia') || ticketType.includes('50%')) price = session.basePrice * 0.5;
        if (ticketType.includes('Cortesia')) price = 0;
        return {
          seatId,
          ticketType,
          price
        };
      });

      const newOrder = window.dataStore.createOrder({
        userId: user.id,
        customerName: user.name,
        customerEmail: user.email,
        customerCpf: user.cpf,
        customerRole: user.role,
        institutionalId: user.institutionalId,
        sessionId: session.id,
        movieTitle: movie.title,
        roomName: room ? room.name : 'Sala UNIFOR',
        items,
        subtotal: totals.subtotal,
        discount: totals.discount,
        couponCode: this.state.appliedCoupon ? this.state.appliedCoupon.code : null,
        totalAmount: totals.total,
        paymentMethod: method
      });

      // Limpa timer
      if (this.state.seatLockTimer) clearInterval(this.state.seatLockTimer);

      this.state.tempOrderId = newOrder.id;
      this.showToast('Pagamento Aprovado com Sucesso! Ingressos Digitais Gerados.', 'success');
      this.navigateTo('screen-confirmation');
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  },

  // ==========================================================================
  // TELA 13: CONFIRMAÇÃO DA COMPRA (RF019, RF020, RF022)
  // ==========================================================================
  renderConfirmation() {
    const orderId = this.state.tempOrderId;
    const order = orderId ? window.dataStore.getOrderById(orderId) : window.dataStore.getOrders()[0];
    if (!order) {
      this.navigateTo('screen-home');
      return;
    }

    document.getElementById('confirm-order-id').textContent = order.id;
    document.getElementById('confirm-movie-title').textContent = order.movieTitle;
    document.getElementById('confirm-session-info').textContent = `${order.sessionDate} às ${order.sessionTime} - ${order.roomName}`;
    document.getElementById('confirm-seats-list').textContent = order.seats.join(', ');
    document.getElementById('confirm-total-amount').textContent = `R$ ${order.totalAmount.toFixed(2)}`;
    document.getElementById('confirm-user-email').textContent = order.customerEmail;
  },

  // ==========================================================================
  // TELA 14: MEUS INGRESSOS COM QR CODE (RF020, RF024)
  // ==========================================================================
  renderMyTickets() {
    const user = window.dataStore.getCurrentUser();
    const container = document.getElementById('my-tickets-list');
    if (!container) return;

    if (!user) {
      container.innerHTML = `
        <div style="text-align: center; padding: 40px;">
          <p style="color: var(--gray-400); margin-bottom: 16px">Você precisa estar logado para acessar seus ingressos digitais.</p>
          <button class="btn btn-primary" onclick="CinemaApp.navigateTo('screen-login')">Entrar na Conta UNIFOR</button>
        </div>
      `;
      return;
    }

    const orders = window.dataStore.getUserOrders(user.id);
    const allTickets = [];
    orders.forEach(o => {
      (o.tickets || []).forEach(t => allTickets.push({ ...t, order: o }));
    });

    if (allTickets.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 40px; color: var(--gray-400)">
          <p>Você ainda não possui ingressos emitidos.</p>
          <button class="btn btn-primary" style="margin-top: 14px" onclick="CinemaApp.navigateTo('screen-catalog')">Explorar Filmes em Cartaz</button>
        </div>
      `;
      return;
    }

    container.innerHTML = allTickets.map(ticket => {
      const qrSvg = this.generateQrSvg(ticket.ticketCode);
      return `
        <div class="ticket-card">
          <div class="ticket-main">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <span class="hero-tag" style="background-color: var(--unifor-blue)">Cinema UNIFOR</span>
                <span class="ticket-status-stamp ${ticket.status}">
                  ${ticket.status === 'ativo' ? '● Ingresso Válido' : ticket.status === 'utilizado' ? '✓ Utilizado na Portaria' : '✕ Cancelado'}
                </span>
              </div>
              <h2 style="font-size: 1.5rem; font-weight: 900; margin: 10px 0 4px">${ticket.movieTitle}</h2>
              <p style="color: #93c5fd; font-size: 0.9rem">${ticket.roomName} • ${ticket.sessionFormat}</p>
            </div>

            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 20px 0; background: rgba(0,0,0,0.25); padding: 12px; border-radius: var(--radius-md);">
              <div>
                <small style="color: var(--gray-400); display: block">Data</small>
                <b>${ticket.sessionDate}</b>
              </div>
              <div>
                <small style="color: var(--gray-400); display: block">Horário</small>
                <b>${ticket.sessionTime}</b>
              </div>
              <div>
                <small style="color: var(--gray-400); display: block">Assento</small>
                <b style="font-size: 1.2rem; color: #60a5fa">${ticket.seatId}</b>
              </div>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: flex-end; font-size: 0.85rem; color: var(--gray-300);">
              <div>
                <span>Titular: <b>${ticket.customerName}</b></span><br>
                <span>Categoria: <b>${ticket.ticketType}</b> (R$ ${ticket.price.toFixed(2)})</span>
              </div>
              <button class="btn btn-sm btn-secondary" onclick="window.print()">
                🖨 Imprimir / Salvar PDF
              </button>
            </div>
          </div>

          <div class="ticket-divider"></div>

          <div class="ticket-stub">
            <div class="ticket-qrcode-wrap">
              ${qrSvg}
            </div>
            <div class="ticket-code-str">${ticket.ticketCode}</div>
            <small style="color: var(--gray-400); font-size: 0.68rem; margin-top: 4px">Apresente este QR Code na portaria da sala</small>
          </div>
        </div>
      `;
    }).join('');
  },

  // Gerador dinâmico de SVG simulando QR Code nítido
  generateQrSvg(text) {
    return `
      <svg width="120" height="120" viewBox="0 0 100 100" fill="#000000" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="100" fill="#ffffff" />
        <!-- Cantos do QR Code -->
        <rect x="10" y="10" width="26" height="26" fill="#000000" />
        <rect x="14" y="14" width="18" height="18" fill="#ffffff" />
        <rect x="18" y="18" width="10" height="10" fill="#000000" />

        <rect x="64" y="10" width="26" height="26" fill="#000000" />
        <rect x="68" y="14" width="18" height="18" fill="#ffffff" />
        <rect x="72" y="18" width="10" height="10" fill="#000000" />

        <rect x="10" y="64" width="26" height="26" fill="#000000" />
        <rect x="14" y="68" width="18" height="18" fill="#ffffff" />
        <rect x="18" y="72" width="10" height="10" fill="#000000" />

        <!-- Padrão dinâmico -->
        <rect x="42" y="14" width="6" height="6" fill="#000000" />
        <rect x="52" y="24" width="6" height="6" fill="#000000" />
        <rect x="42" y="44" width="16" height="16" fill="#044cf4" />
        <rect x="20" y="44" width="8" height="8" fill="#000000" />
        <rect x="72" y="44" width="8" height="8" fill="#000000" />
        <rect x="44" y="70" width="8" height="8" fill="#000000" />
        <rect x="62" y="68" width="12" height="6" fill="#000000" />
        <rect x="78" y="78" width="10" height="10" fill="#000000" />
      </svg>
    `;
  },

  // ==========================================================================
  // TELA 15: HISTÓRICO DE PEDIDOS & CANCELAMENTO (RF023, RF025, RN009)
  // ==========================================================================
  renderOrderHistory() {
    const user = window.dataStore.getCurrentUser();
    const tableBody = document.getElementById('order-history-tbody');
    if (!tableBody) return;

    if (!user) {
      tableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 20px;">Faça login para visualizar suas compras.</td></tr>`;
      return;
    }

    const orders = window.dataStore.getUserOrders(user.id);
    if (orders.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 20px; color: var(--gray-400)">Nenhum pedido realizado até o momento.</td></tr>`;
      return;
    }

    tableBody.innerHTML = orders.map(order => `
      <tr>
        <td><b>${order.id}</b></td>
        <td>${order.movieTitle}</td>
        <td>${order.sessionDate} às ${order.sessionTime}</td>
        <td>${order.seats.join(', ')}</td>
        <td>R$ ${order.totalAmount.toFixed(2)} (${order.paymentMethod})</td>
        <td>
          <span class="ticket-status-stamp ${order.orderStatus === 'Concluído' ? 'ativo' : 'cancelado'}">
            ${order.orderStatus}
          </span>
        </td>
        <td>
          ${order.orderStatus === 'Concluído' 
            ? `<button class="btn btn-sm btn-danger" onclick="CinemaApp.requestCancelOrder('${order.id}')">Cancelar</button>`
            : `<span style="font-size: 0.75rem; color: var(--gray-400)">-</span>`
          }
        </td>
      </tr>
    `).join('');
  },

  requestCancelOrder(orderId) {
    if (confirm(`Deseja realmente cancelar o pedido ${orderId}? Os assentos serão liberados imediatamente e o valor estornado conforme a política do Cinema UNIFOR.`)) {
      try {
        window.dataStore.cancelOrder(orderId, 'Cancelado pelo cliente na área Minha Conta');
        this.showToast('Pedido cancelado com sucesso. Assentos liberados e estorno confirmado.', 'success');
        this.renderOrderHistory();
      } catch (err) {
        this.showToast(err.message, 'error');
      }
    }
  },

  // ==========================================================================
  // TELA 16: PERFIL DO USUÁRIO & VÍNCULO INSTITUCIONAL UNIFOR (RF013, RF016)
  // ==========================================================================
  renderProfile() {
    const user = window.dataStore.getCurrentUser();
    const container = document.getElementById('profile-content-container');
    if (!container) return;

    if (!user) {
      container.innerHTML = `
        <div style="text-align: center; padding: 40px">
          <p style="color: var(--gray-400); margin-bottom: 14px">Nenhum usuário conectado.</p>
          <button class="btn btn-primary" onclick="CinemaApp.navigateTo('screen-login')">Entrar</button>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div style="display: grid; grid-template-columns: 280px 1fr; gap: 30px;">
        <div style="background: var(--unifor-card-bg); border: 1px solid var(--unifor-border); border-radius: var(--radius-lg); padding: 24px; text-align: center;">
          <div class="user-avatar" style="width: 80px; height: 80px; font-size: 2rem; margin: 0 auto 16px;">
            ${user.name.charAt(0)}
          </div>
          <h3 style="font-size: 1.2rem; font-weight: 800">${user.name}</h3>
          <p style="color: var(--gray-400); font-size: 0.85rem">${user.email}</p>
          
          <div style="margin-top: 18px; padding-top: 18px; border-top: 1px solid rgba(255,255,255,0.1); text-align: left;">
            <div style="font-size: 0.75rem; color: #93c5fd; text-transform: uppercase; font-weight: 700">Vínculo Acadêmico</div>
            <div style="font-size: 0.95rem; font-weight: 700; color: var(--white); margin: 2px 0">${user.role === 'aluno' ? 'Aluno UNIFOR' : user.role === 'professor' ? 'Docente UNIFOR' : 'Membro UNIFOR'}</div>
            <div style="font-size: 0.82rem; color: var(--gray-300)">Matrícula: <b>${user.institutionalId || 'Não vinculado'}</b></div>
            <div style="font-size: 0.78rem; color: #34d399; margin-top: 4px">✓ ${user.academicStatus || 'Ativo'}</div>
          </div>

          <button class="btn btn-secondary btn-sm" style="width: 100%; margin-top: 24px" onclick="CinemaApp.handleLogout()">
            Encerrar Sessão
          </button>
        </div>

        <div style="background: var(--unifor-card-bg); border: 1px solid var(--unifor-border); border-radius: var(--radius-lg); padding: 24px;">
          <h3 style="font-size: 1.2rem; font-weight: 800; margin-bottom: 18px">Dados Cadastrais</h3>
          <form onsubmit="CinemaApp.saveProfile(event)">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px">
              <div class="form-group">
                <label class="form-label">Nome Completo</label>
                <input class="form-control" type="text" id="prof-name" value="${user.name}" required />
              </div>
              <div class="form-group">
                <label class="form-label">E-mail Institucional</label>
                <input class="form-control" type="email" id="prof-email" value="${user.email}" readonly style="opacity: 0.7" />
              </div>
              <div class="form-group">
                <label class="form-label">CPF</label>
                <input class="form-control" type="text" id="prof-cpf" value="${user.cpf || ''}" readonly style="opacity: 0.7" />
              </div>
              <div class="form-group">
                <label class="form-label">Telefone / WhatsApp</label>
                <input class="form-control" type="text" id="prof-phone" value="${user.phone || ''}" />
              </div>
              <div class="form-group">
                <label class="form-label">Curso / Centro</label>
                <input class="form-control" type="text" id="prof-course" value="${user.course || 'Universidade de Fortaleza'}" />
              </div>
              <div class="form-group">
                <label class="form-label">Campus</label>
                <input class="form-control" type="text" value="${user.campus || 'Campus Edson Queiroz'}" readonly style="opacity: 0.7" />
              </div>
            </div>
            <button type="submit" class="btn btn-primary" style="margin-top: 10px">Salvar Alterações</button>
          </form>
        </div>
      </div>
    `;
  },

  saveProfile(e) {
    if (e) e.preventDefault();
    const user = window.dataStore.getCurrentUser();
    if (!user) return;

    user.name = document.getElementById('prof-name').value;
    user.phone = document.getElementById('prof-phone').value;
    user.course = document.getElementById('prof-course').value;

    const users = window.dataStore.getUsers();
    const idx = users.findIndex(u => u.id === user.id);
    if (idx >= 0) users[idx] = user;

    localStorage.setItem('unifor_cinema_users', JSON.stringify(users));
    window.dataStore.setCurrentUser(user);
    this.showToast('Dados do perfil atualizados com sucesso!', 'success');
    this.updateUserHeader();
    this.renderProfile();
  },

  handleLogout() {
    window.dataStore.logout();
    this.updateUserHeader();
    this.showToast('Sessão encerrada com sucesso.', 'info');
    this.navigateTo('screen-home');
  },

  // ==========================================================================
  // TELA 17: CONTATO & TELA 18: FAQ
  // ==========================================================================
  renderContact() {
    // Form de contato
  },

  handleContactSubmit(e) {
    if (e) e.preventDefault();
    this.showToast('Mensagem enviada com sucesso ao setor de atendimento do Cinema UNIFOR! Responderemos em até 24 horas.', 'success');
    document.getElementById('contact-form').reset();
  },

  renderFaq() {
    // Accordion
  },

  toggleFaq(index) {
    const el = document.getElementById(`faq-ans-${index}`);
    if (el) {
      el.style.display = el.style.display === 'block' ? 'none' : 'block';
    }
  },

  // ==========================================================================
  // TELAS ADMINISTRATIVAS (21 A 36)
  // ==========================================================================
  renderAdminLogin() {
    // Login admin
  },

  handleAdminLoginSubmit(e) {
    if (e) e.preventDefault();
    const email = document.getElementById('admin-login-email').value;
    const pass = document.getElementById('admin-login-pass').value;

    try {
      const user = window.dataStore.login(email, pass);
      if (user.role !== 'admin' && user.role !== 'fiscal') {
        throw new Error('Acesso restrito apenas a administradores e fiscais do cinema.');
      }
      this.showToast(`Acesso Administrativo Autorizado: ${user.name}`, 'success');
      this.updateUserHeader();
      this.navigateTo('screen-admin-dashboard');
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  },

  // TELA 22: DASHBOARD ADMINISTRATIVO (RF037)
  renderAdminDashboard() {
    const orders = window.dataStore.getOrders();
    const sessions = window.dataStore.getSessions();
    const movies = window.dataStore.getMovies().filter(m => m.status === 'cartaz');

    let totalRevenue = 0;
    let totalTickets = 0;
    for (const o of orders) {
      if (o.orderStatus === 'Concluído') {
        totalRevenue += o.totalAmount;
        totalTickets += (o.tickets || []).length;
      }
    }

    document.getElementById('dash-stat-revenue').textContent = `R$ ${totalRevenue.toFixed(2)}`;
    document.getElementById('dash-stat-tickets').textContent = totalTickets;
    document.getElementById('dash-stat-sessions').textContent = sessions.length;
    document.getElementById('dash-stat-movies').textContent = movies.length;

    // Tabela de ocupação por sessão
    const tbody = document.getElementById('dash-sessions-tbody');
    if (tbody) {
      tbody.innerHTML = sessions.slice(0, 5).map(s => {
        const movie = window.dataStore.getMovieById(s.movieId);
        const room = window.dataStore.getRoomById(s.roomId);
        const cap = room ? room.capacity : 60;
        const sold = (s.occupiedSeats || []).length;
        const occPercent = ((sold / cap) * 100).toFixed(0);

        return `
          <tr>
            <td><b>${movie ? movie.title : 'Filme'}</b></td>
            <td>${room ? room.name.split('-')[0] : 'Sala'}</td>
            <td>${s.date} às ${s.time}</td>
            <td>${sold} / ${cap} assentos</td>
            <td>
              <div style="display: flex; align-items: center; gap: 8px">
                <div style="flex: 1; height: 8px; background: #031442; border-radius: 4px; overflow: hidden">
                  <div style="width: ${occPercent}%; height: 100%; background: var(--unifor-blue)"></div>
                </div>
                <b>${occPercent}%</b>
              </div>
            </td>
          </tr>
        `;
      }).join('');
    }
  },

  // TELA 23: GESTÃO DE FILMES (RF026, RF027) + IMPORTADOR TMDB
  renderAdminMovies() {
    const movies = window.dataStore.getMovies();
    const tbody = document.getElementById('admin-movies-tbody');
    if (!tbody) return;

    tbody.innerHTML = movies.map(m => `
      <tr>
        <td>
          <img src="${m.posterPath}" alt="${m.title}" style="width: 36px; height: 50px; object-fit: cover; border-radius: 4px" />
        </td>
        <td><b>${m.title}</b><br><small style="color: var(--gray-400)">ID TMDb: ${m.tmdbId}</small></td>
        <td>${m.genres.slice(0, 2).join(', ')}</td>
        <td>${m.runtime} min</td>
        <td>
          <span class="ticket-status-stamp ${m.status === 'cartaz' ? 'ativo' : 'utilizado'}">
            ${m.status === 'cartaz' ? 'Em Cartaz' : m.status === 'breve' ? 'Em Breve' : 'Inativo'}
          </span>
        </td>
        <td>
          <button class="btn btn-sm btn-secondary" onclick="CinemaApp.editMovie(${m.id})">Editar</button>
          <button class="btn btn-sm btn-danger" onclick="CinemaApp.deleteMovie(${m.id})">Excluir</button>
        </td>
      </tr>
    `).join('');
  },

  openTmdbSearchModal() {
    const modal = document.getElementById('tmdb-import-modal');
    if (modal) modal.style.display = 'flex';
  },

  closeTmdbSearchModal() {
    const modal = document.getElementById('tmdb-import-modal');
    if (modal) modal.style.display = 'none';
  },

  async searchTmdbOnline() {
    const query = document.getElementById('tmdb-search-input').value;
    const resultsContainer = document.getElementById('tmdb-search-results');
    if (!query || !resultsContainer) return;

    resultsContainer.innerHTML = `<div style="text-align: center; padding: 20px;">Buscando no The Movie Database...</div>`;
    const results = await window.tmdbService.searchMoviesOnline(query);

    if (results.length === 0) {
      resultsContainer.innerHTML = `<div style="text-align: center; padding: 20px; color: var(--gray-400)">Nenhum resultado retornado pelo TMDb para "${query}".</div>`;
      return;
    }

    resultsContainer.innerHTML = results.slice(0, 6).map(movie => `
      <div style="background: #031442; border: 1px solid var(--unifor-border); border-radius: var(--radius-md); padding: 12px; margin-bottom: 10px; display: flex; gap: 14px; align-items: center">
        <img src="${movie.posterPath}" alt="${movie.title}" style="width: 50px; height: 75px; object-fit: cover; border-radius: 4px" />
        <div style="flex: 1">
          <b>${movie.title}</b> (${movie.releaseDate ? movie.releaseDate.split('-')[0] : 'N/A'})
          <p style="font-size: 0.8rem; color: var(--gray-400); margin: 4px 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden">${movie.overview}</p>
          <small style="color: #93c5fd">Nota TMDb: ★ ${movie.voteAverage}</small>
        </div>
        <button class="btn btn-sm btn-primary" onclick="CinemaApp.importTmdbMovieToCatalog(${movie.tmdbId})">
          + Importar ao Cinema UNIFOR
        </button>
      </div>
    `).join('');
  },

  async importTmdbMovieToCatalog(tmdbId) {
    this.showToast('Importando dados detalhados e trailers do TMDb...', 'info');
    const detailed = await window.tmdbService.getMovieDetailsOnline(tmdbId);
    if (!detailed) {
      this.showToast('Não foi possível obter os dados deste filme do TMDb.', 'error');
      return;
    }

    detailed.status = 'cartaz';
    window.dataStore.saveMovie(detailed);
    this.showToast(`Filme "${detailed.title}" importado com sucesso! Já está disponível na grade de sessões.`, 'success');
    this.closeTmdbSearchModal();
    this.renderAdminMovies();
  },

  deleteMovie(id) {
    if (confirm('Tem certeza que deseja remover este filme do catálogo?')) {
      window.dataStore.deleteMovie(id);
      this.showToast('Filme excluído.', 'info');
      this.renderAdminMovies();
    }
  },

  // TELA 24: GESTÃO DE SESSÕES COM ALGORITMO ANTI-CONFLITO (RF030, RF031, RN008)
  renderAdminSessions() {
    const sessions = window.dataStore.getSessions();
    const tbody = document.getElementById('admin-sessions-tbody');
    if (!tbody) return;

    tbody.innerHTML = sessions.map(s => {
      const movie = window.dataStore.getMovieById(s.movieId);
      const room = window.dataStore.getRoomById(s.roomId);
      return `
        <tr>
          <td><b>${movie ? movie.title : 'Filme'}</b></td>
          <td>${room ? room.name : 'Sala'}</td>
          <td>${s.date}</td>
          <td>${s.time}</td>
          <td>${s.format}</td>
          <td>R$ ${s.basePrice.toFixed(2)}</td>
          <td>${(s.occupiedSeats || []).length} vendidos</td>
          <td>
            <button class="btn btn-sm btn-danger" onclick="CinemaApp.deleteSession('${s.id}')">Excluir</button>
          </td>
        </tr>
      `;
    }).join('');

    // Preenche selects do modal de nova sessão
    const movieSelect = document.getElementById('session-new-movie');
    const roomSelect = document.getElementById('session-new-room');
    if (movieSelect) {
      const movies = window.dataStore.getMovies();
      movieSelect.innerHTML = movies.map(m => `<option value="${m.id}">${m.title} (${m.runtime} min)</option>`).join('');
    }
    if (roomSelect) {
      const rooms = window.dataStore.getRooms();
      roomSelect.innerHTML = rooms.map(r => `<option value="${r.id}">${r.name}</option>`).join('');
    }
  },

  openNewSessionModal() {
    const modal = document.getElementById('session-new-modal');
    if (modal) {
      modal.style.display = 'flex';
      document.getElementById('session-conflict-alert-box').style.display = 'none';
      document.getElementById('session-new-date').value = window.dataStore.getDateOffset(0);
    }
  },

  closeNewSessionModal() {
    const modal = document.getElementById('session-new-modal');
    if (modal) modal.style.display = 'none';
  },

  // Validação dinâmica anti-conflito ao alterar campos da sessão
  checkConflictDynamic() {
    const movieId = document.getElementById('session-new-movie').value;
    const roomId = document.getElementById('session-new-room').value;
    const date = document.getElementById('session-new-date').value;
    const time = document.getElementById('session-new-time').value;
    const alertBox = document.getElementById('session-conflict-alert-box');

    if (!movieId || !roomId || !date || !time) return;

    const movie = window.dataStore.getMovieById(movieId);
    const duration = movie ? (movie.runtime || 120) : 120;

    const check = window.dataStore.checkSessionConflict(roomId, date, time, duration);
    if (check.conflict) {
      alertBox.style.display = 'flex';
      alertBox.innerHTML = `
        <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
        <div>
          <b>ALERTA DE CONFLITO DE HORÁRIOS (RF031 / RN008)</b><br>
          Esta sala já está reservada para o filme <b>"${check.movieTitle}"</b> no horário <b>${check.timeSlot}</b>.<br>
          <small>O sistema impede a sobreposição de horários e garante o intervalo de higienização de 20 minutos.</small>
        </div>
      `;
    } else {
      alertBox.style.display = 'none';
    }
  },

  saveNewSession(e) {
    if (e) e.preventDefault();
    const movieId = document.getElementById('session-new-movie').value;
    const roomId = document.getElementById('session-new-room').value;
    const date = document.getElementById('session-new-date').value;
    const time = document.getElementById('session-new-time').value;
    const format = document.getElementById('session-new-format').value;
    const basePrice = parseFloat(document.getElementById('session-new-price').value);

    try {
      window.dataStore.saveSession({
        movieId: Number(movieId),
        roomId,
        date,
        time,
        format,
        basePrice
      });
      this.showToast('Sessão cadastrada com sucesso!', 'success');
      this.closeNewSessionModal();
      this.renderAdminSessions();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  },

  deleteSession(id) {
    if (confirm('Tem certeza que deseja cancelar esta sessão?')) {
      window.dataStore.deleteSession(id);
      this.showToast('Sessão cancelada.', 'info');
      this.renderAdminSessions();
    }
  },

  // TELA 25: GESTÃO DE SALAS (RF028)
  renderAdminRooms() {
    const rooms = window.dataStore.getRooms();
    const tbody = document.getElementById('admin-rooms-tbody');
    if (!tbody) return;

    tbody.innerHTML = rooms.map(r => `
      <tr>
        <td><b>${r.name}</b></td>
        <td>${r.type}</td>
        <td><b>${r.capacity}</b> assentos (${r.rows} fileiras × ${r.cols})</td>
        <td>${r.features.join(' • ')}</td>
        <td><span class="ticket-status-stamp ativo">${r.status.toUpperCase()}</span></td>
      </tr>
    `).join('');
  },

  // TELA 26: GERENCIAMENTO DE ASSENTOS / MAPA DA SALA (RF029)
  renderAdminSeats() {
    const rooms = window.dataStore.getRooms();
    const select = document.getElementById('admin-seats-room-select');
    if (select) {
      select.innerHTML = rooms.map(r => `<option value="${r.id}">${r.name}</option>`).join('');
    }
    this.loadAdminSeatsMap();
  },

  loadAdminSeatsMap() {
    const roomId = document.getElementById('admin-seats-room-select').value;
    const room = window.dataStore.getRoomById(roomId);
    const config = window.dataStore.getSeatsConfig(roomId);
    const container = document.getElementById('admin-seats-editor-grid');
    if (!room || !container) return;

    const rows = room.rows;
    const cols = room.cols;
    const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

    let html = '';
    for (let r = 0; r < rows; r++) {
      const rowLetter = letters[r];
      html += `<div class="seat-row"><div class="seat-row-letter">${rowLetter}</div>`;
      for (let c = 1; c <= cols; c++) {
        const seatId = `${rowLetter}${c}`;
        const type = config[seatId] || 'normal';
        let cls = 'available';
        if (type === 'pcd') cls = 'available pcd';
        if (type === 'blocked') cls = 'blocked';

        html += `
          <div 
            class="seat ${cls}" 
            id="adm-seat-${seatId}" 
            onclick="CinemaApp.cycleAdminSeatType('${roomId}', '${seatId}')"
            title="Clique para alternar: Normal → PCD → Bloqueado"
          >
            ${seatId}
          </div>
        `;
      }
      html += `<div class="seat-row-letter">${rowLetter}</div></div>`;
    }

    container.innerHTML = html;
  },

  cycleAdminSeatType(roomId, seatId) {
    const config = window.dataStore.getSeatsConfig(roomId);
    const current = config[seatId] || 'normal';
    let next = 'normal';
    if (current === 'normal') next = 'pcd';
    else if (current === 'pcd') next = 'blocked';
    else if (current === 'blocked') next = 'normal';

    config[seatId] = next;
    window.dataStore.saveSeatsConfig(roomId, config);
    this.showToast(`Assento ${seatId} alterado para: ${next.toUpperCase()}`, 'info');
    this.loadAdminSeatsMap();
  },

  // TELA 27: PREÇOS (RF032)
  renderAdminPrices() {
    const prices = JSON.parse(localStorage.getItem('unifor_cinema_prices') || '[]');
    const tbody = document.getElementById('admin-prices-tbody');
    if (!tbody) return;

    tbody.innerHTML = prices.map(p => `
      <tr>
        <td><b>${p.category}</b></td>
        <td>R$ ${p.weekdayPrice.toFixed(2)}</td>
        <td>R$ ${p.weekendPrice.toFixed(2)}</td>
        <td>${p.desc}</td>
      </tr>
    `).join('');
  },

  // TELA 28: PROMOÇÕES E CUPONS (RF032)
  renderAdminPromotions() {
    const coupons = window.dataStore.getCoupons();
    const tbody = document.getElementById('admin-coupons-tbody');
    if (!tbody) return;

    tbody.innerHTML = coupons.map(c => `
      <tr>
        <td><b style="color: #93c5fd; font-family: monospace; font-size: 1rem">${c.code}</b></td>
        <td><b>${c.discountPercent}%</b></td>
        <td>${c.desc}</td>
        <td>${c.expiresAt}</td>
        <td><span class="ticket-status-stamp ativo">${c.active ? 'Ativo' : 'Inativo'}</span></td>
      </tr>
    `).join('');
  },

  // TELA 29: GESTÃO DE PEDIDOS (RF033, RF034)
  renderAdminOrders() {
    const orders = window.dataStore.getOrders();
    const tbody = document.getElementById('admin-orders-tbody');
    if (!tbody) return;

    tbody.innerHTML = orders.map(o => `
      <tr>
        <td><b>${o.id}</b></td>
        <td>${o.customerName}<br><small style="color: var(--gray-400)">${o.customerEmail}</small></td>
        <td>${o.movieTitle}</td>
        <td>${o.seats.join(', ')}</td>
        <td>R$ ${o.totalAmount.toFixed(2)}</td>
        <td>${o.paymentMethod}</td>
        <td><span class="ticket-status-stamp ${o.orderStatus === 'Concluído' ? 'ativo' : 'cancelado'}">${o.orderStatus}</span></td>
        <td>
          ${o.orderStatus === 'Concluído'
            ? `<button class="btn btn-sm btn-danger" onclick="CinemaApp.adminCancelOrder('${o.id}')">Cancelar / Estornar</button>`
            : `-`
          }
        </td>
      </tr>
    `).join('');
  },

  adminCancelOrder(orderId) {
    if (confirm(`Administrador: confirmar cancelamento e estorno imediato do pedido ${orderId}?`)) {
      window.dataStore.cancelOrder(orderId, 'Cancelamento Administrativo');
      this.showToast('Pedido cancelado e assentos liberados no sistema.', 'success');
      this.renderAdminOrders();
    }
  },

  // TELA 30: PAGAMENTOS E TRANSAÇÕES (RF019)
  renderAdminPayments() {
    const orders = window.dataStore.getOrders();
    const tbody = document.getElementById('admin-payments-tbody');
    if (!tbody) return;

    tbody.innerHTML = orders.map(o => `
      <tr>
        <td><b>TRX-${o.id.replace('UNI-PED-', '')}</b></td>
        <td>${o.paymentDate ? o.paymentDate.split('T')[0] : 'Hoje'}</td>
        <td>${o.paymentMethod}</td>
        <td><b>R$ ${o.totalAmount.toFixed(2)}</b></td>
        <td><span class="ticket-status-stamp ${o.paymentStatus === 'Aprovado' ? 'ativo' : 'cancelado'}">${o.paymentStatus}</span></td>
      </tr>
    `).join('');
  },

  // TELA 31: USUÁRIOS E CONTROLE DE PERMISSÕES (RF039)
  renderAdminUsers() {
    const users = window.dataStore.getUsers();
    const tbody = document.getElementById('admin-users-tbody');
    if (!tbody) return;

    tbody.innerHTML = users.map(u => `
      <tr>
        <td><b>${u.name}</b></td>
        <td>${u.email}</td>
        <td><b>${u.role.toUpperCase()}</b></td>
        <td>${u.institutionalId || 'N/A'}</td>
        <td><span class="ticket-status-stamp ativo">${u.academicStatus || 'Regular'}</span></td>
      </tr>
    `).join('');
  },

  // TELA 32: RELATÓRIOS GERENCIAIS E TAXA DE OCUPAÇÃO (RF035, RF036)
  renderAdminReports() {
    const sessions = window.dataStore.getSessions();
    const tbody = document.getElementById('admin-reports-tbody');
    if (!tbody) return;

    tbody.innerHTML = sessions.map(s => {
      const movie = window.dataStore.getMovieById(s.movieId);
      const room = window.dataStore.getRoomById(s.roomId);
      const cap = room ? room.capacity : 60;
      const sold = (s.occupiedSeats || []).length;
      const occPercent = ((sold / cap) * 100).toFixed(1);
      const revenue = sold * (s.basePrice * 0.75); // média ponderada

      return `
        <tr>
          <td><b>${movie ? movie.title : 'Filme'}</b></td>
          <td>${room ? room.name.split('-')[0] : 'Sala'}</td>
          <td>${s.date} ${s.time}</td>
          <td>${sold} ingressos</td>
          <td><b>${occPercent}%</b></td>
          <td><b>R$ ${revenue.toFixed(2)}</b></td>
        </tr>
      `;
    }).join('');
  },

  // TELA 33: BANNERS E DESTAQUES (RF038)
  renderAdminBanners() {
    const banners = JSON.parse(localStorage.getItem('unifor_cinema_banners') || '[]');
    const container = document.getElementById('admin-banners-list');
    if (!container) return;

    container.innerHTML = banners.map(b => `
      <div style="background: #031442; border: 1px solid var(--unifor-border); border-radius: var(--radius-md); padding: 16px; margin-bottom: 12px; display: flex; gap: 16px; align-items: center">
        <img src="${b.imageUrl}" alt="${b.title}" style="width: 140px; height: 80px; object-fit: cover; border-radius: 6px" />
        <div style="flex: 1">
          <span class="hero-tag">${b.badge}</span>
          <h4 style="font-size: 1.1rem; margin: 4px 0">${b.title}</h4>
          <p style="font-size: 0.85rem; color: var(--gray-300)">${b.subtitle}</p>
        </div>
        <div>
          <span class="ticket-status-stamp ativo">${b.active ? 'Ativo na Home' : 'Pausado'}</span>
        </div>
      </div>
    `).join('');
  },

  // TELA 34: CONFIGURAÇÕES DO SISTEMA E API TMDB
  renderAdminConfig() {
    const config = window.dataStore.getConfig();
    document.getElementById('cfg-temp-lock').value = config.tempLockMinutes || 10;
    document.getElementById('cfg-session-interval').value = config.sessionIntervalMinutes || 20;
    document.getElementById('cfg-cancel-hours').value = config.cancelLimitHours || 2;
    document.getElementById('cfg-tmdb-key').value = window.tmdbService.getApiKey();
  },

  saveAdminConfig(e) {
    if (e) e.preventDefault();
    const tempLock = parseInt(document.getElementById('cfg-temp-lock').value);
    const interval = parseInt(document.getElementById('cfg-session-interval').value);
    const cancelHours = parseInt(document.getElementById('cfg-cancel-hours').value);
    const tmdbKey = document.getElementById('cfg-tmdb-key').value;

    window.dataStore.saveConfig({
      tempLockMinutes: tempLock,
      sessionIntervalMinutes: interval,
      cancelLimitHours: cancelHours
    });

    if (tmdbKey) {
      window.tmdbService.setApiKey(tmdbKey);
    }

    this.showToast('Configurações do Cinema UNIFOR salvas com sucesso!', 'success');
  },

  // TELA 35: AUDITORIA E LOGS (RF040)
  renderAdminAudit() {
    const logs = window.dataStore.getAuditLogs();
    const tbody = document.getElementById('admin-audit-tbody');
    if (!tbody) return;

    tbody.innerHTML = logs.map(l => `
      <tr>
        <td><small style="font-family: monospace; color: var(--gray-400)">${new Date(l.timestamp).toLocaleString('pt-BR')}</small></td>
        <td><b>${l.userName}</b></td>
        <td><span class="ticket-status-stamp ativo" style="border: none">${l.action}</span></td>
        <td>${l.details}</td>
        <td><small style="color: var(--gray-400)">${l.ip}</small></td>
      </tr>
    `).join('');
  },

  // TELA 36: VALIDADOR DE INGRESSOS DA PORTARIA (RF021, RN004, RN005)
  renderAdminValidator() {
    // Tela de checagem de portaria
    const input = document.getElementById('validator-ticket-input');
    if (input) input.value = '';
    const resBox = document.getElementById('validator-result-box');
    if (resBox) resBox.style.display = 'none';
  },

  validateTicketFromInput() {
    const input = document.getElementById('validator-ticket-input');
    if (!input || !input.value.trim()) {
      this.showToast('Por favor, informe ou bipe o código do ingresso.', 'error');
      return;
    }

    const code = input.value.trim();
    const check = window.dataStore.validateTicket(code);
    const resBox = document.getElementById('validator-result-box');
    if (!resBox) return;

    resBox.style.display = 'block';

    if (check.success) {
      resBox.className = 'conflict-alert';
      resBox.style.borderColor = 'var(--success)';
      resBox.style.background = 'rgba(16, 185, 129, 0.15)';
      resBox.style.color = '#6ee7b7';
      resBox.innerHTML = `
        <div style="font-size: 2.2rem; margin-right: 12px">✓</div>
        <div>
          <h3 style="font-size: 1.3rem; font-weight: 900; color: #fff">INGRESSO VÁLIDO - ENTRADA LIBERADA!</h3>
          <p style="margin: 6px 0; font-size: 0.95rem">
            <b>Filme:</b> ${check.ticket.movieTitle}<br>
            <b>Sessão:</b> ${check.ticket.sessionDate} às ${check.ticket.sessionTime} (${check.ticket.roomName})<br>
            <b>Assento:</b> <span style="font-size: 1.2rem; font-weight: 900; color: #fff; background: var(--unifor-blue); padding: 2px 8px; border-radius: 4px">${check.ticket.seatId}</span><br>
            <b>Cliente:</b> ${check.ticket.customerName} (${check.ticket.ticketType})
          </p>
          <small style="color: #a7f3d0">Validado em: ${check.ticket.validatedAt} • Não poderá ser reutilizado.</small>
        </div>
      `;
    } else {
      resBox.className = 'conflict-alert';
      resBox.style.borderColor = 'var(--danger)';
      resBox.style.background = 'rgba(239, 68, 68, 0.15)';
      resBox.style.color = '#fca5a5';
      resBox.innerHTML = `
        <div style="font-size: 2.2rem; margin-right: 12px">✕</div>
        <div>
          <h3 style="font-size: 1.3rem; font-weight: 900; color: #fff">ACESSO NEGADO!</h3>
          <p style="margin: 6px 0; font-size: 1rem; font-weight: 700">${check.message}</p>
          ${check.ticket ? `
            <small style="color: #fecaca">
              Filme: ${check.ticket.movieTitle} • Assento: ${check.ticket.seatId} • Titular: ${check.ticket.customerName}
            </small>
          ` : ''}
        </div>
      `;
    }
  },

  // Feedback Toast (RNF019)
  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <div style="font-weight: 700">${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</div>
      <div style="font-size: 0.88rem; flex: 1">${message}</div>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4500);
  }
};

// Inicialização automática após carregamento do DOM
document.addEventListener('DOMContentLoaded', () => {
  CinemaApp.init();
});

window.CinemaApp = CinemaApp;
