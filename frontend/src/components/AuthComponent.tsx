import React from "react";
import { Button } from "@/components/button";
import { cn } from "@/lib/utils";

export const Header = ({ title, subtitle, className }: { title: string; subtitle?: string; className?: string }) => (
    <div className={cn("login-header text-center mb-8", className)}>
        <h1 className="welcome-title text-[1.875rem] font-semibold text-foreground leading-[1.875rem] mb-2">{title}</h1>
        {subtitle && <p className="welcome-subtitle text-[0.875rem] font-normal text-muted-foreground leading-relaxed mx-auto max-w-[20rem]">{subtitle}</p>}
    </div>
);

export const InputLabel = ({ children, htmlFor, required, className }: { children: React.ReactNode, htmlFor?: string, required?: boolean, className?: string }) => (
    <label htmlFor={htmlFor} className={cn("block text-[0.875rem] font-medium text-foreground mb-2", className)}>
        {children}
        {required && <span className="text-black ml-1">*</span>}
    </label>
);

export const PrimaryButton = ({ children, onClick, disabled, className = "" }: { children: React.ReactNode, onClick: () => void, disabled?: boolean, className?: string }) => (
    <Button
        className={cn("login-button w-full h-[3.25rem] bg-sunbird-brick hover:bg-sunbird-brick/90 text-white text-[1rem] font-medium rounded-[0.625rem] shadow-none border-none transition-all", className)}
        disabled={disabled}
        onClick={onClick}
    >
        {children}
    </Button>
);
