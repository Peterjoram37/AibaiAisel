import React from "react";
import * as RadixTabs from "@radix-ui/react-tabs";

export const Tabs = RadixTabs.Root;
export const TabsList = ({ children, className = "" }) => <RadixTabs.List className={`flex border-b border-slate-800 ${className}`}>{children}</RadixTabs.List>;
export const TabsTrigger = ({ children, className = "", value }) => (
  <RadixTabs.Trigger value={value} className={`px-3 py-2 border-b-2 border-transparent data-[state=active]:border-blue-500 ${className}`}>
    {children}
  </RadixTabs.Trigger>
);
export const TabsContent = RadixTabs.Content;
