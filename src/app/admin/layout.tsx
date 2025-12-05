import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-[#fafafa] text-[#262626] overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-[#dbdbdb] flex flex-col flex-shrink-0 z-10">
        <div className="p-6 border-b border-[#dbdbdb] flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 rounded-lg"></div>
          <h1 className="text-xl font-bold tracking-tight">Admin</h1>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-4 mt-2">
            World Building
          </div>
          <NavLink href="/admin/universe">Universe & World</NavLink>
          <NavLink href="/admin/character">Character Base</NavLink>

          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-4 mt-6">
            Management
          </div>
          <NavLink href="/admin/life">Life Deployment</NavLink>
          <NavLink href="/admin/profile">Profile Management</NavLink>
          <NavLink href="/admin/user">User & Relationship</NavLink>

          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-4 mt-6">
            System
          </div>
          <NavLink href="/admin/memory">Memory Debugger</NavLink>
          <NavLink href="/admin/message">Message Debugger</NavLink>
        </nav>
        <div className="p-4 border-t border-[#dbdbdb]">
          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-[#262626] transition-colors"
          >
            <span>←</span> Back to App
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="block px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-[#262626] transition-all active:scale-[0.98]"
    >
      {children}
    </Link>
  );
}
