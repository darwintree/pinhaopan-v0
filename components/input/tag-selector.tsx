"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { useTagList } from "@/hooks/use-tag-list"
import { X, Check } from "lucide-react"

interface TagSelectorProps {
  selectedTags: string[]
  onTagSelect: (tags: string[]) => void
}

export function TagSelector({ selectedTags, onTagSelect }: TagSelectorProps) {
  const { tagList, loading } = useTagList()
  const [selectedCategory, setSelectedCategory] = useState("all")

  const handleTagClick = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onTagSelect(selectedTags.filter(t => t !== tag))
    } else {
      onTagSelect([...selectedTags, tag])
    }
  }

  const filteredTags = tagList.filter(tag => 
    selectedCategory === "all" || tag.categories.includes(selectedCategory)
  )

  const categories = Array.from(new Set(tagList.flatMap(tag => tag.categories)))

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>标签</Label>
        <div className="flex gap-2 flex-wrap">
          {selectedTags.map(tag => {
            const tagData = tagList.find(t => t.name === tag)
            return (
              <Badge
                key={tag}
                variant="secondary"
                className="gap-1"
                style={{ backgroundColor: tagData?.color }}
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleTagClick(tag)}
                  className="ml-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 size-4 inline-flex items-center justify-center"
                >
                  <X className="size-3" />
                  <span className="sr-only">移除</span>
                </button>
              </Badge>
            )
          })}
        </div>
      </div>

      <div>
        <select
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="all">所有分类</option>
          {categories.map(category => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap gap-2">
        {loading ? (
          <div>加载中...</div>
        ) : (
          filteredTags.map(tag => {
            const isSelected = selectedTags.includes(tag.name)
            return (
              <Badge
                key={tag.name}
                variant="outline"
                className="cursor-pointer relative pr-7 transition-all"
                style={{
                  borderColor: tag.color,
                  color: tag.color,
                  backgroundColor: isSelected ? `${tag.color}20` : 'transparent'
                }}
                onClick={() => handleTagClick(tag.name)}
              >
                {tag.name}
                {isSelected && (
                  <Check className="size-3.5 absolute right-2 top-1/2 -translate-y-1/2" 
                    style={{ color: tag.color }}/>
                )}
              </Badge>
            )
          })
        )}
      </div>
    </div>
  )
}
