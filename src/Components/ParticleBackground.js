import React, { useEffect, useRef, memo } from 'react';
import { usePageVisible, usePrefersReducedMotion, useIsMobile } from '../utils/performance';

const ParticleBackground = memo(function ParticleBackground() {
  const canvasRef = useRef(null);
  const isVisible = usePageVisible();
  const reducedMotion = usePrefersReducedMotion();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (reducedMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    let animationId;
    let running = true;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas, { passive: true });

    class Particle {
      constructor() {
        this.reset();
      }
      reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.4;
        this.vy = (Math.random() - 0.5) * 0.4;
        this.size = Math.random() * 1.5 + 0.8;
        this.opacity = Math.random() * 0.35 + 0.15;
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0) this.x = canvas.width;
        if (this.x > canvas.width) this.x = 0;
        if (this.y < 0) this.y = canvas.height;
        if (this.y > canvas.height) this.y = 0;
      }
      draw() {
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = '#667eea';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const maxParticles = isMobile ? 12 : 24;
    const particles = Array.from({ length: maxParticles }, () => new Particle());
    const connectionDistSq = 10000;

    const animate = () => {
      if (!running || !isVisible) {
        animationId = requestAnimationFrame(animate);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.update();
        p.draw();
      }

      ctx.strokeStyle = '#667eea';
      ctx.lineWidth = 1;
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          if (Math.abs(p1.x - p2.x) > 100 || Math.abs(p1.y - p2.y) > 100) continue;
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < connectionDistSq) {
            const distance = Math.sqrt(distSq);
            ctx.globalAlpha = ((100 - distance) / 100) * 0.15;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      running = false;
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationId);
    };
  }, [isVisible, reducedMotion, isMobile]);

  if (reducedMotion) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 gpu-layer"
      aria-hidden="true"
    />
  );
});

export default ParticleBackground;
