"use client";

import { motion, useTransform, type MotionValue } from "framer-motion";

import type { Room } from "@/lib/site-config";

export interface RoomProgressProps {
  rooms: readonly Room[];
  active: number;
  progress: MotionValue<number>;
}

interface SegmentProps {
  index: number;
  total: number;
  progress: MotionValue<number>;
}

/** Fills between two ordinals as the camera crosses from one world to the next. */
function Segment({ index, total, progress }: SegmentProps) {
  const band = 1 / total;
  const from = (index + 0.5) * band;
  const to = (index + 1.5) * band;
  const scaleX = useTransform(progress, [from, to], [0, 1], { clamp: true });

  return (
    <span className="room-progress-track">
      <motion.span className="room-progress-fill" style={{ scaleX }} />
    </span>
  );
}

/**
 * Ordinals joined by scroll-linked rules. Reads as a chapter marker in the
 * composition rather than carousel dots.
 */
export function RoomProgress({ rooms, active, progress }: RoomProgressProps) {
  return (
    <div className="room-progress" aria-hidden="true">
      {rooms.map((room, index) => (
        <span className="room-progress-step" key={room.id}>
          {index > 0 && (
            <Segment index={index - 1} total={rooms.length} progress={progress} />
          )}
          <span
            className="room-progress-ordinal"
            data-state={
              index === active ? "active" : index < active ? "past" : "upcoming"
            }
          >
            {room.ordinal}
          </span>
        </span>
      ))}
    </div>
  );
}
