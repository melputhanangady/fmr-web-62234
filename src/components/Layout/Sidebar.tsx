import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const Sidebar: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { path: '/discover', label: 'Discover', icon: '🔍' },
    { path: '/matches', label: 'Matches', icon: '💕' },
    { path: '/likes', label: 'Likes', icon: '❤️' },
    { path: '/passed', label: 'Passed', icon: '👎' },
    { path: '/profile', label: 'Profile', icon: '👤' }
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-background border-r border-border z-40 hidden lg:block">
      {/* App Logo */}
      <div className="p-6 border-b border-border">
        <h1 className="text-xl font-bold text-primary">💕 FindMyRib</h1>
      </div>

      {/* Navigation Items */}
      <nav className="p-4 space-y-2">
        {navItems.map((item) => (
          <Button
            key={item.path}
            asChild
            variant={isActive(item.path) ? "default" : "ghost"}
            className={cn(
              "w-full justify-start h-12 px-4",
              isActive(item.path) && "bg-primary text-primary-foreground"
            )}
          >
            <Link to={item.path}>
              <span className="text-xl mr-3">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </Link>
          </Button>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
