import { memo } from 'react'
import { Handle, Position } from 'reactflow'
import type { NodeProps } from 'reactflow'
import { Brain, Code, Pen, Eye, Play, Palette, FlaskConical, Server, BarChart, Shield } from 'lucide-react'

interface AgentNodeData {
  name: string
  description: string
  status: 'idle' | 'running' | 'success' | 'error'
}

const iconMap: Record<string, any> = {
  Orchestrator: Play,
  Researcher: Brain,
  Coder: Code,
  Writer: Pen,
  Reviewer: Eye,
  Designer: Palette,
  Tester: FlaskConical,
  DevOps: Server,
  'Data Analyst': BarChart,
  'QA Engineer': Shield,
}

const statusBadgeColors = {
  idle: '',
  running: 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/50',
  success: 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/50',
  error: 'bg-red-500 text-white shadow-lg shadow-red-500/50',
}

const statusBgColors = {
  idle: 'from-slate-700 to-slate-800 border-slate-600',
  running: 'from-cyan-500 to-blue-600 border-cyan-400',
  success: 'from-emerald-500 to-green-600 border-emerald-400',
  error: 'from-red-500 to-rose-600 border-red-400',
}

function AgentNode({ data, selected }: NodeProps<AgentNodeData>) {
  const Icon = iconMap[data.name] || Play
  const isRunning = data.status === 'running'
  const isSuccess = data.status === 'success'
  const isError = data.status === 'error'
  
  return (
    <>
      <Handle type="target" position={Position.Top} className="!bg-cyan-400 !w-3 !h-3" />
      
      <div
        className={`
          relative px-4 py-3 rounded-xl border-2 transition-all duration-300
          bg-gradient-to-br ${statusBgColors[data.status]}
          ${selected ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900' : ''}
          ${isRunning ? 'scale-105 shadow-lg shadow-cyan-500/30' : 'shadow-lg'}
          min-w-[160px] backdrop-blur-sm
        `}
      >
        {/* Glow effect for running nodes */}
        {isRunning && (
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-cyan-400/20 to-blue-500/20 animate-pulse" />
        )}
        
        {/* Ripple effect for running nodes */}
        {isRunning && (
          <>
            <div className="absolute inset-0 rounded-xl border-2 border-cyan-400/30 animate-ping" />
          </>
        )}
        
        {/* Status indicator */}
        {isRunning && (
          <div className="absolute -top-1 -right-1">
            <div className="w-3 h-3 bg-cyan-400 rounded-full animate-ping" />
          </div>
        )}
        
        <div className="relative flex items-center gap-3">
          <div className={`
            p-2 rounded-lg bg-black/30 backdrop-blur
            ${isRunning ? 'animate-pulse' : ''}
            ${isSuccess ? 'bg-emerald-500/30' : ''}
            ${isError ? 'bg-red-500/30' : ''}
          `}>
            <Icon className={`w-5 h-5 text-white ${isRunning ? 'animate-spin' : ''}`} />
          </div>
          
          <div>
            <div className="font-semibold text-white text-sm">{data.name}</div>
            <div className="text-xs text-white/60">{data.description}</div>
          </div>
        </div>
        
        {/* Status badge */}
        {data.status !== 'idle' && (
          <div className={`
            absolute -bottom-2 left-1/2 -translate-x-1/2
            px-3 py-0.5 rounded-full text-xs font-medium
            flex items-center gap-1
            ${statusBadgeColors[data.status]}
          `}>
            {isRunning && (
              <>
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                <span>运行中</span>
              </>
            )}
            {isSuccess && (
              <>
                <span>✓</span>
                <span>完成</span>
              </>
            )}
            {isError && (
              <>
                <span>✗</span>
                <span>错误</span>
              </>
            )}
          </div>
        )}
        
        {/* Progress bar for running */}
        {isRunning && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-700 rounded-b-xl overflow-hidden">
            <div className="h-full bg-gradient-to-r from-cyan-400 to-purple-400 animate-pulse" />
          </div>
        )}
      </div>
      
      <Handle type="source" position={Position.Bottom} className="!bg-purple-400 !w-3 !h-3" />
    </>
  )
}

export default memo(AgentNode)