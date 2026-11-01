# Backend — Cinema UNIFOR

API em **Node.js + Express + Mongoose**, conectada ao **MongoDB Atlas**. Implementa o DER do projeto
(gênero, filme, sala/assento, sessão, usuário, ingresso), login com JWT,
compra de ingressos com bloqueio de assentos e um proxy para o TMDB (a chave fica no servidor).

## Como rodar

Crie o arquivo `backend/.env` (ele não vai para o GitHub) com:

```env
MONGODB_URI=mongodb+srv://<usuario>:<senha>@<cluster>.mongodb.net/
JWT_SECRET=um-segredo-com-pelo-menos-16-caracteres
TMDB_API_KEY=            # opcional: cartazes, sinopses e trailers
PORT=3000                # opcional (padrão 3000)
ADMIN_EMAIL=admin@unifor.br   # opcional: admin criado pelo seed
ADMIN_SENHA=Admin@12345       # opcional
```

```bash
cd backend
npm install
npm run seed              # cria gêneros, salas A–E, filmes, sessões e o admin
npm start                 # http://localhost:3000
```

O servidor também serve o site React já compilado (`../frontend/dist`). Para gerar:
`cd frontend && npm install && npm run build`. Em desenvolvimento use `npm run dev` na pasta
`frontend` (veja `frontend/README.md`).

**Atlas:** em *Network Access* libere o acesso (`0.0.0.0/0` para o grupo e para a hospedagem);
em *Database Access* use um usuário com leitura e escrita.
Se a senha tiver caracteres especiais (`@`, `#`, `/`), codifique-a em formato URL.

Admin criado pelo seed: `ADMIN_EMAIL` / `ADMIN_SENHA` do `.env` (padrão `admin@unifor.br` / `Admin@12345`).
**Troque a senha antes de publicar.**
O painel administrativo do site fica em `/admin` (só para contas `admin`).

> **Atualizando de uma versão antiga** (salas 1, 2, 3 ou cupons): rode uma vez `npm run seed -- --limpar`.
> Isso apaga o banco inteiro (inclusive contas e ingressos de teste) e cria tudo de novo.

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
| GET | `/api/filmes/:id` | detalhe do filme |
| POST | `/api/filmes/importar-tmdb` 🛡️ | `{tmdb_id}` cria o filme a partir do TMDB |
| POST/PUT/DELETE | `/api/filmes[/:id]` 🛡️ | CRUD de filmes |
| GET | `/api/salas` · `/api/salas/:id` | salas (com assentos no detalhe) |
| POST/PUT/DELETE | `/api/salas[/:id]` 🛡️ | `POST {nome: "A", fileiras: ["A","B"], assentos_por_fileira: 8}` |
| GET | `/api/sessoes?id_filme=&data=AAAA-MM-DD&todas=1` | sessões (futuras por padrão) |
| GET | `/api/sessoes/:id/assentos` | mapa de assentos com `ocupado` |
| POST/PUT/DELETE | `/api/sessoes[/:id]` 🛡️ | CRUD de sessões (seg. a sáb., a partir das 13:00) |
| POST | `/api/ingressos` 🔒 | `{id_sessao, assentos:[ids], tipo_ingresso}` |
| GET | `/api/ingressos/meus` 🔒 | ingressos do usuário |
| POST | `/api/ingressos/:id/cancelar` 🔒 | cancela e libera o assento |
| POST | `/api/ingressos/:id/utilizar` 🔒 | check-in (admin/funcionário) |
| GET | `/api/ingressos?status=&codigo=` 🛡️ | todos os pedidos (paginado); `codigo` filtra um pedido (QR Code) |
| GET | `/api/tmdb/movie/now_playing`, `/movie/:id`, `/genre/movie/list`, `/search/movie` | proxy do TMDB |
| GET | `/api/admin/resumo` 🛡️ | indicadores do painel |

## Regras importantes

- **Preço calculado no servidor**: `preço da sessão × tipo (meia = 50%)`. O cliente não envia valor.
- **Sem venda dupla de assento**: índice único (sessão + assento) entre ingressos ativos, e a compra roda em
  **transação** (todos os assentos ou nenhum). Cancelar um ingresso libera o assento.
- **Horário das sessões**: de segunda a sábado, a partir das 13:00 (fuso de Fortaleza). O backend recusa outras datas.
- **Salas**: identificadas por letra (A–E); assentos em fileiras A–E.
- **Pagamento simulado**: o ingresso já nasce como `pago`. Para pagamento real, integre um gateway.
- Cadastro público sempre cria `cliente`; só o seed/banco cria `admin`.
- Pequenos acréscimos ao DER: `senha_hash` (usuário), `tmdb_id`/`poster_path`/`sinopse` (filme),
  `codigo_pedido`/`tipo_ingresso`/`ativo` (ingresso).

## Estrutura

```
backend/
├── server.js
├── scripts/seed.js
└── src/
    ├── config/db.js
    ├── middleware/   (auth.js, errors.js)
    ├── models/       (6 coleções)
    ├── routes/       (uma por recurso)
    └── services/tmdb.js
```
