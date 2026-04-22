import { useState, useRef } from 'react'
import { X, Zap } from 'lucide-react'
import { useStore, type TaskResult } from '../store/useStore'
import { motion, AnimatePresence } from 'framer-motion'

interface ControlPanelProps {
  isOpen: boolean
  onClose: () => void
}

// 后端 API 地址
const API_BASE = 'http://localhost:3001/api'

export default function ControlPanel({ isOpen, onClose }: ControlPanelProps) {
  const { 
    isRunning, setIsRunning, 
    setCurrentTask,
    setTaskProgress,
    addLog, updateNodeStatus, addResult, clearResults,
    setTaskId
  } = useStore()
  
  const [taskInput, setTaskInput] = useState('')
  const runningRef = useRef(false)

  const handleStart = async () => {
    if (!taskInput.trim()) {
      addLog('[系统] 请输入任务描述')
      return
    }
    
    clearResults()
    setCurrentTask(taskInput)
    setIsRunning(true)
    setTaskProgress(0)
    runningRef.current = true
    addLog(`[系统] 开始执行任务: ${taskInput}`)
    console.log('[ControlPanel] 开始执行任务:', taskInput)
    
    // 重置所有 Agent 状态
    updateNodeStatus('orchestrator', 'running')
    
    try {
      // 调用后端 API 启动任务
      const response = await fetch(`${API_BASE}/task/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: taskInput })
      })
      
      const data = await response.json()
      console.log('[ControlPanel] 任务已启动:', data)
      
      if (data.taskId) {
        setTaskId(data.taskId)
        addLog(`[系统] 任务ID: ${data.taskId}`)
        addLog(`[系统] 将派遣 Agent: ${data.agents.join(', ')}`)
        
        // 开始轮询任务状态
        pollTaskStatus(data.taskId)
      }
    } catch (error) {
      console.error('[ControlPanel] 启动任务失败:', error)
      addLog('[系统] ❌ 启动任务失败，使用本地模拟')
      
    // 如果后端不可用，使用本地模拟
      runLocalSimulation(taskInput)
    }
    
    onClose()
  }
  
  // 轮询任务状态
  const pollTaskStatus = async (taskId: string) => {
    let lastResultCount = 0
    
    const poll = async () => {
      if (!runningRef.current) return
      
      try {
        const response = await fetch(`${API_BASE}/task/${taskId}/status`)
        const data = await response.json()
        
        console.log('[ControlPanel] 任务状态:', data.status, '进度:', data.progress)
        
        // 更新进度
        setTaskProgress(data.progress)
        
        // 更新 Agent 状态
        data.agents.forEach((agentId: string, index: number) => {
          const hasResult = data.results.some((r: TaskResult) => r.agentId === agentId)
          if (hasResult) {
            updateNodeStatus(agentId, 'success')
          } else if (index < Math.ceil(data.progress / 100 * data.agents.length)) {
            updateNodeStatus(agentId, 'running')
          } else {
            updateNodeStatus(agentId, 'idle')
          }
        })
        
        // 添加新结果
        if (data.results.length > lastResultCount) {
          const newResults = data.results.slice(lastResultCount)
          newResults.forEach((result: TaskResult) => {
            addResult(result)
            addLog(`[${result.agentId}] ✅ 输出已生成`)
          })
          lastResultCount = data.results.length
        }
        
        // 如果任务完成，停止轮询
        if (data.status === 'completed') {
          setIsRunning(false)
          setTaskProgress(100)
          updateNodeStatus('orchestrator', 'success')
          addLog('[系统] 🎉 任务执行完成！')
          return
        }
        
        // 继续轮询
        setTimeout(poll, 1000)
      } catch (error) {
        console.error('[ControlPanel] 轮询任务状态失败:', error)
        setTimeout(poll, 2000)
      }
    }
    
    poll()
  }
  
  // 本地模拟执行
  const runLocalSimulation = (inputTask: string) => {
    
    const task = inputTask
    const needsCode = task.includes('开发') || task.includes('代码') || task.includes('编程') || task.includes('写') || task.includes('程序') || task.includes('爬虫') || task.includes('api') || task.includes('网站') || task.includes('app')
    
    // 定义执行步骤
    const steps: { agentId: string; delay: number; result: TaskResult }[] = [
      {
        agentId: 'researcher',
        delay: 1000,
        result: {
          agentId: 'researcher',
          type: 'research',
          content: `## 调研结果\n\n针对「${task}」的分析：\n\n### 需求理解\n- 任务类型：${needsCode ? '技术开发类' : '规划分析类'}\n- 建议方案：${needsCode ? 'Python + React 全栈实现' : '调研+规划+执行'}\n\n### 执行计划\n1. 需求确认与方案设计\n2. ${needsCode ? '代码开发实现' : '详细规划制定'}\n3. 文档整理与交付\n4. 质量审核验收`,
          timestamp: Date.now()
        }
      },
      {
        agentId: 'coder',
        delay: 2000,
        result: {
          agentId: 'coder',
          type: 'code',
          content: needsCode 
            ? `# 代码实现\n\n## main.py\n\n\`\`\`python\nfrom flask import Flask, jsonify, request\n\napp = Flask(__name__)\n\n@app.route('/api/process', methods=['POST'])\ndef process():\n    data = request.json\n    result = {"status": "success", "data": data}\n    return jsonify(result)\n\nif __name__ == '__main__':\n    app.run(host='0.0.0.0', port=5000)\n\`\`\``
            : `# 本次任务无需代码实现\n\n## 说明\n此任务为${needsCode ? '开发' : '分析规划'}类任务，${needsCode ? '需要编写代码' : '不需要代码实现'}。`,
          timestamp: Date.now()
        }
      },
      {
        agentId: 'writer',
        delay: 3000,
        result: {
          agentId: 'writer',
          type: 'doc',
          content: `# 项目文档\n\n## 任务：${task}\n\n### 执行摘要\n本任务由 Multi-Agent 协作系统完成执行。\n\n### 工作内容\n- ✅ 需求调研与分析\n- ✅ ${needsCode ? '代码开发与实现' : '详细规划制定'}\n- ✅ 文档整理\n- ✅ 质量审核\n\n### 交付说明\n${needsCode ? '包含完整的源代码和部署说明。' : '包含完整的分析报告和执行建议。'}`,
          timestamp: Date.now()
        }
      },
      {
        agentId: 'reviewer',
        delay: 4000,
        result: {
          agentId: 'reviewer',
          type: 'review',
          content: `# 审查报告\n\n## 审查结果：✅ 通过\n\n### 评估项\n| 项目 | 状态 | 说明 |\n|------|------|------|\n| 需求理解 | ✅ | 完整准确 |\n| 执行质量 | ✅ | 符合标准 |\n| 文档完整 | ✅ | 内容清晰 |\n\n### 建议\n- 任务执行符合预期\n- 可按计划交付`,
          timestamp: Date.now()
        }
      },
      {
        agentId: 'orchestrator',
        delay: 5000,
        result: {
          agentId: 'orchestrator',
          type: 'doc',
          content: `# 📋 任务执行总结\n\n## 任务：${task}\n\n**状态**：✅ 成功完成\n**时间**：${new Date().toLocaleString('zh-CN')}\n\n---\n\n## 执行阶段\n\n| 阶段 | Agent | 状态 |\n|------|-------|------|\n| 调研分析 | Researcher | ✅ |\n| ${needsCode ? '代码开发' : '规划制定'} | Coder | ✅ |\n| 文档撰写 | Writer | ✅ |\n| 质量审核 | Reviewer | ✅ |\n\n---\n\n## 交付物\n\n${needsCode ? '1. 源代码实现\n2. API 文档\n3. 使用说明' : '1. 调研分析报告\n2. 规划方案\n3. 执行建议'}\n\n---\n\n> Multi-Agent 协作系统自动生成`,
          timestamp: Date.now()
        }
      }
    ]
    
    // 执行每个步骤
    steps.forEach((step, index) => {
      setTimeout(() => {
        if (!runningRef.current) return
        
        console.log(`[ControlPanel] 执行步骤 ${index + 1}:`, step.agentId)
        
        // 更新 Agent 状态为运行中
        updateNodeStatus(step.agentId, 'running')
        addLog(`[${step.agentId}] 开始执行...`)
        
        // 短暂延迟后添加结果
        setTimeout(() => {
          if (!runningRef.current) return
          
          console.log(`[ControlPanel] 添加结果:`, step.agentId, step.result.content.substring(0, 50))
          
          addResult(step.result)
          updateNodeStatus(step.agentId, 'success')
          setTaskProgress(((index + 1) / steps.length) * 100)
          addLog(`[${step.agentId}] ✅ 输出已生成`)
          
          // 如果是最后一步，完成任务
          if (index === steps.length - 1) {
            setTimeout(() => {
              setIsRunning(false)
              setTaskProgress(100)
              addLog('[系统] 🎉 任务执行完成！')
              console.log('[ControlPanel] 任务执行完成，结果数量:', useStore.getState().results.length)
            }, 300)
          }
        }, 500)
      }, step.delay)
    })
    
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="w-[500px] bg-gradient-to-b from-slate-800 to-slate-900 border border-purple-500/30 rounded-2xl overflow-hidden shadow-2xl shadow-purple-500/20"
          >
            {/* 头部 */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 bg-black/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">创建新任务</h2>
                  <p className="text-xs text-slate-400">Multi-Agent 协作执行</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            
            {/* 内容 */}
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  📝 任务描述
                </label>
                <textarea
                  value={taskInput}
                  onChange={(e) => setTaskInput(e.target.value)}
                  placeholder="输入任务描述，例如：帮我写一个 Python 爬虫..."
                  disabled={isRunning}
                  className="
                    w-full h-32 px-4 py-3 rounded-xl
                    bg-slate-900/50 border border-slate-600
                    text-white placeholder-slate-500
                    resize-none focus:outline-none focus:border-cyan-500
                    transition-colors disabled:opacity-50
                  "
                />
                <div className="mt-2 text-right text-xs text-slate-500">
                  {taskInput.length}/500
                </div>
              </div>
              
              {/* 提示 */}
              <div className="mb-4 p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                <p className="text-xs text-cyan-300">
                  💡 提示：系统会自动识别任务类型，分派给合适的 Agent 执行
                </p>
              </div>
              
              {/* 按钮 */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="
                    flex-1 px-6 py-3 rounded-xl
                    bg-slate-700 hover:bg-slate-600
                    text-slate-300 font-medium
                    transition-colors
                  "
                >
                  取消
                </button>
                <button
                  onClick={handleStart}
                  disabled={!taskInput.trim() || isRunning}
                  className="
                    flex-1 flex items-center justify-center gap-2
                    px-6 py-3 rounded-xl
                    bg-gradient-to-r from-cyan-500 to-purple-600
                    hover:from-cyan-400 hover:to-purple-500
                    text-white font-bold
                    transition-all duration-200
                    disabled:opacity-50 disabled:cursor-not-allowed
                    shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40
                  "
                >
                  <Zap className="w-5 h-5" />
                  开始执行
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}