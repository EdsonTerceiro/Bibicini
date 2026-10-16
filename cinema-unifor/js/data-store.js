// ==========================================================================
// CINEMA UNIFOR - Central Data Store & Business Rules Engine
// DER: Usuários, Filmes, Salas, Assentos, Sessões, Pedidos, Ingressos, Preços, Logs
// Implementa Regras de Negócio (RN001 a RN010) e RNF (Concorrência, Anti-conflito)
// ==========================================================================

const STORAGE_KEYS = {
  MOVIES: 'unifor_cinema_movies',
  ROOMS: 'unifor_cinema_rooms',
  SEATS_CONFIG: 'unifor_cinema_seats_config',
  SESSIONS: 'unifor_cinema_sessions',
  USERS: 'unifor_cinema_users',
  CURRENT_USER: 'unifor_cinema_current_user',
  ORDERS: 'unifor_cinema_orders',
  TICKETS: 'unifor_cinema_tickets',
  PRICES: 'unifor_cinema_prices',
  COUPONS: 'unifor_cinema_coupons',
  BANNERS: 'unifor_cinema_banners',
  CONFIG: 'unifor_cinema_config',
  AUDIT_LOGS: 'unifor_cinema_audit_logs'
};

class CinemaDataStore {
  constructor() {
    this.initDefaultData();
  }

  // Inicializa dados no LocalStorage caso ainda não existam
  initDefaultData() {
    if (!localStorage.getItem(STORAGE_KEYS.ROOMS)) {
      const defaultRooms = [
        {
          id: 'sala-1',
          name: 'Sala UNIFOR 1 - IMAX Laser & Dolby Atmos',
          type: 'IMAX Laser',
          capacity: 64,
          rows: 8, // A a H
          cols: 8, // 1 a 8
          features: ['Projeção 4K Laser', 'Som Imersivo Dolby Atmos', 'Assentos Reclináveis', 'Acessibilidade PCD'],
          status: 'ativa'
        },
        {
          id: 'sala-2',
          name: 'Sala Glauber Rocha - Cinema de Arte',
          type: 'Cinema de Arte',
          capacity: 48,
          rows: 6, // A a F
          cols: 8, // 1 a 8
          features: ['Projeção Digital 2K', 'Acústica Especial', 'Debates e Mostras', 'Acessibilidade PCD'],
          status: 'ativa'
        },
        {
          id: 'sala-3',
          name: 'Sala Rachel de Queiroz - Estúdio Digital',
          type: 'Standard Premium',
          capacity: 40,
          rows: 5, // A a E
          cols: 8, // 1 a 8
          features: ['Projeção 3D RealD', 'Conforto Universitário', 'Acessibilidade PCD'],
          status: 'ativa'
        }
      ];
      localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(defaultRooms));
    }

