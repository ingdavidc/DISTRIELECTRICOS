"use server";

import { prisma } from "@/lib/prisma";

export async function submitQuoteRequest(data: {
  name: string;
  company?: string;
  phone: string;
  email?: string;
  description: string;
}) {
  const quote = await prisma.quoteRequest.create({
    data
  });

  return quote;
}

export async function getQuoteRequests() {
  return await prisma.quoteRequest.findMany({
    orderBy: { createdAt: 'desc' }
  });
}

export async function updateQuoteStatus(id: string, status: string) {
  return await prisma.quoteRequest.update({
    where: { id },
    data: { status }
  });
}
