import MisCotizacionesClient from "./MisCotizacionesClient";
import { getExpertUser } from "@/actions/expert";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getExpertQuotes } from "@/actions/expert-quotes";

export default async function MisCotizacionesPage() {
  const cookieExpertUser = await getExpertUser();
  const session = await auth();
  
  const isNextAuthExpert = (session?.user as any)?.role === "EXPERT";
  const user = cookieExpertUser ?? (isNextAuthExpert ? {
    id: (session!.user as any).id,
    name: session!.user?.name ?? "Aliado",
    email: session!.user?.email ?? "",
    phone: null,
  } : null);

  if (!user) {
    redirect("/aliados/login");
  }

  const result = await getExpertQuotes(user.id);
  const quotes = result.success ? result.quotes : [];

  return <MisCotizacionesClient quotes={quotes || []} />;
}
