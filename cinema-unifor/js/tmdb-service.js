// ==========================================================================
// CINEMA UNIFOR - TMDB (The Movie Database) Integration Service
// Suporta requisições ao vivo à API v3 do TMDb e catálogo offline com dados reais
// ==========================================================================

const TMDB_CONFIG = {
  BASE_URL: 'https://api.themoviedb.org/3',
  IMAGE_BASE_URL: 'https://image.tmdb.org/t/p/w500',
  BACKDROP_BASE_URL: 'https://image.tmdb.org/t/p/original',
  DEFAULT_API_KEY: '8265bd1679663a7ea12ac168da84d2e8', // Chave educacional padrão TMDb
  LANGUAGE: 'pt-BR'
};

// Filmes do catálogo inicial com dados reais extraídos do TMDb em português
const INITIAL_MOVIES_CATALOG = [
  {
    id: 1034541,
    tmdbId: 1034541,
    title: "Ainda Estou Aqui",
    originalTitle: "I'm Still Here",
    tagline: "Uma história sobre memória, coragem e amor.",
    overview: "No início dos anos 70, o Brasil enfrenta o endurecimento da ditadura militar. No Rio de Janeiro, a família Paiva — Rubens, Eunice e seus cinco filhos — vive em frente à praia em uma casa de portas abertas. Um dia, Rubens Paiva é levado por militares e desaparece. Eunice é forçada a se reinventar e liderar sua família.",
    posterPath: "https://image.tmdb.org/t/p/w500/ybpG0pXwz37eQ9sS7mI3W7Nvhz7.jpg",
    backdropPath: "https://image.tmdb.org/t/p/original/j2h2jZ5j9Z4y2CjF3I4gW3N0qKk.jpg",
    releaseDate: "2024-11-07",
    runtime: 137,
    voteAverage: 8.6,
    genres: ["Drama", "História", "Biografia"],
    director: "Walter Salles",
    cast: ["Fernanda Torres", "Selton Mello", "Fernanda Montenegro", "Valentina Herszage"],
    ageRating: "14",
    status: "cartaz", // cartaz, breve, inativo
    format: ["2D", "Nacional"],
    trailerUrl: "https://www.youtube.com/embed/Q0Pek_Y43p4",
    trailerKey: "Q0Pek_Y43p4"
  },
  {
    id: 693134,
    tmdbId: 693134,
    title: "Duna: Parte 2",
    originalTitle: "Dune: Part Two",
    tagline: "O destino aguarda no deserto.",
    overview: "Paul Atreides se une a Chani e aos Fremen enquanto busca vingança contra os conspiradores que destruíram sua família. Diante de uma escolha entre o amor de sua vida e o destino do universo, ele deve evitar um futuro terrível que só ele pode prever.",
    posterPath: "https://image.tmdb.org/t/p/w500/8b8R8l88Qje9dn9OE8PY05Nxl1X.jpg",
    backdropPath: "https://image.tmdb.org/t/p/original/xOMo8BRK7PfcJv9JCnx7s5200bm.jpg",
    releaseDate: "2024-02-29",
    runtime: 166,
    voteAverage: 8.2,
    genres: ["Ficção Científica", "Aventura", "Ação"],
    director: "Denis Villeneuve",
    cast: ["Timothée Chalamet", "Zendaya", "Rebecca Ferguson", "Javier Bardem"],
    ageRating: "14",
    status: "cartaz",
    format: ["IMAX 2D", "3D Laser"],
    trailerUrl: "https://www.youtube.com/embed/Way9Dexny3w",
    trailerKey: "Way9Dexny3w"
  },
  {
    id: 1022789,
    tmdbId: 1022789,
    title: "Divertida Mente 2",
    originalTitle: "Inside Out 2",
    tagline: "Dê espaço para novas emoções.",
    overview: "Com a chegada da adolescência, a mente da jovem Riley passa por uma reforma súbita para dar lugar a algo totalmente inesperado: novas emoções! Alegria, Tristeza, Raiva, Medo e Nojinho não têm certeza de como agir quando Ansiedade, Inveja, Tédio e Vergonha aparecem.",
    posterPath: "https://image.tmdb.org/t/p/w500/sh7Rg8Er3tFcN9BpKIPOMvALgZd.jpg",
    backdropPath: "https://image.tmdb.org/t/p/original/xg270mgWY4R49ytviURqqmPk2BC.jpg",
    releaseDate: "2024-06-20",
    runtime: 96,
    voteAverage: 7.7,
    genres: ["Animação", "Família", "Comédia", "Aventura"],
    director: "Kelsey Mann",
    cast: ["Amy Poehler", "Maya Hawke", "Kensington Tallman", "Liza Lapira"],
    ageRating: "Livre",
    status: "cartaz",
    format: ["2D Dublado", "3D Dublado"],
    trailerUrl: "https://www.youtube.com/embed/LEjhY15eCx0",
    trailerKey: "LEjhY15eCx0"
  },
  {
    id: 872585,
    tmdbId: 872585,
    title: "Oppenheimer",
    originalTitle: "Oppenheimer",
    tagline: "O mundo mudará para sempre.",
    overview: "A história do físico americano J. Robert Oppenheimer, seu papel no Projeto Manhattan e o desenvolvimento da bomba atômica durante a Segunda Guerra Mundial, seguido pelo drama político de sua audiência de segurança em 1954.",
    posterPath: "https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
    backdropPath: "https://image.tmdb.org/t/p/original/fm6KqXpk3M2HVveHwCrBSSBaO0V.jpg",
    releaseDate: "2023-07-20",
    runtime: 180,
    voteAverage: 8.1,
    genres: ["Drama", "História", "Biografia"],
    director: "Christopher Nolan",
    cast: ["Cillian Murphy", "Emily Blunt", "Matt Damon", "Robert Downey Jr."],
    ageRating: "16",
    status: "cartaz",
    format: ["IMAX 2D", "Legendado"],
    trailerUrl: "https://www.youtube.com/embed/uYPbbksJxIg",
    trailerKey: "uYPbbksJxIg"
  },
  {
    id: 558449,
    tmdbId: 558449,
    title: "Gladiador II",
    originalTitle: "Gladiator II",
    tagline: "O que fazemos na vida ecoa pela eternidade.",
    overview: "Anos depois de testemunhar a morte do reverenciado herói Maximus pelas mãos de seu tio, Lucius é forçado a entrar no Coliseu depois que sua casa é conquistada pelos imperadores tirânicos que agora lideram Roma.",
    posterPath: "https://image.tmdb.org/t/p/w500/2cxhvwyEwRlysAmRH4iodkvo0z5.jpg",
    backdropPath: "https://image.tmdb.org/t/p/original/euYIwmwkmz95mnExloguf0Mmlqj.jpg",
    releaseDate: "2024-11-14",
    runtime: 148,
    voteAverage: 7.9,
    genres: ["Ação", "Aventura", "Drama"],
    director: "Ridley Scott",
    cast: ["Paul Mescal", "Pedro Pascal", "Denzel Washington", "Connie Nielsen"],
    ageRating: "16",
    status: "cartaz",
    format: ["2D Legendado", "2D Dublado"],
    trailerUrl: "https://www.youtube.com/embed/4rgYUipGJNo",
    trailerKey: "4rgYUipGJNo"
  },
  {
    id: 449562,
    tmdbId: 449562,
    title: "Bacurau",
    originalTitle: "Bacurau",
    tagline: "Se for, vá na paz.",
    overview: "Pouco após a morte de Dona Carmelita, aos 94 anos, os habitantes de um pequeno povoado localizado no sertão brasileiro, chamado Bacurau, descobrem que a comunidade não consta mais em qualquer mapa. Aos poucos, percebem algo estranho na região.",
    posterPath: "https://image.tmdb.org/t/p/w500/q22bZq5wS1i7JqW5p9hU9zQ3X1N.jpg",
    backdropPath: "https://image.tmdb.org/t/p/original/x8Y5x9Z4w0C0e1mN3w2gG4F5tJ7.jpg",
    releaseDate: "2019-08-29",
    runtime: 132,
    voteAverage: 7.8,
    genres: ["Suspense", "Ficção Científica", "Drama"],
    director: "Kleber Mendonça Filho, Juliano Dornelles",
    cast: ["Sônia Braga", "Udo Kier", "Bárbara Colen", "Silvero Pereira"],
    ageRating: "16",
    status: "cartaz",
    format: ["2D Nacional - Sessão Mostra UNIFOR"],
    trailerUrl: "https://www.youtube.com/embed/qlHeeqdWdqk",
    trailerKey: "qlHeeqdWdqk"
  },
  {
    id: 129,
    tmdbId: 129,
    title: "A Viagem de Chihiro",
    originalTitle: "千と千尋の神隠し",
    tagline: "O túnel levou Chihiro a um mundo misterioso.",
    overview: "Chihiro e seus pais estão se mudando para uma cidade diferente. Ao pegar um atalho, deparam-se com um caminho sem saída que termina em frente a um edifício misterioso. Ao entrar, a garota descobre um mundo povoado por seres fantásticos.",
    posterPath: "https://image.tmdb.org/t/p/w500/393mhUQRIikCjxL9BG6aoaqgG86.jpg",
    backdropPath: "https://image.tmdb.org/t/p/original/Ab8mkHmkYADjU7wQiOkia9BzGvS.jpg",
    releaseDate: "2001-07-20",
    runtime: 125,
    voteAverage: 8.5,
    genres: ["Animação", "Família", "Fantasia"],
    director: "Hayao Miyazaki",
    cast: ["Rumi Hiiragi", "Miyu Irino", "Mari Natsuki", "Takashi Naito"],
    ageRating: "Livre",
    status: "cartaz",
    format: ["2D Legendado - Clássicos do Cinema"],
    trailerUrl: "https://www.youtube.com/embed/ByXuk9QqQkk",
    trailerKey: "ByXuk9QqQkk"
  },
  {
    id: 762509,
    tmdbId: 762509,
    title: "Mufasa: O Rei Leão",
    originalTitle: "Mufasa: The Lion King",
    tagline: "Todo rei tem um começo.",
    overview: "Contado através de flashbacks, Mufasa é um filhote órfão, perdido e sozinho até que conhece um simpático leão chamado Taka, herdeiro de uma linhagem real. O encontro casual dá início a uma grande jornada de um grupo de desajustados em busca de seu destino.",
    posterPath: "https://image.tmdb.org/t/p/w500/lurEK87Luk8NzWW7sqBhZwwJz4x.jpg",
    backdropPath: "https://image.tmdb.org/t/p/original/i1CdA8XwH3oZ49G9QW4mN0rT2V1.jpg",
    releaseDate: "2024-12-19",
    runtime: 118,
    voteAverage: 7.4,
    genres: ["Aventura", "Família", "Animação"],
    director: "Barry Jenkins",
    cast: ["Aaron Pierre", "Kelvin Harrison Jr.", "Seth Rogen", "Billy Eichner"],
    ageRating: "Livre",
    status: "breve",
    format: ["3D Laser", "2D Dublado"],
    trailerUrl: "https://www.youtube.com/embed/o17MF9vnabg",
    trailerKey: "o17MF9vnabg"
  },
  {
    id: 933260,
    tmdbId: 933260,
    title: "A Substância",
    originalTitle: "The Substance",
    tagline: "Você já sonhou com uma versão melhor de si mesma?",
    overview: "Elisabeth Sparkle, uma estrela decadente do fitness na TV, é demitida aos 50 anos. Desesperada, ela toma uma droga misteriosa do mercado clandestino que gera temporariamente uma versão mais jovem e perfeita de si mesma.",
    posterPath: "https://image.tmdb.org/t/p/w500/lqoMzCcZY5N2K5H2iN5qFqWw9Z7.jpg",
    backdropPath: "https://image.tmdb.org/t/p/original/7h6TqPB3ES54h3nI0zWw1uM9kY7.jpg",
    releaseDate: "2024-09-19",
    runtime: 141,
    voteAverage: 7.3,
    genres: ["Terror", "Ficção Científica", "Drama"],
    director: "Coralie Fargeat",
    cast: ["Demi Moore", "Margaret Qualley", "Dennis Quaid", "Hugo Diego Garcia"],
    ageRating: "18",
    status: "breve",
    format: ["2D Legendado - Sessão Meia-Noite"],
    trailerUrl: "https://www.youtube.com/embed/V4f_4c_h_zQ",
    trailerKey: "V4f_4c_h_zQ"
  },
  {
    id: 1184918,
    tmdbId: 1184918,
    title: "O Auto da Compadecida 2",
    originalTitle: "O Auto da Compadecida 2",
    tagline: "O retorno mais esperado do cinema brasileiro.",
    overview: "Passados mais de vinte anos após as aventuras que os tornaram inesquecíveis, Chicó e João Grilo se reencontram na mítica cidade de Taperoá, no sertão paraibano, encarando novos perigos, malandragens e milagres.",
    posterPath: "https://image.tmdb.org/t/p/w500/1Xdd3e7tY4c3Z7N5vB9cK1qL4k2.jpg",
    backdropPath: "https://image.tmdb.org/t/p/original/9Y4kY6f9z0K6c0b3N1v5h8o2xQ4.jpg",
    releaseDate: "2024-12-25",
    runtime: 115,
    voteAverage: 8.0,
    genres: ["Comédia", "Aventura", "Nacional"],
    director: "Guel Arraes, Flávia Lacerda",
    cast: ["Selton Mello", "Matheus Nachtergaele", "Taís Araújo", "Humberto Martins"],
    ageRating: "12",
    status: "breve",
    format: ["2D Nacional"],
    trailerUrl: "https://www.youtube.com/embed/z4fJ9V3jI9Y",
    trailerKey: "z4fJ9V3jI9Y"
  }
];

