"use client"

import { BrowseGuides } from "@/components/browse/browse-guides"
import { MainNav } from "@/components/main-nav"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function BrowsePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-2 py-4">
        <MainNav />

        <main className="mt-8">
          <div className="flex justify-center mb-8">
            <div className="grid w-full max-w-md grid-cols-2">
              <Link href="/browse" className="w-full">
                <Button variant="default" className="w-full rounded-r-none">浏览配置</Button>
              </Link>
              <Link href="/publish" className="w-full">
                <Button variant="outline" className="w-full rounded-l-none">发布配置</Button>
              </Link>
            </div>
          </div>

          <div className="mt-4">
            <BrowseGuides />
          </div>
        </main>
      </div>
    </div>
  )
} 