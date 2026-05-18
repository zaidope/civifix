import React from 'react';
import { motion } from 'framer-motion';
import { hoverLift, staggerItem } from '../utils/animations';

const AnimatedCard = ({ 
  children, 
  className = "", 
  hover = true,
  delay = 0,
  ...props 
}) => {
  return (
    <motion.div
      {...props}
      className={`bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      whileHover={hover ? hoverLift.whileHover : {}}
      transition={hover ? hoverLift.transition : {}}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedCard;

