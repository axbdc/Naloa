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
- **Base de dados:** Postgres. Recomendado: a integração **Neon** do Vercel
  (gratuita, storage.new dentro do dashboard do projeto) — fica tudo em 2 cliques,
  sem sair do Vercel. Alternativa igualmente boa e gratuita: [Neon](https://neon.tech)
  ou [Supabase](https://supabase.com) diretamente.

## Estrutura

- `src/app/(app)/leads` — tabela de leads, agrupada por setor, com botões de estado
  (Por contactar / Contactado / Fechado) e campos editáveis (redes sociais, site,
  contacto, notas).
- `src/app/(app)/calendario` — todos os eventos com data, agrupados por mês, com
  partilha por link.
- `src/app/partilha/[token]` — página pública (sem login) que mostra um evento ou o
  calendário completo consoante o link partilhado.
- `src/app/login` — a única página acessível sem sessão, além de `/partilha/*`.
- `seed/` — dados iniciais (os leads pesquisados) + esquema SQL + script de seed.

## Correr localmente

```bash
npm install
cp .env.example .env.local   # preenche DATABASE_URL, APP_PASSWORD, APP_SECRET
npm run seed                 # cria as tabelas e insere os leads
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

3. **Base de dados (antes do primeiro deploy, ou logo a seguir)**: no projeto no
   Vercel → separador **Storage** → **Create Database** → escolhe **Neon**
   (Postgres serverless, tem plano gratuito). Isto cria automaticamente a variável
   `DATABASE_URL` (ou `POSTGRES_URL`) no projeto — não precisas de copiar nada à mão.

4. **Variáveis de ambiente**: Project → Settings → Environment Variables, adiciona:
   - `APP_PASSWORD` — a password que vais usar para entrar
   - `APP_SECRET` — uma string aleatória longa (gera com
     `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)

5. **Deploy**. Depois do primeiro deploy com sucesso, corre o seed uma vez contra a
   base de dados de produção (a partir do teu computador, com a `DATABASE_URL` que o
   Vercel te deu em Settings → Environment Variables → copia o valor):

   ```bash
   DATABASE_URL="<cola aqui a connection string do Vercel/Neon>" node seed/seed.mjs
   ```

   Isto cria as tabelas e insere os 68 leads. Corres isto de novo sempre que eu
   atualizar os dados de origem em `seed/data.mjs` (nunca apaga o estado que já
   tenhas guardado nem os links de partilha ativos).

A partir daqui, qualquer `git push` para `main` faz o Vercel publicar
automaticamente a nova versão.

## Porquê Neon/Postgres em vez de outra coisa

Precisas de um sítio para guardar o estado dos leads (estado de contacto, notas) e os
links de partilha — e que sobreviva a um simples refresh da página, ao contrário da
versão anterior que guardava tudo só no browser. Neon é Postgres a sério, plano
gratuito generoso para este volume de dados (algumas centenas de linhas), e integra-se
no Vercel com dois cliques (a variável de ligação aparece sozinha, sem copiar
credenciais). Se preferires, o Supabase é uma alternativa igualmente sólida e
gratuita — o código não muda, só precisas de colar a connection string dele em
`DATABASE_URL`.
