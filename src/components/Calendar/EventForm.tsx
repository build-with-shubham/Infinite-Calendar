
import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { EventEntry } from "@/types/events"
import { clamp } from "@/lib/date"

export const EventForm: React.FC<{
  defaultDate: string
  defaultValue?: EventEntry
  onSubmit: (e: Partial<EventEntry>) => void
  onDelete?: () => void
}> = ({ defaultDate, defaultValue, onSubmit, onDelete }) => {
  const [date, setDate] = useState<string>(defaultValue?.date || defaultDate)
  const [imageUrl, setImageUrl] = useState<string>(defaultValue?.imageUrl || "")
  const [rating, setRating] = useState<number | "">(
    typeof defaultValue?.rating === "number" ? defaultValue!.rating! : "",
  )
  const [categories, setCategories] = useState<string>((defaultValue?.categories || []).join(", "))
  const [description, setDescription] = useState<string>(defaultValue?.description || "")

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit({
          date,
          imageUrl,
          rating: rating === "" ? undefined : Number(rating),
          categories: categories
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          description,
        })
      }}
    >
      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <label className="text-xs block mb-1">Date</label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
        <div>
          <label className="text-xs block mb-1">Rating (1-5)</label>
          <Input
            type="number"
            min={1}
            max={5}
            value={rating}
            onChange={(e) => setRating(e.target.value ? clamp(Number(e.target.value), 1, 5) : "")}
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs block mb-1">Image URL</label>
          <Input type="url" placeholder="https://…" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs block mb-1">Categories (comma-separated)</label>
          <Input value={categories} onChange={(e) => setCategories(e.target.value)} />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs block mb-1">Description</label>
          <textarea
            className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 text-sm min-h-[120px]"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      </div>
      <div className="flex items-center justify-between pt-2">
        {onDelete ? (
          <Button type="button" variant="outline" onClick={onDelete}>
            Delete
          </Button>
        ) : (
          <div />
        )}
        <div className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setDate(defaultDate)
              setImageUrl("")
              setRating("")
              setCategories("")
              setDescription("")
            }}
          >
            Reset
          </Button>
          <Button type="submit">Save</Button>
        </div>
      </div>
    </form>
  )
}
