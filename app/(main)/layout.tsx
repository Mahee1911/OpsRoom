import { NavigationSidebar } from "@/components/navigation/navigation-sidebar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-full">
      <div className="fixed inset-y-0 left-0 z-30 flex h-full w-[72px] flex-col">
        <NavigationSidebar />
      </div>

      <main className="h-full pl-[72px]">
        {children}
      </main>
    </div>
  );
}