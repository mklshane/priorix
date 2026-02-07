"use client";

import { ReactNode } from "react";
import SidebarLayout from "@/components/providers/SidebarLayout";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return <SidebarLayout>{children}</SidebarLayout>;
}
