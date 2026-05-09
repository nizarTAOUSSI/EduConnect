import { Outlet } from 'react-router-dom';
import TeacherSidebar from './TeacherSidebar';

export default function TeacherLayout() {
  return (
    <div className="flex h-screen bg-[#fafafa] overflow-hidden">
      <TeacherSidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}