export type UserRole = "personal" | "client" | "solo";

export type Profile = {
  id: string;
  role: UserRole;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  bio: string | null;
  created_at: string;
};

export type Workout = {
  id: string;
  coach_id: string;
  client_id: string | null;
  name: string;
  description: string | null;
  weekday: number | null;
  source: "manual" | "pdf";
  pdf_url: string | null;
  created_at: string;
};

export type WorkoutExercise = {
  id: string;
  workout_id: string;
  position: number;
  name: string;
  sets: number | null;
  reps: string | null;
  load_kg: number | null;
  rest_seconds: number | null;
  notes: string | null;
};

export type ClientStats = {
  client_id: string;
  xp: number;
  level: number;
  streak_days: number;
  longest_streak: number;
  last_session_date: string | null;
  total_sessions: number;
};

export type Achievement = {
  id: string;
  client_id: string;
  code: string;
  title: string;
  description: string | null;
  unlocked_at: string;
};

export type Reminder = {
  id: string;
  coach_id: string;
  client_id: string | null;
  title: string;
  body: string | null;
  scheduled_for: string | null;
  read_at: string | null;
  created_at: string;
};
