// template.tsx é re-montado a cada navegação — perfeito pra disparar a animação.
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="atlas-page-enter">{children}</div>;
}
