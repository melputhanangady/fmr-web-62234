import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const MobileNav: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { path: '/discover', label: 'Discover', icon: '🔍' },
    { path: '/matches', label: 'Matches', icon: '💕' },
    { path: '/profile', label: 'Profile', icon: '👤' }
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border px-4 py-2 z-50 lg:hidden">
      <div className="flex justify-around">
        {navItems.map((item) => (
          <Button
            key={item.path}
            asChild
            variant={isActive(item.path) ? "default" : "ghost"}
            className={cn(
              "flex flex-col items-center py-2 px-4 h-auto",
              isActive(item.path) && "bg-primary text-primary-foreground"
            )}
          >
            <Link to={item.path}>
              <span className="text-2xl mb-1">{item.icon}</span>
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          </Button>
        ))}
      </div>
    </nav>
  );
};

export default MobileNav;

