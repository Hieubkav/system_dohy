'use client';

import React from 'react';
import { Filter } from 'lucide-react';

interface CertificateCardProps {
  customerName: string;
  courseTitle: string;
  enrolledAt?: number;
  completedAt: number;
  certificateCode: string;
  currentUrl?: string;
  className?: string;
}

export function CertificateCard({
  customerName,
  courseTitle,
  enrolledAt,
  completedAt,
  certificateCode,
  currentUrl,
  className = '',
}: CertificateCardProps) {
  const completedDateStr = new Date(completedAt).toLocaleDateString('vi-VN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Pinyon+Script&family=Be+Vietnam+Pro:wght@400;500;600;700;850&display=swap');
        
        .font-cert-sans {
          font-family: 'Be Vietnam Pro', var(--font-be-vietnam-pro), sans-serif;
        }
        .font-signature-pinyon {
          font-family: 'Pinyon Script', cursive;
        }

        /* Landscape A4 printing styles */
        @media print {
          @page {
            size: A4 landscape;
            margin: 0;
          }
          html, body {
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
            height: 100% !important;
            overflow: hidden !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          /* Hide EVERYTHING in the body */
          body * {
            visibility: hidden !important;
          }
          /* Except the print container and its descendants */
          .print-container, .print-container * {
            visibility: visible !important;
          }
          /* Position print container at top left and scale to fit A4 */
          .print-container {
            visibility: visible !important;
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 297mm !important;
            height: 210mm !important;
            padding: 40px !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
            transform: none !important;
            border-radius: 0 !important;
            background-color: #fdfbf7 !important;
            box-sizing: border-box !important;
          }
        }
      `}</style>

      {/* Certificate Frame Outer Box */}
      <div
        className={`w-full bg-[#fdfbf7] text-[#0f172a] p-10 md:p-14 shadow-2xl rounded-xl border border-slate-200 dark:border-slate-800 relative overflow-hidden print-container select-none ${className}`}
        style={{ aspectRatio: '297 / 210', boxSizing: 'border-box' }}
      >
        {/* Background watermark icon */}
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
        <div className="h-full flex flex-col justify-between items-center text-center relative z-10 py-2 font-cert-sans">
          
          {/* Header: Brand and Badge */}
          <div className="space-y-1 mt-2">
            <div className="flex items-center justify-center gap-2">
              <span className="h-[1px] w-8 bg-[#c5a880]/60"></span>
              <p className="text-xs font-bold tracking-[0.25em] text-[#c5a880]">DOHY ACADEMY</p>
              <span className="h-[1px] w-8 bg-[#c5a880]/60"></span>
            </div>
            <p className="text-[9px] tracking-[0.1em] text-slate-400 font-bold uppercase">Professional Creative Education</p>
          </div>

          {/* Certificate Title */}
          <div className="space-y-1.5 my-2">
            <h1 className="text-3xl md:text-[34px] font-extrabold tracking-[0.08em] text-[#0f172a]">
              CHỨNG NHẬN HOÀN THÀNH
            </h1>
            <p className="text-sm italic text-[#c5a880] font-semibold">
              Chứng chỉ này được trân trọng trao tặng cho
            </p>
          </div>

          {/* Recipient Name */}
          <div className="my-2 space-y-2">
            <h2 className="text-3xl md:text-[40px] font-extrabold text-[#0f172a] border-b border-[#c5a880]/30 pb-2.5 px-8 inline-block min-w-[320px] tracking-wide">
              {customerName}
            </h2>
            <p className="text-xs text-slate-500 font-medium max-w-lg mx-auto leading-relaxed">
              Đã hoàn thành xuất sắc chương trình đào tạo chuyên sâu và đạt tiêu chuẩn tốt nghiệp của khóa học
            </p>
          </div>

          {/* Course Title */}
          <div className="my-1.5">
            <h3 className="text-base md:text-lg font-extrabold text-slate-800 tracking-[0.02em] px-5 py-2 bg-slate-50 border border-slate-100 rounded-lg inline-block max-w-[85%] uppercase">
              {courseTitle}
            </h3>
          </div>

          {/* Issue Details */}
          <div className="my-1.5 text-[10px] text-slate-400 uppercase tracking-widest font-bold">
            <span>Cấp ngày {completedDateStr}</span>
          </div>

          {/* Bottom Footer Section: Signatures & Verification Seal */}
          <div className="w-full grid grid-cols-3 items-end mt-4 px-6">
            {/* Left Column: Authorized Signature */}
            <div className="text-left space-y-1">
              <div className="h-14 flex items-end justify-start relative">
                {/* Elegant cursive handwritten signature (using Pinyon Script) */}
                <span className="font-signature-pinyon text-5xl text-blue-900/90 transform -rotate-3 select-none -translate-x-1 translate-y-3 whitespace-nowrap">
                  Tran Manh Hieu
                </span>
                <div className="absolute bottom-2 left-0 right-12 h-[1px] bg-slate-200"></div>
              </div>
              <div className="mt-1">
                <p className="text-[9px] font-extrabold text-slate-800 uppercase tracking-wider">Trần Mạnh Hiếu</p>
                <p className="text-[8px] text-slate-400 uppercase tracking-wider font-semibold">Đại diện Dohy Studio</p>
              </div>
            </div>

            {/* Middle Column: Premium Seal */}
            <div className="flex justify-center">
              {/* Premium star/crest golden seal with certificate gear border */}
              <div className="relative h-18 w-18 md:h-20 md:w-20 rounded-full bg-gradient-to-br from-[#f1d0a5] via-[#c5a880] to-[#a0825a] shadow-lg border-[3px] border-[#fdfbf7] flex items-center justify-center select-none transform hover:scale-105 transition-transform">
                <div className="absolute inset-0.5 border border-dashed border-[#fdfbf7]/40 rounded-full"></div>
                <div className="text-center text-[#fdfbf7] space-y-0.5 flex flex-col items-center justify-center">
                  {/* Ornate Gold Star badge icon */}
                  <svg className="w-6 h-6 drop-shadow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="rgba(255,255,255,0.15)" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="text-[6px] font-extrabold tracking-[0.25em] uppercase leading-none drop-shadow-sm font-cert-sans">ĐÃ XÁC THỰC</span>
                  <span className="text-[5px] tracking-widest leading-none opacity-80 drop-shadow-sm font-bold">DOHY STUDIO</span>
                </div>
              </div>
            </div>

            {/* Right Column: QR Code & Verify */}
            <div className="flex flex-col items-end text-right space-y-1.5">
              {currentUrl && (
                <div className="bg-white p-1 border border-slate-200 rounded shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=${encodeURIComponent(currentUrl)}`}
                    alt="Verification QR"
                    className="w-11 h-11 md:w-12 md:h-12 object-contain"
                  />
                </div>
              )}
              <div>
                <p className="text-[7.5px] font-mono text-slate-500 select-all font-semibold uppercase leading-none">{certificateCode}</p>
                <p className="text-[7.5px] text-slate-400 uppercase tracking-wider font-bold mt-0.5">Quét để xác thực</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
