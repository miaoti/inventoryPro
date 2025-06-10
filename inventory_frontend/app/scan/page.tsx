'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ScanPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the main scanner page to avoid code duplication
    router.replace('/scanner');
  }, [router]);

  return null;
} 