'use client';

import React from 'react';

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
        @import url('https://fonts.googleapis.com/css2?family=Pinyon+Script&family=Be+Vietnam+Pro:wght@300;400;500;600;700;800;900&display=swap');
        
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
        className={`w-full bg-[#fdfbf7] text-[#0f172a] p-12 md:p-16 shadow-2xl rounded-xl border border-slate-200 dark:border-slate-800 relative overflow-hidden print-container select-none ${className}`}
        style={{ aspectRatio: '297 / 210', boxSizing: 'border-box' }}
      >
        {/* Background watermark icon */}
        <div className="absolute inset-0 opacity-[0.018] pointer-events-none flex items-center justify-center">
          <div className="border-[24px] border-[#a27b4c] w-[82%] h-[82%] rounded-full flex items-center justify-center">
            <svg className="w-64 h-64 text-[#a27b4c]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
        </div>

        {/* Golden Ornate Frame Borders */}
        <div className="absolute inset-5 border border-[#a27b4c]/30 pointer-events-none"></div>
        <div className="absolute inset-7 border-[3px] border-double border-[#a27b4c] pointer-events-none"></div>

        {/* Ornate corners decorations SVG (using Deep Bronze Gold) */}
        <svg className="absolute top-9 left-9 w-16 h-16 text-[#a27b4c] pointer-events-none" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M 0 0 L 0 40 L 4 40 L 4 4 L 40 4 L 40 0 Z" />
          <path d="M 8 8 L 8 28 L 10 28 L 10 10 L 28 10 L 28 8 Z" strokeWidth="1"/>
          <circle cx="12" cy="12" r="2" fill="currentColor"/>
        </svg>
        <svg className="absolute top-9 right-9 w-16 h-16 text-[#a27b4c] pointer-events-none transform rotate-90" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M 0 0 L 0 40 L 4 40 L 4 4 L 40 4 L 40 0 Z" />
          <path d="M 8 8 L 8 28 L 10 28 L 10 10 L 28 10 L 28 8 Z" strokeWidth="1"/>
          <circle cx="12" cy="12" r="2" fill="currentColor"/>
        </svg>
        <svg className="absolute bottom-9 left-9 w-16 h-16 text-[#a27b4c] pointer-events-none transform -rotate-90" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M 0 0 L 0 40 L 4 40 L 4 4 L 40 4 L 40 0 Z" />
          <path d="M 8 8 L 8 28 L 10 28 L 10 10 L 28 10 L 28 8 Z" strokeWidth="1"/>
          <circle cx="12" cy="12" r="2" fill="currentColor"/>
        </svg>
        <svg className="absolute bottom-9 right-9 w-16 h-16 text-[#a27b4c] pointer-events-none transform rotate-180" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M 0 0 L 0 40 L 4 40 L 4 4 L 40 4 L 40 0 Z" />
          <path d="M 8 8 L 8 28 L 10 28 L 10 10 L 28 10 L 28 8 Z" strokeWidth="1"/>
          <circle cx="12" cy="12" r="2" fill="currentColor"/>
        </svg>

        {/* Certificate Content Grid */}
        <div className="h-full flex flex-col justify-between items-center text-center relative z-10 py-1.5 font-cert-sans">
          
          {/* Header: Brand Logo & Icon (Bigger and academic-centric) */}
          <div className="space-y-1 mt-1">
            {/* Academic Crest/Shield Icon */}
            <svg className="w-8 h-8 text-[#a27b4c] mx-auto mb-1 drop-shadow-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="rgba(162, 123, 76, 0.05)" />
              <path d="M12 8v8M9 11h6" strokeLinecap="round" />
            </svg>
            <div className="flex items-center justify-center gap-2.5">
              <span className="h-[1px] w-10 bg-[#a27b4c]/65"></span>
              <p className="text-[13px] font-black tracking-[0.32em] text-[#a27b4c] uppercase">DOHY ACADEMY</p>
              <span className="h-[1px] w-10 bg-[#a27b4c]/65"></span>
            </div>
            <p className="text-[9px] tracking-[0.12em] text-slate-400 font-extrabold uppercase">Professional Creative Education & Certification</p>
          </div>

          {/* Certificate Sub-Header (Specifies type clearly) */}
          <div className="mt-4 space-y-1">
            <p className="text-[10px] font-black tracking-[0.25em] text-[#a27b4c] uppercase">
              COURSE COMPLETION CERTIFICATE
            </p>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-[0.06em] text-slate-800 uppercase">
              CHỨNG NHẬN HOÀN THÀNH
            </h1>
            <p className="text-xs italic text-slate-500 font-medium mt-1">
              Chứng chỉ này được trân trọng trao tặng cho học viên
            </p>
          </div>

          {/* Recipient Name (Centerpiece - Massive and highly prominent) */}
          <div className="my-2.5">
            <h2 className="text-4xl md:text-5xl font-black text-[#0f172a] tracking-wide uppercase drop-shadow-sm">
              {customerName}
            </h2>
            <p className="text-xs text-slate-400 font-medium max-w-lg mx-auto leading-relaxed mt-2.5">
              Đã hoàn thành xuất sắc chương trình đào tạo và đạt tiêu chuẩn tốt nghiệp của khóa học chuyên sâu
            </p>
          </div>

          {/* Course Title (Beautifully bordered with no gray background button style) */}
          <div className="my-2 w-[80%] max-w-[650px] border-y border-[#a27b4c]/30 py-3.5">
            <h3 className="text-lg md:text-xl font-extrabold text-[#a27b4c] tracking-[0.04em] uppercase">
              {courseTitle}
            </h3>
          </div>

          {/* Issue Date Details */}
          <div className="text-[9.5px] text-slate-400 uppercase tracking-widest font-extrabold">
            <span>Cấp ngày {completedDateStr}</span>
          </div>

          {/* Bottom Footer Section: Signatures & Verification Seal & QR Code */}
          <div className="w-full grid grid-cols-3 items-end mt-4 px-4">
            {/* Left Column: Authorized Signature (More elegant & cursive) */}
            <div className="text-left space-y-1.5 pb-1">
              <div className="h-14 flex items-end justify-start relative">
                {/* Dynamic cursive handwritten signature */}
                <span className="font-signature-pinyon text-5xl text-blue-900/90 transform -rotate-2 select-none -translate-x-1 translate-y-3 whitespace-nowrap">
                  Tran Manh Hieu
                </span>
                <div className="absolute bottom-2.5 left-0 right-12 h-[1px] bg-slate-200"></div>
              </div>
              <div>
                <p className="text-[9.5px] font-extrabold text-slate-800 uppercase tracking-wider">Trần Mạnh Hiếu</p>
                <p className="text-[8px] text-slate-400 uppercase tracking-wider font-bold">Đại diện Dohy Studio</p>
              </div>
            </div>

            {/* Middle Column: Premium Golden Wax Seal (Bigger & Ornate) */}
            <div className="flex justify-center">
              {/* Embossed Ornate 3D Gold Seal */}
              <div className="relative h-20 w-20 md:h-22 md:w-22 rounded-full bg-gradient-to-br from-[#f5d7b5] via-[#a27b4c] to-[#7f5d34] shadow-xl border-[3.5px] border-[#fdfbf7] flex items-center justify-center select-none transform hover:scale-105 transition-transform duration-300">
                {/* Wavy/Teethed Outer Edge Seal decoration */}
                <div className="absolute inset-0.5 border border-dashed border-[#fdfbf7]/45 rounded-full"></div>
                <div className="text-center text-[#fdfbf7] space-y-0.5 flex flex-col items-center justify-center">
                  {/* Ornate badge emblem */}
                  <svg className="w-6 h-6 drop-shadow text-white/95" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="rgba(255,255,255,0.08)"/>
                    <path d="m9 12 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="text-[6.5px] font-black tracking-[0.25em] uppercase leading-none drop-shadow-sm font-cert-sans">VERIFIED</span>
                  <span className="text-[5.5px] tracking-wider leading-none opacity-80 drop-shadow-sm font-extrabold">DOHY STUDIO</span>
                </div>
              </div>
            </div>

            {/* Right Column: Bigger QR Code & Scanning Instructions */}
            <div className="flex flex-col items-end text-right space-y-2 pb-1">
              {currentUrl && (
                <div className="bg-white p-1.5 border border-slate-200 rounded shadow-md">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=70x70&data=${encodeURIComponent(currentUrl)}`}
                    alt="Verification QR"
                    className="w-14 h-14 md:w-16 md:h-16 object-contain"
                  />
                </div>
              )}
              <div className="space-y-0.5">
                <p className="text-[7.5px] font-mono text-slate-500 select-all font-bold uppercase leading-none">{certificateCode}</p>
                <p className="text-[7.5px] text-slate-400 uppercase tracking-wider font-extrabold">Quét xác thực trực tuyến</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