    if (!localStorage.getItem(STORAGE_KEYS.MOVIES)) {
      const initialMovies = window.tmdbService ? window.tmdbService.getInitialMovies() : [];
      localStorage.setItem(STORAGE_KEYS.MOVIES, JSON.stringify(initialMovies));
    }

    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      const defaultUsers = [
        {
          id: 'usr-1',
          name: 'Caique Alencar',
          email: 'aluno@unifor.br',
          password: 'unifor',
          cpf: '123.456.789-00',
          phone: '(85) 99876-5432',
          birthDate: '2002-05-14',
          role: 'aluno', // aluno, professor, colaborador, visitante, admin, fiscal
          institutionalId: '2410889',
          course: 'Engenharia da Computação',
          campus: 'Campus Edson Queiroz',
          academicStatus: 'Matrícula Regular Ativa',
          createdAt: '2024-02-10'
        },
        {
          id: 'usr-2',
          name: 'Profa. Amanda Vasconcelos',
          email: 'prof@unifor.br',
          password: 'unifor',
          cpf: '234.567.890-11',
          phone: '(85) 98765-4321',
          birthDate: '1985-09-22',
          role: 'professor',
          institutionalId: 'PF99120',
          course: 'Centro de Ciências da Comunicação e Gestão',
          campus: 'Campus Edson Queiroz',
          academicStatus: 'Docente Ativo',
          createdAt: '2024-01-15'
        },
        {
          id: 'usr-3',
          name: 'Edson Terceiro',
          email: 'admin@unifor.br',
          password: 'admin',
          cpf: '345.678.901-22',
          phone: '(85) 99123-4567',
          birthDate: '1988-03-30',
          role: 'admin', // Acesso irrestrito a gestão
          institutionalId: 'ADM-004',
          course: 'Administração do Cinema UNIFOR',
          campus: 'Campus Edson Queiroz',
          academicStatus: 'Gestor Administrativo',
          createdAt: '2023-08-01'
        },
        {
          id: 'usr-4',
          name: 'Gabriel Rocha',
          email: 'fiscal@unifor.br',
          password: 'fiscal',
          cpf: '456.789.012-33',
          phone: '(85) 98111-2233',
          birthDate: '1995-11-12',
          role: 'fiscal', // Validador da portaria
          institutionalId: 'FISC-012',
          course: 'Operação de Eventos e Bilheteria',
          campus: 'Campus Edson Queiroz',
          academicStatus: 'Fiscal de Sala',
          createdAt: '2024-03-01'
        },
        {
          id: 'usr-5',
          name: 'Visitante Externo',
          email: 'visitante@gmail.com',
          password: '123456',
          cpf: '567.890.123-44',
          phone: '(85) 97777-8888',
          birthDate: '1999-07-08',
          role: 'visitante',
          institutionalId: '',
          course: '',
          campus: '',
          academicStatus: 'Público Geral',
          createdAt: '2024-04-10'
        }
      ];
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(defaultUsers));
    }

    // Usuário padrão logado (inicia com o aluno UNIFOR para demonstrar benefícios institucionais de imediato)
    if (!localStorage.getItem(STORAGE_KEYS.CURRENT_USER)) {
      const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(users[0]));
    }

    if (!localStorage.getItem(STORAGE_KEYS.PRICES)) {
      const defaultPrices = [
        { id: 'prc-1', category: 'Inteira', weekdayPrice: 32.00, weekendPrice: 38.00, desc: 'Público geral sem desconto' },
        { id: 'prc-2', category: 'Meia Aluno UNIFOR', weekdayPrice: 16.00, weekendPrice: 19.00, desc: '50% de desconto institucional para alunos matriculados' },
        { id: 'prc-3', category: 'Meia Professor / Colaborador UNIFOR', weekdayPrice: 16.00, weekendPrice: 19.00, desc: '50% de desconto institucional para docentes e equipe' },
        { id: 'prc-4', category: 'Meia Estudante Federal / Lei da Meia', weekdayPrice: 16.00, weekendPrice: 19.00, desc: 'Estudantes externos, idosos, PCD e jovens de baixa renda' },
        { id: 'prc-5', category: 'Cortesia Cultural UNIFOR', weekdayPrice: 0.00, weekendPrice: 0.00, desc: 'Sessões acadêmicas especiais autorizadas' }
      ];
      localStorage.setItem(STORAGE_KEYS.PRICES, JSON.stringify(defaultPrices));
    }

    if (!localStorage.getItem(STORAGE_KEYS.COUPONS)) {
      const defaultCoupons = [
        { code: 'UNIFOR10', discountPercent: 10, minPurchase: 0, expiresAt: '2026-12-31', active: true, desc: '10% de desconto institucional' },
        { code: 'BEMVINDO20', discountPercent: 20, minPurchase: 30, expiresAt: '2026-12-31', active: true, desc: '20% off para novas compras' },
        { code: 'QUARTAUNIFOR', discountPercent: 15, minPurchase: 0, expiresAt: '2026-12-31', active: true, desc: 'Super Quarta do Cinema UNIFOR' }
      ];
      localStorage.setItem(STORAGE_KEYS.COUPONS, JSON.stringify(defaultCoupons));
    }

    if (!localStorage.getItem(STORAGE_KEYS.CONFIG)) {
      const defaultConfig = {
        tempLockMinutes: 10, // Trava de assento por 10 minutos (RN002, RN003)
        sessionIntervalMinutes: 20, // Intervalo mínimo de higienização e trailers entre sessões (RF031)
        cancelLimitHours: 2, // Limite para cancelamento antes do início (RN009)
        serviceFee: 0.00, // Cinema universitário sem taxa de conveniência
        cinemaName: 'Cinema UNIFOR - Universidade de Fortaleza',
        cinemaLocation: 'Centro de Convivência, Campus Edson Queiroz - Fortaleza, CE',
        contactEmail: 'cinema@unifor.br',
        contactPhone: '(85) 3477-3000 / 3477-3100',
        tmdbApiKey: '8265bd1679663a7ea12ac168da84d2e8'
      };
      localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(defaultConfig));
    }

    if (!localStorage.getItem(STORAGE_KEYS.BANNERS)) {
      const defaultBanners = [
        {
          id: 'ban-1',
          title: 'Festival de Cinema Brasileiro UNIFOR',
          subtitle: 'Exibição especial de "Ainda Estou Aqui" e debates com cineastas convidados no Auditório Principal.',
          imageUrl: 'https://image.tmdb.org/t/p/original/j2h2jZ5j9Z4y2CjF3I4gW3N0qKk.jpg',
          badge: 'Mostra Universitária',
          linkType: 'movie',
          targetId: 1034541,
          active: true
        },
        {
          id: 'ban-2',
          title: 'Super Estreias em IMAX 4K Laser',
          subtitle: 'Experimente a melhor tecnologia de projeção e áudio imersivo de Fortaleza com desconto exclusivo para a comunidade UNIFOR.',
          imageUrl: 'https://image.tmdb.org/t/p/original/xOMo8BRK7PfcJv9JCnx7s5200bm.jpg',
          badge: 'Tecnologia IMAX',
          linkType: 'movie',
          targetId: 693134,
          active: true
        },
        {
          id: 'ban-3',
          title: 'Clássicos da Animação Mundial',
          subtitle: 'Mostra Hayao Miyazaki com exibições remasterizadas de "A Viagem de Chihiro" e sessões para toda a família.',
          imageUrl: 'https://image.tmdb.org/t/p/original/Ab8mkHmkYADjU7wQiOkia9BzGvS.jpg',
          badge: 'Clássicos UNIFOR',
          linkType: 'movie',
          targetId: 129,
          active: true
        }
      ];
      localStorage.setItem(STORAGE_KEYS.BANNERS, JSON.stringify(defaultBanners));
    }

    if (!localStorage.getItem(STORAGE_KEYS.SESSIONS)) {
      this.initDefaultSessions();
    }

    if (!localStorage.getItem(STORAGE_KEYS.ORDERS)) {
      this.initDefaultOrders();
    }

    if (!localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS)) {
      const defaultLogs = [
        {
          id: 'log-1',
          timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
          userName: 'Edson Terceiro (admin@unifor.br)',
          action: 'CADASTRO_SESSAO',
          details: 'Agendamento de sessão para "Ainda Estou Aqui" na Sala UNIFOR 1',
          ip: '177.19.124.8'
        },
        {
          id: 'log-2',
          timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
          userName: 'Edson Terceiro (admin@unifor.br)',
          action: 'CONFIG_PRECOS',
          details: 'Atualização da política de desconto institucional UNIFOR para 50%',
          ip: '177.19.124.8'
        }
      ];
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(defaultLogs));
    }
  }

  // Gera datas formatadas para os próximos 7 dias
  getDateOffset(offsetDays = 0) {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().split('T')[0];
  }

  initDefaultSessions() {
    const today = this.getDateOffset(0);
    const tomorrow = this.getDateOffset(1);
    const dayAfter = this.getDateOffset(2);

    const defaultSessions = [
      {
        id: 'ses-101',
        movieId: 1034541, // Ainda Estou Aqui
        roomId: 'sala-1',
        date: today,
        time: '14:00',
        format: '2D Nacional - Digital',
        basePrice: 32.00,
        occupiedSeats: ['C4', 'C5', 'D4', 'D5'],
        reservedSeats: {}, // { 'E4': { userId: 'usr-1', expiresAt: Date.now() + 600000 } }
        status: 'ativa'
      },
      {
        id: 'ses-102',
        movieId: 1034541, // Ainda Estou Aqui
        roomId: 'sala-1',
        date: today,
        time: '17:30',
        format: '2D Nacional - Debate Acadêmico',
        basePrice: 32.00,
        occupiedSeats: ['D3', 'D4', 'D5', 'D6', 'E3', 'E4', 'E5'],
        reservedSeats: {},
        status: 'ativa'
      },
      {
        id: 'ses-103',
        movieId: 1034541, // Ainda Estou Aqui
        roomId: 'sala-1',
        date: today,
        time: '20:45',
        format: '2D Nacional - Sessão Noturna',
        basePrice: 32.00,
        occupiedSeats: ['F4', 'F5'],
        reservedSeats: {},
        status: 'ativa'
      },
      {
        id: 'ses-104',
        movieId: 693134, // Duna: Parte 2
        roomId: 'sala-2',
        date: today,
        time: '15:00',
        format: 'IMAX 2D Legendado',
        basePrice: 38.00,
        occupiedSeats: ['B3', 'B4', 'C3', 'C4'],
        reservedSeats: {},
        status: 'ativa'
      },
      {
        id: 'ses-105',
        movieId: 693134, // Duna: Parte 2
        roomId: 'sala-2',
        date: today,
        time: '19:00',
        format: 'IMAX 2D Legendado',
        basePrice: 38.00,
        occupiedSeats: ['C3', 'C4', 'C5', 'D3', 'D4', 'D5', 'D6'],
        reservedSeats: {},
        status: 'ativa'
      },
      {
        id: 'ses-106',
        movieId: 1022789, // Divertida Mente 2
        roomId: 'sala-3',
        date: today,
        time: '14:30',
        format: '2D Dublado',
        basePrice: 32.00,
        occupiedSeats: ['A3', 'A4', 'B3', 'B4'],
        reservedSeats: {},
        status: 'ativa'
      },
      {
        id: 'ses-107',
        movieId: 1022789, // Divertida Mente 2
        roomId: 'sala-3',
        date: today,
        time: '17:00',
        format: '3D Laser Dublado',
        basePrice: 36.00,
        occupiedSeats: [],
        reservedSeats: {},
        status: 'ativa'
      },
      {
        id: 'ses-108',
        movieId: 872585, // Oppenheimer
        roomId: 'sala-3',
        date: today,
        time: '19:45',
        format: '2D Legendado - Especial UNIFOR',
        basePrice: 32.00,
        occupiedSeats: ['C2', 'C3'],
        reservedSeats: {},
        status: 'ativa'
      },
      // Sessões de amanhã
      {
        id: 'ses-201',
        movieId: 1034541,
        roomId: 'sala-1',
        date: tomorrow,
        time: '16:00',
        format: '2D Nacional - Digital',
        basePrice: 32.00,
        occupiedSeats: ['D4', 'D5'],
        reservedSeats: {},
        status: 'ativa'
      },
      {
        id: 'ses-202',
        movieId: 693134,
        roomId: 'sala-1',
        date: tomorrow,
        time: '19:30',
        format: 'IMAX 2D Legendado',
        basePrice: 38.00,
        occupiedSeats: [],
        reservedSeats: {},
        status: 'ativa'
      },
      {
        id: 'ses-203',
        movieId: 558449, // Gladiador 2
        roomId: 'sala-2',
        date: tomorrow,
        time: '18:00',
        format: '2D Legendado',
        basePrice: 32.00,
        occupiedSeats: ['C3', 'C4'],
        reservedSeats: {},
        status: 'ativa'
      },
      {
        id: 'ses-301',
        movieId: 129, // Chihiro
        roomId: 'sala-2',
        date: dayAfter,
        time: '15:30',
        format: '2D Legendado - Sessão Cultural',
        basePrice: 20.00,
        occupiedSeats: [],
        reservedSeats: {},
        status: 'ativa'
      }
    ];

    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(defaultSessions));
  }

  initDefaultOrders() {
    const today = this.getDateOffset(0);
    const defaultOrders = [
      {
        id: 'UNI-PED-9081',
        userId: 'usr-1', // Caique (Aluno)
        customerName: 'Caique Alencar',
        customerEmail: 'aluno@unifor.br',
        customerCpf: '123.456.789-00',
        customerRole: 'aluno',
        institutionalId: '2410889',
        sessionId: 'ses-101',
        movieId: 1034541,
        movieTitle: 'Ainda Estou Aqui',
        roomName: 'Sala UNIFOR 1 - IMAX Laser & Dolby Atmos',
        sessionDate: today,
        sessionTime: '14:00',
        sessionFormat: '2D Nacional - Digital',
        seats: ['C4', 'C5'],
        tickets: [
          {
            ticketCode: 'UNI-TKT-9081-1',
            seatId: 'C4',
            ticketType: 'Meia Aluno UNIFOR',
            price: 16.00,
            status: 'ativo',
            validatedAt: null
          },
          {
            ticketCode: 'UNI-TKT-9081-2',
            seatId: 'C5',
            ticketType: 'Meia Aluno UNIFOR',
            price: 16.00,
            status: 'ativo',
            validatedAt: null
          }
        ],
        subtotal: 64.00,
        discount: 32.00,
        totalAmount: 32.00,
        paymentMethod: 'PIX',
        paymentStatus: 'Aprovado',
        paymentDate: new Date(Date.now() - 7200000).toISOString(),
        orderStatus: 'Concluído',
        createdAt: new Date(Date.now() - 7200000).toISOString()
      },
      {
        id: 'UNI-PED-9075',
        userId: 'usr-2', // Profa Amanda
        customerName: 'Profa. Amanda Vasconcelos',
        customerEmail: 'prof@unifor.br',
        customerCpf: '234.567.890-11',
        customerRole: 'professor',
        institutionalId: 'PF99120',
        sessionId: 'ses-105',
        movieId: 693134,
        movieTitle: 'Duna: Parte 2',
        roomName: 'Sala Glauber Rocha - Cinema de Arte',
        sessionDate: today,
        sessionTime: '19:00',
        sessionFormat: 'IMAX 2D Legendado',
        seats: ['D4'],
        tickets: [
          {
            ticketCode: 'UNI-TKT-9075-1',
            seatId: 'D4',
            ticketType: 'Meia Professor / Colaborador UNIFOR',
            price: 19.00,
            status: 'utilizado',
            validatedAt: new Date(Date.now() - 1800000).toLocaleString('pt-BR')
          }
        ],
        subtotal: 38.00,
        discount: 19.00,
        totalAmount: 19.00,
        paymentMethod: 'Cartão de Crédito',
        paymentStatus: 'Aprovado',
        paymentDate: new Date(Date.now() - 3600000 * 5).toISOString(),
        orderStatus: 'Concluído',
        createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
      }
    ];

    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(defaultOrders));
  }

  // ===================== CRUD E CONSULTAS =====================

  getMovies() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.MOVIES) || '[]');
  }

  getMovieById(id) {
    const movies = this.getMovies();
    return movies.find(m => m.id == id || m.tmdbId == id) || null;
  }

  saveMovie(movie) {
    const movies = this.getMovies();
    const index = movies.findIndex(m => m.id == movie.id);
    if (index >= 0) {
      movies[index] = { ...movies[index], ...movie };
    } else {
      movies.unshift(movie);
    }
    localStorage.setItem(STORAGE_KEYS.MOVIES, JSON.stringify(movies));
    this.addAuditLog('SALVAR_FILME', `Filme cadastrado/atualizado: ${movie.title}`);
    return movie;
  }

  deleteMovie(id) {
    let movies = this.getMovies();
    const movie = movies.find(m => m.id == id);
    movies = movies.filter(m => m.id != id);
    localStorage.setItem(STORAGE_KEYS.MOVIES, JSON.stringify(movies));
    if (movie) {
      this.addAuditLog('EXCLUIR_FILME', `Filme removido: ${movie.title}`);
    }
  }

  getRooms() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.ROOMS) || '[]');
  }

  getRoomById(id) {
    const rooms = this.getRooms();
    return rooms.find(r => r.id === id) || null;
  }

  saveRoom(room) {
    const rooms = this.getRooms();
    const index = rooms.findIndex(r => r.id === room.id);
    if (index >= 0) {
      rooms[index] = { ...rooms[index], ...room };
    } else {
      rooms.push(room);
    }
    localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(rooms));
    this.addAuditLog('SALVAR_SALA', `Sala salva: ${room.name}`);
    return room;
  }

  getSeatsConfig(roomId) {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEYS.SEATS_CONFIG) || '{}');
    return all[roomId] || {};
  }

  saveSeatsConfig(roomId, config) {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEYS.SEATS_CONFIG) || '{}');
    all[roomId] = config;
    localStorage.setItem(STORAGE_KEYS.SEATS_CONFIG, JSON.stringify(all));
    this.addAuditLog('SALVAR_MAPA_ASSENTOS', `Mapa de assentos atualizado para sala: ${roomId}`);
  }

  getSessions() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSIONS) || '[]');
  }

  getSessionById(id) {
    const sessions = this.getSessions();
    return sessions.find(s => s.id === id) || null;
  }

  // ===================== ALGORITMO ANTI-CONFLITO DE SESSÕES (RF031, RN008) =====================
  // Valida sobreposição de horários na mesma sala considerando a duração do filme + intervalo operacional
  checkSessionConflict(roomId, date, timeStr, durationMinutes, excludeSessionId = null) {
    const sessions = this.getSessions();
    const config = this.getConfig();
    const interval = config.sessionIntervalMinutes || 20;

    const [startH, startM] = timeStr.split(':').map(Number);
    const newStartMinutes = startH * 60 + startM;
    const newEndMinutes = newStartMinutes + Number(durationMinutes) + interval;

    for (const session of sessions) {
      if (session.roomId === roomId && session.date === date) {
        if (excludeSessionId && session.id === excludeSessionId) continue;

        const movie = this.getMovieById(session.movieId);
        const existingDuration = movie ? (movie.runtime || 120) : 120;
        const [existH, existM] = session.time.split(':').map(Number);
        const existStartMinutes = existH * 60 + existM;
        const existEndMinutes = existStartMinutes + existingDuration + interval;

        // Há sobreposição se o novo início for antes do fim existente E o novo fim for depois do início existente
        const hasOverlap = (newStartMinutes < existEndMinutes) && (newEndMinutes > existStartMinutes);

        if (hasOverlap) {
          const formatMin = m => {
            const h = Math.floor(m / 60).toString().padStart(2, '0');
            const min = (m % 60).toString().padStart(2, '0');
            return `${h}:${min}`;
          };
          return {
            conflict: true,
            conflictingSession: session,
            movieTitle: movie ? movie.title : 'Filme existente',
            timeSlot: `${session.time} até ~${formatMin(existEndMinutes)} (inclui ${interval}min de intervalo)`,
            attemptedSlot: `${timeStr} até ~${formatMin(newEndMinutes)}`
          };
        }
      }
    }

    return { conflict: false };
  }

  saveSession(sessionData) {
    const movie = this.getMovieById(sessionData.movieId);
    const duration = movie ? (movie.runtime || 120) : 120;

    // Executa verificação anti-conflito
    const check = this.checkSessionConflict(
      sessionData.roomId,
      sessionData.date,
      sessionData.time,
      duration,
      sessionData.id
    );

    if (check.conflict) {
      throw new Error(`Conflito de horário detectado! A sala já estará ocupada pela sessão de "${check.movieTitle}" das ${check.timeSlot}. Escolha outro horário ou sala.`);
    }

    const sessions = this.getSessions();
    const index = sessions.findIndex(s => s.id === sessionData.id);

    if (index >= 0) {
      sessions[index] = { ...sessions[index], ...sessionData };
    } else {
      if (!sessionData.id) {
        sessionData.id = `ses-${Date.now().toString().slice(-6)}`;
      }
      if (!sessionData.occupiedSeats) sessionData.occupiedSeats = [];
      if (!sessionData.reservedSeats) sessionData.reservedSeats = {};
      sessions.push(sessionData);
    }

    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
    this.addAuditLog('SALVAR_SESSAO', `Sessão agendada: Sala ${sessionData.roomId}, ${sessionData.date} às ${sessionData.time}`);
    return sessionData;
  }

  deleteSession(id) {
    let sessions = this.getSessions();
    const session = sessions.find(s => s.id === id);
    sessions = sessions.filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
    if (session) {
      this.addAuditLog('EXCLUIR_SESSAO', `Sessão cancelada/excluída: ID ${id}`);
    }
  }

  // ===================== CONTROLE DE ASSENTOS E TRAVA TEMPORÁRIA (RF008-010, RN002-003, RNF014) =====================

  // Limpa reservas expiradas de uma sessão
  cleanExpiredLocks(session) {
    if (!session || !session.reservedSeats) return false;
    const now = Date.now();
    let modified = false;

    for (const [seatId, lock] of Object.entries(session.reservedSeats)) {
      if (lock.expiresAt && now > lock.expiresAt) {
        delete session.reservedSeats[seatId];
        modified = true;
      }
    }
    return modified;
  }

  // Tenta reservar temporariamente os assentos pelo usuário atual
  lockSeats(sessionId, seatIds, userId) {
    const sessions = this.getSessions();
    const sessionIndex = sessions.findIndex(s => s.id === sessionId);
    if (sessionIndex < 0) throw new Error('Sessão não encontrada.');

    const session = sessions[sessionIndex];
    if (!session.reservedSeats) session.reservedSeats = {};
    if (!session.occupiedSeats) session.occupiedSeats = [];

    // Limpa reservas que já expiraram
    this.cleanExpiredLocks(session);

    const config = this.getConfig();
    const lockMinutes = config.tempLockMinutes || 10;
    const now = Date.now();
    const expiresAt = now + (lockMinutes * 60 * 1000);

    // Verifica se algum assento já está vendido ou bloqueado por outro usuário ativo
    for (const seatId of seatIds) {
      if (session.occupiedSeats.includes(seatId)) {
        throw new Error(`O assento ${seatId} já foi comprado por outro cliente.`);
      }
      const existingLock = session.reservedSeats[seatId];
      if (existingLock && existingLock.userId !== userId && now < existingLock.expiresAt) {
        throw new Error(`O assento ${seatId} está temporariamente reservado por outro cliente em processo de compra. Tente novamente em instantes.`);
      }
    }

    // Libera reservas anteriores deste usuário nesta sessão que ele desmarcou
    for (const [sId, lock] of Object.entries(session.reservedSeats)) {
      if (lock.userId === userId && !seatIds.includes(sId)) {
        delete session.reservedSeats[sId];
      }
    }

    // Aplica a nova trava temporária
    for (const seatId of seatIds) {
      session.reservedSeats[seatId] = {
        userId,
        expiresAt
      };
    }

    sessions[sessionIndex] = session;
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));

    return {
      success: true,
      expiresAt,
      lockMinutes
    };
  }

  // Libera a trava temporária caso o usuário desista ou volte
  releaseLocks(sessionId, userId) {
    const sessions = this.getSessions();
    const sessionIndex = sessions.findIndex(s => s.id === sessionId);
    if (sessionIndex < 0) return;

    const session = sessions[sessionIndex];
    if (!session.reservedSeats) return;

    let changed = false;
    for (const [seatId, lock] of Object.entries(session.reservedSeats)) {
      if (lock.userId === userId) {
        delete session.reservedSeats[seatId];
        changed = true;
      }
    }

    if (changed) {
      sessions[sessionIndex] = session;
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
    }
  }

  // ===================== CHECKOUT, PEDIDOS E EMISSÃO DE INGRESSOS (RF017-020, RN004) =====================

  createOrder(orderData) {
    const sessions = this.getSessions();
    const sessionIndex = sessions.findIndex(s => s.id === orderData.sessionId);
    if (sessionIndex < 0) throw new Error('Sessão informada é inválida.');

    const session = sessions[sessionIndex];
    if (!session.occupiedSeats) session.occupiedSeats = [];

    // Checagem final de concorrência anti-venda duplicada (RN010, RNF014)
    for (const item of orderData.items) {
      if (session.occupiedSeats.includes(item.seatId)) {
        throw new Error(`Conflito de compra: O assento ${item.seatId} já foi concluído em outra transação.`);
      }
    }

    // Gera ID único do pedido e ingressos com identificadores exclusivos
    const orderNumber = `UNI-PED-${Math.floor(100000 + Math.random() * 900000)}`;
    const tickets = orderData.items.map((item, idx) => ({
      ticketCode: `UNI-TKT-${Math.floor(10000000 + Math.random() * 90000000)}`,
      orderId: orderNumber,
      seatId: item.seatId,
      ticketType: item.ticketType,
      price: item.price,
      movieId: session.movieId,
      movieTitle: orderData.movieTitle,
      roomName: orderData.roomName,
      sessionDate: session.date,
      sessionTime: session.time,
      sessionFormat: session.format,
      customerName: orderData.customerName,
      customerEmail: orderData.customerEmail,
      customerCpf: orderData.customerCpf,
      customerRole: orderData.customerRole,
      institutionalId: orderData.institutionalId,
      status: 'ativo', // ativo, utilizado, cancelado
      validatedAt: null,
      createdAt: new Date().toISOString()
    }));

    // Registra os assentos como ocupados definitivamente e remove a trava
    for (const item of orderData.items) {
      session.occupiedSeats.push(item.seatId);
      if (session.reservedSeats && session.reservedSeats[item.seatId]) {
        delete session.reservedSeats[item.seatId];
      }
    }
    sessions[sessionIndex] = session;
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));

    // Salva o pedido completo
    const fullOrder = {
      id: orderNumber,
      userId: orderData.userId,
      customerName: orderData.customerName,
      customerEmail: orderData.customerEmail,
      customerCpf: orderData.customerCpf,
      customerRole: orderData.customerRole,
      institutionalId: orderData.institutionalId,
      sessionId: session.id,
      movieId: session.movieId,
      movieTitle: orderData.movieTitle,
      roomName: orderData.roomName,
      sessionDate: session.date,
      sessionTime: session.time,
      sessionFormat: session.format,
      seats: orderData.items.map(i => i.seatId),
      tickets,
      subtotal: orderData.subtotal,
      discount: orderData.discount || 0,
      couponCode: orderData.couponCode || null,
      totalAmount: orderData.totalAmount,
      paymentMethod: orderData.paymentMethod,
      paymentStatus: 'Aprovado',
      paymentDate: new Date().toISOString(),
      orderStatus: 'Concluído',
      createdAt: new Date().toISOString()
    };

    const orders = this.getOrders();
    orders.unshift(fullOrder);
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));

    this.addAuditLog('COMPRA_INGRESSO', `Pedido aprovado: ${orderNumber} - R$ ${fullOrder.totalAmount.toFixed(2)} (${orderData.customerName})`);

    return fullOrder;
  }

  getOrders() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.ORDERS) || '[]');
  }

  getOrderById(id) {
    const orders = this.getOrders();
    return orders.find(o => o.id === id) || null;
  }

  getUserOrders(userId) {
    const orders = this.getOrders();
    return orders.filter(o => o.userId === userId);
  }

  // Cancelamento de Pedido pelo Cliente ou Admin (RF025, RF034, RN009)
  cancelOrder(orderId, reason = 'Solicitação do cliente') {
    const orders = this.getOrders();
    const orderIndex = orders.findIndex(o => o.id === orderId);
    if (orderIndex < 0) throw new Error('Pedido não localizado.');

    const order = orders[orderIndex];
    if (order.orderStatus === 'Cancelado') throw new Error('Este pedido já foi cancelado.');

    // Libera os assentos ocupados da sessão
    const sessions = this.getSessions();
    const sessionIndex = sessions.findIndex(s => s.id === order.sessionId);
    if (sessionIndex >= 0) {
      const session = sessions[sessionIndex];
      session.occupiedSeats = session.occupiedSeats.filter(seat => !order.seats.includes(seat));
      sessions[sessionIndex] = session;
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
    }

    // Atualiza status do pedido e ingressos
    order.orderStatus = 'Cancelado';
    order.paymentStatus = 'Estornado';
    order.cancelReason = reason;
    order.canceledAt = new Date().toISOString();
    order.tickets.forEach(t => t.status = 'cancelado');

    orders[orderIndex] = order;
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));

    this.addAuditLog('CANCELAMENTO_PEDIDO', `Pedido ${orderId} cancelado. Motivo: ${reason}`);
    return order;
  }

  // ===================== VALIDADOR DE INGRESSOS DA PORTARIA (RF021, RN004, RN005) =====================

  validateTicket(ticketCode) {
    const code = ticketCode.trim().toUpperCase();
    const orders = this.getOrders();

    for (const order of orders) {
      const ticket = (order.tickets || []).find(t => t.ticketCode.toUpperCase() === code);
      if (ticket) {
        if (ticket.status === 'cancelado') {
          return {
            success: false,
            reason: 'canceled',
            message: 'Ingresso CANCELADO ou estornado. Entrada não permitida!',
            ticket,
            order
          };
        }

        if (ticket.status === 'utilizado') {
          return {
            success: false,
            reason: 'alreadyUsed',
            message: `Atenção: Este ingresso JÁ FOI UTILIZADO na portaria em ${ticket.validatedAt}. Entrada barrada!`,
            ticket,
            order
          };
        }

        // Validação com sucesso! Marca como utilizado para impedir reuso (RN005)
        ticket.status = 'utilizado';
        ticket.validatedAt = new Date().toLocaleString('pt-BR');
        localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));

        this.addAuditLog('VALIDACAO_PORTARIA', `Ingresso ${ticket.ticketCode} validado com sucesso na portaria! Assento: ${ticket.seatId}`);

        return {
          success: true,
          reason: 'valid',
          message: 'Ingresso VÁLIDO! Entrada Autorizada.',
          ticket,
          order
        };
      }
    }

    return {
      success: false,
      reason: 'notFound',
      message: 'Código de ingresso não localizado no sistema.'
    };
  }

  // ===================== USUÁRIOS E AUTENTICAÇÃO =====================

  getUsers() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
  }

  getCurrentUser() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_USER) || 'null');
  }

  setCurrentUser(user) {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  }

  registerUser(userData) {
    const users = this.getUsers();
    if (users.some(u => u.email.toLowerCase() === userData.email.toLowerCase())) {
      throw new Error('Já existe um usuário cadastrado com este e-mail.');
    }

    const newUser = {
      id: `usr-${Date.now()}`,
      createdAt: new Date().toISOString(),
      ...userData
    };

    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    this.setCurrentUser(newUser);
    this.addAuditLog('CADASTRO_USUARIO', `Novo usuário registrado: ${newUser.name} (${newUser.email})`);
    return newUser;
  }

  login(email, password) {
    const users = this.getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (!user) {
      throw new Error('E-mail ou senha inválidos.');
    }
    this.setCurrentUser(user);
    this.addAuditLog('LOGIN', `Login realizado por: ${user.name} (${user.role})`);
    return user;
  }

  logout() {
    const user = this.getCurrentUser();
    if (user) {
      this.addAuditLog('LOGOUT', `Logout realizado por: ${user.name}`);
    }
    this.setCurrentUser(null);
  }

  // ===================== CUPONS, CONFIGURAÇÕES E AUDITORIA =====================

  getCoupons() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.COUPONS) || '[]');
  }

  validateCoupon(code) {
    const coupons = this.getCoupons();
    const coupon = coupons.find(c => c.code.toUpperCase() === code.toUpperCase() && c.active);
    if (!coupon) return null;
    return coupon;
  }

  getConfig() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.CONFIG) || '{}');
  }

  saveConfig(newConfig) {
    const current = this.getConfig();
    const merged = { ...current, ...newConfig };
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(merged));
    this.addAuditLog('ALTERAR_CONFIG', 'Parâmetros operacionais do Cinema UNIFOR atualizados');
    return merged;
  }

  getAuditLogs() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS) || '[]');
  }

  addAuditLog(action, details) {
    const logs = this.getAuditLogs();
    const user = this.getCurrentUser();
    const userName = user ? `${user.name} (${user.email})` : 'Sistema / Convidado';

    logs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userName,
      action,
      details,
      ip: '127.0.0.1'
    });

    if (logs.length > 200) logs.pop();
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs));
  }
}

// Exporta singleton global para toda a aplicação
window.dataStore = new CinemaDataStore();
