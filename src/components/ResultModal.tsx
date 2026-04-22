import { useState } from 'react'
import { FileText, Code, Search, Eye, Play, X, Copy, Check } from 'lucide-react'
import { useStore } from '../store/useStore'

const iconMap: Record<string, any> = {
  researcher: Search,
  coder: Code,
  writer: FileText,
  reviewer: Eye,
  orchestrator: Play,
}

const colorMap: Record<string, string> = {
  researcher: 'border-purple-500/50 bg-purple-500/10 text-purple-400',
  coder: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400',
  writer: 'border-amber-500/50 bg-amber-500/10 text-amber-400',
  reviewer: 'border-rose-500/50 bg-rose-500/10 text-rose-400',
  orchestrator: 'border-cyan-500/50 bg-cyan-500/10 text-cyan-400',
}

export default function ResultModal() {
  const results = useStore(state => state.results)
  const [selectedResult, setSelectedResult] = useState<number | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  // 检查是否有任何结果
  const hasResults = results && results.length > 0

  // 打开弹窗
  const openModal = () => {
    if (hasResults) {
      setIsOpen(true)
      setSelectedResult(0) // 默认显示第一个结果
    }
  }

  // 关闭弹窗
  const closeModal = () => {
    setIsOpen(false)
    setSelectedResult(null)
  }

  // 复制内容
  const handleCopy = async () => {
    if (selectedResult === null) return
    try {
      await navigator.clipboard.writeText(results[selectedResult].content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (e) {
      console.error('Copy failed:', e)
    }
  }

  // 如果没有结果，显示一个提示按钮
  if (!hasResults) {
    return (
      <div className="fixed bottom-6 right-6 z-40">
        <button
          className="
            flex items-center gap-2 px-4 py-2 rounded-xl
            bg-slate-700/80 border border-slate-600
            text-slate-400 text-sm
            cursor-not-allowed opacity-50
          "
          disabled
        >
          <FileText className="w-4 h-4" />
          暂无结果
        </button>
      </div>
    )
  }

  return (
    <>
      {/* 结果按钮 - 浮动在右下角 */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={openModal}
          className="
            flex items-center gap-2 px-4 py-2 rounded-xl
            bg-gradient-to-r from-amber-500 to-orange-500
            hover:from-amber-400 hover:to-orange-400
            text-white text-sm font-medium
            shadow-lg shadow-amber-500/30
            hover:scale-105 transition-transform
            animate-pulse
          "
        >
          <FileText className="w-4 h-4" />
          查看结果 ({results.length})
        </button>
      </div>

      {/* 结果弹窗 */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* 背景遮罩 */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeModal}
          />
          
          {/* 弹窗内容 */}
          <div className="
            relative w-full max-w-3xl max-h-[80vh]
            bg-slate-800 rounded-2xl border border-slate-600
            shadow-2xl overflow-hidden
            animate-in fade-in zoom-in duration-200
          ">
            {/* 头部 */}
            <div className="
              flex items-center justify-between px-6 py-4
              border-b border-slate-700 bg-slate-800/50
            ">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">执行结果</h2>
                  <p className="text-xs text-slate-400">共 {results.length} 个结果</p>
                </div>
              </div>
              
              <button
                onClick={closeModal}
                className="p-2 rounded-lg hover:bg-slate-700 transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            
            {/* 内容区域 */}
            <div className="flex h-[500px]">
              {/* 左侧：结果列表 */}
              <div className="w-48 border-r border-slate-700 p-3 overflow-y-auto bg-slate-800/30">
                {results.map((result, index) => {
                  const Icon = iconMap[result.agentId] || FileText
                  const colorClass = colorMap[result.agentId] || colorMap.orchestrator
                  
                  return (
                    <button
                      key={index}
                      onClick={() => setSelectedResult(index)}
                      className={`
                        w-full flex items-center gap-2 px-3 py-2 mb-1 rounded-lg
                        text-left text-sm transition-colors
                        ${selectedResult === index 
                          ? 'bg-slate-700 text-white' 
                          : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
                        }
                      `}
                    >
                      <Icon className={`w-4 h-4 ${colorClass.split(' ')[1]}`} />
                      <span className="truncate">{result.agentId}</span>
                    </button>
                  )
                })}
              </div>
              
              {/* 右侧：结果详情 */}
              <div className="flex-1 flex flex-col p-4 overflow-hidden">
                {selectedResult !== null && results[selectedResult] && (
                  <>
                    {/* 结果头部 */}
                    <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-700">
                      <div className="flex items-center gap-2">
                        {(() => {
                          const Icon = iconMap[results[selectedResult].agentId] || FileText
                          const colorClass = colorMap[results[selectedResult].agentId] || colorMap.orchestrator
                          return (
                            <div className={`p-2 rounded-lg ${colorClass}`}>
                              <Icon className="w-4 h-4" />
                            </div>
                          )
                        })()}
                        <div>
                          <div className="text-sm font-medium text-white">
                            {results[selectedResult].agentId}
                          </div>
                          <div className="text-xs text-slate-500">
                            {new Date(results[selectedResult].timestamp).toLocaleString('zh-CN')}
                          </div>
                        </div>
                      </div>
                      
                      <button
                        onClick={handleCopy}
                        className="
                          flex items-center gap-1 px-3 py-1.5 rounded-lg
                          bg-slate-700 hover:bg-slate-600
                          text-slate-300 text-xs
                          transition-colors
                        "
                      >
                        {copied ? (
                          <>
                            <Check className="w-3 h-3 text-green-400" />
                            已复制
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            复制
                          </>
                        )}
                      </button>
                    </div>
                    
                    {/* 结果内容 */}
                    <div className="flex-1 overflow-y-auto">
                      <pre className="
                        text-xs text-slate-300 whitespace-pre-wrap
                        font-mono bg-black/30 p-4 rounded-xl
                        leading-relaxed
                      ">
                        {results[selectedResult].content}
                      </pre>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}