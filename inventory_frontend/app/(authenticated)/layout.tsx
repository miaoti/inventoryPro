'use client';

import Layout from '../components/Layout'; // Corrected import path

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Layout>{children}</Layout>;
} 