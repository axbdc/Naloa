# Naloa · Radar de Prospeção (webapp)

Webapp privada da Naloa: tabela de leads (com estado de contacto, redes sociais, site
e contacto de cada lead) + calendário partilhável por link.

- **Só tu tens acesso.** A app inteira está atrás de uma password (`APP_PASSWORD`).
  Não há contas nem lista de utilizadores.
- **Partilha por link.** No calendário, cada evento tem um botão "Partilhar" que gera
  um link único (`/partilha/<token>`) que qualquer pessoa com o link pode ver, sem
  precisar de login. Também podes partilhar o calendário inteiro. Podes remover
  ("Remover") qualquer link a qualquer momento — deixa logo de funcionar.
- **Criar eventos.** Botão "+ Novo evento" no calendário — nome, datas, local, nota e
  link. Fica logo visível no calendário e também na tabela de leads, numa secção
  "Adicionados por ti".
- **Base de dados:** Firebase Firestore (plano gratuito Spark, mais do que suficiente
  para este volume de dados).
- **Calendário em grelha.** Vista de mês tipo calendário normal (dias em grelha, não
  lista), com os eventos desse dia dentro de cada célula — dá para alternar para a
  vista em lista a qualquer momento ("Grelha" / "Lista").
- **Ficha de evento completa.** Ao clicar num evento (na tabela, no kanban ou no
  calendário) abre-se um painel com hora de início/fim, tipo de serviço (fotografia,
  vídeo, fotografia + vídeo, drone, outro), equipa/pessoas envolvidas, checklist de
  material necessário (com checkboxes), orçamento e estado de pagamento (pendente /
  pago), além dos campos já existentes (redes sociais, site, contacto, notas).
- **Modo escuro / claro.** Botão no topo (ao lado do "Sair") alterna entre os dois; a
  escolha fica guardada no browser e respeita por omissão o tema do sistema.
- **Vista kanban.** Nos leads, além da tabela por setor há uma vista kanban (Por
  contactar / Contactado / Fechado) com drag-and-drop para mudar o estado.
- **Duplicar evento.** Dentro da ficha de um evento, "Duplicar evento" cria uma cópia
  com novas datas (útil para eventos recorrentes).
- **Exportar calendário (.ics).** Cada link de partilha do calendário tem também um
  "Copiar link .ics" — cola esse link no Calendário do iPhone/Google Calendar
  ("subscrever calendário") e os eventos aparecem lá, sempre atualizados.
- **Pesquisa.** Campo de pesquisa por nome/local, tanto na tabela de leads como no
  calendário.
- **Instalável como app (PWA).** No telemóvel, "Adicionar ao ecrã principal" (Safari/
  Chrome) instala a Naloa como app, com ícone próprio — sem custo nenhum, não é a App
  Store/Play Store, é só o browser a guardar um atalho. Os dados são sempre pedidos
  em direto (não há cache offline), para nunca mostrares informação desatualizada.

## Estrutura

- `src/app/(app)/leads` — tabela de leads (vista tabela ou kanban), agrupada por
  setor, com botões de estado (Por contactar / Contactado / Fechado), pesquisa e
  campos editáveis (redes sociais, site, contacto, notas).
- `src/app/(app)/event-detail-modal.tsx` — a ficha de evento partilhada (usada pela
  tabela, pelo kanban e pelo calendário): horas, tipo de serviço, equipa, material,
  orçamento/pagamento e a opção de duplicar.
- `src/app/(app)/calendario` — calendário em grelha (com alternativa em lista),
  agrupado por mês, com partilha por link e exportação `.ics`.
- `src/app/(app)/theme-toggle.tsx` — o botão de modo escuro/claro.
- `src/app/partilha/[token]` — página pública (sem login) que mostra um evento ou o
  calendário completo consoante o link partilhado.
- `src/app/api/ical/[token]` — gera o ficheiro `.ics` para o link de partilha do
  calendário.
- `src/app/login` — a única página acessível sem sessão, além de `/partilha/*` e
  `/api/ical/*`.
- `public/manifest.json`, `public/sw.js`, `public/icons/` — configuração da app
  instalável (PWA).
- `seed/` — dados iniciais (os leads pesquisados) + script de seed para o Firestore.

## Criar o projeto Firebase (uma vez só)

1. Vai a [console.firebase.google.com](https://console.firebase.google.com) → **Adicionar
   projeto** → dá-lhe um nome (ex. `naloa-app`) → podes desligar o Google Analytics, não
   é preciso.
2. No menu lateral, **Compilação → Firestore Database** → **Criar base de dados** →
   escolhe uma localização (ex. `eur3 (europe-west)`) → começa em **modo de produção**
   (as regras de segurança não importam aqui, porque só o servidor Next.js acede à base
   de dados, nunca o browser diretamente).
3. **Definições do projeto** (ícone de engrenagem) → **Contas de serviço** → **Gerar
   nova chave privada**. Isto descarrega um ficheiro `.json` — abre-o, vais precisar de
   3 valores dele: `project_id`, `client_email` e `private_key`.

## Correr localmente

```bash
npm install
cp .env.example .env.local   # cola aqui os 3 valores do ficheiro .json + APP_PASSWORD/APP_SECRET
npm run seed                 # insere os leads no Firestore
npm run dev
```

Abre http://localhost:3000 e entra com a `APP_PASSWORD` que definiste.

## Publicar (GitHub → Vercel)

1. **Criar o repositório no GitHub** (github.com → New repository, vazio, sem
   README). Depois, neste projeto:

   ```bash
   git remote add origin https://github.com/<o-teu-user>/naloa-app.git
   git branch -M main
   git push -u origin main
   ```

2. **Importar no Vercel**: vercel.com → Add New → Project → escolhe o repositório
   `naloa-app` no GitHub. O Vercel deteta Next.js automaticamente, não precisas de
   mudar nenhuma definição de build.

3. **Variáveis de ambiente**: Project → Settings → Environment Variables, adiciona:
   - `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` — os
     mesmos 3 valores do ficheiro `.json` da conta de serviço (cola a `private_key`
     completa, com as `\n` incluídas, tal como vem no ficheiro).
   - `APP_PASSWORD` — a password que vais usar para entrar
   - `APP_SECRET` — uma string aleatória longa (gera com
     `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)

4. **Deploy**. Depois do primeiro deploy com sucesso, corre o seed uma vez contra o
   Firestore de produção (a partir do teu computador, usando o mesmo `.env.local` que
   já tens configurado):

   ```bash
   npm run seed
   ```

   Isto insere os 68 leads. Corres isto de novo sempre que eu atualizar os dados de
   origem em `seed/data.mjs` (nunca apaga o estado que já tenhas guardado — status,
   notas, contacto — nem os links de partilha ativos).

A partir daqui, qualquer `git push` para `main` faz o Vercel publicar
automaticamente a nova versão.

## Porquê Firebase/Firestore

Precisas de um sítio para guardar o estado dos leads (estado de contacto, notas) e os
links de partilha — e que sobreviva a um simples refresh da página. O Firestore tem
plano gratuito (Spark) generoso para este volume de dados (menos de 100 documentos),
não tem custo de "always-on" como uma base de dados relacional tradicional, e já
usas Firebase noutros projetos teus, o que evita mais uma conta/serviço para gerir.
