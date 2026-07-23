"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface TileProps {
  index: number;
  isCenter: boolean;
  isHovered: boolean;
  onHover: (index: number | null) => void;
}

const SIZE = 64;
const DEPTH = 3;

function Tile({ index, isCenter, isHovered, onHover }: TileProps) {
  const color = isCenter ? "59,130,246" : "255,107,0";
  const alpha = isHovered ? 1 : 0.7;

  const glow = `rgba(${color}, ${isHovered ? 0.75 : 0.4})`;

  const faceStyle: React.CSSProperties = {
    width: SIZE,
    height: SIZE,
    background: "#0a0a0a",
    border: `2px solid rgba(${color}, ${alpha})`,
    boxShadow: `0 0 18px ${glow}, inset 0 0 14px ${glow}, 0 0 6px rgba(${color}, ${alpha})`,
    borderRadius: 2,
    transition: "border-color 0.3s ease, box-shadow 0.3s ease",
  };

  const staggerDelay = (index % 3) * 0.2 + Math.floor(index / 3) * 0.25;
  const floatDuration = 3 + (index % 5) * 0.3;

  return (
    <motion.div
      className="relative cursor-pointer"
      style={{ width: SIZE, height: SIZE, transformStyle: "preserve-3d" }}
      onMouseEnter={() => onHover(index)}
      onMouseLeave={() => onHover(null)}
      animate={{
        y: [0, -6, 0, 6, 0],
        z: isHovered ? 24 : 0,
      }}
      transition={{
        y: {
          duration: floatDuration,
          repeat: Infinity,
          ease: "easeInOut",
          delay: staggerDelay,
        },
        z: { type: "spring", stiffness: 260, damping: 16, mass: 0.6 },
      }}
    >
      {/* Top face */}
      <div style={{ ...faceStyle, position: "absolute", transform: `translateZ(${DEPTH / 2}px)` }} />
      {/* Bottom face — gives thin slab depth */}
      <div style={{ ...faceStyle, position: "absolute", transform: `translateZ(${-DEPTH / 2}px)` }} />
    </motion.div>
  );
}

export function IsometricGrid() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div className="relative py-8">
      {/* Background glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className={`w-48 h-48 rounded-full blur-3xl transition-all duration-700 ${
            hoveredIndex !== null
              ? "bg-accent-orange/10"
              : "bg-accent-orange/5"
          }`}
        />
      </div>

      {/* Connected 3x3 platform — rotated as ONE unit */}
      <div
        className="relative flex flex-col items-center"
        style={{ perspective: "1000px" }}
      >
        <div
          style={{
            transform: "rotateX(55deg) rotateZ(-45deg)",
            transformStyle: "preserve-3d",
          }}
        >
          {[0, 1, 2].map((row) => (
            <div
              key={row}
              className="flex"
              style={{ transformStyle: "preserve-3d" }}
            >
              {[0, 1, 2].map((col) => {
                const index = row * 3 + col;
                const isCenter = row === 1 && col === 1;
                return (
                  <Tile
                    key={col}
                    index={index}
                    isCenter={isCenter}
                    isHovered={hoveredIndex === index}
                    onHover={setHoveredIndex}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
