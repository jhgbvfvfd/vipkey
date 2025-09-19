import React from 'react';
import { motion } from 'framer-motion';

const IntroAnimation: React.FC = () => {
  const text = "ADMIN BOT CSCODE";
  const letters = Array.from(text);

  const container = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.04 * i },
    }),
  };

  const child = {
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 100,
      },
    },
    hidden: {
      opacity: 0,
      x: -20,
      y: 10,
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 100,
      },
    },
  };

  return (
    <motion.div
      style={{ display: "flex", justifyContent: "center", alignItems: "center", overflow: "hidden" }}
      variants={container}
      initial="hidden"
      animate="visible"
    >
      {letters.map((letter, index) => (
        <motion.span
          key={index}
          variants={child}
          style={{
            margin: '0 2px',
            fontSize: '2rem',
            fontWeight: 'bold',
            color: '#fff',
            textShadow: '0 0 10px #007BFF, 0 0 20px #007BFF, 0 0 30px #007BFF',
          }}
        >
          {letter === " " ? "\u00A0" : letter}
        </motion.span>
      ))}
    </motion.div>
  );
};

export default IntroAnimation;
