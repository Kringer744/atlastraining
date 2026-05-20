import { SignupForm } from "./SignupForm";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: "personal" | "client" | "solo" }>;
}) {
  const sp = await searchParams;
  return <SignupForm initialRole={sp.role ?? "client"} />;
}
