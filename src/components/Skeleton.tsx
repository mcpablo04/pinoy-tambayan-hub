"use client";

interface SkeletonProps {
  className?: string;
  variant?: "rectangle" | "circle" | "text";
  width?: string | number;
  height?: string | number;
}

export default function Skeleton({ 
  className = "", 
  variant = "rectangle",
  width,
  height
}: SkeletonProps) {
  
  // v4 compatible: Uses 'animate-shimmer' from our @theme block
  const baseStyles = "relative overflow-hidden bg-white/5 before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-white/5 before:to-transparent";

  const variantStyles = {
    rectangle: "rounded-2xl",
    circle: "rounded-full",
    text: "rounded-md h-3 w-3/4 mb-2"
  };

  const style: React.CSSProperties = {
    width: width,
    height: height
  };

  return (
    <div 
      style={style}
      className={`
        ${baseStyles} 
        ${variantStyles[variant]} 
        ${className}
      `} 
    />
  );
}