import { Outlet } from 'react-router-dom';
import StudentSidebar from './StudentSidebar';

export default function StudentLayout() {
  return (
    <div className="flex h-screen bg-[#fafafa] overflow-hidden">
      <StudentSidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}