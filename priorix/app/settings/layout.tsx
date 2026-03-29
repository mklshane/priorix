"use client";

import { usePathname, useRouter } from "next/navigation";
import SidebarLayout from "@/components/providers/SidebarLayout";
import { cn } from "@/lib/utils";

const tabs = [
  { label: "Learning", href: "/settings/learning" },
  { label: "Profile", href: "/settings/profile" },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <SidebarLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex border-b-2 border-border mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.href}
              onClick={() => router.push(tab.href)}
              className={cn(
                "px-4 py-2 text-xs font-bold uppercase tracking-widest border-b-2 -mb-[2px] transition-colors",
                pathname === tab.href
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {children}
      </div>
    </SidebarLayout>
  );
}
