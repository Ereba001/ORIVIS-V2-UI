import React, { useState, useEffect } from "react";

interface TextureBgProps {
  src: string;
  opacity?: number;
}

export default function TextureBg({ src, opacity = 0.25 }: TextureBgProps) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.onload = () => setLoaded(true);
    img.src = src;
  }, [src]);

  return (
    <div
      className={`texture-layer ${loaded ? "texture-loaded" : ""}`}
      role="presentation"
      aria-hidden="true"
      style={{
        opacity: loaded ? opacity : 0,
        backgroundImage: `url(${src}), radial-gradient(ellipse at 30% 20%, rgba(255, 255, 255, 0.04) 0%, transparent 60%)`,
      }}
    />
  );
}
