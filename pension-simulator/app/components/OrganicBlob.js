"use client";
import { motion } from "framer-motion";

export default function OrganicBlob() {
  return (
    <motion.div
      className="fixed inset-0 -z-20 opacity-[0.35] pointer-events-none"
      initial={{ borderRadius: "55% 45% 60% 40%" }}
      animate={{
        borderRadius: [
          "55% 45% 60% 40%",
          "45% 55% 40% 60%",
          "60% 40% 55% 45%",
          "55% 45% 60% 40%",
        ],
        scale: [1, 1.05, 1, 1.07, 1],
        rotate: [0, 10, -8, 12, 0],
      }}
      transition={{
        duration: 22,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      style={{
        background: "radial-gradient(circle at 30% 40%, #DAD8C3 0%, #7A6D45 70%)",
        filter: "blur(80px)",
      }}
    ></motion.div>
  );
}
