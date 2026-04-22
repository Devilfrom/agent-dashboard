import { useState, useEffect } from 'react'
import { FileText, Code, Search, Eye, Play, ChevronDown, ChevronRight, Copy, Check } from 'lucide-react'
import { useStore } from '../store/useStore'

const iconMap: Record<string, any> = {
  researcher: Search,
  coder: Code,
  writer: FileText,
  reviewer: Eye,
  orchestrator: Play,
}

const colorMap: Record<string, string> = {
  researcher: 'border-purple-500/30 bg-purple-500/10',
  coder: 'border-emerald-500/30 bg-emerald-500/10',
  writer: 'border-amber-500/30 bg-amber-500/10',
  reviewer: 'border-rose-500/30 bg-rose-500/10',
  orchestrator: 'border-cyan-500/30 bg-cyan-500/10',
}

export default function ResultPanel() {
  const results = useStore(state => state.results)
  const clearResults = useStore(state => state.clearResults)
  const [expanded, setExpanded] = useState<Record<number, boolean>>({})
  const [copied, setCopied] = useState<number | null>(null)

  // Debug: log results when they change
  useEffect(() => {
    console.log('[ResultPanel] Results:', results)
  }, [results])

  const toggleExpand = (index: number) => {
    setExpanded(prev => ({ ...prev, [index]: !prev[index] }))
  }

  const copyToClipboard = async (content: string, index: number) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(index)
      setTimeout(() => setCopied(null), 2000)
    } catch (e) {
      console.error('Copy failed:', e)
    }
  }

  if (!results || results.length === 0) {
    return (
      <div className="h-full flex flex-col bg-slate-800/50 rounded-2xl border border-slate-700 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-medium text-white">执行结果</span>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
          暂无结果，请先执行任务
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-slate-800/50 rounded-2xl border border-slate-700 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 shrink-0">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-medium text-white">执行结果</span>
          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-xs text-amber-400">
            {results.length}
          </span>
        </div>
        <button
          onClick={clearResults}
          className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          清空
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {results.map((result, index) => {
          const Icon = iconMap[result.agentId] || FileText
          const isExpanded = expanded[index]
          const isCopied = copied === index
          const colorClass = colorMap[result.agentId] || colorMap.orchestrator
          
          return (
            <div
              key={`${result.agentId}-${index}`}
              className={`rounded-xl border ${colorClass} overflow-hidden`}
            >
              <div 
                className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => toggleExpand(index)}
              >
                <div className="flex items-center gap-2">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium text-white">{result.agentId}</span>
                  <span className="text-xs text-slate-500">
                    {new Date(result.timestamp).toLocaleTimeString('zh-CN')}
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    copyToClipboard(result.content, index)
                  }}
                  className="p-1 rounded hover:bg-white/10 transition-colors"
                  title="复制内容"
                >
                  {isCopied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
              
              {isExpanded && (
                <div className="px-3 pb-3">
                  <pre className="text-xs text-slate-300 whitespace-pre-wrap font-mono bg-black/20 p-2 rounded-lg max-h-40 overflow-y-auto">
                    {result.content}
                  </pre>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}