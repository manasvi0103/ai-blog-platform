"use client"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface SEOScoreCircleProps {
  score: number
  size?: "sm" | "md" | "lg"
  showBreakdown?: boolean
  breakdown?: {
    keywordScore: number
    lengthScore: number
    readabilityScore: number
    trendScore: number
  }
}

export function SEOScoreCircle({ score, size = "md", showBreakdown = false, breakdown }: SEOScoreCircleProps) {
  const getColor = (score: number) => {
    if (score >= 90) return "#00aa66"
    if (score >= 70) return "#f59e0b"
    return "#ef4444"
  }

  const getSize = () => {
    switch (size) {
      case "sm":
        return { width: 40, height: 40, strokeWidth: 3, fontSize: "10px" }
      case "lg":
        return { width: 80, height: 80, strokeWidth: 6, fontSize: "16px" }
      default:
        return { width: 60, height: 60, strokeWidth: 4, fontSize: "12px" }
    }
  }

  const { width, height, strokeWidth, fontSize } = getSize()
  const radius = (width - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (score / 100) * circumference

  const circle = (
    <div className="relative inline-flex items-center justify-center">
      <svg width={width} height={height} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={width / 2}
          cy={height / 2}
          r={radius}
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress circle */}
        <circle
          cx={width / 2}
          cy={height / 2}
          r={radius}
          stroke={getColor(score)}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
          style={{
            animation: "fillScore 1s ease-out",
          }}
        />
      </svg>
      <div
        className="absolute inset-0 flex items-center justify-center font-bold"
        style={{ fontSize, color: getColor(score) }}
      >
        {score}
      </div>
    </div>
  )

  if (showBreakdown && breakdown) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{circle}</TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between gap-4">
                <span>Keywords:</span>
                <span>{breakdown.keywordScore}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span>Length:</span>
                <span>{breakdown.lengthScore}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span>Readability:</span>
                <span>{breakdown.readabilityScore}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span>Trends:</span>
                <span>{breakdown.trendScore}</span>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return circle
}
