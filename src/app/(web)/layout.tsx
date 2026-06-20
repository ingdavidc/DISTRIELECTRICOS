import PublicNavbar from "@/components/web/PublicNavbar";
import Footer from "@/components/web/Footer";
import AiAssistant from "@/components/web/AiAssistant";

export default function WebLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <PublicNavbar />
      <main style={{ flex: 1 }}>
        {children}
      </main>
      <Footer />
      <AiAssistant />
    </div>
  );
}
