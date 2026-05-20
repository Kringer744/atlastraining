// Sugestões de treino prontas — usuário escolhe e populamos o form.

export type WorkoutTemplate = {
  id: string;
  name: string;
  description: string;
  muscle_groups: string[]; // keys do BodyMuscles
  weekday?: number | null; // opcional
  exercises: {
    name: string;
    sets?: number;
    reps?: string;
    rest_seconds?: number;
    notes?: string;
  }[];
};

export const WORKOUT_TEMPLATES: WorkoutTemplate[] = [
  {
    id: "push",
    name: "Push (Peito + Ombro + Tríceps)",
    description: "Empurrar pesado. Foco em força e volume.",
    muscle_groups: ["peito", "ombros", "triceps"],
    exercises: [
      { name: "Supino reto", sets: 4, reps: "8-10", rest_seconds: 90 },
      { name: "Supino inclinado halteres", sets: 3, reps: "10-12", rest_seconds: 75 },
      { name: "Desenvolvimento militar", sets: 4, reps: "8-10", rest_seconds: 90 },
      { name: "Elevação lateral", sets: 3, reps: "12-15", rest_seconds: 60 },
      { name: "Tríceps polia corda", sets: 3, reps: "12-15", rest_seconds: 60 },
      { name: "Tríceps testa", sets: 3, reps: "10-12", rest_seconds: 60 },
    ],
  },
  {
    id: "pull",
    name: "Pull (Costas + Bíceps)",
    description: "Puxar pesado. Construir as costas largas.",
    muscle_groups: ["costas", "trapezio", "biceps", "antebraco"],
    exercises: [
      { name: "Barra fixa (ou puxada alta)", sets: 4, reps: "6-10", rest_seconds: 120 },
      { name: "Remada curvada", sets: 4, reps: "8-10", rest_seconds: 90 },
      { name: "Remada baixa", sets: 3, reps: "10-12", rest_seconds: 75 },
      { name: "Encolhimento de ombros", sets: 3, reps: "12-15", rest_seconds: 60 },
      { name: "Rosca direta", sets: 3, reps: "10-12", rest_seconds: 60 },
      { name: "Rosca martelo", sets: 3, reps: "12", rest_seconds: 60 },
    ],
  },
  {
    id: "legs",
    name: "Legs (Pernas completo)",
    description: "Dia mais sagrado. Não pula.",
    muscle_groups: ["quadriceps", "posterior", "gluteos", "panturrilha"],
    exercises: [
      { name: "Agachamento livre", sets: 4, reps: "6-10", rest_seconds: 150 },
      { name: "Leg press 45°", sets: 4, reps: "10-12", rest_seconds: 120 },
      { name: "Cadeira extensora", sets: 3, reps: "12-15", rest_seconds: 60 },
      { name: "Stiff", sets: 3, reps: "10-12", rest_seconds: 90 },
      { name: "Mesa flexora", sets: 3, reps: "12-15", rest_seconds: 60 },
      { name: "Panturrilha em pé", sets: 4, reps: "15-20", rest_seconds: 45 },
    ],
  },
  {
    id: "peito-triceps",
    name: "Peito + Tríceps",
    description: "Clássico. Volume no peitoral, fechando com tríceps.",
    muscle_groups: ["peito", "triceps"],
    exercises: [
      { name: "Supino reto barra", sets: 4, reps: "8-10", rest_seconds: 90 },
      { name: "Supino inclinado halteres", sets: 3, reps: "10-12", rest_seconds: 75 },
      { name: "Crucifixo polia", sets: 3, reps: "12-15", rest_seconds: 60 },
      { name: "Paralelas", sets: 3, reps: "AMRAP", rest_seconds: 90 },
      { name: "Tríceps testa", sets: 3, reps: "10-12", rest_seconds: 60 },
      { name: "Tríceps coice", sets: 3, reps: "12-15", rest_seconds: 60 },
    ],
  },
  {
    id: "costas-biceps",
    name: "Costas + Bíceps",
    description: "Puxada pesada e fechamento com pico de bíceps.",
    muscle_groups: ["costas", "biceps", "antebraco"],
    exercises: [
      { name: "Puxada frontal", sets: 4, reps: "8-10", rest_seconds: 90 },
      { name: "Remada cavalinho", sets: 4, reps: "8-10", rest_seconds: 90 },
      { name: "Remada unilateral halter", sets: 3, reps: "10-12", rest_seconds: 60 },
      { name: "Rosca direta", sets: 4, reps: "10-12", rest_seconds: 60 },
      { name: "Rosca alternada banco inclinado", sets: 3, reps: "10-12", rest_seconds: 60 },
      { name: "Rosca martelo", sets: 3, reps: "12-15", rest_seconds: 45 },
    ],
  },
  {
    id: "ombro-abs",
    name: "Ombros + Core",
    description: "Definir os ombros e travar o core.",
    muscle_groups: ["ombros", "abdomen"],
    exercises: [
      { name: "Desenvolvimento halteres", sets: 4, reps: "8-10", rest_seconds: 90 },
      { name: "Elevação lateral", sets: 4, reps: "12-15", rest_seconds: 45 },
      { name: "Elevação frontal", sets: 3, reps: "12", rest_seconds: 45 },
      { name: "Crucifixo invertido", sets: 3, reps: "12-15", rest_seconds: 45 },
      { name: "Prancha (segurar)", sets: 3, reps: "60s", rest_seconds: 30 },
      { name: "Abdominal canivete", sets: 3, reps: "15-20", rest_seconds: 30 },
    ],
  },
  {
    id: "full-iniciante",
    name: "Full Body Iniciante",
    description: "Quem tá começando: corpo todo, 3x na semana.",
    muscle_groups: ["peito", "costas", "quadriceps", "abdomen"],
    exercises: [
      { name: "Agachamento livre", sets: 3, reps: "8-10", rest_seconds: 90 },
      { name: "Supino reto", sets: 3, reps: "8-10", rest_seconds: 90 },
      { name: "Remada curvada", sets: 3, reps: "8-10", rest_seconds: 90 },
      { name: "Desenvolvimento", sets: 3, reps: "8-10", rest_seconds: 75 },
      { name: "Prancha", sets: 3, reps: "30-45s", rest_seconds: 30 },
    ],
  },
  {
    id: "abs",
    name: "ABS Express",
    description: "20 minutos focado no abdômen.",
    muscle_groups: ["abdomen"],
    exercises: [
      { name: "Prancha frontal", sets: 3, reps: "45s", rest_seconds: 30 },
      { name: "Abdominal supra", sets: 3, reps: "20", rest_seconds: 30 },
      { name: "Elevação de pernas", sets: 3, reps: "12-15", rest_seconds: 45 },
      { name: "Russian twist", sets: 3, reps: "30 (15/lado)", rest_seconds: 30 },
      { name: "Prancha lateral", sets: 2, reps: "30s/lado", rest_seconds: 30 },
    ],
  },
];
