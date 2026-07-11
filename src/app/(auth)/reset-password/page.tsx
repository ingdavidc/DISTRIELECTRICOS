import { Suspense } from "react";
import ResetPasswordForm from "./ResetPasswordForm";

// Next.js 15 Server Component receives searchParams as a Promise
export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  const token = typeof resolvedParams.token === "string" ? resolvedParams.token : "";

  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <ResetPasswordForm token={token} />
    </Suspense>
  );
}
