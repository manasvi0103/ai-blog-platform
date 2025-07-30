"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit3, Trash2, FileText, ExternalLink, Link, RefreshCw } from "lucide-react"
import type { BlogBlock } from "@/types/api"

interface ContentBlockProps {
  block: BlogBlock
  onEdit: () => void
  onRegenerate: () => void
  onDelete?: () => void
  showRegenerateButton?: boolean
  selectedKeyword?: string
}

// Helper function to make links clickable and clean markdown
const makeLinksClickable = (text: string) => {
  if (!text) return text;

  // First clean any remaining markdown formatting
  let cleanText = text
    // Remove bold markdown
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    // Remove italic markdown
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    // Remove heading markers
    .replace(/^#{1,6}\s+/gm, '')
    // Remove list markers
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1');

  // Then make URLs clickable
  const urlRegex = /(https?:\/\/[^\s\)]+)/g;
  const parts = cleanText.split(urlRegex);

  return parts.map((part, index) => {
    if (urlRegex.test(part)) {
      // Clean up URL (remove trailing punctuation)
      const cleanUrl = part.replace(/[.,;:!?]+$/, '');
      return (
        <a
          key={index}
          href={cleanUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 underline inline-flex items-center gap-1"
        >
          {cleanUrl}
          <ExternalLink className="h-3 w-3" />
        </a>
      );
    }
    return part;
  });
};

export function ContentBlock({
  block,
  onEdit,
  onRegenerate,
  onDelete,
  showRegenerateButton = true,
  selectedKeyword,
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
        return "References & Links"
      default:
        return "Content Block"
    }
  }

  // Check if content includes the selected keyword
  const includesKeyword = selectedKeyword && block.content &&
    block.content.toLowerCase().includes(selectedKeyword.toLowerCase());

  return (
    <div className="bg-white border-0 shadow-none px-6 py-4">
      {/* WordPress-style content - no visible headers, just content */}
      <div className="max-w-none">
        {block.h2 && (
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 leading-tight pb-3 border-b border-gray-200">
              {block.h2}
            </h2>
            {selectedKeyword && includesKeyword && (
              <div className="mt-2">
                <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                  🎯 Focused on "{selectedKeyword}"
                </Badge>
              </div>
            )}
          </div>
        )}
        <div className="text-gray-800 leading-relaxed text-base whitespace-pre-wrap font-normal">
          {makeLinksClickable(block.content)}
        </div>
        {selectedKeyword && includesKeyword && !block.h2 && (
          <div className="mt-3">
            <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
              🎯 Content focused on "{selectedKeyword}"
            </Badge>
          </div>
        )}
      </div>

      {/* Hidden edit controls that appear on hover */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
        <Button onClick={onRegenerate} variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-blue-50 text-blue-500 hover:text-blue-600 rounded">
          <RefreshCw className="h-3 w-3" />
        </Button>
        <Button onClick={onEdit} variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-gray-100 rounded">
          <Edit3 className="h-3 w-3 text-gray-500" />
        </Button>
        {onDelete && (
          <Button onClick={onDelete} variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-red-50 text-red-500 hover:text-red-600 rounded">
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>

    </div>
  )
}
