"use client";

import { ReactNode } from "react";
import SidebarLayout from "@/components/providers/SidebarLayout";

interface BrowseLayoutProps {
  children: ReactNode;
}

export default function BrowseLayout({ children }: BrowseLayoutProps) {
  return <SidebarLayout>{children}</SidebarLayout>;
}
