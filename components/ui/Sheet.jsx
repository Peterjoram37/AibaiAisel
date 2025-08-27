import React from "react";
import * as RadixSheet from "@radix-ui/react-dialog";

export const Sheet = RadixSheet.Root;
export const SheetTrigger = RadixSheet.Trigger;
export const SheetContent = RadixSheet.Content;
export const SheetHeader = ({ children }) => <div className="p-4 border-b border-slate-800">{children}</div>;
export const SheetTitle = ({ children }) => <h3 className="font-bold text-lg">{children}</h3>;
