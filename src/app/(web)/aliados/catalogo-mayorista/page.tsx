import { getExpertUser } from "@/actions/expert";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import CatalogoMayoristaClient from "./CatalogoMayoristaClient";

export default async function CatalogoMayoristaPage() {
  const [cookieUser, session] = await Promise.all([
    getExpertUser(),
    auth(),
  ]);

  const isExpertSession = (session?.user as any)?.role === "EXPERT";
  
  if (!cookieUser && !isExpertSession) {
    redirect("/aliados");
  }

  const userId = cookieUser?.id ?? (session?.user as any)?.id;
  const userName = cookieUser?.name ?? session?.user?.name ?? "Aliado Experto";

  return <CatalogoMayoristaClient userId={userId} userName={userName} />;
}
