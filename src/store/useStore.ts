import { create } from 'zustand'
import type { Node, Edge } from 'reactflow'

export type AgentStatus = 'idle' | 'running' | 'success' | 'error'

export type TaskResult = {
  agentId: string
  type: 'research' | 'code' | 'doc' | 'review'
  content: string
  timestamp: number
}

// 标准 Agent 模板
export const AGENT_TEMPLATES = [
  {
    id: 'orchestrator',
    name: 'Orchestrator',
    description: '任务指挥官',
    icon: 'Play',
    color: 'cyan',
    role: '调度协调'
  },
  {
    id: 'researcher',
    name: 'Researcher',
    description: '研究员 - 调研搜索',
    icon: 'Brain',
    color: 'purple',
    role: '调研分析'
  },
  {
    id: 'coder',
    name: 'Coder',
    description: '工程师 - 代码开发',
    icon: 'Code',
    color: 'emerald',
    role: '代码开发'
  },
  {
    id: 'writer',
    name: 'Writer',
    description: '创作者 - 文档撰写',
    icon: 'Pen',
    color: 'amber',
    role: '内容创作'
  },
  {
    id: 'reviewer',
    name: 'Reviewer',
    description: '审核员 - 代码审查',
    icon: 'Eye',
    color: 'rose',
    role: '质量审核'
  },
  {
    id: 'designer',
    name: 'Designer',
    description: 'UI/UX 设计师',
    icon: 'Palette',
    color: 'pink',
    role: '界面设计'
  },
  {
    id: 'tester',
    name: 'Tester',
    description: '测试工程师',
    icon: 'Flask',
    color: 'blue',
    role: '测试验证'
  },
  {
    id: 'devops',
    name: 'DevOps',
    description: '运维工程师',
    icon: 'Server',
    color: 'indigo',
    role: '部署运维'
  },
  {
    id: 'analyst',
    name: 'Data Analyst',
    description: '数据分析师',
    icon: 'BarChart',
    color: 'teal',
    role: '数据分析'
  },
  {
    id: 'qa',
    name: 'QA Engineer',
    description: '质量保证工程师',
    icon: 'Shield',
    color: 'lime',
    role: '质量保证'
  },
] as const

export type AgentTemplate = typeof AGENT_TEMPLATES[number]

export interface Model {
  label: string
  providerId: string
  modelId: string
  fullId: string
  baseUrl: string
  apiKey: string
  apiType: string
}

interface AppState {
  // Agent nodes
  nodes: Node[]
  edges: Edge[]
  
  // Current model
  currentModel: Model | null
  models: Model[]
  
  // Running task
  isRunning: boolean
  currentTask: string
  taskProgress: number
  taskId: string | null  // 添加任务 ID
  
  // Logs
  logs: string[]
  
  // Results
  results: TaskResult[]
  
  // Actions
  setNodes: (nodes: Node[]) => void
  setEdges: (edges: Edge[]) => void
  updateNodeStatus: (nodeId: string, status: AgentStatus, log?: string) => void
  setCurrentModel: (model: Model) => void
  setModels: (models: Model[]) => void
  setIsRunning: (running: boolean) => void
  setCurrentTask: (task: string) => void
  setTaskProgress: (progress: number) => void
  setTaskId: (taskId: string | null) => void  // 添加设置函数
  addLog: (log: string) => void
  clearLogs: () => void
  addResult: (result: TaskResult) => void
  clearResults: () => void
  addAgent: (template: AgentTemplate, position?: { x: number, y: number }) => void
  removeAgent: (nodeId: string) => void
  // Task control
  startTask: (task: string) => void
  stopTask: () => void
}

const getDefaultNodes = (): Node[] => [
  {
    id: 'orchestrator',
    type: 'custom',
    position: { x: 400, y: 50 },
    data: { name: 'Orchestrator', description: '任务指挥官', status: 'idle' as AgentStatus },
  },
  {
    id: 'researcher',
    type: 'custom',
    position: { x: 150, y: 200 },
    data: { name: 'Researcher', description: '研究员 - 调研搜索', status: 'idle' as AgentStatus },
  },
  {
    id: 'coder',
    type: 'custom',
    position: { x: 400, y: 200 },
    data: { name: 'Coder', description: '工程师 - 代码开发', status: 'idle' as AgentStatus },
  },
  {
    id: 'writer',
    type: 'custom',
    position: { x: 650, y: 200 },
    data: { name: 'Writer', description: '创作者 - 文档撰写', status: 'idle' as AgentStatus },
  },
  {
    id: 'reviewer',
    type: 'custom',
    position: { x: 400, y: 350 },
    data: { name: 'Reviewer', description: '审核员 - 代码审查', status: 'idle' as AgentStatus },
  },
]

