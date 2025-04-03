import { Upload, ClipboardPaste } from "lucide-react"
import type { EquipmentType } from "@/lib/types"
import { Button } from "@/components/ui/button"

interface UploadAreaProps {
  title: string
  onImageUpload: (imageUrl: string) => void
}

export function UploadArea({ title, onImageUpload }: UploadAreaProps) {
  const handlePasteFromClipboard = async () => {
    try {
      const clipboardItems = await navigator.clipboard.read()
      for (const clipboardItem of clipboardItems) {
        for (const type of clipboardItem.types) {
          if (type.startsWith('image/')) {
            const blob = await clipboardItem.getType(type)
            const reader = new FileReader()
            reader.onload = (e) => {
              if (e.target?.result) {
                onImageUpload(e.target.result as string)
              }
            }
            reader.readAsDataURL(blob)
            return
          }
        }
      }
      alert('剪贴板中没有找到图片')
    } catch (error) {
      console.error('Failed to read clipboard:', error)
      alert('无法访问剪贴板，请检查浏览器权限设置')
    }
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <label className="flex flex-col items-center justify-center cursor-pointer text-center">
        <Upload className="h-10 w-10 text-primary/60 mb-2" />
        <p className="text-sm font-medium mb-1">点击或拖拽上传{title}</p>
        <p className="text-xs text-muted-foreground">支持PNG、JPG格式，系统将自动识别主体{title}</p>
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
      <div className="flex items-center gap-2">
        <div className="h-px w-8 bg-border" />
        <span className="text-xs text-muted-foreground">或</span>
        <div className="h-px w-8 bg-border" />
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
        onClick={handlePasteFromClipboard}
      >
        <ClipboardPaste className="h-4 w-4" />
        从剪贴板上传
      </Button>
    </div>
  )
} 