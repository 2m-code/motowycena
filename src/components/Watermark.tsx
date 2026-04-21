export default function Watermark() {
  return (
    <>
      <div className="fixed inset-0 z-[9999] pointer-events-none select-none flex items-center justify-center overflow-hidden">
        <span className="text-[20vw] font-black tracking-tighter text-[#1E293B] opacity-10 -rotate-45 mix-blend-multiply">2mcode</span>
      </div>

      <div className="fixed bottom-6 right-6 z-[9999] pointer-events-none select-none">
        <span className="bg-white px-5 py-3 rounded-[12px] border-2 border-[#E2E8F0] shadow-2xl text-[13px] font-black text-[#1E293B] uppercase tracking-widest flex items-center gap-2">
          Design by <span className="text-[#0066FF]">2mcode</span>
        </span>
      </div>
    </>
  );
}
