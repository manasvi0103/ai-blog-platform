"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit3, Trash2, FileText } from "lucide-react"
import type { BlogBlock } from "@/types/api"

interface ContentBlockProps {
  block: BlogBlock
  onEdit: () => void
  onRegenerate: () => void
  onDelete?: () => void
  showRegenerateButton?: boolean
}

export function ContentBlock({
  block,
  onEdit,
  onRegenerate,
  onDelete,
  showRegenerateButton = true,
}: ContentBlockProps) {
  const getBlockIcon = () => {
    return <FileText className="h-4 w-4" />
  }

  const getBlockTitle = () => {
    switch (block.type) {
      case "introduction":
        return "Introduction"
      case "section":
        return block.h2 || "Section"
      case "conclusion":
        return "Conclusion"
      case "references":
        return "References"
      default:
        return "Content Block"
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getBlockIcon()}
            <CardTitle className="text-lg">{getBlockTitle()}</CardTitle>
            {block.wordCount && (
              <Badge variant="outline" className="text-xs">
                {block.wordCount} words
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-1">
            <Button onClick={onEdit} variant="ghost" size="sm">
              <Edit3 className="h-4 w-4" />
            </Button>

            {onDelete && (
              <Button onClick={onDelete} variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="prose prose-sm max-w-none">
          {block.h2 && <h2 className="text-xl font-semibold text-gray-900 mb-3">{block.h2}</h2>}
          <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">{block.content}</div>
        </div>
      </CardContent>
    </Card>
  )
}
