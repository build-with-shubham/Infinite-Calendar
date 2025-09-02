
import type React from "react"
import { motion, type PanInfo } from "framer-motion"
import { Card } from "@/components/ui/card"
import type { EventEntry } from "@/types/events"

export const SwipeCard: React.FC<{
  entries: EventEntry[]
  index: number
  onIndex: (n: number) => void
}> = ({ entries, index, onIndex }) => {
  const entry = entries[index]

  const onDragEnd = (_: any, info: PanInfo) => {
    const offsetX = info.offset.x
    if (offsetX > 120 && index > 0) onIndex(index - 1)
    else if (offsetX < -120 && index < entries.length - 1) onIndex(index + 1)
  }

  return (
    <div className="relative">
      <div className="absolute -top-2 right-0 rounded-full bg-black/5 dark:bg-white/10 px-2 py-1 text-xs">
        {index + 1} / {entries.length}
      </div>
      <motion.div
        className="overflow-hidden"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={onDragEnd}
      >
        <Card className="w-full h-full  p-1 rounded-3xl shadow-lg bg-white dark:bg-gray-900">
          <div className="flex flex-col gap-4">
            {/* Image Section */}
            {entry?.imageUrl ? (
              <div className="w-full h-90 rounded-2xl overflow-hidden flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                <img
                  src={entry.imageUrl || "/placeholder.svg"}
                  alt="Selected entry"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-full h-70 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-sm text-gray-500">
                No image
              </div>
            )}

            {/* Details Section */}
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="text-lg font-semibold">{entry?.date}</div>
              <div className="flex items-center gap-1 justify-center">
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg
                    key={i}
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-5 w-5 ${i < (entry?.rating ?? 0)
                        ? "text-yellow-400"
                        : "text-gray-300 dark:text-gray-600"
                      }`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.946a1 1 0 00.95.69h4.15c.969 0 1.371 1.24.588 1.81l-3.36 2.44a1 1 0 00-.364 1.118l1.287 3.946c.3.921-.755 1.688-1.54 1.118l-3.36-2.44a1 1 0 00-1.176 0l-3.36 2.44c-.784.57-1.838-.197-1.539-1.118l1.287-3.946a1 1 0 00-.364-1.118L2.036 9.373c-.783-.57-.38-1.81.588-1.81h4.15a1 1 0 00.95-.69l1.286-3.946z" />
                  </svg>
                ))}
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {(entry?.categories || []).map((c) => (
                  <span
                    key={c}
                    className="px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-medium"
                  >
                    {c}
                  </span>
                ))}
              </div>
              <p className="text-sm leading-6 whitespace-pre-wrap">{entry?.description || "(no description)"}</p>
            </div>
          </div>
        </Card>

      </motion.div>
    </div>
  )
}
