import type React from "react"

import { Upload } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ImageUploadWithRecognition } from "@/components/image-recognition/image-upload-with-recognition"
import { BoundingBox, EquipmentData } from '@/lib/types'

// Define a more specific type for uploadConfigs if possible
interface UploadConfig {
  type: "chara" | "weapon" | "summon"; // Use specific types
  title: string;
  icon: React.ReactNode;
  images: string[];
  setImages: React.Dispatch<React.SetStateAction<string[]>>;
  infoText: string;
  onEquipmentsUpdate: React.Dispatch<React.SetStateAction<Record<number, EquipmentData>>>;
  onBoundingBoxChange?: (bbox: BoundingBox | null) => void;
}

interface GuideImageUploaderProps {
  uploadConfigs: UploadConfig[];
  autoRecognize: boolean;
  setAutoRecognize: React.Dispatch<React.SetStateAction<boolean>>;
}

export function GuideImageUploader({
  uploadConfigs,
  autoRecognize,
  setAutoRecognize,
}: GuideImageUploaderProps) {
  return (
    <Card className="backdrop-blur-lg bg-white/40 dark:bg-slate-900/40 border-slate-200/50 dark:border-slate-700/50 shadow-sm overflow-hidden">
      <div className="bg-primary/10 p-2 sm:p-3 border-b border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between">
        <h3 className="text-lg font-medium flex items-center gap-2">
          <Upload className="h-5 w-5" />
          上传游戏截图
        </h3>
        <Badge variant="outline" className="font-normal">
          必填
        </Badge>
      </div>
      <CardContent className="px-1 py-3 sm:p-4 md:p-6">
        <div className="space-y-6">
          {uploadConfigs.map((config) => (
            <ImageUploadWithRecognition
              key={config.type}
              type={config.type}
              title={config.title}
              icon={config.icon}
              images={config.images}
              setImages={config.setImages}
              autoRecognize={autoRecognize}
              setAutoRecognize={setAutoRecognize}
              infoText={config.infoText}
              onEquipmentsUpdate={config.onEquipmentsUpdate}
              onBoundingBoxChange={config.onBoundingBoxChange}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
} 