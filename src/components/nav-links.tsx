"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Route,
  Settings,
  Truck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { logout, obterUsuario } from "@/lib/auth";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/viagens", label: "Viagens", icon: Route },
  { href: "/chat", label: "Assistente", icon: MessageCircle },
  { href: "/configuracoes", label: "Config.", icon: Settings },
] as const;

export function NavLinks({ pathname }: { pathname: string }) {
  const router = useRouter();
  const usuario = obterUsuario();

  async function sair() {
    await logout();
    router.push("/");
  }

  return (
    <>
      <Link
        href="/dashboard"
        prefetch
        className="flex items-center gap-2 font-bold text-amber-950"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500 text-white shadow-sm">
          <Truck className="h-5 w-5" />
        </span>
        <span className="hidden sm:inline">RotaCerta</span>
      </Link>

      <nav className="flex items-center gap-1">
        {links.map(({ href, label, icon: Icon }) => {
          const ativo =
            href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname === href || pathname.startsWith(`${href}/`);

          return (
            <Link
              key={href}
              href={href}
              prefetch
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                ativo
                  ? "bg-amber-500 text-white shadow-sm"
                  : "text-muted-foreground hover:bg-amber-100 hover:text-amber-950"
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden md:inline">{label}</span>
            </Link>
          );
        })}

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => void sair()}
          className="ml-1 gap-1.5 text-muted-foreground hover:text-amber-950"
          title={usuario?.nome ?? "Sair"}
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden lg:inline max-w-[100px] truncate">
            {usuario?.nome ?? "Sair"}
          </span>
        </Button>
      </nav>
    </>
  );
}
