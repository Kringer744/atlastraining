import Link from "next/link";
import { AtlasLogo } from "@/components/brand/AtlasLogo";
import { ProgressRing } from "@/components/brand/ProgressRing";
import { ActivityDots } from "@/components/brand/ActivityDots";
import { ArrowRight, Dumbbell, Flame, LineChart, Trophy, Users } from "lucide-react";

export default function Landing() {
  return (
    <main className="min-h-dvh bg-atlas-focus text-atlas-contrast">
      <header className="px-6 py-5 flex items-center justify-between max-w-5xl mx-auto">
        <AtlasLogo withWordmark />
        <nav className="flex items-center gap-2">
          <Link href="/login" className="atlas-btn-ghost text-sm py-2 px-4">
            Entrar
          </Link>
          <Link href="/signup" className="atlas-btn-primary text-sm py-2 px-4">
            Criar conta
          </Link>
        </nav>
      </header>

      <section className="px-6 max-w-5xl mx-auto pt-8 pb-16">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <span className="atlas-chip-energy mb-4">SEU TREINO. SUA EVOLUÇÃO.</span>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight tracking-tight">
              A plataforma completa para
              <span className="text-atlas-energy"> personal trainers</span> e alunos
              evoluírem juntos.
            </h1>
            <p className="mt-4 text-atlas-muted text-lg">
              Gerencie alunos, monte treinos no app ou via PDF, acompanhe a evolução
              com dados reais e mantenha todo mundo motivado com gamificação.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/signup?role=personal" className="atlas-btn-primary">
                Sou Personal <ArrowRight size={18} />
              </Link>
              <Link href="/signup?role=client" className="atlas-btn-ghost">
                Sou Aluno
              </Link>
              <Link href="/signup?role=solo" className="atlas-btn-ghost">
                Meu Atlas Pessoal
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="atlas-card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm text-atlas-muted">Olá, Lucas</div>
                  <div className="text-xl font-semibold">Você está indo bem!</div>
                </div>
                <ProgressRing
                  value={75}
                  size={84}
                  label={<span className="text-atlas-energy text-2xl font-bold">12</span>}
                  sublabel="dias em sequência"
                />
              </div>
              <div className="atlas-card-muted">
                <div className="text-xs text-atlas-muted">Próximo treino</div>
                <div className="mt-1 font-medium">Costas + Bíceps</div>
                <div className="text-xs text-atlas-muted">Hoje · 19:00</div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <div className="atlas-card-muted text-center">
                  <div className="text-xs text-atlas-muted">Treinos</div>
                  <div className="text-xl font-bold">24</div>
                </div>
                <div className="atlas-card-muted text-center">
                  <div className="text-xs text-atlas-muted">Volume</div>
                  <div className="text-xl font-bold">8.450</div>
                </div>
                <div className="atlas-card-muted text-center">
                  <div className="text-xs text-atlas-muted">Horas</div>
                  <div className="text-xl font-bold">18,5</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 grid md:grid-cols-4 gap-4">
          {[
            { icon: Users, t: "Gerencie", d: "Alunos e treinos em um só lugar." },
            { icon: LineChart, t: "Evolua", d: "Dados reais a cada sessão." },
            { icon: Trophy, t: "Motive", d: "Gamificação com XP, níveis e medalhas." },
            { icon: Flame, t: "Conecte", d: "Personal e aluno alinhados sempre." },
          ].map((f) => (
            <div key={f.t} className="atlas-card">
              <f.icon className="text-atlas-energy" />
              <div className="mt-3 text-sm uppercase tracking-wider text-atlas-muted">
                {f.t}
              </div>
              <div className="font-medium">{f.d}</div>
            </div>
          ))}
        </div>

        <div className="mt-10">
          <ActivityDots sessionDates={[]} />
        </div>
      </section>

      <footer className="px-6 py-8 text-center text-xs text-atlas-muted">
        © Atlas Training — evolua todos os dias.
      </footer>
    </main>
  );
}
