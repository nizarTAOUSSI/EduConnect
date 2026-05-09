import { Outlet } from 'react-router-dom';
import ParentSidebar from './ParentSidebar';

export default function ParentLayout() {
  return (
    <div className="flex h-screen bg-[#fafafa] overflow-hidden">
      <ParentSidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}