# Cinema UNIFOR — Bibicini 🎬🏛

> **Portal Web e Sistema de Venda e Reserva de Ingressos do Cinema da Universidade de Fortaleza (UNIFOR)**  
> Campus Edson Queiroz — Fundação Edson Queiroz

---

## 🎨 Identidade Visual e Paleta Oficial
O projeto foi desenvolvido priorizando rigorosamente as cores institucionais da UNIFOR:
- **Azul Elétrico / Real UNIFOR:** `#044cf4`
- **Branco Puro:** `#ffffff`
- **Tonalidades de Apoio:** Azul Marinho Noturno (`#020c26`, `#05194d`, `#09205e`) para garantir alto contraste, elegância cinematográfica e acessibilidade visual (WCAG).

---

## 🌐 Integração com a API The Movie Database (TMDb)
- **API Oficial TMDb v3:** Conexão para busca em tempo real de títulos mundiais, sinopses oficiais em português (`pt-BR`), pôsteres em alta definição (`w500`), imagens de fundo (`original`) e trailers oficiais do YouTube.
- **Catálogo Base Rico Offline & Fallback:** Já vem pré-carregado com sucessos atuais e mostras culturais da UNIFOR (*Ainda Estou Aqui*, *Duna: Parte 2*, *Divertida Mente 2*, *Oppenheimer*, *Gladiador II*, *Bacurau*, *A Viagem de Chihiro*, *A Substância*, *O Auto da Compadecida 2*).
- **Importador TMDb no Painel Admin (Tela 23):** O administrador pode digitar o nome de qualquer filme, consultar ao vivo no TMDb e importá-lo diretamente com 1 clique para a grade de exibições do Cinema UNIFOR.
- **Chave de API Configurável (Tela 34):** Campo nas configurações para definir ou atualizar a chave do TMDb.

---

## 📑 As 36 Telas Desenvolvidas (Fase 4 - Homologação Completa)

No topo da aplicação há uma barra fixa de **Navegador do Protótipo (1 a 36)** permitindo saltar instantaneamente para qualquer uma das 36 telas especificadas:

### 👤 Área do Usuário (20 Telas)
1. **Página Inicial (RF001):** Hero carrossel com filmes TMDb, banners institucionais, grade de filmes em cartaz e lançamentos futuros.
2. **Filmes em Cartaz (RF002, RF003):** Catálogo com busca por texto e filtros por gênero (Ação, Drama, Animação, Ficção...).
3. **Em Breve / Lançamentos (RF001):** Próximas estreias com botão interativo "Avise-me".
4. **Detalhes do Filme (RF004):** Sinopse em português, trailer embutido do YouTube/TMDb, ficha técnica (direção, elenco, duração) e lista de horários.
5. **Programação por Data (RF005):** Seletor de dias da semana (Hoje, Qui, Sex, Sáb, Dom...) com sessões agrupadas por filme e sala.
6. **Seleção de Sessão (RF006, RF007):** Horários, sala, formato (2D, 3D Laser, IMAX, Dublado, Legendado) e preço.
7. **Seleção de Assentos & Timer (RF008 a RF010):** Mapa interativo com tela curva, assentos livres, selecionados, ocupados e PCD. **Possui cronômetro regressivo de 10 minutos (RN002, RN003)** que trava os assentos temporariamente e os libera se expirar.
8. **Resumo da Compra & Meia UNIFOR (RF011, RF012, RF017):** Seletor de tarifas por assento (**Meia Aluno UNIFOR com matrícula institucional**, Meia Professor, Inteira, Cortesia), cupom de desconto promocional e cálculo automático.
9. **Login de Usuário (RF014):** Autenticação com e-mail e senha, com botões de login rápido (Aluno UNIFOR, Visitante, Admin).
10. **Cadastro com Vínculo UNIFOR (RF013, LGPD):** Coleta de dados (Nome, CPF, Nascimento, Telefone, E-mail, Matrícula Institucional) e aceite obrigatório de termos LGPD (RNF009).
11. **Recuperação de Senha (RF015):** Envio simulado de token e link de redefinição por e-mail.
12. **Pagamento PIX / Cartão (RF018):**
    - Aba **PIX**: QR Code SVG dinâmico gerado em tela, chave copia e cola e botão de confirmação imediata.
    - Aba **Cartão de Crédito**: Formulário com validação de número, validade, CVV e parcelas.
    - Aba **Débito Online**.
