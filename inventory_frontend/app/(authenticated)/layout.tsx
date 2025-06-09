'use client';

import Layout from '../components/Layout';
import AuthGuard from '../components/AuthGuard';

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard requireAuth={true}>
      <Layout>{children}</Layout>
    </AuthGuard>
  );
} 