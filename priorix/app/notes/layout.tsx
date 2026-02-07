"use client";

import { ReactNode } from "react";
import SidebarLayout from "@/components/providers/SidebarLayout";

interface NotesLayoutProps {
  children: ReactNode;
}

export default function NotesLayout({ children }: NotesLayoutProps) {
  return <SidebarLayout>{children}</SidebarLayout>;
}
