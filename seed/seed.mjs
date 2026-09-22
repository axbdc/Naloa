// Corre com: npm run seed
// Lê as credenciais do Firebase do ambiente (FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL /
// FIREBASE_PRIVATE_KEY, ou FIRESTORE_EMULATOR_HOST em dev local) e faz upsert de todos os
// leads a partir de seed/data.mjs na coleção "leads" do Firestore.
// Nunca apaga "status" de leads existentes — só atualiza os campos de conteúdo.

import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { leads } from "./data.mjs";

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
const usingEmulator = Boolean(process.env.FIRESTORE_EMULATOR_HOST);

if (!usingEmulator && (!projectId || !clientEmail || !privateKey)) {
  console.error(
    "Define FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL e FIREBASE_PRIVATE_KEY antes de correr o seed."
  );
  process.exit(1);
}

if (!getApps().length) {
  initializeApp(
    usingEmulator ? { projectId: projectId ?? "naloa-dev" } : { credential: cert({ projectId, clientEmail, privateKey }) }
  );
}

const db = getFirestore();
const leadsCol = db.collection("leads");

async function main() {
  console.log(`A inserir/atualizar ${leads.length} leads...`);

  let batch = db.batch();
  let opsInBatch = 0;
  let total = 0;

  for (let i = 0; i < leads.length; i++) {
    const lead = leads[i];
    const ref = leadsCol.doc(lead.id);
    // set com merge:true preserva "status" e "updated_at" de leads que já existem
    // (não fazem parte deste payload), e cria-os com status "todo" quando é a
    // primeira vez que o documento aparece.
    const existing = await ref.get();
    const data = {
      section: lead.section,
      sort_order: i + 1,
      date_label: lead.date_label ?? null,
      start_date: lead.start_date ?? null,
      end_date: lead.end_date ?? null,
      name: lead.name,
      sub: lead.sub ?? null,
      local: lead.local ?? null,
      angle: lead.angle ?? null,
      link: lead.link ?? null,
      redes_sociais: lead.redes_sociais ?? null,
      site: lead.site ?? null,
      contacto: lead.contacto ?? null,
      notas: lead.notas ?? null,
    };
    if (!existing.exists) {
      data.status = "todo";
      data.updated_at = new Date().toISOString();
    }
    batch.set(ref, data, { merge: true });
    opsInBatch += 1;
    total += 1;

    // Firestore limita batches a 500 operações.
    if (opsInBatch === 450) {
      await batch.commit();
      batch = db.batch();
      opsInBatch = 0;
    }
  }

  if (opsInBatch > 0) {
    await batch.commit();
  }

  console.log(`Seed concluído. ${total} leads processados.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
