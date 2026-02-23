import Sidebar from "@/components/dashboard/Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#080a0f]">
      <Sidebar />
      <main className="flex-1 ml-60 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
