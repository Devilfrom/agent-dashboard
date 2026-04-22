import { useState } from 'react'
import { Plus, X, Brain, Code, Pen, Eye, Play, Palette, FlaskConical, Server, BarChart, Shield, ChevronDown, ChevronRight } from 'lucide-react'
import { useStore, AGENT_TEMPLATES } from '../store/useStore'

const iconMap: Record<string, any> = {
  Play, Brain, Code, Pen, Eye, Palette, FlaskConical, Server, BarChart, Shield
}

const colorMap: Record<string, string> = {
  cyan: 'from-cyan-500 to-blue-500 border-cyan-400',
  purple: 'from-purple-500 to-violet-500 border-purple-400',
  emerald: 'from-emerald-500 to-green-500 border-emerald-400',
  amber: 'from-amber-500 to-orange-500 border-amber-400',
  rose: 'from-rose-500 to-red-500 border-rose-400',
  pink: 'from-pink-500 to-rose-500 border-pink-400',
  blue: 'from-blue-500 to-indigo-500 border-blue-400',
  indigo: 'from-indigo-500 to-purple-500 border-indigo-400',
  teal: 'from-teal-500 to-cyan-500 border-teal-400',
  lime: 'from-lime-500 to-green-500 border-lime-400',
}

export default function AgentManager() {
  const { nodes, addAgent, removeAgent, isRunning } = useStore()
  const [showTemplates, setShowTemplates] = useState(false)
  const [showConfirm, setShowConfirm] = useState<string | null>(null)
  
  // Get current agent IDs
  const currentAgentIds = nodes.map(n => n.id)
  
  // Get available templates (not yet added)
  const availableTemplates = AGENT_TEMPLATES.filter(
    t => !currentAgentIds.includes(t.id)
  )
  
  const handleAddAgent = (template: typeof AGENT_TEMPLATES[number]) => {
    try {
      addAgent(template)
      setShowTemplates(false)
    } catch (e) {
      console.error('Failed to add agent:', e)
    }
  }
  
  const handleRemoveClick = (agentId: string) => {
    if (showConfirm === agentId) {
      removeAgent(agentId)
      setShowConfirm(null)
    } else {
      setShowConfirm(agentId)
      // Auto-hide after 3 seconds
      setTimeout(() => setShowConfirm(null), 3000)
    }
  }

  return (
    <div className="mt-4 pt-4 border-t border-slate-700">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-slate-400">Agent 节点管理</span>
        <button
          onClick={() => setShowTemplates(!showTemplates)}
          disabled={isRunning || availableTemplates.length === 0}
          className="
            flex items-center gap-1 px-3 py-1.5 rounded-lg
            bg-cyan-500/20 text-cyan-400 text-xs font-medium
            hover:bg-cyan-500/30 transition-colors
            disabled:opacity-50 disabled:cursor-not-allowed
          "
        >
          {showTemplates ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          <Plus className="w-3 h-3" />
          添加 Agent
        </button>
      </div>
      
      {/* Current Agents */}
      <div className="flex flex-wrap gap-2">
        {nodes.map(node => {
          const template = AGENT_TEMPLATES.find(t => t.id === node.id)
          const Icon = template ? iconMap[template.icon] || Play : Play
          const color = template?.color || 'cyan'
          
          return (
            <div
              key={node.id}
              className={`
                group flex items-center gap-2 px-3 py-1.5 rounded-lg
                bg-gradient-to-r ${colorMap[color]}
                text-white text-xs font-medium
                shadow-lg
              `}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{node.data.name}</span>
              
              {node.id !== 'orchestrator' && (
                <button
                  onClick={() => handleRemoveClick(node.id)}
                  disabled={isRunning}
                  className={`
                    ml-1 p-0.5 rounded
                    bg-black/20 hover:bg-black/40
                    opacity-0 group-hover:opacity-100
                    transition-all disabled:opacity-0
                    ${showConfirm === node.id ? '!opacity-100 !bg-red-500' : ''}
                  `}
                >
                  {showConfirm === node.id ? '确认?' : <X className="w-3 h-3" />}
                </button>
              )}
            </div>
          )
        })}
      </div>
      
      {/* Template Selection - simplified without AnimatePresence */}
      {showTemplates && (
        <div className="mt-3">
          <div className="grid grid-cols-2 gap-2 p-3 bg-slate-800/50 rounded-xl border border-slate-700 max-h-48 overflow-y-auto">
            {availableTemplates.map(template => {
              const Icon = iconMap[template.icon] || Play
              const color = colorMap[template.color]
              
              return (
                <button
                  key={template.id}
                  onClick={() => handleAddAgent(template)}
                  disabled={isRunning}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-lg
                    bg-gradient-to-r ${color}
                    text-white text-xs font-medium
                    shadow-lg hover:scale-105 transition-transform
                    disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <div className="text-left">
                    <div className="font-medium">{template.name}</div>
                    <div className="text-[10px] text-white/70">{template.role}</div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}
      
      {showTemplates && availableTemplates.length === 0 && (
        <div className="mt-3 p-3 bg-slate-800/50 rounded-xl border border-slate-700 text-center text-slate-500 text-sm">
          所有 Agent 都已添加
        </div>
      )}
    </div>
  )
}