import { useEffect, useRef } from 'react'
import { ScrollText, Trash2, Download } from 'lucide-react'
import { useStore } from '../store/useStore'
import { motion, AnimatePresence } from 'framer-motion'

export default function LogPanel() {
  const { logs, clearLogs } = useStore()
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [logs])

  const handleDownload = () => {
    const content = logs.join('\n')
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `agent-logs-${new Date().toISOString().slice(0, 10)}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="h-full flex flex-col bg-slate-800/50 rounded-2xl border border-slate-700 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <ScrollText className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-medium text-white">实时日志</span>
          <span className="px-2 py-0.5 rounded-full bg-slate-700 text-xs text-slate-400">
            {logs.length}
          </span>
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={handleDownload}
            className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            title="下载日志"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={clearLogs}
            className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            title="清空日志"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-3 space-y-1 font-mono text-xs"
      >
        <AnimatePresence>
          {logs.length === 0 ? (
            <div className="text-slate-500 text-center py-8">
              等待任务执行...
            </div>
          ) : (
            logs.map((log, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`
                  px-2 py-1 rounded break-all
                  ${log.includes('[orchestrator]') ? 'text-cyan-400 bg-cyan-500/10' : ''}
                  ${log.includes('[researcher]') ? 'text-purple-400 bg-purple-500/10' : ''}
                  ${log.includes('[coder]') ? 'text-emerald-400 bg-emerald-500/10' : ''}
                  ${log.includes('[writer]') ? 'text-amber-400 bg-amber-500/10' : ''}
                  ${log.includes('[reviewer]') ? 'text-rose-400 bg-rose-500/10' : ''}
                  ${!log.includes('[') ? 'text-slate-300' : ''}
                `}
              >
                <span className="text-slate-500 mr-2">
                  {new Date().toLocaleTimeString('zh-CN')}
                </span>
                {log}
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}