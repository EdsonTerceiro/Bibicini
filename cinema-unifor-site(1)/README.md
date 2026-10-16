# Cinema UNIFOR — protótipo web

Interface responsiva em HTML, CSS e JavaScript, com identidade visual baseada em azul UNIFOR (`#044cf4`) e branco. O projeto usa a API do The Movie Database (TMDB) para carregar filmes em cartaz, gêneros, detalhes e trailers.

## Como executar
1. Extraia a pasta.
2. Abra `index.html` no navegador. Para evitar restrições do navegador e facilitar testes, recomenda-se usar um servidor local:
   - VS Code: extensão **Live Server** → “Open with Live Server”; ou
   - Python: `python3 -m http.server 8000` dentro desta pasta e acesse `http://localhost:8000`.
3. A página funciona em modo demonstração mesmo sem chave API. Para dados ao vivo, clique em **Entrar → Configurar API TMDB** (ou abra o botão de login e escolha configurar API).
4. Solicite sua chave em https://www.themoviedb.org/settings/api e cole a chave **API Read Access Token (v4)**? **A implementação atual espera a chave API v3 (api_key)**. Use a chave API v3 da sua conta TMDB.

## O que está implementado no protótipo
- Página inicial com identidade visual UNIFOR, catálogo, busca por título, filtro de gênero e carregamento adicional.
- Integração TMDB: filmes em cartaz no Brasil, gêneros, detalhes e consulta de trailer.
- Detalhes do filme e sessões ilustrativas.
- Mapa interativo de assentos com estados disponível/selecionado/ocupado.
- Fluxo demonstrativo de pedido, seleção de ingresso, totalização e comprovante baixável.
- Login e cadastro de demonstração, sem autenticação real.
- Painel administrativo demonstrativo com indicadores, catálogo, sessões e pedidos locais.
- Layout adaptável a computador, tablet e celular; foco de teclado, textos alternativos e respeito a `prefers-reduced-motion`.

## Importante: limites do protótipo
Este é um **frontend acadêmico**, não um sistema de venda real. As sessões, preços e assentos são ilustrativos. Os pedidos ficam no `localStorage` do navegador. Não há backend, banco de dados, pagamento, autenticação segura, bloqueio concorrente de assentos, emissão/validação real de QR Code, envio de e-mail nem integração com sistemas institucionais. Não informe dados bancários reais.

Para produção, implementar backend/API e banco de dados; autenticação e autorização por perfil; hash seguro de senhas; bloqueio transacional de assentos; gateway de pagamento; QR Code único validado no servidor; HTTPS, logs, backups e adequação à LGPD. A chave TMDB no navegador é visível para quem inspecionar o site; para implantação pública, prefira um backend/proxy.

## Requisitos de referência
A estrutura prioriza os requisitos do documento anexado: página inicial, catálogo/pesquisa, detalhes, programação, seleção de sessão e assentos, tipos e total de ingressos, fluxo de compra demonstrativo, comprovante, além de uma prévia da área administrativa. As funcionalidades que dependem de servidor estão identificadas como demonstração.
