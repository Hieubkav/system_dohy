'use client';

import React, { use, useEffect, useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import Link from 'next/link';
import { ArrowLeft, Printer, AlertTriangle, ShieldCheck } from 'lucide-react';

type CertificatePageProps = {
  params: Promise<{ code: string }>;
};

export default function CertificatePage({ params }: CertificatePageProps) {
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
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-slate-600 dark:text-slate-400 font-medium">Đang tải chứng nhận của bạn...</p>
        </div>
      </div>
    );
  }

  if (certInfo === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
        <div className="max-w-md w-full text-center bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700 space-y-6">
          <div className="h-16 w-16 bg-red-50 dark:bg-red-950/30 rounded-full flex items-center justify-center text-red-600 dark:text-red-400 mx-auto">
            <AlertTriangle size={32} />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Không tìm thấy chứng nhận</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Mã chứng nhận <code className="bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded font-mono text-red-600 dark:text-red-400 font-semibold">{code}</code> không hợp lệ, đã bị thu hồi hoặc chưa hoàn thành khóa học.
            </p>
          </div>
          <Link
            href="/khoa-hoc"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-md hover:bg-indigo-500 transition-colors"
          >
            Quay lại danh sách khóa học
          </Link>
        </div>
      </div>
    );
  }

  const enrolledDateStr = certInfo.enrolledAt ? new Date(certInfo.enrolledAt).toLocaleDateString('vi-VN') : '';
  const completedDateStr = new Date(certInfo.completedAt).toLocaleDateString('vi-VN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <>
      {/* Font imports for Certificate styling */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Great+Vibes&display=swap');
        
        .font-cinzel {
          font-family: 'Cinzel', serif;
        }
        .font-cormorant {
          font-family: 'Cormorant Garamond', serif;
        }
        .font-signature {
          font-family: 'Great Vibes', cursive;
        }

        /* Landscape orientation and full page container when printing */
        @media print {
          @page {
            size: landscape;
            margin: 0;
          }
          body {
            background: #ffffff;
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .no-print {
            display: none !important;
          }
          .print-container {
            width: 297mm !important;
            height: 210mm !important;
            padding: 28px !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            transform: none !important;
            border-radius: 0 !important;
            background-color: #fdfbf7 !important;
            box-sizing: border-box !important;
          }
        }
      `}</style>

      {/* Main Container */}
      <div className="min-h-screen bg-slate-100 dark:bg-slate-900 py-12 px-4 flex flex-col items-center justify-center gap-6 no-print">
        {/* Navigation Toolbar */}
        <div className="w-full max-w-[1000px] flex items-center justify-between no-print px-2">
          <Link
            href={`/khoa-hoc/${certInfo.courseSlug}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            <ArrowLeft size={16} />
            Quay lại khóa học
          </Link>
          <div className="flex gap-3">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors shadow-sm cursor-pointer"
            >
              <Printer size={16} />
              In / Tải về PDF
            </button>
          </div>
        </div>

        {/* Certificate Card Container */}
        <div 
          className="w-full max-w-[1000px] bg-[#fdfbf7] text-[#0f172a] p-10 md:p-14 shadow-2xl rounded-xl border border-slate-200 dark:border-slate-800 relative overflow-hidden print-container select-none"
          style={{ aspectRatio: '297 / 210' }}
        >
          {/* Background watermark */}
          <div className="absolute inset-0 opacity-[0.015] pointer-events-none flex items-center justify-center">
            <div className="border-[20px] border-[#c5a880] w-[80%] h-[80%] rounded-full"></div>
          </div>

          {/* Golden Ornate Frame Borders */}
          <div className="absolute inset-4 border border-[#c5a880]/30 pointer-events-none"></div>
          <div className="absolute inset-6 border-[3px] border-double border-[#c5a880] pointer-events-none"></div>
          
          {/* Ornate corners decorations SVG */}
          <svg className="absolute top-8 left-8 w-16 h-16 text-[#c5a880] pointer-events-none" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M 0 0 L 0 40 L 4 40 L 4 4 L 40 4 L 40 0 Z" />
            <path d="M 8 8 L 8 28 L 10 28 L 10 10 L 28 10 L 28 8 Z" strokeWidth="1"/>
            <circle cx="12" cy="12" r="2" fill="currentColor"/>
          </svg>
          <svg className="absolute top-8 right-8 w-16 h-16 text-[#c5a880] pointer-events-none transform rotate-90" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M 0 0 L 0 40 L 4 40 L 4 4 L 40 4 L 40 0 Z" />
            <path d="M 8 8 L 8 28 L 10 28 L 10 10 L 28 10 L 28 8 Z" strokeWidth="1"/>
            <circle cx="12" cy="12" r="2" fill="currentColor"/>
          </svg>
          <svg className="absolute bottom-8 left-8 w-16 h-16 text-[#c5a880] pointer-events-none transform -rotate-90" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M 0 0 L 0 40 L 4 40 L 4 4 L 40 4 L 40 0 Z" />
            <path d="M 8 8 L 8 28 L 10 28 L 10 10 L 28 10 L 28 8 Z" strokeWidth="1"/>
            <circle cx="12" cy="12" r="2" fill="currentColor"/>
          </svg>
          <svg className="absolute bottom-8 right-8 w-16 h-16 text-[#c5a880] pointer-events-none transform rotate-180" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M 0 0 L 0 40 L 4 40 L 4 4 L 40 4 L 40 0 Z" />
            <path d="M 8 8 L 8 28 L 10 28 L 10 10 L 28 10 L 28 8 Z" strokeWidth="1"/>
            <circle cx="12" cy="12" r="2" fill="currentColor"/>
          </svg>

          {/* Certificate Content Grid */}
          <div className="h-full flex flex-col justify-between items-center text-center relative z-10 py-4">
            
            {/* Header: Brand and Badge */}
            <div className="space-y-1.5 mt-2">
              <div className="flex items-center justify-center gap-1.5">
                <span className="h-0.5 w-6 bg-[#c5a880]"></span>
                <p className="font-cinzel text-xs font-semibold tracking-[0.3em] text-[#c5a880]">DOHY ACADEMY</p>
                <span className="h-0.5 w-6 bg-[#c5a880]"></span>
              </div>
              <p className="text-[10px] tracking-[0.1em] text-slate-400 font-semibold uppercase">Professional Creative Education</p>
            </div>

            {/* Certificate Title */}
            <div className="space-y-2 my-2">
              <h1 className="font-cinzel text-3xl md:text-4xl font-bold tracking-[0.12em] text-[#0f172a]">
                CHỨNG NHẬN HOÀN THÀNH
              </h1>
              <p className="font-cormorant text-base md:text-lg italic text-[#c5a880] font-semibold">
                Chứng chỉ này được trân trọng trao tặng cho
              </p>
            </div>

            {/* Recipient Name */}
            <div className="my-2 space-y-2">
              <h2 className="font-cormorant text-4xl md:text-5xl font-bold text-[#0f172a] border-b border-[#c5a880]/30 pb-3 px-8 inline-block min-w-[320px]">
                {certInfo.customerName}
              </h2>
              <p className="font-cormorant text-sm text-slate-500 italic max-w-lg mx-auto leading-relaxed">
                Đã hoàn thành xuất sắc chương trình đào tạo chuyên sâu và đạt tiêu chuẩn tốt nghiệp của khóa học
              </p>
            </div>

            {/* Course Title */}
            <div className="my-2">
              <h3 className="font-cinzel text-lg md:text-xl font-bold text-slate-800 tracking-[0.05em] px-4 py-2 bg-slate-50 border border-slate-100 rounded-md inline-block max-w-[80%] uppercase">
                {certInfo.courseTitle}
              </h3>
            </div>

            {/* Issue Details */}
            <div className="my-2 font-cormorant text-xs text-slate-400 uppercase tracking-widest">
              <span>Cấp ngày {completedDateStr}</span>
            </div>

            {/* Bottom Footer Section: Signatures & Verification Seal */}
            <div className="w-full grid grid-cols-3 items-end mt-4 px-6">
              {/* Left Column: Authorized Signature */}
              <div className="text-left space-y-1">
                <div className="h-12 flex items-end justify-start relative">
                  {/* Digital handwritten signature */}
                  <span className="font-signature text-3xl text-indigo-900/80 transform -rotate-6 select-none -translate-x-1 translate-y-1">
                    Tran Manh Hieu
                  </span>
                  <div className="absolute bottom-2 left-0 right-12 h-[1px] bg-slate-300"></div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">Trần Mạnh Hiếu</p>
                  <p className="text-[9px] text-slate-400 uppercase tracking-wider">Đại diện Dohy Studio</p>
                </div>
              </div>

              {/* Middle Column: Seal */}
              <div className="flex justify-center">
                {/* 3D embossed style golden stamp/seal */}
                <div className="relative h-18 w-18 md:h-20 md:w-20 rounded-full bg-gradient-to-br from-[#e6c79c] via-[#c5a880] to-[#9c7d56] shadow-md border-[3px] border-[#fdfbf7] flex items-center justify-center select-none transform hover:scale-105 transition-transform">
                  <div className="absolute inset-0.5 border border-dashed border-[#fdfbf7]/50 rounded-full"></div>
                  <div className="text-center text-[#fdfbf7] space-y-0.5 flex flex-col items-center">
                    <ShieldCheck size={20} className="drop-shadow-sm" />
                    <span className="text-[7px] font-bold tracking-[0.2em] uppercase leading-none drop-shadow-sm font-cinzel">VERIFIED</span>
                    <span className="text-[6px] tracking-wider leading-none opacity-80 drop-shadow-sm">DOHY STUDIO</span>
                  </div>
                </div>
              </div>

              {/* Right Column: QR Code & Verify */}
              <div className="flex flex-col items-end text-right space-y-1.5">
                {currentUrl && (
                  <div className="bg-white p-1 border border-slate-200 rounded">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=55x55&data=${encodeURIComponent(currentUrl)}`}
                      alt="Verification QR"
                      className="w-12 h-12 md:w-14 md:h-14 object-contain"
                    />
                  </div>
                )}
                <div>
                  <p className="text-[8px] font-mono text-slate-500 select-all font-semibold uppercase">{certInfo.certificateCode}</p>
                  <p className="text-[8px] text-slate-400 uppercase tracking-wider font-semibold">Quét để xác thực</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
