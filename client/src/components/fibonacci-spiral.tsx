import { cn } from "@/lib/utils";

interface FibSpiralProps {
  className?: string;
  size?: number;
  opacity?: number;
  color?: string;
}

export function FibonacciSpiral({ className, size = 200, opacity = 0.08, color = "hsl(50, 100%, 50%)" }: FibSpiralProps) {
  const fib = [1, 1, 2, 3, 5, 8, 13, 21];
  const scale = size / 55;

  let x = 0, y = 0;
  const arcs: string[] = [];
  const dirs = [
    [1, 0, 0, 1],
    [0, -1, 1, 0],
    [-1, 0, 0, -1],
    [0, 1, -1, 0],
  ];

  let cx = 0, cy = 0;
  for (let i = 0; i < fib.length; i++) {
    const r = fib[i] * scale;
    const dir = dirs[i % 4];
    const ex = cx + dir[0] * r;
    const ey = cy + dir[1] * r;
    const sweep = 1;
    arcs.push(`A ${r} ${r} 0 0 ${sweep} ${ex} ${ey}`);
    cx = ex;
    cy = ey;

    if (i % 4 === 0) { x += fib[i] * scale; }
    else if (i % 4 === 1) { y -= fib[i] * scale; }
    else if (i % 4 === 2) { x -= fib[i] * scale; }
    else { y += fib[i] * scale; }
  }

  return (
    <svg
      className={cn("pointer-events-none select-none", className)}
      width={size}
      height={size}
      viewBox={`${-size * 0.4} ${-size * 0.5} ${size} ${size}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d={`M 0 0 ${arcs.join(" ")}`}
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        opacity={opacity}
        fill="none"
      />
      {fib.slice(0, 6).map((f, i) => {
        const r = f * scale * 0.5;
        const angle = (i * 137.5 * Math.PI) / 180;
        const px = Math.cos(angle) * r * 2;
        const py = Math.sin(angle) * r * 2;
        return (
          <circle
            key={i}
            cx={px}
            cy={py}
            r={r * 0.15 + 0.5}
            fill={color}
            opacity={opacity * 1.5}
          />
        );
      })}
    </svg>
  );
}

export function FibDots({ className, count = 8 }: { className?: string; count?: number }) {
  const phi = (1 + Math.sqrt(5)) / 2;
  return (
    <div className={cn("relative", className)}>
      {Array.from({ length: count }).map((_, i) => {
        const angle = i * 2 * Math.PI / phi;
        const r = Math.sqrt(i + 1) * 12;
        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * r;
        const size = 2 + (count - i) * 0.3;
        return (
          <div
            key={i}
            className="absolute rounded-full bg-yellow-400/20"
            style={{
              width: size,
              height: size,
              left: `calc(50% + ${x}px)`,
              top: `calc(50% + ${y}px)`,
            }}
          />
        );
      })}
    </div>
  );
}

export function GoldenRing({ className, size = 120 }: { className?: string; size?: number }) {
  return (
    <svg
      className={cn("pointer-events-none select-none", className)}
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
    >
      <circle cx="60" cy="60" r="55" stroke="hsl(50, 100%, 50%)" strokeWidth="0.5" opacity="0.15" />
      <circle cx="60" cy="60" r="34" stroke="hsl(50, 100%, 50%)" strokeWidth="0.5" opacity="0.12" />
      <circle cx="60" cy="60" r="21" stroke="hsl(50, 100%, 50%)" strokeWidth="0.5" opacity="0.09" />
      <circle cx="60" cy="60" r="13" stroke="hsl(50, 100%, 50%)" strokeWidth="0.5" opacity="0.06" />
    </svg>
  );
}