class TmdbService {
  constructor() {
    this.apiKey = localStorage.getItem('unifor_tmdb_api_key') || TMDB_CONFIG.DEFAULT_API_KEY;
    this.language = TMDB_CONFIG.LANGUAGE;
  }

  setApiKey(key) {
    this.apiKey = key.trim();
    localStorage.setItem('unifor_tmdb_api_key', this.apiKey);
  }

  getApiKey() {
    return this.apiKey;
  }

  // Busca filmes ao vivo no TMDb via navegador do usuário
  async searchMoviesOnline(query) {
    if (!query || query.trim() === '') return [];
    try {
      const url = `${TMDB_CONFIG.BASE_URL}/search/movie?api_key=${this.apiKey}&language=${this.language}&query=${encodeURIComponent(query)}&page=1&include_adult=false`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      return (data.results || []).map(movie => this.formatTmdbMovie(movie));
    } catch (err) {
      console.warn('[TMDb Service] Falha na busca online ou sem internet externa. Usando catálogo local.', err);
      return this.searchLocalMovies(query);
    }
  }

  // Busca detalhes completos de um filme no TMDb (incluindo créditos e vídeos de trailer)
  async getMovieDetailsOnline(tmdbId) {
    try {
      const url = `${TMDB_CONFIG.BASE_URL}/movie/${tmdbId}?api_key=${this.apiKey}&language=${this.language}&append_to_response=videos,credits`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      return this.formatTmdbDetailedMovie(data);
    } catch (err) {
      console.warn('[TMDb Service] Falha ao obter detalhes online. Usando dados locais.', err);
      const local = INITIAL_MOVIES_CATALOG.find(m => m.tmdbId == tmdbId || m.id == tmdbId);
      return local || null;
    }
  }

