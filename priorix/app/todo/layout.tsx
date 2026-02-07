"use client";

import { ReactNode } from "react";
import SidebarLayout from "@/components/providers/SidebarLayout";

interface TodoLayoutProps {
  children: ReactNode;
}

export default function TodoLayout({ children }: TodoLayoutProps) {
  return <SidebarLayout>{children}</SidebarLayout>;
}
