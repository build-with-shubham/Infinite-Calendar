
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
        <Card>
          <div className="grid md:grid-cols-2 gap-4 p-4">
            {entry?.imageUrl ? (
              <img
                src={entry.imageUrl || "/placeholder.svg"}
                alt="Selected entry"
                className="w-full aspect-video object-cover rounded-2xl"
              />
            ) : (
              <div className="w-full aspect-video rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-sm text-gray-500">
                No image
              </div>
            )}
            <div className="space-y-3">
              <div className="text-sm text-gray-500">{entry?.date}</div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold">Rating:</span>
                <span className="text-lg">{entry?.rating ?? "—"}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {(entry?.categories || []).map((c) => (
                  <span key={c} className="px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-xs">
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
