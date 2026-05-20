// Map nome -> tableId no NocoDB.
// Gerado por `scripts/bootstrap-nocodb.mjs` em tables.json e embutido no bundle.
// Em produção pode-se sobrescrever via env NOCODB_TABLE_IDS (JSON string).

import staticIds from "./tables.json";

type Tables = {
  users: string;
  coach_clients: string;
  workouts: string;
  workout_exercises: string;
  sessions: string;
  session_sets: string;
  reminders: string;
  measurements: string;
  client_stats: string;
  achievements: string;
  water_logs: string;
  sleep_sessions: string;
};

function loadTableIds(): Tables {
  const envIds = process.env.NOCODB_TABLE_IDS;
  if (envIds) {
    try {
      return JSON.parse(envIds);
    } catch {
      // ignore
    }
  }
  return staticIds as Tables;
}

export const TABLE_IDS = loadTableIds();
