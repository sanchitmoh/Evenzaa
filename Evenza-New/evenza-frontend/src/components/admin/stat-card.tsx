import React from "react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type StatCardProps = {
  title: string
  value: string
  change: string
  icon: React.ReactNode
  color: "violet" | "blue" | "emerald" | "amber"
  isNegative?: boolean
}

const StatCard = ({
  title,
  value,
  change,
  icon,
  color,
  isNegative = false,
}: StatCardProps) => {
  const colorVariants = {
    violet: "bg-violet-500/20 text-violet-500",
    blue: "bg-blue-500/20 text-blue-500",
    emerald: "bg-emerald-500/20 text-emerald-500",
    amber: "bg-amber-500/20 text-amber-500",
  }

  const changeColorClass = isNegative ? "text-red-500" : "text-emerald-500"

  return (
    <Card className="bg-zinc-900/80 border-zinc-800">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm text-gray-400">{title}</h3>
          <div className={cn("p-2 rounded-full", colorVariants[color])}>
            {icon}
          </div>
        </div>
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-bold">{value}</h2>
          <div className={cn("text-sm font-medium", changeColorClass)}>
            {change}
          </div>
        </div>
      </div>
    </Card>
  )
}

export default StatCard
