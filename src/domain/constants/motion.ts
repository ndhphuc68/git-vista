/** Thời lượng animation (ms), dùng cho Transition và CSS duration. */
export const MOTION = {
  fast: 150,
  normal: 200,
  slow: 300,
} as const;

export type MotionSpeed = keyof typeof MOTION;
