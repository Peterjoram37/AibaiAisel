import React from "react";

export function Button({ children, className = "", variant = "default", size = "default", ...props }) {
  let base = "rounded font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";

  let variants = {
    default: "bg-blue-600 text-white hover:bg-blue-700",
    outline: "border border-slate-700 text-slate-100 hover:bg-slate-800",
    ghost: "bg-transparent hover:bg-slate-800 text-slate-100",
    secondary: "bg-slate-700 text-white hover:bg-slate-600",
  };

  let sizes = {
    default: "px-4 py-2",
    sm: "px-2 py-1 text-sm",
    icon: "p-2",
  };

  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  );
}
