"use client";
import React from "react";

export function VerifiedBadge({ className = "" }: { className?: string }){
  return (
    <span
      className={`inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] leading-none ${className}`}
      title="Verified"
    >
      ✓
    </span>
  );
}

