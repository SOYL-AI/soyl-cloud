import { Variants } from "framer-motion";

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    }
  }
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    }
  }
};

export const floatHover: Variants = {
  initial: { y: 0 },
  hover: {
    y: -5,
    transition: {
      duration: 0.3,
      ease: "easeOut",
    }
  }
};

export const staggerItem: Variants = fadeUp;

