"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import LoginForm from "@/components/LoginForm";

// Dynamic import Spline to avoid SSR issues
const Spline = dynamic(() => import("@splinetool/react-spline"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-white/30 border-t-white rounded-full"></div>
    </div>
  ),
});

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-16 lg:px-24 py-12 bg-gradient-to-br from-gray-100 to-gray-200">
        <Suspense fallback={
          <div className="max-w-md w-full mx-auto">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-300 rounded w-3/4"></div>
              <div className="h-4 bg-gray-300 rounded w-1/2"></div>
            </div>
          </div>
        }>
          <LoginForm />
        </Suspense>
      </div>

      {/* Right Side - 3D Spline Animation */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500 relative overflow-hidden">
        {/* Spline 3D Scene */}
        <div className="absolute inset-0 w-full h-full">
          <Spline scene="https://prod.spline.design/DxTQnnuQcl6HNTJl/scene.splinecode" />
        </div>
        
        {/* Floating Container */}
        <div className="absolute right-3 bottom-4 flex items-center justify-center z-40 pointer-events-none">
          <div className="bg-[#f5f6f5] rounded-xl p-5 min-w-[10vw]">
            <h2 className="text-xl font-bold text-gray-800 text-center tracking-wide">
             
            </h2>
          </div>
        </div>
      </div>
    </div>
  );
}
