import Link from "next/link";
import { AtlasLogo } from "@/components/brand/AtlasLogo";

export const metadata = {
  title: "Privacidade — Atlas Training",
  description: "Como o Atlas Training trata seus dados pessoais.",
};

export default function PrivacidadePage() {
  return (
    <main className="min-h-dvh max-w-2xl mx-auto px-5 py-8 text-atlas-contrast">
      <Link href="/" className="inline-flex items-center gap-2 mb-6">
        <AtlasLogo size={32} withWordmark />
      </Link>
      <h1 className="text-3xl font-bold tracking-tight">
        Política de Privacidade
      </h1>
      <p className="text-atlas-muted text-sm mt-1">
        Em vigor desde 20 de maio de 2026 · LGPD (Lei nº 13.709/2018)
      </p>

      <Section title="1. Quem somos">
        <p>
          O <strong>Atlas Training</strong> é uma plataforma de gestão de treinos
          e evolução física, operada para personal trainers, alunos e usuários
          autônomos. O controlador dos dados é o responsável pela conta de
          deploy desta instância.
        </p>
      </Section>

      <Section title="2. Quais dados coletamos">
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Cadastrais</strong>: nome, email, função (personal / aluno / pessoal).
          </li>
          <li>
            <strong>Autenticação</strong>: senha (armazenada apenas como hash bcrypt — nunca em texto puro).
          </li>
          <li>
            <strong>Treino</strong>: exercícios executados, séries, cargas,
            duração, percepção de esforço.
          </li>
          <li>
            <strong>Saúde</strong>: peso, % gordura, medidas corporais,
            hidratação, dados de sono (volume ambiente e padrões de ronco —
            áudio NÃO é gravado).
          </li>
          <li>
            <strong>Técnicos</strong>: cookies de sessão (HTTP-only, criptografados).
            Não usamos cookies de rastreamento.
          </li>
        </ul>
      </Section>

      <Section title="3. Para que usamos">
        <ul className="list-disc pl-5 space-y-1">
          <li>Operação da plataforma (treinos, evolução, gamificação).</li>
          <li>Vincular personal trainer ao aluno (consentido pelos dois).</li>
          <li>Estatísticas anônimas/agregadas (rankings, médias).</li>
          <li>
            <strong>Não compartilhamos com terceiros</strong> nem vendemos
            dados.
          </li>
        </ul>
      </Section>

      <Section title="4. Base legal (LGPD Art. 7º)">
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Consentimento</strong> — você concorda explicitamente ao criar conta.
          </li>
          <li>
            <strong>Execução de contrato</strong> — entregar o serviço solicitado.
          </li>
          <li>
            <strong>Legítimo interesse</strong> — segurança, prevenção de fraude.
          </li>
        </ul>
      </Section>

      <Section title="5. Sons capturados pelo modo soneca">
        <p>
          O monitoramento de sono usa o microfone APENAS para medir volume
          ambiente em tempo real (decibéis e bandas de frequência).
          <strong> Nenhuma gravação de áudio é feita</strong>. Os dados
          processados são números agregados (eventos de ruído, picos, padrão
          rítmico de ronco). Esses números ficam no seu banco de dados,
          vinculados à sua conta.
        </p>
      </Section>

      <Section title="6. Onde os dados ficam">
        <p>
          Banco NocoDB (PostgreSQL) hospedado no servidor do operador. Em
          trânsito, tudo via HTTPS. Senhas com bcrypt (custo 10). Sessões via
          JWT HS256 em cookie HTTP-only com SameSite=Lax e Secure em produção.
        </p>
      </Section>

      <Section title="7. Seus direitos (LGPD Art. 18)">
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Acesso</strong>: pedir cópia dos seus dados.</li>
          <li><strong>Correção</strong>: editar dados incorretos via app.</li>
          <li><strong>Exclusão</strong>: apagar sua conta (envia email pro operador).</li>
          <li><strong>Portabilidade</strong>: receber seus dados em JSON.</li>
          <li><strong>Revogação</strong>: cancelar consentimento a qualquer momento.</li>
          <li><strong>Oposição</strong>: opor-se a tratamento que considere abusivo.</li>
        </ul>
      </Section>

      <Section title="8. Retenção">
        <p>
          Dados mantidos enquanto a conta estiver ativa. Após pedido de
          exclusão, removidos em até 30 dias do banco principal e dos backups
          em até 90 dias.
        </p>
      </Section>

      <Section title="9. Menores de idade">
        <p>
          Plataforma destinada a maiores de 14 anos. Para menores, exige
          consentimento dos pais ou responsáveis (Art. 14 da LGPD).
        </p>
      </Section>

      <Section title="10. Contato (DPO)">
        <p>
          Para exercer qualquer direito, manda um email pra o operador da sua
          instância do Atlas (Personal Trainer ou administrador que te
          convidou). Atendimento em até 15 dias úteis.
        </p>
      </Section>

      <Section title="11. Mudanças">
        <p>
          Esta política pode ser atualizada. Mudanças significativas são
          comunicadas via app antes de entrarem em vigor.
        </p>
      </Section>

      <div className="mt-10 flex gap-3 text-sm">
        <Link href="/termos" className="text-atlas-energy hover:underline">
          Termos de uso
        </Link>
        <span className="text-atlas-muted">·</span>
        <Link href="/" className="text-atlas-energy hover:underline">
          Voltar
        </Link>
      </div>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-6">
      <h2 className="text-lg font-semibold mb-2">{title}</h2>
      <div className="text-sm text-atlas-muted leading-relaxed">{children}</div>
    </section>
  );
}
