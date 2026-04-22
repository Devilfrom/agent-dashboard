import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from './store/useStore'
import {
  Bot, MessageSquare, Workflow, BarChart3, Settings, Bell, Search,
  ChevronDown, Plus, Play, RefreshCw, Download,
  CheckCircle2, XCircle, Loader2, ArrowRight,
  Sun, Moon, Zap, FileText, Star
} from 'lucide-react'

// ==================== 字节跳动风格主应用 ====================
export default function ByteApp() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeTab, setActiveTab] = useState('workflow')
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  
  return (
    <div className={`h-screen flex ${theme === 'dark' ? 'bg-gray-950' : 'bg-gray-50'}`}>
      {/* 侧边栏 */}
      <Sidebar 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        theme={theme}
        setTheme={setTheme}
      />
      
      {/* 主内容区 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 顶部导航 */}
        <Header theme={theme} setTheme={setTheme} />
        
        {/* 内容区 */}
        <main className="flex-1 overflow-auto p-6">
          <AnimatePresence mode="wait">
            {activeTab === 'workflow' && <WorkflowView />}
            {activeTab === 'chat' && <ChatView />}
            {activeTab === 'results' && <ResultsView />}
            {activeTab === 'settings' && <SettingsView />}
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}

// ==================== 侧边栏 ====================
function Sidebar({ 
  sidebarOpen, 
  setSidebarOpen, 
  activeTab, 
  setActiveTab,
  theme 
}: { 
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  activeTab: string
  setActiveTab: (tab: string) => void
  theme: string
  setTheme: (t: 'light' | 'dark') => void
}) {
  const { nodes } = useStore()
  
  const navItems = [
    { id: 'workflow', icon: Workflow, label: '工作流', color: 'violet' },
    { id: 'chat', icon: MessageSquare, label: '对话', color: 'blue' },
    { id: 'results', icon: BarChart3, label: '结果', color: 'emerald' },
    { id: 'settings', icon: Settings, label: '设置', color: 'gray' },
  ]
  
  return (
    <motion.aside
      animate={{ width: sidebarOpen ? 240 : 72 }}
      className={`h-full relative ${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border-r flex flex-col transition-all`}
    >
      {/* Logo */}
      <div className={`h-16 flex items-center px-4 ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'} border-b`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
            <Bot className="w-6 h-6 text-white" />
          </div>
          {sidebarOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h1 className="font-bold text-lg">Agent Hub</h1>
              <p className="text-xs text-gray-500">Multi-Agent Platform</p>
            </motion.div>
          )}
        </div>
      </div>
      
      {/* 导航 */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {navItems.map((item) => (
          <NavItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            active={activeTab === item.id}
            color={item.color}
            onClick={() => setActiveTab(item.id)}
            expanded={sidebarOpen}
          />
        ))}
      </nav>
      
      {/* Agent 状态 */}
      {sidebarOpen && (
        <div className={`p-4 ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'} border-t`}>
          <div className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mb-3`}>
            Agent 状态 ({nodes.filter(n => n.data.status === 'running').length} 运行中)
          </div>
          <div className="space-y-2">
            {nodes.slice(0, 4).map((node) => (
              <div key={node.id} className="flex items-center gap-2">
                <StatusDot status={node.data.status as string} />
                <span className={`text-sm truncate ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  {node.data.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* 展开/收起按钮 */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className={`absolute top-20 -right-3 w-6 h-6 rounded-full ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border flex items-center justify-center shadow-sm hover:scale-110 transition-transform`}
      >
        <ChevronDown className={`w-4 h-4 transition-transform ${sidebarOpen ? '' : 'rotate-180'}`} />
      </button>
    </motion.aside>
  )
}

// ==================== 导航项 ====================
function NavItem({ 
  icon: Icon, 
  label, 
  active, 
  color, 
  onClick, 
  expanded 
}: {
  icon: any
  label: string
  active: boolean
  color: string
  onClick: () => void
  expanded: boolean
}) {
  const colorMap: Record<string, string> = {
    violet: active ? 'bg-violet-500/10 text-violet-500' : `hover:bg-gray-100 dark:hover:bg-gray-800 ${active ? '' : 'opacity-70'}`,
    blue: active ? 'bg-blue-500/10 text-blue-500' : `hover:bg-gray-100 dark:hover:bg-gray-800 ${active ? '' : 'opacity-70'}`,
    emerald: active ? 'bg-emerald-500/10 text-emerald-500' : `hover:bg-gray-100 dark:hover:bg-gray-800 ${active ? '' : 'opacity-70'}`,
    gray: active ? 'bg-gray-500/10 text-gray-500' : `hover:bg-gray-100 dark:hover:bg-gray-800 ${active ? '' : 'opacity-70'}`,
  }
  
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${colorMap[color]}`}
    >
      <Icon className={`w-5 h-5 flex-shrink-0 ${active ? '' : 'opacity-60'}`} />
      {expanded && <span className="text-sm font-medium">{label}</span>}
    </button>
  )
}

// ==================== 顶部导航 ====================
function Header({ theme, setTheme }: { theme: string; setTheme: (t: 'light' | 'dark') => void }) {
  return (
    <header className={`h-16 ${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border-b flex items-center justify-between px-6`}>
      {/* 左侧 */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Agent Hub</span>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </div>
        
        {/* 快捷操作 */}
        <div className="flex items-center gap-2 ml-4">
          <button className="btn btn-primary text-sm">
            <Plus className="w-4 h-4" />
            新建任务
          </button>
        </div>
      </div>
      
      {/* 右侧 */}
      <div className="flex items-center gap-3">
        {/* 搜索 */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}>
          <Search className="w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="搜索..." 
            className={`w-48 bg-transparent text-sm outline-none ${theme === 'dark' ? 'text-gray-200 placeholder-gray-500' : 'text-gray-700 placeholder-gray-400'}`}
          />
          <kbd className={`text-xs px-1.5 py-0.5 rounded ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>⌘K</kbd>
        </div>
        
        {/* 主题切换 */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className={`p-2 rounded-lg ${theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
        
        {/* 通知 */}
        <button className={`p-2 rounded-lg ${theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} relative`}>
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>
        
        {/* 用户头像 */}
        <div className="flex items-center gap-2 pl-3 border-l border-gray-200 dark:border-gray-700">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <span className="text-white text-sm font-medium">A</span>
          </div>
        </div>
      </div>
    </header>
  )
}

// ==================== 工作流视图 ====================
function WorkflowView() {
  const { nodes, isRunning, taskProgress, startTask } = useStore()
  const [taskInput, setTaskInput] = useState('')
  
  const handleStart = () => {
    if (taskInput.trim()) {
      startTask(taskInput)
    }
  }
  
  return (
    <div className="h-full flex flex-col gap-6">
      {/* 标题区 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">工作流编排</h2>
          <p className="text-gray-500 text-sm mt-1">可视化编排多Agent协作流程</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn btn-secondary">
            <Download className="w-4 h-4" />
            导出
          </button>
          <button className="btn btn-secondary">
            <RefreshCw className="w-4 h-4" />
            重置
          </button>
        </div>
      </div>
      
      {/* 主内容 */}
      <div className="flex-1 grid grid-cols-3 gap-6">
        {/* 左侧: Agent列表 */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">可用 Agent</h3>
            <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2">
            {nodes.map((node) => (
              <AgentCard key={node.id} node={node} />
            ))}
          </div>
        </div>
        
        {/* 中间: 工作流 */}
        <div className="col-span-2 card p-4 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">工作流设计</h3>
            <div className="flex items-center gap-2">
              <span className={`badge ${isRunning ? 'badge-warning' : 'badge-success'}`}>
                {isRunning ? '运行中' : '就绪'}
              </span>
            </div>
          </div>
          
          {/* 工作流可视化 */}
          <div className="flex-1 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-8 min-h-[400px]">
            <WorkflowCanvas />
          </div>
          
          {/* 任务输入 */}
          <div className="mt-4 flex gap-3">
            <input
              type="text"
              value={taskInput}
              onChange={(e) => setTaskInput(e.target.value)}
              placeholder="输入任务描述..."
              className="input flex-1"
              disabled={isRunning}
            />
            <button 
              onClick={handleStart}
              disabled={isRunning || !taskInput.trim()}
              className="btn btn-primary"
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  执行中...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  开始执行
                </>
              )}
            </button>
          </div>
          
          {/* 进度条 */}
          {isRunning && (
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500">任务进度</span>
                <span className="font-medium">{Math.round(taskProgress)}%</span>
              </div>
              <div className="progress">
                <div className="progress-bar" style={{ width: `${taskProgress}%` }} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ==================== Agent卡片 ====================
function AgentCard({ node }: { node: any }) {
  const colorMap: Record<string, string> = {
    researcher: 'from-blue-500 to-cyan-500',
    coder: 'from-cyan-500 to-teal-500',
    writer: 'from-emerald-500 to-green-500',
    reviewer: 'from-amber-500 to-orange-500',
    orchestrator: 'from-violet-500 to-purple-500',
  }
  
  const iconMap: Record<string, any> = {
    researcher: Search,
    coder: Zap,
    writer: FileText,
    reviewer: Star,
    orchestrator: Bot,
  }
  
  const Icon = iconMap[node.id] || Bot
  const colors = colorMap[node.id] || 'from-gray-500 to-gray-600'
  
  return (
    <div className={`p-3 rounded-lg border cursor-pointer transition-all hover:scale-[1.02] ${
      node.data.status === 'running' 
        ? 'border-violet-500/50 bg-violet-500/5' 
        : node.data.status === 'success'
          ? 'border-emerald-500/50 bg-emerald-500/5'
          : 'border-gray-200 dark:border-gray-700 hover:border-violet-500/30'
    }`}>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${colors} flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <div className="font-medium text-sm">{node.data.name}</div>
          <div className="text-xs text-gray-500">{node.data.role || node.data.status}</div>
        </div>
        <StatusDot status={node.data.status} />
      </div>
    </div>
  )
}

// ==================== 状态指示器 ====================
function StatusDot({ status }: { status: string }) {
  const statusConfig: Record<string, { color: string; animate?: boolean }> = {
    idle: { color: 'bg-gray-400' },
    running: { color: 'bg-violet-500', animate: true },
    success: { color: 'bg-emerald-500' },
    error: { color: 'bg-red-500' },
  }
  
  const config = statusConfig[status] || statusConfig.idle
  
  return (
    <span className="relative flex h-2.5 w-2.5">
      {config.animate && (
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${config.color} opacity-75`} />
      )}
      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${config.color}`} />
    </span>
  )
}

// ==================== 工作流画布 ====================
function WorkflowCanvas() {
  const { nodes } = useStore()
  
  return (
    <div className="h-full flex flex-col">
      {/* 工作流节点 */}
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center gap-4 flex-wrap justify-center">
          {nodes.map((node, index) => (
            <div key={node.id} className="flex items-center">
              <WorkflowNode node={node} index={index} />
              {index < nodes.length - 1 && (
                <div className="mx-2 text-gray-400">
                  <ArrowRight className="w-6 h-6" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* 边/连接线 */}
      <div className="text-center text-sm text-gray-500">
        共 {nodes.length} 个 Agent
      </div>
    </div>
  )
}

// ==================== 工作流节点 ====================
function WorkflowNode({ node, index }: { node: any; index: number }) {
  const nodeColors: Record<string, string> = {
    researcher: 'from-blue-500 to-cyan-500',
    coder: 'from-cyan-500 to-teal-500',
    writer: 'from-emerald-500 to-green-500',
    reviewer: 'from-amber-500 to-orange-500',
    orchestrator: 'from-violet-500 to-purple-500',
  }
  
  const iconMap: Record<string, any> = {
    researcher: Search,
    coder: Zap,
    writer: FileText,
    reviewer: Star,
    orchestrator: Bot,
  }
  
  const Icon = iconMap[node.id] || Bot
  const colors = nodeColors[node.id] || 'from-gray-500 to-gray-600'
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`relative p-4 rounded-xl border-2 w-36 text-center transition-all ${
        node.data.status === 'running' 
          ? 'border-violet-500 bg-violet-500/10' 
          : node.data.status === 'success'
            ? 'border-emerald-500 bg-emerald-500/10'
            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900'
      }`}
    >
      <div className={`w-12 h-12 mx-auto mb-2 rounded-xl bg-gradient-to-br ${colors} flex items-center justify-center`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div className="font-medium text-sm">{node.data.name}</div>
      <div className="text-xs text-gray-500 capitalize">{node.data.status}</div>
      
      {/* 状态图标 */}
      {node.data.status === 'running' && (
        <div className="absolute -top-2 -right-2">
          <Loader2 className="w-5 h-5 text-violet-500 animate-spin" />
        </div>
      )}
      {node.data.status === 'success' && (
        <div className="absolute -top-2 -right-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
        </div>
      )}
      {node.data.status === 'error' && (
        <div className="absolute -top-2 -right-2">
          <XCircle className="w-5 h-5 text-red-500" />
        </div>
      )}
    </motion.div>
  )
}

// ==================== 对话视图 ====================
function ChatView() {
  return (
    <div className="h-full flex flex-col">
      <div className="card p-6 flex-1 flex flex-col">
        <h2 className="text-xl font-bold mb-4">AI 对话</h2>
        <div className="flex-1 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-8 flex items-center justify-center">
          <div className="text-center text-gray-400">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>选择一个 Agent 开始对话</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ==================== 结果视图 ====================
function ResultsView() {
  const { results } = useStore()
  
  return (
    <div className="h-full flex flex-col">
      <div className="card p-6 flex-1">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">执行结果</h2>
          <span className="badge badge-info">{results.length} 条结果</span>
        </div>
        
        {results.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-400">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>暂无执行结果</p>
              <p className="text-sm mt-2">在工作流视图中执行任务后查看结果</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {results.map((result, index) => (
              <ResultCard key={index} result={result} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ResultCard({ result }: { result: any }) {
  const colorMap: Record<string, string> = {
    researcher: 'from-blue-500 to-cyan-500',
    coder: 'from-cyan-500 to-teal-500',
    writer: 'from-emerald-500 to-green-500',
    reviewer: 'from-amber-500 to-orange-500',
  }
  
  const iconMap: Record<string, any> = {
    researcher: Search,
    coder: Zap,
    writer: FileText,
    reviewer: Star,
  }
  
  const Icon = iconMap[result.agentId] || Bot
  const colors = colorMap[result.agentId] || 'from-gray-500 to-gray-600'
  
  return (
    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-violet-500/30 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${colors} flex items-center justify-center`}>
            <Icon className="w-4 h-4 text-white" />
          </div>
          <span className="font-medium">{result.agentId}</span>
        </div>
        <span className="badge badge-success">成功</span>
      </div>
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
        <pre className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap font-mono">
          {result.content?.substring(0, 300)}
          {result.content?.length > 300 && '...'}
        </pre>
      </div>
    </div>
  )
}

// ==================== 设置视图 ====================
function SettingsView() {
  return (
    <div className="h-full">
      <div className="card p-6">
        <h2 className="text-xl font-bold mb-6">设置</h2>
        
        <div className="space-y-6">
          {/* API 设置 */}
          <div>
            <h3 className="font-medium mb-3">API 配置</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-500 mb-1 block">API 地址</label>
                <input type="text" className="input" defaultValue="http://maas.gd.chinamobile.com:36007" />
              </div>
              <div>
                <label className="text-sm text-gray-500 mb-1 block">API Key</label>
                <input type="password" className="input" defaultValue="sk-..." />
              </div>
              <div>
                <label className="text-sm text-gray-500 mb-1 block">模型</label>
                <select className="input">
                  <option>minimax-m25</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* 其他设置 */}
          <div>
            <h3 className="font-medium mb-3">偏好设置</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-300" defaultChecked />
                <span className="text-sm">自动保存执行记录</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-300" defaultChecked />
                <span className="text-sm">显示详细日志</span>
              </label>
            </div>
          </div>
          
          {/* 保存按钮 */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <button className="btn btn-primary">
              保存设置
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
