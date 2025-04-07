"use client"

import { BookOpen, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"

export function MainNav() {
  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-lg bg-white/75 dark:bg-slate-900/75 border-b border-slate-200/50 dark:border-slate-800/50">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">拼好盘</span>
        </div>

        <nav className="flex items-center gap-4">
          <ModeToggle />
          <Button variant="ghost" size="icon">
            <User className="h-5 w-5" />
          </Button>
        </nav>
      </div>
    </header>
  )
}

