import { Upload } from "lucide-react"
import type { EquipmentType } from "@/lib/types"

interface UploadAreaProps {
  title: string
  onImageUpload: (imageUrl: string) => void
}

export function UploadArea({ title, onImageUpload }: UploadAreaProps) {
  return (
    <label className="flex flex-col items-center justify-center cursor-pointer text-center">
      <Upload className="h-10 w-10 text-primary/60 mb-2" />
      <p className="text-sm font-medium mb-1">点击或拖拽上传{title}</p>
      <p className="text-xs text-muted-foreground">支持PNG、JPG格式，系统将自动识别所有{title}</p>
      <input
        type="file"
        className="hidden"
        accept="image/*"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            const reader = new FileReader()
            reader.onload = (e) => {
              if (e.target?.result) {
                onImageUpload(e.target.result as string)
              }
            }
            reader.readAsDataURL(e.target.files[0])
          }
        }}
      />
    </label>
  )
} 