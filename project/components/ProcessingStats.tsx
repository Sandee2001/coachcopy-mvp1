'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, TrendingUp, Clock, CheckCircle, AlertCircle } from 'lucide-react'

interface ProcessingStatsProps {
  totalFiles: number
  completedFiles: number
  errorFiles: number
  processingTime?: string
}

export function ProcessingStats({ totalFiles, completedFiles, errorFiles, processingTime }: ProcessingStatsProps) {
  const successRate = totalFiles > 0 ? Math.round((completedFiles / totalFiles) * 100) : 0
  const processedFiles = completedFiles + errorFiles
  const isProcessing = processedFiles < totalFiles
  
  const getOverallStatus = () => {
    if (isProcessing) {
      return { 
        text: "Processing", 
        variant: "secondary" as const, 
        icon: Clock,
        color: "text-blue-600 bg-blue-50"
      }
    } else if (errorFiles > 0) {
      return { 
        text: "Completed with Errors", 
        variant: "destructive" as const, 
        icon: AlertCircle,
        color: "text-red-600 bg-red-50"
      }
    } else {
      return { 
        text: "Complete", 
        variant: "default" as const, 
        icon: CheckCircle,
        color: "text-green-600 bg-green-50"
      }
    }
  }
  
  const status = getOverallStatus()
  const StatusIcon = status.icon

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-medium text-slate-600">Total Files</CardTitle>
          <div className="rounded-full bg-slate-50 p-2">
            <FileText className="h-4 w-4 text-slate-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-slate-900">{totalFiles}</div>
          <p className="text-xs text-slate-500 mt-1">
            Files uploaded for processing
          </p>
        </CardContent>
      </Card>

      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-medium text-slate-600">Success Rate</CardTitle>
          <div className="rounded-full bg-blue-50 p-2">
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-slate-900">{successRate}%</div>
          <p className="text-xs text-slate-500 mt-1">
            {completedFiles} completed, {errorFiles} errors
          </p>
        </CardContent>
      </Card>

      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-medium text-slate-600">Status</CardTitle>
          <div className={`rounded-full p-2 ${status.color}`}>
            <StatusIcon className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant={status.variant} className="gap-1 text-xs">
              <StatusIcon className="h-3 w-3" />
              {status.text}
            </Badge>
          </div>
          <p className="text-xs text-slate-500">
            {isProcessing ? 'Processing...' : (processingTime || 'Complete')}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}