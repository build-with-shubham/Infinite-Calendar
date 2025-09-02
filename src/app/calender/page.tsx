
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

import type { EventEntry, FilterState } from "@/types/events"
import { addMonths, buildThresholdList, clamp, isLeapYear, monthLabel, startOfMonth, ymd } from "@/lib/date"
import { fetchRemoteJournal, loadLocalEvents, saveLocalEvents } from "@/lib/data"
import { EventForm } from "@/components/Calendar/EventForm"
import { MonthGrid } from "@/components/Calendar/MonthGrid"
import { SwipeCard } from "@/components/Calendar/SwipeCard"

const HEADER_HEIGHT = 72
const WEEKDAY_LABELS = (startOnMonday: boolean) =>
    startOnMonday ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

export default function CalendarPage() {
    // State
    const [weekStartsOn, setWeekStartsOn] = useState<0 | 1>(1) // 1 = Monday
    const [filters, setFilters] = useState<FilterState>({ text: "", category: "", minRating: undefined })
    const [headerLabel, setHeaderLabel] = useState<string>(monthLabel(new Date()))

    const [range, setRange] = useState<{ start: number; end: number }>({ start: -24, end: 24 })
    const containerRef = useRef<HTMLDivElement>(null)

    const monthHeights = useRef<Map<number, number>>(new Map())
    const monthRefs = useRef<Map<number, HTMLDivElement | null>>(new Map())

    // Data state
    const [remote, setRemote] = useState<EventEntry[]>([])
    const [localEvents, setLocalEvents] = useState<EventEntry[]>([])

    // Dialogs state
    const [openEventForm, setOpenEventForm] = useState(false)
    const [formDate, setFormDate] = useState<string>(ymd(new Date()))
    const [editing, setEditing] = useState<EventEntry | null>(null)

    const [openViewer, setOpenViewer] = useState(false)
    const [viewerDate, setViewerDate] = useState<string>("")
    const [viewerIndex, setViewerIndex] = useState<number>(0)

    useEffect(() => {
        setLocalEvents(loadLocalEvents())
    }, [])

    useEffect(() => {
        fetchRemoteJournal().then(setRemote)
    }, [])

    const allEvents = useMemo(() => {
        const combined = [...remote, ...localEvents]
        if (!filters.text && !filters.category && !filters.minRating) return combined

        const t = filters.text.toLowerCase()
        return combined.filter((e) => {
            if (filters.category && !(e.categories || []).includes(filters.category)) return false
            if (typeof filters.minRating === "number" && (e.rating ?? -1) < filters.minRating!) return false
            if (t) {
                const blob = `${e.description || ""} ${(e.categories || []).join(" ")}`.toLowerCase()
                if (!blob.includes(t)) return false
            }
            return true
        })
    }, [remote, localEvents, filters])

    const eventsByDay = useMemo(() => {
        const map = new Map<string, EventEntry[]>()
        for (const e of allEvents) {
            if (!map.has(e.date)) map.set(e.date, [])
            map.get(e.date)!.push(e)
        }
        for (const [k, arr] of map) arr.sort((a, b) => (a.id > b.id ? 1 : -1))
        return map
    }, [allEvents])

    // Infinite scroll 
    const anchor = useMemo(() => startOfMonth(new Date()), [])
    const monthAt = useCallback((offset: number) => addMonths(anchor, offset), [anchor])
    const monthList = useMemo(() => {
        const arr: number[] = []
        for (let i = range.start; i <= range.end; i++) arr.push(i)
        return arr
    }, [range])

    useLayoutEffect(() => {
        const observers: ResizeObserver[] = []
        for (const offset of monthList) {
            const el = monthRefs.current.get(offset)
            if (!el) continue
            const ro = new ResizeObserver(() => {
                monthHeights.current.set(offset, el.getBoundingClientRect().height)
            })
            ro.observe(el)
            monthHeights.current.set(offset, el.getBoundingClientRect().height)
            observers.push(ro)
        }
        return () => {
            for (const ro of observers) ro.disconnect()
        }
    }, [monthList])

    // Extend window on scroll 
    const onScroll = useCallback(() => {
        const container = containerRef.current
        if (!container) return
        const { scrollTop, clientHeight, scrollHeight } = container
        const threshold = 800

        if (scrollTop < threshold) {
            setRange((prev) => {
                const next = { start: prev.start - 6, end: prev.end }
                const span = next.end - next.start
                return span > 180 ? { start: next.start, end: next.end - 6 } : next
            })
        } else if (scrollTop + clientHeight > scrollHeight - threshold) {
            setRange((prev) => {
                const next = { start: prev.start, end: prev.end + 6 }
                const span = next.end - next.start
                return span > 180 ? { start: next.start + 6, end: next.end } : next
            })
        }
    }, [])

    useEffect(() => {
        const container = containerRef.current
        if (!container) return
        const options: IntersectionObserverInit = { root: container, threshold: buildThresholdList() }
        const io = new IntersectionObserver((entries) => {
            let best: { ratio: number; label: string } | null = null
            for (const e of entries) {
                const offset = Number((e.target as HTMLElement).dataset.offset)
                const d = monthAt(offset)
                const label = monthLabel(d)
                const ratio = e.intersectionRatio
                if (!best || ratio > best.ratio) best = { ratio, label }
            }
            if (best) setHeaderLabel((prev) => (prev === best!.label ? prev : best!.label))
        }, options)

        for (const offset of monthList) {
            const el = monthRefs.current.get(offset)
            if (el) io.observe(el)
        }
        return () => io.disconnect()
    }, [monthList, monthAt])

    const isMonthMostlyVisible = useCallback((offset: number) => {
        const container = containerRef.current
        const el = monthRefs.current.get(offset)
        if (!container || !el) return false
        const r = el.getBoundingClientRect()
        const c = container.getBoundingClientRect()
        const visibleTop = Math.max(r.top, c.top + HEADER_HEIGHT)
        const visibleBottom = Math.min(r.bottom, c.bottom)
        const visible = Math.max(0, visibleBottom - visibleTop)
        const ratio = visible / Math.max(1, r.height)
        return ratio >= 0.5
    }, [])

    const getCurrentVisibleOffset = useCallback(() => {
        const visibleOffsets = monthList.filter((o) => isMonthMostlyVisible(o))
        return visibleOffsets.length ? visibleOffsets[0] : 0
    }, [monthList, isMonthMostlyVisible])

    const jumpToMonth = useCallback((targetOffset: number) => {
        const container = containerRef.current
        const el = monthRefs.current.get(targetOffset)
        if (!container || !el) return
        const top = el.offsetTop - HEADER_HEIGHT - 8
        container.scrollTo({ top, behavior: "smooth" })
    }, [])

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) e.preventDefault()
            const current = getCurrentVisibleOffset()
            if (e.key === "ArrowLeft" || e.key === "ArrowUp") jumpToMonth(current - 1)
            if (e.key === "ArrowRight" || e.key === "ArrowDown") jumpToMonth(current + 1)
        }
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [getCurrentVisibleOffset, jumpToMonth])

    useEffect(() => {
        const container = containerRef.current
        if (!container) return
        const currentEl = monthRefs.current.get(0)
        if (currentEl) {
            const top = currentEl.offsetTop - HEADER_HEIGHT - 8
            container.scrollTo({ top })
        }
    }, [])

    // Event handlers
    const openDay = (iso: string) => {
        setFormDate(iso)
        setEditing(null)
        setOpenEventForm(true)
    }

    const onEntryClick = (iso: string, i: number) => {
        setViewerDate(iso)
        setViewerIndex(i)
        setOpenViewer(true)
    }

    const upsertEvent = (e: Partial<EventEntry>) => {
        if (editing) {
            const updated: EventEntry = { ...editing, ...e } as EventEntry
            const next = localEvents.map((x) => (x.id === editing.id ? updated : x))
            setLocalEvents(next)
            saveLocalEvents(next)
        } else {
            const created: EventEntry = {
                id: `local-${Date.now()}`,
                date: e.date || formDate,
                imageUrl: e.imageUrl || "",
                rating: e.rating ?? undefined,
                categories: e.categories || [],
                description: e.description || "",
                source: "local",
            }
            const next = [...localEvents, created]
            setLocalEvents(next)
            saveLocalEvents(next)
        }
        setOpenEventForm(false)
    }

    const deleteEvent = (id: string) => {
        const next = localEvents.filter((e) => e.id !== id)
        setLocalEvents(next)
        saveLocalEvents(next)
        setOpenEventForm(false)
    }

    const dayEntries = (iso: string) => eventsByDay.get(iso) || []

    // Render
    return (
        <div className="h-screen w-full bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50">
            {/* Sticky Header */}
            <div className="sticky top-0 z-30 h-[72px] backdrop-blur supports-[backdrop-filter]:bg-white/70 dark:supports-[backdrop-filter]:bg-black/40 bg-white/80 dark:bg-black/60 border-b border-gray-200 dark:border-gray-800 flex items-center">
                <div className="mx-auto w-full max-w-6xl px-3 md:px-6 flex items-center justify-between gap-3">
                    <AnimatePresence mode="popLayout" initial={false}>
                        <motion.h1
                            key={headerLabel}
                            layout
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -10, opacity: 0 }}
                            className="text-xl md:text-2xl font-bold tracking-tight text-balance"
                        >
                            {headerLabel}
                        </motion.h1>
                    </AnimatePresence>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            onClick={() => {
                                const current = getCurrentVisibleOffset()
                                jumpToMonth(current - 1)
                            }}
                        >
                            Prev
                        </Button>
                        <Button variant="outline" onClick={() => jumpToMonth(0)}>
                            Today
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => {
                                const current = getCurrentVisibleOffset()
                                jumpToMonth(current + 1)
                            }}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="sticky top-[72px] z-20 bg-white/80 dark:bg-black/60 backdrop-blur border-b border-gray-200 dark:border-gray-800">
                <div className="mx-auto w-full max-w-6xl px-3 md:px-6 py-3 grid grid-cols-2 md:grid-cols-6 gap-2">
                    <div className="col-span-2 md:col-span-3">
                        <Input
                            placeholder="Search text…"
                            value={filters.text}
                            onChange={(e) => setFilters((f) => ({ ...f, text: e.target.value }))}
                            aria-label="Search entries"
                        />
                    </div>
                    <div className="col-span-1">
                        <Input
                            placeholder="Category"
                            value={filters.category}
                            onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
                            aria-label="Filter by category"
                        />
                    </div>
                    <div className="col-span-1">
                        <Input
                            placeholder="Min rating (1-5)"
                            type="number"
                            min={1}
                            max={5}
                            value={filters.minRating ?? ""}
                            onChange={(e) =>
                                setFilters((f) => ({
                                    ...f,
                                    minRating: e.target.value ? clamp(Number(e.target.value), 1, 5) : undefined,
                                }))
                            }
                            aria-label="Minimum rating"
                        />
                    </div>
                    <div className="col-span-1 flex items-center gap-2">
                        <Button variant="outline" onClick={() => setFilters({ text: "", category: "", minRating: undefined })}>
                            Clear
                        </Button>
                        <Button variant="outline" onClick={() => setWeekStartsOn((w) => (w === 1 ? 0 : 1))}>
                            {weekStartsOn === 1 ? "Start Mon" : "Start Sun"}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Scroll Container */}
            <div
                ref={containerRef}
                onScroll={onScroll}
                className="mx-auto w-full max-w-6xl h-[calc(100vh-72px-56px)] overflow-y-auto will-change-transform"
                aria-label="Calendar scroll container"
            >
                <div className="px-3 md:px-6 py-6 space-y-20">
                    {monthList.map((offset) => {
                        const d = monthAt(offset)
                        return (
                            <div
                                key={offset}
                                data-offset={offset}
                                ref={(el) => { monthRefs.current.set(offset, el) }}
                                className="scroll-mt-[88px]"
                            >
                                <header className="mb-15">
                                    <h2 className="text-xl font-semibold tracking-tight">
                                        {d.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
                                    </h2>
                                    {isLeapYear(d.getFullYear()) && d.getMonth() === 1 && (
                                        <p className="text-xs text-gray-500 mt-1">Leap year</p>
                                    )}
                                </header>
                                <MonthGrid
                                    monthDate={d}
                                    eventsByDay={eventsByDay}
                                    weekStartsOn={weekStartsOn}
                                    weekdayLabels={WEEKDAY_LABELS(weekStartsOn === 1)}
                                    onDayClick={openDay}
                                    onEntryClick={onEntryClick}
                                />
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Add/Edit Event Dialog */}
            <Dialog open={openEventForm} onOpenChange={setOpenEventForm}>
                <DialogHeader>
                    {/* <DialogTitle>{editing ? "Edit Entry" : "Add Entry"}</DialogTitle> */}
                </DialogHeader>
                <DialogContent>
                    <EventForm
                        defaultDate={formDate}
                        defaultValue={editing || undefined}
                        onSubmit={upsertEvent}
                        onDelete={editing ? () => deleteEvent(editing!.id) : undefined}
                    />
                </DialogContent>
            </Dialog>

            <Dialog open={openViewer} onOpenChange={setOpenViewer}>

                <DialogContent>
                    <SwipeCard entries={dayEntries(viewerDate)} index={viewerIndex} onIndex={setViewerIndex} />
                </DialogContent>
            </Dialog>

            <div className="fixed bottom-6 right-6">
                <Button
                    className="rounded-full shadow-lg"
                    onClick={() => {
                        setFormDate(ymd(new Date()))
                        setEditing(null)
                        setOpenEventForm(true)
                    }}
                //   aria-label="Add entry"
                >
                    + Add
                </Button>
            </div>
        </div>
    )
}