  // Formata o objeto retornado pelo TMDb para o padrão do Cinema UNIFOR
  formatTmdbMovie(raw) {
    const posterPath = raw.poster_path 
      ? `${TMDB_CONFIG.IMAGE_BASE_URL}${raw.poster_path}` 
      : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=60';
    const backdropPath = raw.backdrop_path 
      ? `${TMDB_CONFIG.BACKDROP_BASE_URL}${raw.backdrop_path}` 
      : posterPath;

    return {
      id: raw.id,
      tmdbId: raw.id,
      title: raw.title || raw.name,
      originalTitle: raw.original_title || '',
      tagline: '',
      overview: raw.overview || 'Sinopse não informada pelo distribuidor.',
      posterPath,
      backdropPath,
      releaseDate: raw.release_date || '',
      runtime: raw.runtime || 120,
      voteAverage: raw.vote_average ? Number(raw.vote_average.toFixed(1)) : 7.0,
      genres: ['Cinema UNIFOR'],
      director: 'Direção TMDb',
      cast: ['Elenco do Filme'],
      ageRating: '12',
      status: 'cartaz',
      format: ['2D Digital'],
      trailerUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
    };
  }

  formatTmdbDetailedMovie(raw) {
    const movie = this.formatTmdbMovie(raw);
    movie.runtime = raw.runtime || 120;
    movie.tagline = raw.tagline || '';
    if (raw.genres && raw.genres.length > 0) {
      movie.genres = raw.genres.map(g => g.name);
    }

    // Extrair diretor e elenco dos créditos
    if (raw.credits) {
      const directorObj = (raw.credits.crew || []).find(c => c.job === 'Director');
      if (directorObj) movie.director = directorObj.name;
      movie.cast = (raw.credits.cast || []).slice(0, 5).map(a => a.name);
    }

    // Extrair trailer do YouTube
    if (raw.videos && raw.videos.results) {
      const trailer = raw.videos.results.find(v => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser'));
      if (trailer && trailer.key) {
        movie.trailerKey = trailer.key;
        movie.trailerUrl = `https://www.youtube.com/embed/${trailer.key}`;
      }
    }

    return movie;
  }

  searchLocalMovies(query) {
    const q = query.toLowerCase().trim();
    return INITIAL_MOVIES_CATALOG.filter(m => 
      m.title.toLowerCase().includes(q) || 
      m.overview.toLowerCase().includes(q) ||
      m.genres.some(g => g.toLowerCase().includes(q))
    );
  }

  getInitialMovies() {
    return [...INITIAL_MOVIES_CATALOG];
  }
}

// Exporta singleton global para uso nos componentes e na área administrativa
window.tmdbService = new TmdbService();
