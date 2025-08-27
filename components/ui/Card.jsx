import React from "react";

export function Card({ children, className = "" }) {
  return <div className={`rounded-xl border border-slate-800 bg-slate-950 ${className}`}>{children}</div>;
}

export function CardHeader({ children, className = "" }) {
  return <div className={`p-3 border-b border-slate-800 ${className}`}>{children}</div>;
}

export function CardContent({ children, className = "" }) {
  return <div className={`p-3 ${className}`}>{children}</div>;
}

export function CardTitle({ children, className = "" }) {
  return <h3 className={`font-bold text-lg ${className}`}>{children}</h3>;
}
