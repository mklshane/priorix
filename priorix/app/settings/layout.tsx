import SidebarLayout from "@/components/providers/SidebarLayout";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SidebarLayout>{children}</SidebarLayout>;
}
