"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

interface EnhancedCardProps {
  title: string
  description?: string
  children: ReactNode
  selected?: boolean
  className?: string
  badge?: {
    text: string
    variant: "ai" | "manual" | "success" | "default"
  }
  gradient?: boolean
  hover?: boolean
}

export function EnhancedCard({
  title,
  description,
  children,
  selected = false,
  className,
  badge,
  gradient = true,
  hover = true,
}: EnhancedCardProps) {
  return (
    <Card
      className={cn(
        "transition-all duration-300 ease-out",
        gradient && "bg-gradient-to-br from-white to-slate-50",
        hover && "hover:shadow-xl hover:-translate-y-2",
        selected && "ring-2 ring-blue-500 ring-offset-2 bg-gradient-to-br from-blue-50 to-indigo-50",
        className,
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-gray-900 mb-1">{title}</CardTitle>
            {description && <p className="text-sm text-gray-600">{description}</p>}
          </div>
          {badge && (
            <Badge
              className={cn(
                "ml-2",
                badge.variant === "ai" && "bg-gradient-to-r from-purple-500 to-purple-600 text-white",
                badge.variant === "manual" && "bg-gradient-to-r from-blue-500 to-blue-600 text-white",
                badge.variant === "success" && "bg-gradient-to-r from-green-500 to-green-600 text-white",
              )}
            >
              {badge.text}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}
