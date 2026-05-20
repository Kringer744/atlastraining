import { requireUser } from "@/lib/auth/server";
import { AppShell } from "@/components/app/AppShell";
import { PersonalNav } from "@/components/app/PersonalNav";
import { createReminder } from "../actions";
import { safeList } from "@/lib/safe";

export default async function NovoAviso({
  searchParams,
}: {
  searchParams: Promise<{ client?: string }>;
}) {
  const sp = await searchParams;
  const session = await requireUser();

  const { list: links } = await safeList<{ client_id: string }>("coach_clients", {
    where: `(coach_id,eq,${session.sub})`,
    fields: "client_id",
    limit: 200,
  });
  let clients: { id: string; full_name: string }[] = [];
  const ids = [...new Set(links.map((l) => l.client_id))];
  if (ids.length > 0) {
    const where = ids.map((id) => `(id,eq,${id})`).join("~or");
    const r = await safeList<{ id: string; full_name: string | null }>("users", {
      where,
      fields: "id,full_name",
    });
    clients = r.list.map((u) => ({ id: u.id, full_name: u.full_name ?? "Aluno" }));
  }

  return (
    <AppShell title="Novo aviso" bottomNav={<PersonalNav />}>
      <form action={createReminder} className="atlas-card space-y-3 max-w-md">
        <select name="client_id" defaultValue={sp.client ?? ""} className="atlas-input">
          <option value="">— Para todos os alunos —</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.full_name}
            </option>
          ))}
        </select>
        <input name="title" required placeholder="Título" className="atlas-input" />
        <textarea
          name="body"
          rows={3}
          placeholder="Mensagem (opcional)"
          className="atlas-input"
        />
        <input
          name="scheduled_for"
          type="datetime-local"
          placeholder="Agendar (opcional)"
          className="atlas-input"
        />
        <button className="atlas-btn-primary w-full">Enviar aviso</button>
      </form>
    </AppShell>
  );
}
