import React from "react";
import * as RadixDialog from "@radix-ui/react-dialog";

export const Dialog = RadixDialog.Root;
export const DialogTrigger = RadixDialog.Trigger;
export const DialogContent = RadixDialog.Content;
export const DialogHeader = ({ children }) => <div className="p-4 border-b border-slate-800">{children}</div>;
export const DialogTitle = ({ children }) => <h3 className="font-bold text-lg">{children}</h3>;
