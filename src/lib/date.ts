export function pad2(n: number) {
  return n.toString().padStart(2, "0")
}

export function ymd(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

export function parseYMD(s: string) {
  const [y, m, d] = s.split("-").map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

export function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

export function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0)
}

export function addMonths(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1)
}

export function isLeapYear(year: number) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

export function weeksInMonth(d: Date, weekStartsOn: 0 | 1 = 0) {
  const start = startOfMonth(d)
  const end = endOfMonth(d)
  const startWeekday = (start.getDay() - weekStartsOn + 7) % 7
  const totalDays = end.getDate()
  const cells = startWeekday + totalDays
  const rows = Math.ceil(cells / 7)
  const weeks: Date[][] = []
  let day = 1 - startWeekday
  for (let r = 0; r < rows; r++) {
    const row: Date[] = []
    for (let c = 0; c < 7; c++) {
      const dt = new Date(d.getFullYear(), d.getMonth(), day)
      row.push(dt)
      day++
    }
    weeks.push(row)
  }
  return weeks
}

export function monthLabel(d: Date) {
  return d.toLocaleDateString(undefined, { month: "long", year: "numeric" })
}

export function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n))
}

export function buildThresholdList() {
  const thresholds: number[] = []
  const numSteps = 20
  for (let i = 1.0; i <= numSteps; i++) {
    const ratio = i / numSteps
    thresholds.push(ratio)
  }
  thresholds.push(0)
  return thresholds
}
