import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function Logo({ className, showText = true, size = 'md' }: LogoProps) {
  const sizes = {
    sm: { width: 24, height: 24, textSize: 'text-sm' },
    md: { width: 32, height: 32, textSize: 'text-lg' },
    lg: { width: 48, height: 48, textSize: 'text-xl' },
  };

  const { width, height, textSize } = sizes[size];

  return (
    <Link href="/" className={cn('flex items-center gap-2', className)}>
      <div className="relative">
        <Image
          src="/bloved-2.png"
          alt="BeLoved Transportation Logo"
          width={width}
          height={height}
          className="object-contain"
          priority
        />
      </div>
      {showText && (
        <span className={cn('font-bold tracking-tight', textSize)}>
          BeLoved Transportation
        </span>
      )}
    </Link>
  );
} 