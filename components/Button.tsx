import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  text: string;
  variant?: "red" | "blue" | "sky";
  disabled?: boolean;
}

export default function Button({ 
  text, 
  variant = 'red', 
  type = 'button',
  disabled = false,
  className = "",
  ...props
}: ButtonProps) {
  const baseStyle = "w-full mt-4 py-3 text-white font-bold rounded-xl shadow-md transition-all text-center";
  const stateStyle = disabled 
    ? "opacity-50 cursor-not-allowed" 
    : "cursor-pointer active:scale-[0.98]";

  // 色ごとのスタイル
  const variantStyles = variant === 'red' 
    ? "bg-brand-red hover:bg-red-600 shadow-brand-red/20" 
    : "bg-brand-blue hover:bg-sky-500 shadow-brand-blue/20";

  return (
    <button 
      type={type} 
      disabled={disabled}
      className={`${baseStyle} ${stateStyle} ${variantStyles} ${className}`}
      {...props}
    >
      {text}
    </button>
  );
}