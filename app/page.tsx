"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BrowseGuides } from "@/components/browse-guides"
import { PublishGuide } from "@/components/publish-guide"
import { MainNav } from "@/components/main-nav"

export default function Home() {
  const [activeTab, setActiveTab] = useState("browse")

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-6">
        <MainNav />

        <main className="mt-8">
          <Tabs defaultValue="browse" className="w-full" onValueChange={setActiveTab}>
            <div className="flex justify-center mb-8">
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="browse">浏览攻略</TabsTrigger>
                <TabsTrigger value="publish">发布攻略</TabsTrigger>
              </TabsList>
            </div>

            <div className="mt-4">
              <TabsContent value="browse" className="mt-0">
                <BrowseGuides />
              </TabsContent>

              <TabsContent value="publish" className="mt-0">
                <PublishGuide />
              </TabsContent>
            </div>
          </Tabs>
        </main>
      </div>
    </div>
  )
}

