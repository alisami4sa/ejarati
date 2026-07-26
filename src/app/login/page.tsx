import { redirect } from "next/navigation";
import { OtpAuthForm } from "@/components/otp-auth-form";
import { getSessionUser } from "@/lib/session";

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");
  return <OtpAuthForm />;
}
