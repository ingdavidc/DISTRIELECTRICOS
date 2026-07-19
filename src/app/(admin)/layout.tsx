import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";

export const maxDuration = 60; // Increase timeout to 60s for Vercel Hobby tier
import WelcomeToast from "@/components/WelcomeToast";
import IdleTimeout from "@/components/IdleTimeout";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }
  
  if ((session.user as any).role === "CUSTOMER") {
    redirect("/profile");
  }

  return (
    <div className="dashboard-layout">
      <IdleTimeout />
      <WelcomeToast userName={session.user.name || ""} />
      <Sidebar 
        role={(session.user as any).role || "ADMIN"} 
        modules={(session.user as any).modules || []}
      />
      <div className="main-content">
        <Navbar user={session.user} />
        <main className="page-container">
          {children}
        </main>
      </div>
    </div>
  );
}
