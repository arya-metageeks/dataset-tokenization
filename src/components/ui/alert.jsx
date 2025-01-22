import React from 'react';
import { AlertCircle } from "lucide-react";

// Alert Components
export const Alert = React.forwardRef(({ variant = "default", className = "", children, ...props }, ref) => {
  const variantClasses = {
    default: "bg-gray-100 text-gray-800 border-gray-200",
    destructive: "bg-red-100 text-red-800 border-red-200"
  };

  return (
    <div
      ref={ref}
      role="alert"
      className={`relative w-full rounded-lg border p-4 ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
});

Alert.displayName = "Alert";

export const AlertTitle = React.forwardRef(({ className = "", ...props }, ref) => (
  <h5
    ref={ref}
    className={`mb-1 font-medium leading-none tracking-tight ${className}`}
    {...props}
  />
));

AlertTitle.displayName = "AlertTitle";

export const AlertDescription = React.forwardRef(({ className = "", ...props }, ref) => (
  <div
    ref={ref}
    className={`flex items-center gap-2 text-sm [&_p]:leading-relaxed ${className}`}
    {...props}
  >
    <AlertCircle className="h-4 w-4" />
    <span>{props.children}</span>
  </div>
));

AlertDescription.displayName = "AlertDescription";