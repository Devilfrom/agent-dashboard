import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from './store/useStore'
import Scene3D from './components/Scene3D'
import ControlPanel from './components/ControlPanel'
import { X, ChevronLeft, ChevronRight, Code, FileText, Search, Eye, Play } from 'lucide-react'

export default function App() {
  const { 
    isRunning, 
    results,
    currentTask,
    taskProgress
  } = useStore()
  
  const [showResults, setShowResults] = useState(false)
  const [showControlPanel, setShowControlPanel] = useState(false)
  const [selectedResultIndex, setSelectedResultIndex] = useState(0)
  
  const hasResults = results && results.length > 0
  
  const iconMap: Record<string, any> = {
    researcher: Search,
    coder: Code,
    writer: FileText,
    reviewer: Eye,
    orchestrator: Play,
  }
  
  const colorMap: Record<string, string> = {
    researcher: 'from-blue-500 to-blue-600',
    coder: 'from-cyan-500 to-cyan-600',
    writer: 'from-green-500 to-green-600',
    reviewer: 'from-amber-500 to-amber-600',
    orchestrator: 'from-purple-500 to-purple-600',
  }

  return (
    <div className="relative w-full h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
      {/* 3D 场景背景 */}
      <Scene3D />
      
      {/* 游戏化 UI 层 */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {/* 顶部标题 */}
        <div className="absolute top-0 left-0 right-0 p-4 pointer-events-auto">
          <div className="flex items-center justify-center gap-3">
            <div className="px-6 py-2 bg-black/50 backdrop-blur-md border border-cyan-500/30 rounded-full">
              <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                🎮 Multi-Agent Command Center
              </h1>
            </div>
          </div>
        </div>
        
        {/* 任务显示 */}
        {currentTask && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 pointer-events-auto">
            <div className="px-4 py-2 bg-black/60 backdrop-blur-md border border-purple-500/50 rounded-lg">
              <p className="text-sm text-purple-300">当前任务：</p>
              <p className="text-white font-medium">{currentTask}</p>
            </div>
          </div>
        )}
        
        {/* 进度条 - 底部 */}
        {isRunning && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-96 pointer-events-auto">
            <div className="bg-black/60 backdrop-blur-md border border-cyan-500/30 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-cyan-400 text-sm font-medium">任务执行中...</span>
                <span className="text-white font-bold">{Math.round(taskProgress)}%</span>
              </div>
              <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-cyan-500 via-purple-500 to-cyan-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${taskProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          </div>
        )}
        
        {/* 右侧控制面板 */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-auto">
          <div className="flex flex-col gap-2">
            <ControlButton icon="📝" label="输入任务" onClick={() => setShowControlPanel(true)} />
            <ControlButton icon="🚀" label="开始执行" onClick={() => setShowControlPanel(true)} />
            <ControlButton 
              icon="📊" 
              label="查看结果" 
              onClick={() => setShowResults(true)}
              badge={hasResults ? results.length : 0}
            />
          </div>
        </div>
        
        {/* Agent 状态面板 - 左侧 */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-auto">
          <AgentStatusPanel />
        </div>
      </div>
      
      {/* 结果模态框 */}
      <AnimatePresence>
        {showResults && hasResults && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md pointer-events-auto"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-[800px] h-[600px] bg-gradient-to-b from-slate-800 to-slate-900 border border-purple-500/30 rounded-2xl overflow-hidden shadow-2xl shadow-purple-500/20"
            >
              {/* 头部 */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 bg-black/30">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📋</span>
                  <h2 className="text-xl font-bold text-white">任务执行结果</h2>
                </div>
                <button
                  onClick={() => setShowResults(false)}
                  className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              
              {/* 结果导航 */}
              <div className="flex gap-2 p-4 border-b border-slate-700 bg-black/20 overflow-x-auto">
                {results.map((result, index) => {
                  const Icon = iconMap[result.agentId] || FileText
                  const colorClass = colorMap[result.agentId] || 'from-gray-500 to-gray-600'
                  const isSelected = index === selectedResultIndex
                  
                  return (
                    <button
                      key={index}
                      onClick={() => setSelectedResultIndex(index)}
                      className={`
                        flex items-center gap-2 px-4 py-2 rounded-lg
                        transition-all duration-200 whitespace-nowrap
                        ${isSelected 
                          ? `bg-gradient-to-r ${colorClass} text-white` 
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}
                      `}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="font-medium">{result.agentId}</span>
                    </button>
                  )
                })}
              </div>
              
              {/* 结果内容 */}
              <div className="h-[420px] overflow-auto p-6">
                <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700">
                  <pre className="text-sm text-slate-300 whitespace-pre-wrap font-mono">
                    {results[selectedResultIndex]?.content}
                  </pre>
                </div>
              </div>
              
              {/* 底部导航 */}
              <div className="flex items-center justify-between px-6 py-3 border-t border-slate-700 bg-black/30">
                <button
                  onClick={() => setSelectedResultIndex(Math.max(0, selectedResultIndex - 1))}
                  disabled={selectedResultIndex === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="text-white">上一个</span>
                </button>
                
                <span className="text-slate-400 text-sm">
                  {selectedResultIndex + 1} / {results.length}
                </span>
                
                <button
                  onClick={() => setSelectedResultIndex(Math.min(results.length - 1, selectedResultIndex + 1))}
                  disabled={selectedResultIndex === results.length - 1}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <span className="text-white">下一个</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* 结果提示按钮 */}
      {hasResults && !showResults && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute bottom-4 right-4 z-20 pointer-events-auto"
          onClick={() => setShowResults(true)}
        >
          <div className="relative">
            <div className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 rounded-full shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-shadow">
              <span className="text-white font-bold">📊 查看结果</span>
            </div>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">{results.length}</span>
            </div>
          </div>
        </motion.button>
      )}
      
      {/* 控制面板模态框 */}
      <ControlPanel isOpen={showControlPanel} onClose={() => setShowControlPanel(false)} />
    </div>
  )
}

// 控制按钮组件
function ControlButton({ icon, label, onClick, badge }: {
  icon: string
  label: string
  onClick: () => void
  badge?: number
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="relative"
    >
      <div className="flex flex-col items-center gap-1 px-4 py-3 bg-black/60 backdrop-blur-md border border-purple-500/30 rounded-xl hover:border-purple-500/60 transition-colors">
        <span className="text-2xl">{icon}</span>
        <span className="text-xs text-slate-300">{label}</span>
      </div>
      {badge !== undefined && badge > 0 && (
        <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
          <span className="text-white text-xs font-bold">{badge}</span>
        </div>
      )}
    </motion.button>
  )
}

// Agent 状态面板
function AgentStatusPanel() {
  const { nodes } = useStore()
  
  const statusColors: Record<string, string> = {
    idle: 'bg-slate-500',
    running: 'bg-cyan-500 animate-pulse',
    success: 'bg-green-500',
    error: 'bg-red-500',
  }
  
  return (
    <div className="bg-black/60 backdrop-blur-md border border-purple-500/30 rounded-xl p-4 min-w-[200px]">
      <h3 className="text-sm font-bold text-purple-400 mb-3 flex items-center gap-2">
        <span>🤖</span> Agent 状态
      </h3>
      <div className="space-y-2">
        {nodes.map((node) => (
          <div key={node.id} className="flex items-center justify-between">
            <span className="text-sm text-slate-300">{node.data.name}</span>
            <div className={`w-2 h-2 rounded-full ${statusColors[node.data.status as string] || 'bg-slate-500'}`} />
          </div>
        ))}
      </div>
    </div>
  )
}