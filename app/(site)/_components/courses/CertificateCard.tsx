'use client';

import React, { useMemo } from 'react';

interface CertificateCardProps {
  customerName: string;
  courseTitle: string;
  enrolledAt?: number;
  completedAt: number;
  certificateCode: string;
  currentUrl?: string;
  className?: string;
}

// ─── Guilloche helper: generates a spirograph/hypotrochoid path ───────────────
// Formula: x = (R-r)cos(t) + d·cos((R-r)/r · t)
//          y = (R-r)sin(t) - d·sin((R-r)/r · t)
function guillochePathD(
  R: number,
  r: number,
  d: number,
  steps = 1200,
  cx = 0,
  cy = 0,
): string {
  const points: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2 * r; // full cycle
    const x = cx + (R - r) * Math.cos(t) + d * Math.cos(((R - r) / r) * t);
    const y = cy + (R - r) * Math.sin(t) - d * Math.sin(((R - r) / r) * t);
    points.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return points.join(' ') + ' Z';
}

// ─── Rosette helper: N-petal flower via overlapping circles ──────────────────
function rosettePath(cx: number, cy: number, r: number, petals: number): string {
  const paths: string[] = [];
  for (let i = 0; i < petals; i++) {
    const angle = (i / petals) * Math.PI * 2;
    const px = cx + r * Math.cos(angle);
    const py = cy + r * Math.sin(angle);
    paths.push(`M ${cx} ${cy} A ${r} ${r} 0 0 1 ${px.toFixed(2)} ${py.toFixed(2)}`);
    // second arc back
    paths.push(`A ${r} ${r} 0 0 1 ${cx} ${cy}`);
  }
  return paths.join(' ');
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

  // Pre-compute guilloche paths (expensive but static)
  const guillocheOuter = useMemo(() => guillochePathD(80, 11, 68, 1800, 0, 0), []);
  const guillocheInner = useMemo(() => guillochePathD(60, 7, 52, 1800, 0, 0), []);

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&family=Be+Vietnam+Pro:wght@300;400;500;600;700;800;900&display=swap');

        .font-cert-sans {
          font-family: 'Be Vietnam Pro', var(--font-be-vietnam-pro), sans-serif;
        }
        .font-signature-great-vibes {
          font-family: 'Great Vibes', cursive;
        }

        @media print {
          @page { size: A4 landscape; margin: 0; }
          html, body {
            background: #ffffff !important;
            margin: 0 !important; padding: 0 !important;
            height: 100% !important; overflow: hidden !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          body * { visibility: hidden !important; }
          .print-container, .print-container * { visibility: visible !important; }
          .print-container {
            position: absolute !important;
            top: 0 !important; left: 0 !important;
            width: 297mm !important; height: 210mm !important;
            padding: 32px !important; margin: 0 !important;
            box-shadow: none !important; border: none !important;
            transform: none !important; border-radius: 0 !important;
            background-color: #fdfbf7 !important;
            box-sizing: border-box !important;
          }
        }
      `}</style>

      <div
        className={`w-full bg-[#fdfbf7] text-[#0f172a] p-8 md:p-12 shadow-2xl rounded-xl border border-slate-200 relative overflow-hidden print-container select-none ${className}`}
        style={{ aspectRatio: '297 / 210', boxSizing: 'border-box' }}
      >

        {/* ══════════════════════════════════════════════════════
            BACKGROUND LAYER 1 — Damask pattern
            Most praised certificate background by devs (4-fold symmetry,
            curved petals, seamless tile — used by Canva, Certifier, Harvard-style certs)
        ══════════════════════════════════════════════════════ */}
        <svg
          aria-hidden="true"
          className="absolute inset-0 w-full h-full pointer-events-none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            {/* Classic damask tile: central 4-petal flower + half-petals at edges for seamless tiling */}
            <pattern id="damask-bg" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
              {/* Large outer diamond connecting mid-edges */}
              <path d="M40,0 L80,40 L40,80 L0,40 Z" fill="none" stroke="#a27b4c" strokeWidth="0.5" strokeOpacity="0.13"/>
              {/* Central 4 curved petals */}
              <path d="M40,40 C37,32 33,24 40,16 C47,24 43,32 40,40Z" fill="#a27b4c" fillOpacity="0.08"/>
              <path d="M40,40 C43,48 47,56 40,64 C33,56 37,48 40,40Z" fill="#a27b4c" fillOpacity="0.08"/>
              <path d="M40,40 C32,43 24,47 16,40 C24,33 32,37 40,40Z" fill="#a27b4c" fillOpacity="0.08"/>
              <path d="M40,40 C48,37 56,33 64,40 C56,47 48,43 40,40Z" fill="#a27b4c" fillOpacity="0.08"/>
              {/* Half-petals at each edge for seamless tiling */}
              <path d="M40,0 C37,-8 33,-16 40,-24 C47,-16 43,-8 40,0Z" fill="#a27b4c" fillOpacity="0.08"/>
              <path d="M40,80 C43,88 47,96 40,104 C33,96 37,88 40,80Z" fill="#a27b4c" fillOpacity="0.08"/>
              <path d="M0,40 C-8,43 -16,47 -24,40 C-16,33 -8,37 0,40Z" fill="#a27b4c" fillOpacity="0.08"/>
              <path d="M80,40 C88,37 96,33 104,40 C96,47 88,43 80,40Z" fill="#a27b4c" fillOpacity="0.08"/>
              {/* Inner small diamond */}
              <path d="M40,34 L46,40 L40,46 L34,40 Z" fill="none" stroke="#a27b4c" strokeWidth="0.7" strokeOpacity="0.18"/>
              {/* Center dot */}
              <circle cx="40" cy="40" r="1.8" fill="#a27b4c" fillOpacity="0.14"/>
              {/* Corner dots */}
              <circle cx="0" cy="0" r="1.5" fill="#a27b4c" fillOpacity="0.09"/>
              <circle cx="80" cy="0" r="1.5" fill="#a27b4c" fillOpacity="0.09"/>
              <circle cx="0" cy="80" r="1.5" fill="#a27b4c" fillOpacity="0.09"/>
              <circle cx="80" cy="80" r="1.5" fill="#a27b4c" fillOpacity="0.09"/>
            </pattern>
            {/* Radial vignette */}
            <radialGradient id="vignette-cert" cx="50%" cy="50%" r="65%">
              <stop offset="0%" stopColor="#fdfbf7" stopOpacity="0" />
              <stop offset="100%" stopColor="#c9aa82" stopOpacity="0.25" />
            </radialGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#damask-bg)" />
          <rect width="100%" height="100%" fill="url(#vignette-cert)" />
        </svg>

        {/* ══════════════════════════════════════════════════════
            BACKGROUND LAYER 2 — Guilloche spirograph (bottom-left & top-right)
            Iconic security-document pattern — #1 on certificates globally
        ══════════════════════════════════════════════════════ */}

        {/* Guilloche — bottom-left */}
        <svg
          aria-hidden="true"
          className="absolute pointer-events-none"
          style={{ bottom: '-10%', left: '-8%', width: '38%', opacity: 0.07 }}
          viewBox="-90 -90 180 180"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d={guillocheOuter} fill="none" stroke="#7f5d34" strokeWidth="0.5" />
          <path d={guillocheInner} fill="none" stroke="#a27b4c" strokeWidth="0.4" />
        </svg>

        {/* Guilloche — top-right */}
        <svg
          aria-hidden="true"
          className="absolute pointer-events-none"
          style={{ top: '-10%', right: '-8%', width: '38%', opacity: 0.07, transform: 'rotate(45deg)' }}
          viewBox="-90 -90 180 180"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d={guillocheOuter} fill="none" stroke="#7f5d34" strokeWidth="0.5" />
          <path d={guillocheInner} fill="none" stroke="#a27b4c" strokeWidth="0.4" />
        </svg>

        {/* ══════════════════════════════════════════════════════
            BACKGROUND LAYER 3 — Rosette (center-faint watermark)
            Gothic rose window — popular on Harvard/MIT style certs
        ══════════════════════════════════════════════════════ */}
        <svg
          aria-hidden="true"
          className="absolute pointer-events-none"
          style={{
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '42%', opacity: 0.035,
          }}
          viewBox="-110 -110 220 220"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Outer ring */}
          <circle cx="0" cy="0" r="100" fill="none" stroke="#a27b4c" strokeWidth="1.2" />
          <circle cx="0" cy="0" r="90" fill="none" stroke="#a27b4c" strokeWidth="0.5" />
          {/* 12-petal rosette */}
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i / 12) * Math.PI * 2;
            const bx = 45 * Math.cos(angle);
            const by = 45 * Math.sin(angle);
            return (
              <circle key={i} cx={bx} cy={by} r="45"
                fill="none" stroke="#a27b4c" strokeWidth="0.7" strokeOpacity="0.9"
              />
            );
          })}
          {/* Inner 6-petal */}
          {Array.from({ length: 6 }).map((_, i) => {
            const angle = (i / 6) * Math.PI * 2;
            const bx = 22 * Math.cos(angle);
            const by = 22 * Math.sin(angle);
            return (
              <circle key={i} cx={bx} cy={by} r="22"
                fill="none" stroke="#7f5d34" strokeWidth="0.6" strokeOpacity="0.8"
              />
            );
          })}
          {/* Center dot */}
          <circle cx="0" cy="0" r="5" fill="#a27b4c" fillOpacity="0.6" />
          <circle cx="0" cy="0" r="2" fill="#7f5d34" fillOpacity="1" />
          {/* Radial spokes */}
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i / 12) * Math.PI * 2;
            return (
              <line key={i}
                x1={0} y1={0}
                x2={(98 * Math.cos(angle)).toFixed(2)}
                y2={(98 * Math.sin(angle)).toFixed(2)}
                stroke="#a27b4c" strokeWidth="0.35" strokeOpacity="0.5"
              />
            );
          })}
        </svg>

        {/* ─── Double-line ornate frame — sát mép hơn ─── */}
        <div className="absolute inset-1.5 border border-[#a27b4c]/25 pointer-events-none" />
        <div className="absolute inset-[10px] border-[2.5px] border-double border-[#a27b4c]/60 pointer-events-none" />

        {/* ─── Corner ornaments — sát mép theo border ─── */}
        {[
          'top-2 left-2',
          'top-2 right-2 rotate-90',
          'bottom-2 left-2 -rotate-90',
          'bottom-2 right-2 rotate-180',
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

        {/* ═══════════════ Certificate Content ═══════════════ */}
        <div className="h-full flex flex-col justify-between items-center text-center relative z-10 py-1 font-cert-sans">

          {/* Header */}
          <div className="space-y-0.5 mt-1">
            <div className="flex items-center justify-center gap-2">
              <span className="h-px w-10 bg-[#a27b4c]/50" />
              <p className="text-[11px] font-black tracking-[0.3em] text-[#a27b4c] uppercase">DOHY ACADEMY</p>
              <span className="h-px w-10 bg-[#a27b4c]/50" />
            </div>
            <p className="text-[8px] tracking-[0.12em] text-slate-400 font-bold uppercase">
              Professional Creative Education &amp; Certification
            </p>
          </div>

          {/* Title block */}
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

          {/* Course title */}
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
            <div className="flex flex-col justify-end items-center text-center pb-1 gap-0">
              <p className="text-[8px] font-extrabold text-slate-700 uppercase tracking-wider">Trần Mạnh Hiếu</p>
              <p className="text-[7px] text-slate-400 uppercase tracking-wider font-bold">Đại diện Dohy Studio</p>
              {/* Great Vibes — #1 certificate signature font */}
              <div className="relative mt-1.5 flex flex-col items-center">
                <span className="font-signature-great-vibes text-[1.65rem] text-slate-600 select-none whitespace-nowrap leading-none block">
                  Tran Manh Hieu
                </span>
                <div className="h-px w-full bg-gradient-to-r from-transparent via-[#a27b4c]/30 to-transparent mt-0.5" />
              </div>
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

            {/* QR code — cert code là trục căn giữa, QR và label đều center theo */}
            <div className="flex flex-col items-center text-center pb-0 justify-end translate-y-2">
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
              <div className="mt-1.5 space-y-0.5">
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
