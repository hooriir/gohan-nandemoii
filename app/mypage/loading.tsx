import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";

export default function Loading() {
  return (
    /* 親要素から animate-pulse を外す */
    <div className="bg-brand-bg min-h-screen p-4 sm:p-8 flex flex-col items-center font-sans">
      <Header />
      <div className="w-full max-w-[900px] flex flex-col md:flex-row gap-6 items-start">
        <Sidebar />
        
        <div className="flex-1 bg-white rounded-3xl shadow-xl p-6 sm:p-10 border border-slate-100 w-full min-h-[400px] animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-48 mx-auto mb-8"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="h-40 bg-slate-100 rounded-3xl"></div>
            <div className="h-40 bg-slate-100 rounded-3xl"></div>
            <div className="h-40 bg-slate-100 rounded-3xl"></div>
          </div>
        </div>
      </div>
    </div>
  );
}