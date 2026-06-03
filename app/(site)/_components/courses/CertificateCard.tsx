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
          body * { visibility: hidden !important; }
          .print-container, .print-container * { visibility: visible !important; }
          .print-container {
            visibility: visible !important;
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 297mm !important;
            height: 210mm !important;
            padding: 32px !important;
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

      <div
        className={`w-full bg-[#fdfbf7] text-[#0f172a] p-8 md:p-12 shadow-2xl rounded-xl border border-slate-200 relative overflow-hidden print-container select-none ${className}`}
        style={{ aspectRatio: '297 / 210', boxSizing: 'border-box' }}
      >
        {/* ─── Background decorative pattern ─── */}
        <svg
          aria-hidden="true"
          className="absolute inset-0 w-full h-full pointer-events-none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            {/* Repeating diamond-lotus tile */}
            <pattern id="cert-bg-pattern" x="0" y="0" width="48" height="48" patternUnits="userSpaceOnUse">
              {/* Thin cross lines */}
              <line x1="24" y1="0" x2="24" y2="48" stroke="#a27b4c" strokeWidth="0.4" strokeOpacity="0.12" />
              <line x1="0" y1="24" x2="48" y2="24" stroke="#a27b4c" strokeWidth="0.4" strokeOpacity="0.12" />
              {/* Diagonal */}
              <line x1="0" y1="0" x2="48" y2="48" stroke="#a27b4c" strokeWidth="0.3" strokeOpacity="0.07" />
              <line x1="48" y1="0" x2="0" y2="48" stroke="#a27b4c" strokeWidth="0.3" strokeOpacity="0.07" />
              {/* Center diamond */}
              <polygon
                points="24,18 30,24 24,30 18,24"
                fill="none"
                stroke="#a27b4c"
                strokeWidth="0.6"
                strokeOpacity="0.13"
              />
              {/* Tiny dot at intersections */}
              <circle cx="24" cy="24" r="1" fill="#a27b4c" fillOpacity="0.1" />
              <circle cx="0" cy="0" r="0.7" fill="#a27b4c" fillOpacity="0.07" />
              <circle cx="48" cy="0" r="0.7" fill="#a27b4c" fillOpacity="0.07" />
              <circle cx="0" cy="48" r="0.7" fill="#a27b4c" fillOpacity="0.07" />
              <circle cx="48" cy="48" r="0.7" fill="#a27b4c" fillOpacity="0.07" />
            </pattern>
            {/* Radial vignette: edges slightly darker ivory */}
            <radialGradient id="cert-vignette" cx="50%" cy="50%" r="70%">
              <stop offset="0%" stopColor="#fdfbf7" stopOpacity="0" />
              <stop offset="100%" stopColor="#e8ddd0" stopOpacity="0.35" />
            </radialGradient>
          </defs>

          {/* Pattern layer */}
          <rect width="100%" height="100%" fill="url(#cert-bg-pattern)" />
          {/* Vignette overlay */}
          <rect width="100%" height="100%" fill="url(#cert-vignette)" />
        </svg>

        {/* ─── Double-line ornate frame ─── */}
        <div className="absolute inset-4 border border-[#a27b4c]/25 pointer-events-none" />
        <div className="absolute inset-[22px] border-[2.5px] border-double border-[#a27b4c]/60 pointer-events-none" />

        {/* ─── Corner ornaments (single shape, 4× rotation) ─── */}
        {[
          'top-7 left-7',
          'top-7 right-7 rotate-90',
          'bottom-7 left-7 -rotate-90',
          'bottom-7 right-7 rotate-180',
        ].map((pos, i) => (
          <svg
            key={i}
            aria-hidden="true"
            className={`absolute ${pos} w-12 h-12 text-[#a27b4c] pointer-events-none`}
            viewBox="0 0 56 56"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
          >
            <path d="M0 0 L0 36 L4 36 L4 4 L36 4 L36 0 Z" />
            <path d="M7 7 L7 24 L9 24 L9 9 L24 9 L24 7 Z" strokeWidth="0.9" />
            <circle cx="11" cy="11" r="1.8" fill="currentColor" />
          </svg>
        ))}

        {/* ─── Certificate Content ─── */}
        <div className="h-full flex flex-col justify-between items-center text-center relative z-10 py-1 font-cert-sans">

          {/* Header */}
          <div className="space-y-0.5 mt-1">
            <div className="flex items-center justify-center gap-2">
              <span className="h-px w-10 bg-[#a27b4c]/50" />
              <p className="text-[11px] font-black tracking-[0.3em] text-[#a27b4c] uppercase">
                DOHY ACADEMY
              </p>
              <span className="h-px w-10 bg-[#a27b4c]/50" />
            </div>
            <p className="text-[8px] tracking-[0.12em] text-slate-400 font-bold uppercase">
              Professional Creative Education &amp; Certification
            </p>
          </div>

          {/* Title block — merged, no duplication */}
          <div className="space-y-1 mt-1">
            <h1 className="text-xl md:text-2xl font-extrabold tracking-[0.06em] text-slate-800 uppercase">
              CHỨNG NHẬN HOÀN THÀNH
            </h1>
            <p className="text-[10.5px] italic text-slate-400 font-medium">
              Chứng chỉ này được trân trọng trao tặng cho
            </p>
          </div>

          {/* Recipient name — centerpiece */}
          <div className="my-1">
            <h2 className="text-[2.3rem] md:text-[2.6rem] font-black text-[#0f172a] tracking-wide uppercase leading-none drop-shadow-sm">
              {customerName}
            </h2>
            <p className="text-[10px] text-slate-400 font-semibold max-w-sm mx-auto mt-1.5 leading-relaxed">
              Đã hoàn thành xuất sắc chương trình đào tạo và đạt tiêu chuẩn tốt nghiệp của khóa học chuyên sâu
            </p>
          </div>

          {/* Course title — elegant border bar */}
          <div className="w-[72%] max-w-[560px] border-y border-[#a27b4c]/30 py-2">
            <h3 className="text-[0.95rem] md:text-base font-extrabold text-[#a27b4c] tracking-[0.04em] uppercase leading-tight">
              {courseTitle}
            </h3>
          </div>

          {/* Date */}
          <div className="text-[8.5px] text-slate-400 uppercase tracking-widest font-extrabold">
            Cấp ngày {completedDateStr}
          </div>

          {/* Footer: signature | seal | QR */}
          <div className="w-full grid grid-cols-3 items-end mt-2 px-2">

            {/* Signature */}
            <div className="text-left space-y-0.5 pb-1">
              <div className="h-10 flex items-end justify-start relative">
                <span className="font-signature-pinyon text-[2rem] text-blue-900/85 transform -rotate-2 select-none -translate-x-0.5 translate-y-3 whitespace-nowrap">
                  Tran Manh Hieu
                </span>
                <div className="absolute bottom-1.5 left-0 right-8 h-px bg-slate-200" />
              </div>
              <p className="text-[8px] font-extrabold text-slate-700 uppercase tracking-wider">Trần Mạnh Hiếu</p>
              <p className="text-[7px] text-slate-400 uppercase tracking-wider font-bold">Đại diện Dohy Studio</p>
            </div>

            {/* Gold wax seal */}
            <div className="flex justify-center">
              <div className="relative h-16 w-16 rounded-full bg-gradient-to-br from-[#f5d7b5] via-[#a27b4c] to-[#7f5d34] shadow-md border-2 border-[#fdfbf7] flex items-center justify-center select-none">
                <div className="absolute inset-1 border border-dashed border-white/30 rounded-full" />
                <div className="text-white flex flex-col items-center justify-center gap-0.5">
                  <svg className="w-5 h-5 drop-shadow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="rgba(255,255,255,0.05)" />
                    <path d="m9 12 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="text-[5px] font-black tracking-[0.25em] uppercase leading-none font-cert-sans">VERIFIED</span>
                  <span className="text-[4px] tracking-wider leading-none opacity-75 font-bold">DOHY STUDIO</span>
                </div>
              </div>
            </div>

            {/* QR code */}
            <div className="flex flex-col items-end text-right space-y-1 pb-1">
              {currentUrl && (
                <div className="bg-white p-1 border border-slate-200 rounded shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=64x64&data=${encodeURIComponent(currentUrl)}`}
                    alt="Verification QR"
                    className="w-11 h-11 object-contain"
                  />
                </div>
              )}
              <div className="space-y-0.5">
                <p className="text-[7px] font-mono text-slate-500 select-all font-bold uppercase leading-none">{certificateCode}</p>
                <p className="text-[7px] text-slate-400 uppercase tracking-wider font-extrabold">Quét xác thực</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
