import Link from "next/link";
import { AtlasLogo } from "@/components/brand/AtlasLogo";

export const metadata = {
  title: "Termos de Uso — Atlas Training",
};

export default function TermosPage() {
  return (
    <main className="min-h-dvh max-w-2xl mx-auto px-5 py-8 text-atlas-contrast">
      <Link href="/" className="inline-flex items-center gap-2 mb-6">
        <AtlasLogo size={32} withWordmark />
      </Link>
      <h1 className="text-3xl font-bold tracking-tight">Termos de Uso</h1>
      <p className="text-atlas-muted text-sm mt-1">
        Em vigor desde 20 de maio de 2026.
      </p>

      <S t="1. Aceitação">
        Ao criar uma conta, você concorda com estes termos e com a{" "}
        <Link href="/privacidade" className="text-atlas-energy hover:underline">
          Política de Privacidade
        </Link>
        .
      </S>

      <S t="2. Cadastro">
        Você fornece informações verídicas e mantém sua senha em sigilo. É
        responsável por toda atividade na sua conta.
      </S>

      <S t="3. Uso aceitável">
        Não use o app para:
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>Atividades ilegais.</li>
          <li>Burlar limites técnicos (scraping massivo, ataques, etc).</li>
          <li>Conteúdo ofensivo, calúnia, ódio.</li>
          <li>Manipular gamificação (bots, multiconta).</li>
        </ul>
      </S>

      <S t="4. Treinos e saúde">
        <strong>O Atlas não substitui acompanhamento médico ou de profissional
        de educação física.</strong> Treinos sugeridos são genéricos. Antes de
        iniciar um programa de exercícios, consulte um médico.
      </S>

      <S t="5. Dados de saúde">
        Você é livre pra registrar peso, medidas, sono. Não compartilhe esses
        dados com pessoas em quem não confia. O personal trainer só vê dados
        dos alunos que o vincularam.
      </S>

      <S t="6. Propriedade">
        O código do Atlas Training é do operador. Seus dados são seus.
      </S>

      <S t="7. Suspensão de conta">
        Podemos suspender contas que violem estes termos. Você pode pedir
        exclusão a qualquer momento.
      </S>

      <S t="8. Limitação de responsabilidade">
        O Atlas é fornecido "como está". Não nos responsabilizamos por lesões
        decorrentes do uso indevido das informações.
      </S>

      <S t="9. Mudanças">
        Termos podem mudar. Mudanças relevantes são comunicadas no app.
      </S>

      <S t="10. Foro">
        Foro da comarca do operador da instância, conforme legislação brasileira.
      </S>

      <div className="mt-10 flex gap-3 text-sm">
        <Link href="/privacidade" className="text-atlas-energy hover:underline">
          Privacidade
        </Link>
        <span className="text-atlas-muted">·</span>
        <Link href="/" className="text-atlas-energy hover:underline">
          Voltar
        </Link>
      </div>
    </main>
  );
}

function S({ t, children }: { t: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="text-lg font-semibold mb-2">{t}</h2>
      <div className="text-sm text-atlas-muted leading-relaxed">{children}</div>
    </section>
  );
}
