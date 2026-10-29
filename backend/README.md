# Backend — Cinema UNIFOR

API em **Node.js + Express + Mongoose**, conectada ao **MongoDB Atlas**. Implementa o DER do projeto
(gênero, filme, sala/assento, sessão, usuário, avaliação, cupom, ingresso), login com JWT,
compra de ingressos com bloqueio de assentos e um proxy para o TMDB (a chave fica no servidor).

## Como rodar

```bash
cd backend
npm install
cp .env.example .env      # no Windows: copy .env.example .env
# edite o .env: MONGODB_URI, JWT_SECRET e (opcional) TMDB_API_KEY
npm run seed              # cria gêneros, salas, filmes, sessões, cupom e o admin
npm start                 # http://localhost:3000
```

O servidor também serve o frontend de `../cinema-unifor-site(1)`, então basta abrir
`http://localhost:3000`.

**Atlas:** em *Network Access* libere seu IP; em *Database Access* use um usuário com leitura e escrita.
Se a senha tiver caracteres especiais (`@`, `#`, `/`), codifique-a em formato URL.

Admin criado pelo seed: `ADMIN_EMAIL` / `ADMIN_SENHA` do `.env` (padrão `admin@unifor.br` / `Admin@12345`).
**Troque a senha antes de publicar.** Cupom de exemplo: `UNIFOR10` (10%).

## Rotas

Autenticação: header `Authorization: Bearer <token>`. 🔒 = exige login · 🛡️ = admin.

| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/auth/registrar` | `{nome, email, senha}` → token |
| POST | `/api/auth/login` | `{email, senha}` → token |
| GET | `/api/auth/eu` 🔒 | dados do usuário logado |
| GET | `/api/generos` | lista gêneros |
| POST/PUT/DELETE | `/api/generos[/:id]` 🛡️ | CRUD de gêneros |
| GET | `/api/filmes?busca=&genero=&pagina=&limite=` | catálogo paginado |
| GET | `/api/filmes/:id` · `/api/filmes/tmdb/:tmdbId` | detalhe (por id do banco ou do TMDB) |
| POST | `/api/filmes/importar-tmdb` 🛡️ | `{tmdb_id}` cria o filme a partir do TMDB |
| POST/PUT/DELETE | `/api/filmes[/:id]` 🛡️ | CRUD de filmes |
| GET | `/api/salas` · `/api/salas/:id` | salas (com assentos no detalhe) |
| POST/PUT/DELETE | `/api/salas[/:id]` 🛡️ | `POST` aceita `fileiras` + `assentos_por_fileira` |
| GET | `/api/sessoes?id_filme=&data=AAAA-MM-DD&todas=1` | sessões (futuras por padrão) |
| GET | `/api/sessoes/:id/assentos` | mapa de assentos com `ocupado` |
| POST/PUT/DELETE | `/api/sessoes[/:id]` 🛡️ | CRUD de sessões |
| POST | `/api/ingressos` 🔒 | `{id_sessao, assentos:[ids], tipo_ingresso, codigo_cupom?}` |
| GET | `/api/ingressos/meus` 🔒 | ingressos do usuário |
| POST | `/api/ingressos/:id/cancelar` 🔒 | cancela e libera o assento |
| POST | `/api/ingressos/:id/utilizar` 🔒 | check-in (admin/funcionário) |
| GET | `/api/ingressos` 🛡️ | todos os pedidos (paginado) |
| GET | `/api/avaliacoes?id_filme=` | avaliações + média |
| POST/DELETE | `/api/avaliacoes[/:id]` 🔒 | cria / remove (dono ou admin) |
| GET | `/api/cupons/validar/:codigo` 🔒 | confere o desconto |
| GET/POST/DELETE | `/api/cupons[/:id]` 🛡️ | CRUD de cupons |
| GET | `/api/tmdb/movie/now_playing`, `/movie/:id`, `/genre/movie/list`, `/search/movie` | proxy do TMDB |
| GET | `/api/admin/resumo` 🛡️ | indicadores do painel |

## Regras importantes

- **Preço calculado no servidor**: `preço da sessão × tipo (meia = 50%) × (1 − cupom%)`. O cliente não envia valor.
- **Sem venda dupla de assento**: índice único (sessão + assento) entre ingressos ativos, e a compra roda em
  **transação** (todos os assentos ou nenhum). Cancelar um ingresso libera o assento.
- **Cupom**: `desconto` é um **percentual** (10 = 10%).
- **Pagamento simulado**: o ingresso já nasce como `pago`. Para pagamento real, integre um gateway.
- Cadastro público sempre cria `cliente`; só o seed/banco cria `admin`.
- Pequenos acréscimos ao DER: `senha_hash` (usuário), `tmdb_id`/`poster_path`/`sinopse` (filme),
  `codigo_pedido`/`tipo_ingresso`/`ativo` (ingresso) e um índice único usuário+filme em avaliação.

## Estrutura

```
backend/
├── server.js
├── scripts/seed.js
└── src/
    ├── config/db.js
    ├── middleware/   (auth.js, errors.js)
    ├── models/       (8 coleções)
    ├── routes/       (uma por recurso)
    └── services/tmdb.js
```