13. **Confirmação da Compra (RF019, RF020, RF022):** Resumo do pedido, número `#UNI-PED-XXXX`, recibo e aviso de envio de e-mail.
14. **Meus Ingressos & QR Code (RF024):** Carteira digital com ingressos individuais por assento, **QR Code exclusivo (RN004)**, carimbo de status (Ativo / Utilizado / Cancelado) e botão para imprimir/salvar PDF.
15. **Histórico de Compras (RF023, RF025):** Tabela de pedidos com status e botão de cancelamento (até 2 horas antes da sessão - RN009).
16. **Perfil do Usuário (RF013, RF016):** Dados cadastrais e selo validado de vínculo acadêmico UNIFOR ativo.
17. **Contato / Localização:** Endereço oficial no Campus Edson Queiroz (Av. Washington Soares, 1321), horários da bilheteria e formulário.
18. **Perguntas Frequentes (FAQ):** Accordion com as principais dúvidas institucionais.
19. **Política de Privacidade (LGPD):** Conformidade integral com a Lei 13.709/2018 (RNF009).
20. **Termos de Uso:** Regulamento de convivência, tolerância de atraso e cancelamento.

---

### ⚙️ Área Administrativa (16 Telas)
21. **Login Administrativo (RNF007):** Acesso exclusivo para a equipe do cinema.
22. **Dashboard Operacional (RF037):** Indicadores de receita total, ingressos vendidos, sessões do dia, filmes em cartaz e tabela de taxa de ocupação.
23. **Gerenciamento de Filmes (RF026, RF027):** Tabela de títulos cadastrados com **modal de busca ao vivo e importação da API TMDb**.
24. **Gestão de Sessões & Algoritmo Anti-Conflito (RF030, RF031, RN008):** Agenda sessões e verifica matematicamente se haverá choque de horários na mesma sala (calculando duração do filme + 20 min de intervalo operacional). Se houver conflito, emite alerta visual vermelho e bloqueia o agendamento!
25. **Gerenciamento de Salas (RF028):** Cadastro de salas (Sala 1 IMAX Laser, Sala 2 Glauber Rocha, Sala 3 Rachel de Queiroz).
26. **Editor do Mapa de Assentos (RF029):** Permite clicar nos assentos para alternar entre Normal, PCD Acessível ou Bloqueado para Manutenção.
27. **Tabela de Preços (RF032):** Regras de valores por dia (Seg-Qui, Sex-Dom) e descontos institucionais.
28. **Promoções e Cupons (RF032):** Gestão de cupons de desconto (`UNIFOR10`, `QUARTAUNIFOR`, `BEMVINDO20`).
29. **Gestão de Pedidos (RF033, RF034):** Tabela com cancelamento administrativo e liberação de assentos.
30. **Transações e Pagamentos (RF019):** Relatório financeiro de pagamentos PIX e cartões.
31. **Gestão de Usuários (RF039):** Controle de permissões (Administrador, Fiscal, Docente, Aluno UNIFOR).
32. **Relatórios Gerenciais (RF035, RF036):** Taxa de ocupação detalhada (`Assentos vendidos ÷ Capacidade × 100`) e exportação para impressão.
33. **Banners e Destaques (RF038):** Gerenciamento dos destaques da Home Page.
34. **Configurações Operacionais:** Ajuste do tempo de trava temporária (padrão 10 min), intervalo entre sessões e chave da API TMDb.
35. **Auditoria e Logs (RF040):** Histórico de operações de gestão com carimbo de data/hora, usuário e ação.
36. **Validador de Ingressos da Portaria (RF021, RN004, RN005):** Scanner/leitor para os fiscais na entrada do cinema:
    - Se válido: Marca como utilizado no sistema e exibe confirmação em verde.
    - Se já utilizado anteriormente: Alerta em vermelho informando data e hora do uso anterior, bloqueando a fraude e o reuso.

---

## 🚀 Como Executar

O projeto possui um servidor HTTP embutido em Node.js (sem dependências externas):

```bash
cd /home/caique/.gemini/antigravity/scratch/cinema-unifor
npm start
```

Acesse em seu navegador:
👉 **[http://localhost:3000](http://localhost:3000)**

---

## 👥 Equipe do Projeto
- **Front-end:** Caique
- **Back-end:** Gabriel
- **UX/UI Design:** Amanda
- **Gerente de Projeto:** Edson
