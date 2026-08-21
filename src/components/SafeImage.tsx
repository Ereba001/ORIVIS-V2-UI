import { useState, type ImgHTMLAttributes } from "react";

interface SafeImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  fallback?: React.ReactNode;
}

export default function SafeImage({ src, alt, className, fallback, ...props }: SafeImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return fallback ? (
      <>{fallback}</>
    ) : (
      <div className={`bg-brand-gray ${className ?? ""}`} aria-label={alt} />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => setFailed(true)}
      {...props}
    />
  );
}
