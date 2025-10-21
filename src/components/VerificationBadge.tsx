import React from 'react';
import { CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface VerificationBadgeProps {
  isVerified?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const VerificationBadge: React.FC<VerificationBadgeProps> = ({ 
  isVerified = false, 
  size = 'md',
  className = '' 
}) => {
  if (!isVerified) return null;

  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  return (
    <Badge 
      variant="secondary" 
      className={`bg-blue-100 text-blue-800 border-blue-200 flex items-center space-x-1 ${className}`}
    >
      <CheckCircle className={sizeClasses[size]} />
      <span className={textSizeClasses[size]}>MatchMaker Verified</span>
    </Badge>
  );
};

export default VerificationBadge;
