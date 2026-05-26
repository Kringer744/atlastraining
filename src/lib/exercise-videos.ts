// Catálogo curado de vídeos de execução de exercícios.
// Map normalizado(nome do exercício) → YouTube video ID.
// Quando não tem match, fallback: link de busca YouTube.

function normalize(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // remove acentos
    .replace(/\s+/g, " ")
    .trim();
}

// Curadoria inicial — IDs do YouTube de canais confiáveis (Cariani, Leandrinho,
// Hipertrofia Maxima, Ironberg, IronManager, ATR Atrofiados).
// Edite a vontade pra substituir por canais preferidos.
const RAW: Record<string, string> = {
  // Peito
  "supino reto": "f3lkfHnXKZA",
  "supino reto barra": "f3lkfHnXKZA",
  "supino inclinado halteres": "8iPEnn-ltC8",
  "supino inclinado": "8iPEnn-ltC8",
  "crucifixo": "eozdVDA78K0",
  "crucifixo polia": "eozdVDA78K0",
  "crossover": "taI4XduLpTk",
  "paralelas": "wjUmnZH528Y",
  "flexao de braco": "_l3ySVKYVJ8",
  "flexao": "_l3ySVKYVJ8",
  "peck deck": "Z57CtFmRMxA",

  // Costas
  "puxada frontal": "CAwf7n6Luuc",
  "puxada alta": "CAwf7n6Luuc",
  "barra fixa": "eGo4IYlbE5g",
  "remada curvada": "vT2GjY_Umpw",
  "remada baixa": "GZbfZ033f74",
  "remada cavalinho": "yLwAOL6Q_xs",
  "remada unilateral halter": "roCP6wCXPqo",
  "pulldown": "CAwf7n6Luuc",

  // Ombros
  "desenvolvimento militar": "qEwKCR5JCog",
  "desenvolvimento halteres": "qEwKCR5JCog",
  "desenvolvimento": "qEwKCR5JCog",
  "elevacao lateral": "3VcKaXpzqRo",
  "elevacao frontal": "-t7fuZ0KhDA",
  "crucifixo invertido": "ttvfGg9d76c",
  "encolhimento de ombros": "g6qbq4Lf1FI",
  "encolhimento": "g6qbq4Lf1FI",

  // Braço
  "rosca direta": "ykJmrZ5v0Oo",
  "rosca alternada banco inclinado": "soxrZlIl35U",
  "rosca martelo": "zC3nLlEvin4",
  "triceps polia corda": "kiuVA0gs3EI",
  "triceps testa": "d_KZxkY_0cM",
  "triceps coice": "6SS6K3lAwY8",
  "triceps frances": "YbX7Wd8jQ-Q",

  // Pernas
  "agachamento livre": "ultWZbUMPL8",
  "agachamento": "ultWZbUMPL8",
  "leg press 45": "IZxyjW7MPJQ",
  "leg press": "IZxyjW7MPJQ",
  "cadeira extensora": "YyvSfVjQeL0",
  "stiff": "ZmHmObUJ8nQ",
  "mesa flexora": "1Tq3QdYUuHs",
  "panturrilha em pe": "gwLzBJYoWlI",
  "panturrilha sentado": "JbyjNymZOt0",
  "afundo": "D7KaRcUTQeE",
  "avanco": "D7KaRcUTQeE",
  "cadeira abdutora": "I_LR54_xZSE",
  "cadeira adutora": "CzqxN_5d8VE",

  // Core
  "prancha": "ASdvN_XEl_c",
  "prancha frontal": "ASdvN_XEl_c",
  "prancha lateral": "K2VljzCC16g",
  "abdominal supra": "jDwoBqPH0jk",
  "abdominal canivete": "g_BYB0R-4Ws",
  "russian twist": "wkD8rjkodUI",
  "elevacao de pernas": "JB2oyawG9KI",
};

const VIDEOS = new Map<string, string>(
  Object.entries(RAW).map(([k, v]) => [normalize(k), v]),
);

export function exerciseVideoId(name: string): string | null {
  if (!name) return null;
  const n = normalize(name);
  if (VIDEOS.has(n)) return VIDEOS.get(n)!;
  // tenta match parcial (ex: "supino reto barra 45kg" → "supino reto")
  for (const [key, id] of VIDEOS.entries()) {
    if (n.includes(key)) return id;
  }
  return null;
}

export function exerciseSearchUrl(name: string): string {
  const q = encodeURIComponent(`como fazer ${name} execução correta`);
  return `https://www.youtube.com/results?search_query=${q}`;
}
