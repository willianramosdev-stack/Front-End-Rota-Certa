"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { estaAutenticado } from "@/lib/auth";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    if (!estaAutenticado()) {
      router.replace("/login");
      return;
    }
    setPronto(true);
  }, [router]);

  if (!pronto) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        Verificando sessão...
      </p>
    );
  }

  return children;
}
