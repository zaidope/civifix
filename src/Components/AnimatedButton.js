import React from 'react';
import { motion } from 'framer-motion';
import { hoverScale, hoverLift } from '../utils/animations';

const AnimatedButton = ({ 
  children, 
  className = "", 
  variant = "primary",
  onClick,
  disabled = false,
  loading = false,
  ...props 
}) => {
  const baseClasses = "relative overflow-hidden font-semibold rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2";
  
  const variantClasses = {
    primary: "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 focus:ring-indigo-500",
    secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500",
    success: "bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 focus:ring-green-500",
    danger: "bg-gradient-to-r from-red-500 to-pink-600 text-white hover:from-red-600 hover:to-pink-700 focus:ring-red-500",
    outline: "border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white focus:ring-indigo-500"
  };

  return (
    <motion.button
      {...props}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses[variant]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      whileHover={!disabled ? hoverScale.whileHover : {}}
      whileTap={!disabled ? hoverScale.whileTap : {}}
      transition={hoverScale.transition}
    >
      {loading && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        </motion.div>
      )}
      <span className={loading ? 'opacity-0' : 'opacity-100'}>
        {children}
      </span>
    </motion.button>
  );
};

export default AnimatedButton;