const defaultEdges: Edge[] = [
  { id: 'e1', source: 'orchestrator', target: 'researcher', animated: false },
  { id: 'e2', source: 'orchestrator', target: 'coder', animated: false },
  { id: 'e3', source: 'orchestrator', target: 'writer', animated: false },
  { id: 'e4', source: 'researcher', target: 'reviewer', animated: false },
  { id: 'e5', source: 'coder', target: 'reviewer', animated: false },
  { id: 'e6', source: 'writer', target: 'reviewer', animated: false },
  { id: 'e7', source: 'reviewer', target: 'orchestrator', animated: false },
]

export const useStore = create<AppState>((set, get) => ({
  nodes: getDefaultNodes(),
  edges: defaultEdges,
  currentModel: null,
  models: [],
  isRunning: false,
  currentTask: '',
  taskProgress: 0,
  taskId: null,  // 添加初始值
  logs: [],
  results: [],
  
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  
  updateNodeStatus: (nodeId, status, log) => set((state) => ({
    nodes: state.nodes.map((node) =>
      node.id === nodeId
        ? { ...node, data: { ...node.data, status } }
        : node
    ),
    logs: log ? [...state.logs, `[${nodeId}] ${log}`] : state.logs,
  })),
  
  setCurrentModel: (model) => set({ currentModel: model }),
  setModels: (models) => set({ models }),
  setIsRunning: (running) => set({ isRunning: running }),
  setCurrentTask: (task) => set({ currentTask: task }),
  setTaskProgress: (progress) => set({ taskProgress: progress }),
  setTaskId: (taskId) => set({ taskId }),  // 添加实现
  addLog: (log) => set((state) => ({ logs: [...state.logs, log] })),
  clearLogs: () => set({ logs: [] }),
  addResult: (result) => set((state) => ({ results: [...state.results, result] })),
  clearResults: () => set({ results: [] }),
  
  addAgent: (template, position) => {
    const state = get()
    const id = template.id
    const pos = position || { 
      x: 200 + Math.random() * 400, 
      y: 200 + Math.random() * 200 
    }
    
    // Check if agent already exists
    if (state.nodes.find(n => n.id === id)) {
      return
    }
    
    const newNode: Node = {
      id,
      type: 'custom',
      position: pos,
      data: { 
        name: template.name, 
        description: template.description, 
        status: 'idle' as AgentStatus 
      },
    }
    
    // Add edges from orchestrator to new agent
    const newEdge: Edge = {
      id: `e-${id}`,
      source: 'orchestrator',
      target: id,
      animated: false,
    }
    
    set({ 
      nodes: [...state.nodes, newNode],
      edges: [...state.edges, newEdge],
    })
  },
  
  removeAgent: (nodeId) => {
    const state = get()
    // Don't allow removing orchestrator
    if (nodeId === 'orchestrator') return
    
    set({
      nodes: state.nodes.filter(n => n.id !== nodeId),
      edges: state.edges.filter(e => e.source !== nodeId && e.target !== nodeId),
    })
  },
  
  // Task control methods
  startTask: (task: string) => {
    const state = get()
    set({ 
      isRunning: true, 
      currentTask: task, 
      taskProgress: 0,
      results: []
    })
    
    // Simulate task execution
    const agentOrder = ['researcher', 'coder', 'writer', 'reviewer']
    const totalSteps = agentOrder.length
    
    agentOrder.forEach((agentId, index) => {
      setTimeout(() => {
        const progress = ((index + 1) / totalSteps) * 100
        set({ taskProgress: progress })
        
        // Update node status
        state.updateNodeStatus(agentId, 'running')
        
        // Add result after a delay
        setTimeout(() => {
          state.updateNodeStatus(agentId, 'success')
          state.addResult({
            agentId,
            type: agentId === 'researcher' ? 'research' : 
                  agentId === 'coder' ? 'code' : 
                  agentId === 'writer' ? 'doc' : 'review',
            content: `[${agentId}] Task completed successfully. This is the output from ${agentId}.`,
            timestamp: Date.now()
          })
          
          // Check if all done
          if (index === totalSteps - 1) {
            set({ isRunning: false, taskProgress: 100 })
          }
        }, 2000)
      }, index * 2500)
    })
  },
  
  stopTask: () => {
    set({ isRunning: false, taskProgress: 0 })
  },
}))