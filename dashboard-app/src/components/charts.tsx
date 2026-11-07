import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'

export const Empty = ({ children }: { children: React.ReactNode }) => <p className="py-7 text-center text-sm text-muted-foreground">{children}</p>

type Series = { key: string; label: string; color: string }

// Vertical columns, one or more series side by side. Rows hold label plus one number per series key.
export function Columns({ data, series }: { data: Record<string, string | number>[]; series: Series[] }) {
  const config: ChartConfig = Object.fromEntries(series.map(s => [s.key, { label: s.label, color: s.color }]))
  const single = series.length === 1 ? series[0].key : ''
  // Full dates do not fit in 14 cells on a phone, so it labels each one by day number; the tooltip has the date.
  const dayOnly = matchMedia('(max-width: 639px)').matches
  const peak = single ? Math.max(0, ...data.map(d => Number(d[single]))) : 0
  // Only the first highest column carries its number; the axis and tooltip give the rest.
  const rows = data.map((d, i) => ({ ...d, peak: peak && d[single] === peak && data.findIndex(x => x[single] === peak) === i ? peak : undefined }))
  return (
    <ChartContainer config={config} className="aspect-auto h-56 w-full">
      <BarChart accessibilityLayer data={rows} barGap={2} margin={{ top: single ? 20 : 0, right: 16, bottom: 0, left: 0 }}>
        {/* Lines between days, not through them, so each day's bars sit in their own cell. */}
        <CartesianGrid stroke="var(--border)" verticalCoordinatesGenerator={({ offset }) => data.map((_, i) => (offset.left ?? 0) + i * (offset.width ?? 0) / data.length).concat((offset.left ?? 0) + (offset.width ?? 0))} />
        <XAxis dataKey="label" interval="preserveEnd" minTickGap={4} tickFormatter={l => dayOnly ? String(l).match(/\d+/)?.[0] ?? l : l} tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis allowDecimals={false} tickCount={3} width={28} tickLine={false} axisLine={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        {series.length > 1 && <ChartLegend verticalAlign="top" align="left" itemSorter={null} content={<ChartLegendContent className="justify-start pt-0 pb-3" />} />}
        {series.map(s => (
          <Bar key={s.key} dataKey={s.key} fill={`var(--color-${s.key})`} radius={[4, 4, 0, 0]} maxBarSize={24}>
            {single && <LabelList dataKey="peak" position="top" className="fill-foreground font-medium" />}
          </Bar>
        ))}
      </BarChart>
    </ChartContainer>
  )
}

const short = (s: string) => s.length > 18 ? `${s.slice(0, 17)}…` : s

// Horizontal bars, one series, value at the tip. data: [{label, value, note?}]
export function Bars({ data, unit = 'Jobs' }: { data: { label: string; value: number; note?: string }[]; unit?: string }) {
  if (!data.length) return <Empty>Nothing yet</Empty>
  return (
    <ChartContainer config={{ value: { label: unit, color: 'var(--chart-1)' } }} className="aspect-auto w-full" style={{ height: data.length * 34 }}>
      <BarChart accessibilityLayer layout="vertical" data={data} margin={{ top: 0, right: 32, bottom: 0, left: 0 }}>
        <XAxis type="number" hide />
        <YAxis type="category" dataKey="label" interval={0} width={120} tickFormatter={short} tickLine={false} axisLine={false} />
        <ChartTooltip content={<ChartTooltipContent labelFormatter={(l, p) => p[0]?.payload.note ? `${l} (${p[0].payload.note})` : l} />} />
        <Bar dataKey="value" fill="var(--color-value)" radius={[0, 4, 4, 0]} barSize={16} minPointSize={2}>
          <LabelList dataKey="value" position="right" className="fill-foreground font-medium" />
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}
