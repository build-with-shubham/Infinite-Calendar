
import type React from "react"
import type { EventEntry } from "@/types/events"
import { weeksInMonth, ymd } from "@/lib/date"

export const MonthGrid: React.FC<{
  monthDate: Date
  eventsByDay: Map<string, EventEntry[]>
  weekStartsOn: 0 | 1
  weekdayLabels: string[]
  onDayClick: (dateISO: string) => void
  onEntryClick: (dateISO: string, entryIndex: number) => void
}> = ({ monthDate, eventsByDay, weekStartsOn, weekdayLabels, onDayClick, onEntryClick }) => {
  const weeks = weeksInMonth(monthDate, weekStartsOn)
  const month = monthDate.getMonth()

  return (
    <div className="w-full select-none">
      {/* Month title spacer for sticky behavior alignment */}
      <div className="sticky top-0 -mt-16 h-0 pointer-events-none" aria-hidden />
      <div className="grid grid-cols-7 gap-2 text-xs text-gray-500 px-1 md:px-2">
        {weekdayLabels.map((l) => (
          <div key={l} className="text-center uppercase tracking-wide">
            {l}
          </div>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-7 gap-2 px-1 md:px-2">
        {weeks.flat().map((d, idx) => {
          const iso = ymd(d)
          const isCurrentMonthDay = d.getMonth() === month
          const entries = eventsByDay.get(iso) || []
          const isToday = d.toDateString() === new Date().toDateString()
          return (
            <div
              key={iso + idx}
              className={`min-h-[92px] md:min-h-[120px] rounded-2xl border p-2 flex flex-col gap-1 transition ${
                isCurrentMonthDay
                  ? "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"
                  : "bg-gray-50 dark:bg-gray-900/40 border-gray-200/60 dark:border-gray-800/60 opacity-70"
              }`}
              onClick={() => onDayClick(iso)}
              role="button"
              aria-label={`Open day ${iso}`}
            >
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">{d.getDate()}</div>
                {isToday && <span className="text-[10px] px-2 py-0.5 rounded-full bg-black text-white">Today</span>}
              </div>
              <div className="flex flex-wrap gap-1">
                {entries.slice(0, 3).map((e, i) =>
                  e.imageUrl ? (
                    <img
                      key={e.id}
                      src={e.imageUrl || "/placeholder.svg"}
                      alt="Entry thumbnail"
                      className="w-8 h-8 rounded-lg object-cover cursor-pointer"
                      onClick={(ev) => {
                        ev.stopPropagation()
                        onEntryClick(iso, i)
                      }}
                    />
                  ) : (
                    <div
                      key={e.id}
                      className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700 text-[10px] flex items-center justify-center cursor-pointer"
                      onClick={(ev) => {
                        ev.stopPropagation()
                        onEntryClick(iso, i)
                      }}
                    >
                      Note
                    </div>
                  ),
                )}
                {entries.length > 3 && (
                  <div className="text-[10px] px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800">
                    +{entries.length - 3}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
