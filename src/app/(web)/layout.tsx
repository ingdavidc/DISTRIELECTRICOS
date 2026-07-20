import PublicNavbar from "@/components/web/PublicNavbar";
import Footer from "@/components/web/Footer";
import AiAssistant from "@/components/web/AiAssistant";
import { CartProvider } from "@/components/web/CartContext";
import CartSidebar from "@/components/web/CartSidebar";
import { auth } from "@/auth";

export default async function WebLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { getB2BUser } = await import("@/actions/b2b-login");
  const b2bUser = await getB2BUser();

  const { getExpertUser } = await import("@/actions/expert");
  const cookieExpertUser = await getExpertUser();

  // Also check NextAuth session for EXPERT role (new login flow)
  const session = await auth();
  const isNextAuthExpert = (session?.user as any)?.role === "EXPERT";
  const expertUser = cookieExpertUser ?? (isNextAuthExpert ? {
    id: (session!.user as any).id,
    name: session!.user?.name ?? "Aliado",
    email: session!.user?.email ?? "",
    phone: null,
  } : null);

  return (
    <CartProvider>
      <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <PublicNavbar b2bUser={b2bUser} expertUser={expertUser} />
        <main style={{ flex: 1 }}>
          {children}
        </main>
        <Footer />
        <AiAssistant />
      </div>
      <CartSidebar />
    </CartProvider>
  );
}
