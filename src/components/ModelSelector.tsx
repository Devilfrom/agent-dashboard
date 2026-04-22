import { useState, useEffect } from 'react'
import { ChevronDown, RefreshCw, Check, X, Plus } from 'lucide-react'
import { useStore, type Model } from '../store/useStore'
import { motion, AnimatePresence } from 'framer-motion'

// Default models (read from ModelHub config)
const defaultModels: Model[] = [
  {
    label: 'QClaw 默认模型',
    providerId: 'qclaw',
    modelId: 'modelroute',
    fullId: 'qclaw/modelroute',
    baseUrl: '${QCLAW_LLM_BASE_URL}',
    apiKey: '${QCLAW_LLM_API_KEY}',
    apiType: 'openai',
  },
  {
    label: '中国移动 MiniMax-M25',
    providerId: 'chinamobile-minimax',
    modelId: 'minimax-m25',
    fullId: 'chinamobile-minimax/minimax-m25',
    baseUrl: 'http://maas.gd.chinamobile.com:36007/ai/uifm/open/v1',
    apiKey: 'sk-gm3khp4v26pr5mme81k8ensenftxj2a9i709hnzy414xb',
    apiType: 'openai',
  },
]

export default function ModelSelector() {
  const { currentModel, setCurrentModel, models, setModels, isRunning } = useStore()
  const [isOpen, setIsOpen] = useState(false)
  const [testing, setTesting] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<{ [key: string]: 'success' | 'error' }>({})

  useEffect(() => {
    setModels(defaultModels)
    setCurrentModel(defaultModels[1])
  }, [])

  const handleTest = async (model: Model) => {
    setTesting(model.fullId)
    try {
      const response = await fetch(model.baseUrl + '/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${model.apiKey}`,
        },
        body: JSON.stringify({
          model: model.modelId,
          messages: [{ role: 'user', content: 'Hi' }],
          max_tokens: 10,
        }),
      })
      setTestResult({ [model.fullId]: response.ok ? 'success' : 'error' })
    } catch {
      setTestResult({ [model.fullId]: 'error' })
    } finally {
      setTesting(null)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => !isRunning && setIsOpen(!isOpen)}
        disabled={isRunning}
        className={`
          flex items-center gap-3 px-4 py-2.5 rounded-xl
          bg-gradient-to-r from-slate-800 to-slate-900
          border border-slate-600 hover:border-cyan-400
          transition-all duration-200 disabled:opacity-50
          ${isRunning ? 'cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
          <span className="text-xs font-bold text-white">
            {currentModel?.label.slice(0, 2) || '??'}
          </span>
        </div>
        
        <div className="text-left">
          <div className="text-xs text-slate-400">当前模型</div>
          <div className="text-sm font-medium text-white">
            {currentModel?.label || '未选择'}
          </div>
        </div>
        
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-full mt-2 right-0 w-80 z-50"
          >
            <div className="bg-slate-800/95 backdrop-blur-xl rounded-xl border border-slate-600 shadow-2xl overflow-hidden">
              <div className="p-3 border-b border-slate-700">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white">切换模型</span>
                  <button className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="max-h-64 overflow-y-auto p-2 space-y-1">
                {models.map((model) => (
                  <div
                    key={model.fullId}
                    className={`
                      group flex items-center gap-3 p-3 rounded-lg
                      transition-all duration-150 cursor-pointer
                      ${currentModel?.fullId === model.fullId
                        ? 'bg-cyan-500/20 border border-cyan-500/50'
                        : 'hover:bg-slate-700/50 border border-transparent'}
                    `}
                    onClick={() => {
                      setCurrentModel(model)
                      setIsOpen(false)
                    }}
                  >
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center">
                      <span className="text-xs font-bold text-slate-300">
                        {model.label.slice(0, 2)}
                      </span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white truncate">
                          {model.label}
                        </span>
                        {currentModel?.fullId === model.fullId && (
                          <Check className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                        )}
                      </div>
                      <div className="text-xs text-slate-400 truncate">
                        {model.fullId}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleTest(model)
                        }}
                        disabled={testing === model.fullId}
                        className="p-1.5 rounded-lg hover:bg-slate-600 text-slate-400 hover:text-white transition-colors"
                        title="测试连接"
                      >
                        {testing === model.fullId ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : testResult[model.fullId] === 'success' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : testResult[model.fullId] === 'error' ? (
                          <X className="w-3.5 h-3.5 text-red-400" />
                        ) : (
                          <RefreshCw className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="p-3 border-t border-slate-700">
                <button className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-sm">
                  <RefreshCw className="w-4 h-4" />
                  恢复默认模型
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      )}
    </div>
  )
}