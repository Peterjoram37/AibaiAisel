import React from "react";

export function Badge({ children, className = "" }) {
  return <span className={`inline-block px-2 py-1 text-xs rounded-full bg-blue-600/20 border border-blue-500/30 ${className}`}>{children}</span>;
}
