export type ModuleCategory = 'approach' | 'pitch' | 'overcome' | 'close' | 'objections'

export interface LearningModule {
  id: string
  title: string
  slug: string
  category: ModuleCategory
  display_order: number
  estimated_minutes: number
  content: string
  is_published: boolean
  created_at: string
  updated_at: string
}

export interface LearningObjection {
  id: string
  name: string
  slug: string
  description: string | null
  scripts: ObjectionScript[]
  display_order: number
  created_at: string
  updated_at: string
}

export interface ObjectionScript {
  title: string
  script: string
  tips?: string[]
}

export interface UserModuleProgress {
  id: string
  user_id: string
  module_id: string
  completed_at: string | null
  time_spent_seconds: number
  created_at: string
  updated_at: string
}

export interface ModuleWithProgress extends LearningModule {
  progress?: UserModuleProgress | null
}

export interface ModuleProgressUpdate {
  module_id: string
  completed_at?: string | null
  time_spent_seconds?: number
}

