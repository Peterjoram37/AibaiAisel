"use client";
import React from "react";
import { VerifiedBadge } from "./VerifiedBadge";

export function UserName({ name, verified, className = "" }: { name: string; verified?: boolean; className?: string }){
  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <span className="font-semibold leading-none">{name}</span>
      {verified ? <VerifiedBadge /> : null}
    </span>
  );
}

