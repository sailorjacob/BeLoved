import React from 'react';
import Link from 'next/link';
import { usePlatform } from '@/hooks/usePlatform';
import { cn } from '@/lib/utils';

interface FooterProps {
  className?: string;
}

export function Footer({ className }: FooterProps) {
  const { isLoaded, isWeb } = usePlatform();
  
  // Don't render anything until we know what platform we're on
  if (!isLoaded) return null;
  
  // Don't render footer on iOS
  if (!isWeb) return null;
  
  return (
    <footer className={cn("border-t border-gray-200 bg-white py-6", className)}>
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row justify-between items-center">
          <div className="mb-4 sm:mb-0">
            <p className="text-sm text-gray-600">
              © {new Date().getFullYear()} BeLoved Transportation. All rights reserved.
            </p>
          </div>
          <nav className="flex space-x-6">
            <Link href="/about" className="text-sm text-gray-600 hover:text-blue-600 transition">
              About
            </Link>
            <Link href="/support" className="text-sm text-gray-600 hover:text-blue-600 transition">
              Support
            </Link>
            <Link href="/terms" className="text-sm text-gray-600 hover:text-blue-600 transition">
              Terms of Service
            </Link>
            <Link href="/privacy" className="text-sm text-gray-600 hover:text-blue-600 transition">
              Privacy Policy
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
} 