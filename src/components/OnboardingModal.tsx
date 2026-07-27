import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles, Mic, Type, CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react';

export const OnboardingModal: React.FC = () => {
  const { isOnboardingOpen, setIsOnboardingOpen, setIsCaptureModalOpen } = useApp();
  const [step, setStep] = useState<number>(1);

  if (!isOnboardingOpen) return null;

  const handleFinish = () => {
    localStorage.setItem('sparkflow_onboarding_completed', 'true');
    setIsOnboardingOpen(false);
  };

  const handleFirstCapture = () => {
    handleFinish();
    setIsCaptureModalOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F2537]/50 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-[#FFFFFF] w-full max-w-sm rounded-[28px] p-6 shadow-2xl border border-[#E8ECEF] space-y-5 text-center">
        
        {/* Step 1: Welcome */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#52CBB5]/20 text-[#0F2537] mx-auto flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-[#52CBB5]" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-[#0F2537]">Welcome to SparkFlow</h2>
              <p className="text-xs text-[#6B7A90] mt-1.5 leading-relaxed">
                Capture anything. SparkFlow performs the executive functioning work to organize your life.
              </p>
            </div>

            <div className="bg-[#F6F8F9] p-3.5 rounded-[18px] text-xs text-[#0F2537] font-medium space-y-2 text-left">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#52CBB5] shrink-0" />
                <span>Zero manual categorizing or scheduling</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#52CBB5] shrink-0" />
                <span>Text or voice brain dumps in under 1 minute</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#52CBB5] shrink-0" />
                <span>Always in full control of saved tasks</span>
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full py-3 rounded-full bg-[#52CBB5] text-white font-bold text-xs hover:bg-[#42b5a0] transition-all flex items-center justify-center gap-2 shadow-md shadow-[#52CBB5]/20"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 2: How It Works */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#D8CEFA] text-[#0F2537] mx-auto flex items-center justify-center">
              <ShieldCheck className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-[#0F2537]">How SparkFlow Helps</h2>
              <p className="text-xs text-[#6B7A90] mt-1.5 leading-relaxed">
                Speak or type naturally without worrying about deadlines, categories, or formatting.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-left text-xs">
              <div className="bg-[#F6F8F9] p-3 rounded-[16px]">
                <Mic className="w-5 h-5 text-[#FF6B6B] mb-1" />
                <p className="font-bold text-[#0F2537]">Voice or Text</p>
                <p className="text-[10px] text-[#8A99AD] mt-0.5">Brain dump whatever comes to mind</p>
              </div>

              <div className="bg-[#F6F8F9] p-3 rounded-[16px]">
                <Sparkles className="w-5 h-5 text-[#52CBB5] mb-1" />
                <p className="font-bold text-[#0F2537]">AI Extraction</p>
                <p className="text-[10px] text-[#8A99AD] mt-0.5">Extracts tasks, deadlines & reminders</p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={handleFinish}
                className="flex-1 py-3 rounded-full bg-[#F0F4F8] text-[#6B7A90] font-semibold text-xs hover:bg-[#E8ECEF]"
              >
                Skip to App
              </button>
              <button
                onClick={handleFirstCapture}
                className="flex-1 py-3 rounded-full bg-[#52CBB5] text-white font-bold text-xs hover:bg-[#42b5a0] shadow-md shadow-[#52CBB5]/20"
              >
                Try First Capture
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
