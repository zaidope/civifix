import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { usePrefersReducedMotion } from '../utils/performance';

const ScrollAnimation = memo(function ScrollAnimation({
  children,
  className = "",
  animation = "fadeInUp",
  delay = 0,
  duration = 0.5,
  threshold = 0.1
}) {
  const reducedMotion = usePrefersReducedMotion();
  const [ref, inView] = useInView({
    threshold,
    triggerOnce: true,
    rootMargin: "50px 0px",
  });

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  const animations = {
    fadeInUp: {
      initial: { opacity: 0, y: 40 },
      animate: inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }
    },
    fadeInLeft: {
      initial: { opacity: 0, x: -40 },
      animate: inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -40 }
    },
    fadeInRight: {
      initial: { opacity: 0, x: 40 },
      animate: inView ? { opacity: 1, x: 0 } : { opacity: 0, x: 40 }
    },
    scaleIn: {
      initial: { opacity: 0, scale: 0.95 },
      animate: inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }
    }
  };

  const variant = animations[animation] || animations.fadeInUp;

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={variant.initial}
      animate={variant.animate}
      transition={{ duration, delay, ease: [0.25, 0.1, 0.25, 1] }}
      style={{ willChange: inView ? "auto" : "transform, opacity" }}
    >
      {children}
    </motion.div>
  );
});

export default ScrollAnimation;
