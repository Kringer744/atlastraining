// Frases do "Coach Atlas" — voz da marca em cada momento.
// Mantenha curtas, motivacionais, sem clichê de academia genérico.

const MORNING = [
  "Bom dia. O ferro tá esperando.",
  "Acordou pra evoluir hoje.",
  "Primeiro suor antes do café — bora.",
];
const AFTERNOON = [
  "Tarde produtiva começa no treino.",
  "Tira 1h pra você. Vai vendo.",
];
const EVENING = [
  "Último round do dia. Não pisa no freio.",
  "Boa noite só depois de treinar.",
];
const NIGHT = [
  "Treino noturno hits diferente.",
  "Madrugada e disciplina andam juntas.",
];

export function greetByHour(name?: string): string {
  const h = new Date().getHours();
  const pool =
    h < 12 ? MORNING : h < 18 ? AFTERNOON : h < 22 ? EVENING : NIGHT;
  const line = pool[Math.floor(Math.random() * pool.length)];
  return name ? `${name.split(" ")[0]}, ${line.toLowerCase()}` : line;
}

const PRE_WORKOUT = [
  "Foca no controle, não na carga.",
  "Aqueceu? Então fecha o copo.",
  "3 sets pesados valem mais que 5 fracos.",
  "Hoje a mente leva o corpo.",
  "Vai com tudo. O Atlas tá com você.",
];
const SET_DONE = [
  "Mais um. Não pausa demais.",
  "Pé na tábua.",
  "Próximo set, mesma energia.",
  "Sente a fibra. Continua.",
  "Tá no flow.",
  "Pega leve no descanso, hein.",
];
const PR_HIT = [
  "🚀 NOVO PR! Você passou de você.",
  "Recorde quebrado. Vai lá registrar isso na história.",
  "Isso é evolução real. Continua.",
  "Limite anterior: superado.",
];
const HIGH_RPE = [
  "PSE alta. Recupera bem essa noite.",
  "Hoje deu tudo. Amanhã tem mais.",
  "Treino pesado, foco no sono e na comida.",
];
const LOW_RPE = [
  "Sobrou bala — próxima vez sobe a carga.",
  "Tava confortável demais. Pesa mais.",
];
const POST_WORKOUT = [
  "Treino fechado. Tá brilhando.",
  "Mais um tijolo no topo da pirâmide.",
  "Disciplina hoje, resultado amanhã.",
  "É assim que se constrói atleta.",
];

const STREAK_HIGH = [
  "Sequência insana. Não para agora.",
  "Você virou hábito. Respeitável.",
  "Cada dia que treina, fica mais difícil parar.",
];
const STREAK_RESTART = [
  "Hoje você começou de novo. E começa todo dia se precisar.",
  "Streak zerado, fome intacta.",
];

function pick(arr: string[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export const atlasCoach = {
  preWorkout: () => pick(PRE_WORKOUT),
  setDone: () => pick(SET_DONE),
  pr: () => pick(PR_HIT),
  postWorkout: (params?: { perceivedEffort?: number; streak?: number; isPR?: boolean }) => {
    if (params?.isPR) return pick(PR_HIT);
    if ((params?.perceivedEffort ?? 5) >= 8) return pick(HIGH_RPE);
    if ((params?.perceivedEffort ?? 5) <= 4) return pick(LOW_RPE);
    if ((params?.streak ?? 0) >= 7) return pick(STREAK_HIGH);
    if ((params?.streak ?? 0) === 1) return pick(STREAK_RESTART);
    return pick(POST_WORKOUT);
  },
  streak: (days: number) =>
    days >= 7 ? pick(STREAK_HIGH) : pick(STREAK_RESTART),
};
