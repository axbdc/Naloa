// Corre com: node seed/seed.mjs
// Lê DATABASE_URL (ou POSTGRES_URL) do ambiente, cria as tabelas se não existirem
// e faz upsert de todos os leads a partir de seed/data.mjs.
// Nunca apaga "status" nem "shares" existentes — só atualiza os campos de conteúdo.

import postgres from "postgres";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { leads } from "./data.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!connectionString) {
  console.error("Define DATABASE_URL (ou POSTGRES_URL) antes de correr o seed.");
  process.exit(1);
}

const sql = postgres(connectionString, { ssl: connectionString.includes("localhost") ? false : "require" });

async function main() {
  const schema = readFileSync(join(__dirname, "schema.sql"), "utf8");
  await sql.unsafe(schema);
  console.log(`Esquema pronto. A inserir/atualizar ${leads.length} leads...`);

  let i = 0;
  for (const lead of leads) {
    i += 1;
    await sql`
      INSERT INTO leads (
        id, section, sort_order, date_label, start_date, end_date,
        name, sub, local, angle, link, redes_sociais, site, contacto, notas
      ) VALUES (
        ${lead.id}, ${lead.section}, ${i}, ${lead.date_label}, ${lead.start_date}, ${lead.end_date},
        ${lead.name}, ${lead.sub}, ${lead.local}, ${lead.angle}, ${lead.link},
        ${lead.redes_sociais}, ${lead.site}, ${lead.contacto}, ${lead.notas}
      )
      ON CONFLICT (id) DO UPDATE SET
        section = EXCLUDED.section,
        sort_order = EXCLUDED.sort_order,
        date_label = EXCLUDED.date_label,
        start_date = EXCLUDED.start_date,
        end_date = EXCLUDED.end_date,
        name = EXCLUDED.name,
        sub = EXCLUDED.sub,
        local = EXCLUDED.local,
        angle = EXCLUDED.angle,
        link = EXCLUDED.link,
        redes_sociais = EXCLUDED.redes_sociais,
        site = EXCLUDED.site,
        contacto = EXCLUDED.contacto,
        notas = EXCLUDED.notas;
    `;
  }

  console.log("Seed concluído.");
  await sql.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
