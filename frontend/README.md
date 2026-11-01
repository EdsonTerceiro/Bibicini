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

## Estrutura

```
src/
├── main.jsx            ponto de entrada
├── App.jsx             página + controle do modal (qual tela está aberta)
├── api.js              chamadas à API do backend
├── util.js             formatação de preço, data, tipos de ingresso
├── styles.css
├── contexts/           AuthContext (login) e ToastContext (mensagens)
├── components/         Header, Hero, Catalogo, FilmeCard, Programacao, Beneficios, Newsletter, Footer, Modal
└── telas/              DetalhesFilme, MapaAssentos, Checkout, IngressoConfirmado, MeusIngressos, Login, Cadastro, Conta
```
