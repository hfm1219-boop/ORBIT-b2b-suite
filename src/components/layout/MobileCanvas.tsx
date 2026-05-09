import React from "react";

interface MobileCanvasProps {
  children: React.ReactNode;
}

export default function MobileCanvas({ children }: MobileCanvasProps) {
  return (
    <div className="min-h-screen bg-gray-200 flex justify-center items-start sm:py-8">
      {/* Mobile-sized container */}
      <div className="w-full max-w-[430px] h-screen sm:h-[844px] bg-app-bg sm:rounded-[40px] shadow-2xl relative overflow-hidden flex flex-col border-black/5 border">
        {/* Status bar mock */}
        <div className="h-7 w-full flex justify-between items-center px-8 flex-shrink-0">
          <span className="text-[11px] font-black tracking-tight">9:41</span>
          <div className="flex gap-1.5 items-center">
            <div className="w-3 h-3 bg-black/10 rounded-sm"></div>
            <div className="w-4 h-2 bg-black/10 rounded-sm"></div>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-hidden relative flex flex-col">
          {children}
        </div>

        {/* Home indicator */}
        <div className="h-8 w-full flex justify-center items-center flex-shrink-0">
          <div className="w-32 h-1.5 bg-black/20 rounded-full"></div>
        </div>
      </div>
    </div>
  );
}
