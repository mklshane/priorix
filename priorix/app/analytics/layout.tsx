"use client";

import { ReactNode } from "react";
import SidebarLayout from "@/components/providers/SidebarLayout";

interface AnalyticsLayoutProps {
  children: ReactNode;
}

export default function AnalyticsLayout({ children }: AnalyticsLayoutProps) {
  return <SidebarLayout>{children}</SidebarLayout>;
}
