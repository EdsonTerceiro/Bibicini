# Cinema UNIFOR — front-end (React + Vite)

## Desenvolvimento

Dois terminais:

```bash
# terminal 1
cd backend
npm start

# terminal 2
cd frontend
npm install      # só na primeira vez
npm run dev      # abre em http://localhost:5173
```

O Vite repassa as chamadas `/api` para o backend (a porta é lida do `PORT` em `backend/.env`).
Ao salvar um arquivo, a página atualiza sozinha.

## Versão final

```bash
cd frontend
npm run build    # gera frontend/dist
cd ../backend
npm start        # o backend passa a servir o site em http://localhost:PORT
```

## Páginas

| Endereço | Página |
|---|---|
| `/` | Início (destaques, programação, benefícios) |
| `/filmes` | Todos os filmes, com busca, filtro e "Carregar mais" |
| `/entrar` | Login |
| `/cadastro` | Criar conta |
| `/admin` | Painel administrativo (só contas `admin`): visão geral, filmes, gêneros, sessões, salas e vendas |

Detalhes do filme, assentos, checkout, ingresso e "Meus ingressos" abrem num modal por cima da página.

## Estrutura

```
src/
├── main.jsx            ponto de entrada
├── App.jsx             escolhe a página pelo endereço + controla o modal
├── rota.jsx            roteador simples (useRota, navegar, <Link>)
├── api.js              chamadas à API do backend
├── util.js             formatação de preço, data, tipos de ingresso
├── styles.css
├── paginas/            Inicio, Filmes, Entrar, Cadastro, Admin, NaoEncontrada
├── admin/              abas do painel: Resumo, AdminFilmes, AdminGeneros, AdminSessoes, AdminSalas, AdminVendas
├── contexts/           AuthContext (login) e ToastContext (mensagens)
├── components/         Header, Hero, Catalogo, FilmeCard, Programacao, Beneficios, Newsletter, Footer, Modal, AuthLayout, QrCode
└── telas/              DetalhesFilme, MapaAssentos, Checkout, IngressoConfirmado, MeusIngressos, Conta
```
