"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useLogoutMutation } from "@/store/api";

export function LogoutButton({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [logout, { isLoading }] = useLogoutMutation();
  const onClick = async () => {
    await logout().unwrap().catch(() => null); // signed out locally either way
    router.replace("/login");
  };
  return (
    <Button size={compact ? "sm" : "md"} className={compact ? "" : "w-full"} loading={isLoading} onClick={onClick}>
      <LogOut aria-hidden />
      Log out
    </Button>
  );
}
