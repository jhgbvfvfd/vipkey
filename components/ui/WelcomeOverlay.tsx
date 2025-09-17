import React, { useEffect, useState } from 'react';

const STORAGE_KEY = 'vipkey-welcome-dismissed';

const WelcomeOverlay: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (!dismissed) {
      setIsOpen(true);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const styleId = 'vipkey-welcome-animations';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.innerHTML = `
        @keyframes glowPulse {
          0%, 100% { opacity: 0.35; transform: scale(1); }
          50% { opacity: 0.65; transform: scale(1.08); }
        }
        @keyframes floatCard {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes titlePulse {
          0%, 100% { filter: drop-shadow(0 0 12px rgba(45, 212, 191, 0.55)); }
          50% { filter: drop-shadow(0 0 22px rgba(59, 130, 246, 0.8)); }
        }
        @keyframes beamSlide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `;
      document.head.appendChild(style);
    }
  }, [isOpen]);

  const handleAccept = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setIsClosing(true);
    window.setTimeout(() => {
      setIsOpen(false);
    }, 320);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className={`fixed inset-0 z-[2000] flex items-center justify-center px-4 backdrop-blur-3xl transition-opacity duration-300 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      } bg-slate-950/90`}
    >
      <div className="relative w-full max-w-2xl">
        <div className="absolute -inset-24 bg-gradient-to-br from-cyan-500/25 via-sky-500/20 to-transparent blur-3xl animate-[glowPulse_8s_ease-in-out_infinite]"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-indigo-500/10 to-transparent blur-xl"></div>

        <div className="relative overflow-hidden rounded-3xl border border-cyan-300/30 bg-slate-900/80 shadow-[0_25px_70px_rgba(14,165,233,0.35)]">
          <div className="absolute -top-28 -right-24 h-52 w-52 rounded-full bg-cyan-400/30 blur-3xl animate-[glowPulse_9s_ease-in-out_infinite]" style={{ animationDelay: '800ms' }}></div>
          <div className="absolute -bottom-28 -left-24 h-56 w-56 rounded-full bg-blue-500/25 blur-3xl animate-[glowPulse_9s_ease-in-out_infinite]" style={{ animationDelay: '1800ms' }}></div>

          <div className="relative flex flex-col items-center gap-6 px-8 py-12 text-center text-slate-100">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-cyan-400/40 blur-2xl animate-[glowPulse_7s_ease-in-out_infinite]"></div>
              <div className="relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border border-cyan-300/60 bg-slate-950/60 shadow-[0_0_35px_rgba(34,211,238,0.45)] animate-[floatCard_5s_ease-in-out_infinite]">
                <img
                  src="https://img2.pic.in.th/pic/received_1477586920220219.jpeg"
                  alt="ADMIN BOT CSCODE"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.45em] text-cyan-200/80">ADMIN BOT</p>
              <h1 className="text-3xl font-semibold text-white md:text-4xl">
                <span className="bg-gradient-to-r from-cyan-200 via-sky-400 to-indigo-400 bg-clip-text text-transparent animate-[titlePulse_6s_ease-in-out_infinite]">
                  CSCODE
                </span>
              </h1>
            </div>

            <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 text-sm leading-relaxed text-slate-200 md:text-base">
              <div className="pointer-events-none absolute inset-y-0 -left-full w-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[beamSlide_3.2s_linear_infinite]"></div>
              <p className="font-light text-slate-200">
                ยินดีต้อนรับสู่ศูนย์ควบคุม <span className="font-semibold text-cyan-300">ADMIN BOT CSCODE</span> ที่รวบรวมเครื่องมือดูแลแพลตฟอร์ม การจัดการคีย์ และการตรวจสอบสถานะต่างๆ ไว้ในที่เดียวอย่างปลอดภัยและมีสไตล์
              </p>
              <ul className="mt-4 space-y-2 text-left text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-cyan-300"></span>
                  <span>ตรวจสอบแพลตฟอร์มและบอทแบบเรียลไทม์ พร้อมสถานะการเชื่อมต่อที่อัปเดตทันที</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-sky-300"></span>
                  <span>จัดการคีย์ แจกจ่าย หรือยกเลิกการใช้งานได้อย่างคล่องตัว พร้อมประวัติการเคลื่อนไหวครบถ้วน</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-300"></span>
                  <span>สนับสนุนทีมงานด้วยแดชบอร์ดภารกิจ รายงาน และการตั้งค่าที่ปรับแต่งตามบทบาท</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              onClick={handleAccept}
              className="group relative mt-2 inline-flex items-center justify-center gap-2 overflow-hidden rounded-full border border-cyan-300/40 bg-gradient-to-r from-cyan-400/80 via-sky-500/90 to-indigo-500/80 px-10 py-3 text-base font-semibold text-white shadow-[0_10px_30px_rgba(56,189,248,0.45)] transition hover:scale-[1.02] hover:shadow-[0_18px_45px_rgba(56,189,248,0.55)] focus:outline-none focus:ring-2 focus:ring-cyan-300/60 focus:ring-offset-2 focus:ring-offset-slate-900"
            >
              <span className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-30" style={{ background: 'radial-gradient(circle at top, rgba(255,255,255,0.6), transparent 70%)' }}></span>
              <span className="relative">ตกลง</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeOverlay;
