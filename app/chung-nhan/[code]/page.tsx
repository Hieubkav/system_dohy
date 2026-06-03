'use client';

import React, { use, useEffect, useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import Link from 'next/link';
import { ArrowLeft, Printer, AlertTriangle } from 'lucide-react';
import { CertificateCard } from '../../(site)/_components/courses/CertificateCard';

type CertificatePageProps = {
  params: Promise<{ code: string }>;
};

export default function StandaloneCertificatePage({ params }: CertificatePageProps) {
  const { code } = use(params);
  const certInfo = useQuery(api.courses.getCertificateByCode, { code });
  const [currentUrl, setCurrentUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentUrl(window.location.href);
    }
  }, []);

  const handlePrint = () => {
    window.print();
  };

  if (certInfo === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500 mx-auto"></div>
          <p className="text-slate-400 font-medium">Đang tải chứng nhận...</p>
        </div>
      </div>
    );
  }

  if (certInfo === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 text-white">
        <div className="max-w-md w-full text-center bg-slate-900 p-8 rounded-2xl shadow-2xl border border-slate-800 space-y-6">
          <div className="h-16 w-16 bg-red-950/40 rounded-full flex items-center justify-center text-red-400 mx-auto">
            <AlertTriangle size={32} />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-white">Không tìm thấy chứng nhận</h1>
            <p className="text-sm text-slate-400">
              Mã chứng nhận <code className="bg-slate-950 px-1.5 py-0.5 rounded font-mono text-red-400 font-semibold">{code}</code> không hợp lệ hoặc chưa được cấp.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-3 text-sm font-semibold text-white shadow-md hover:bg-amber-500 transition-colors"
          >
            Quay lại trang chủ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white py-12 px-4 flex flex-col items-center justify-center gap-6 select-none">
      {/* Navigation Toolbar (no-print) */}
      <div className="w-full max-w-[1000px] flex items-center justify-between no-print px-2">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-amber-500 transition-colors"
        >
          <ArrowLeft size={16} />
          Về trang chủ
        </Link>
        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 border border-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-slate-800 transition-colors shadow-lg cursor-pointer"
        >
          <Printer size={16} />
          In / Tải về PDF
        </button>
      </div>

      {/* Standalone Certificate Card */}
      <CertificateCard
        customerName={certInfo.customerName}
        courseTitle={certInfo.courseTitle}
        completedAt={certInfo.completedAt}
        certificateCode={certInfo.certificateCode}
        currentUrl={currentUrl}
        className="max-w-[1000px]"
      />
    </div>
  );
}
