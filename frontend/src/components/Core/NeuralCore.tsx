import React, { useEffect, useRef } from 'react';

export const NeuralCore: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 600);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 450);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener('resize', handleResize);

    // 3D Neural Nodes
    const NODE_COUNT = 48;
    const nodes: Array<{
      x: number;
      y: number;
      z: number;
      baseX: number;
      baseY: number;
      baseZ: number;
      phase: number;
      speed: number;
    }> = [];

    for (let i = 0; i < NODE_COUNT; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const radius = 100 + Math.random() * 70;

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);

      nodes.push({
        x,
        y,
        z,
        baseX: x,
        baseY: y,
        baseZ: z,
        phase: Math.random() * Math.PI * 2,
        speed: 0.3 + Math.random() * 0.4,
      });
    }

    // Interactive mouse parallax
    let targetRotX = 0;
    let targetRotY = 0;
    let rotX = 0;
    let rotY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width - 0.5;
      const ny = (e.clientY - rect.top) / rect.height - 0.5;
      targetRotY = nx * 0.8;
      targetRotX = -ny * 0.8;
    };
    canvas.addEventListener('mousemove', handleMouseMove);

    let time = 0;

    const render = () => {
      time += 0.012;
      rotX += (targetRotX - rotX) * 0.05;
      rotY += (targetRotY - rotY) * 0.05;

      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      // Global subtle ambient lighting
      const ambientGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, 220);
      ambientGrad.addColorStop(0, 'rgba(139, 92, 246, 0.16)');
      ambientGrad.addColorStop(0.5, 'rgba(34, 211, 238, 0.06)');
      ambientGrad.addColorStop(1, 'rgba(7, 9, 16, 0)');
      ctx.fillStyle = ambientGrad;
      ctx.fillRect(0, 0, width, height);

      // Rotating Orbital Rings
      ctx.save();
      ctx.translate(cx, cy);

      // Ring 1 (Outer violet)
      ctx.beginPath();
      ctx.ellipse(0, 0, 170, 75, time * 0.3 + rotY, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(139, 92, 246, 0.25)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Ring 2 (Inner cyan dashed)
      ctx.beginPath();
      ctx.ellipse(0, 0, 140, 60, -time * 0.4 + rotX, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.3)';
      ctx.setLineDash([4, 12]);
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.setLineDash([]);

      // Ring 3 (Equatorial thin reticle)
      ctx.beginPath();
      ctx.ellipse(0, 0, 195, 85, time * 0.15, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.stroke();

      ctx.restore();

      // Transform & Project 3D Nodes
      const currentRotY = time * 0.25 + rotY;
      const currentRotX = 0.2 + rotX;

      const cosY = Math.cos(currentRotY);
      const sinY = Math.sin(currentRotY);
      const cosX = Math.cos(currentRotX);
      const sinX = Math.sin(currentRotX);

      const projected = nodes.map((node) => {
        // Floating wave displacement
        const wave = Math.sin(time * node.speed + node.phase) * 10;
        const bx = node.baseX + wave * 0.2;
        const by = node.baseY + wave * 0.3;
        const bz = node.baseZ + wave * 0.2;

        // Y rotation
        const x1 = bx * cosY - bz * sinY;
        const z1 = bx * sinY + bz * cosY;

        // X rotation
        const y2 = by * cosX - z1 * sinX;
        const z2 = by * sinX + z1 * cosX;

        // Perspective projection
        const fov = 400;
        const scale = fov / (fov + z2);
        const px = cx + x1 * scale;
        const py = cy + y2 * scale;

        return { px, py, z: z2, scale };
      });

      // Sort by depth for correct visual rendering
      projected.sort((a, b) => a.z - b.z);

      // Render Synaptic Connection Lines
      ctx.lineWidth = 0.8;
      for (let i = 0; i < projected.length; i++) {
        for (let j = i + 1; j < projected.length; j++) {
          const dx = projected[i].px - projected[j].px;
          const dy = projected[i].py - projected[j].py;
          const dist = Math.hypot(dx, dy);

          if (dist < 65) {
            const alpha = (1 - dist / 65) * 0.28;
            ctx.strokeStyle = `rgba(167, 139, 250, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(projected[i].px, projected[i].py);
            ctx.lineTo(projected[j].px, projected[j].py);
            ctx.stroke();
          }
        }
      }

      // Central Luminous Core Orb
      const corePulse = 1 + Math.sin(time * 2) * 0.08;
      const coreGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, 38 * corePulse);
      coreGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      coreGrad.addColorStop(0.2, 'rgba(167, 139, 250, 0.9)');
      coreGrad.addColorStop(0.5, 'rgba(139, 92, 246, 0.45)');
      coreGrad.addColorStop(0.85, 'rgba(34, 211, 238, 0.15)');
      coreGrad.addColorStop(1, 'rgba(139, 92, 246, 0)');

      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, 40 * corePulse, 0, Math.PI * 2);
      ctx.fill();

      // Render Nodes with Depth Bloom
      projected.forEach((p, idx) => {
        const radius = Math.max(1.2, p.scale * 2.2);
        const depthAlpha = Math.min(1, Math.max(0.2, (p.z + 180) / 360));

        ctx.fillStyle = idx % 3 === 0 ? `rgba(34, 211, 238, ${depthAlpha})` : `rgba(167, 139, 250, ${depthAlpha})`;
        ctx.beginPath();
        ctx.arc(p.px, p.py, radius, 0, Math.PI * 2);
        ctx.fill();

        // High intensity spark for foreground nodes
        if (p.z > 40 && idx % 4 === 0) {
          ctx.strokeStyle = `rgba(255, 255, 255, ${depthAlpha * 0.8})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      });

      // Data packet pulses travelling between random points
      const packetPulse = (time * 0.8) % 1;
      if (projected.length > 10) {
        const p1 = projected[4];
        const p2 = projected[14];
        const px = p1.px + (p2.px - p1.px) * packetPulse;
        const py = p1.py + (p2.py - p1.py) * packetPulse;

        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#22D3EE';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(px, py, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="relative w-full h-full min-h-[380px] flex items-center justify-center select-none pointer-events-auto">
      {/* Background canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Futuristic HUD Markings */}
      <div className="absolute top-4 left-4 font-mono text-[9px] text-slate-500 tracking-widest uppercase pointer-events-none flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
        <span>CORE // SYNAPTIC MATRIX 01</span>
      </div>

      <div className="absolute top-4 right-4 font-mono text-[9px] text-slate-500 tracking-widest uppercase pointer-events-none">
        <span>FREQ: 98.4 GHZ</span>
      </div>

      <div className="absolute bottom-4 left-4 font-mono text-[9px] text-slate-500 tracking-widest uppercase pointer-events-none">
        <span>LAT: 42.8°N · ROT: ACTIVE</span>
      </div>

      <div className="absolute bottom-4 right-4 font-mono text-[9px] text-violet-400/80 tracking-widest uppercase pointer-events-none">
        <span>STATUS: 100% NOMINAL</span>
      </div>
    </div>
  );
};
