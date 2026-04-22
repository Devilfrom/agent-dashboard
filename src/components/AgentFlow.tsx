import { useCallback, useEffect, useState } from 'react'
import ReactFlow, {
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { useStore } from '../store/useStore'
import AgentNodeComponent from './AgentNode'

const nodeTypes = {
  custom: AgentNodeComponent,
}

export default function AgentFlow() {
  const { nodes: storeNodes, edges: storeEdges, isRunning, logs } = useStore()
  
  const [nodes, setNodes, onNodesChange] = useNodesState(storeNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(storeEdges)
  const [activeNode, setActiveNode] = useState<string | null>(null)

  // Sync store nodes to local state
  useEffect(() => {
    setNodes(storeNodes)
  }, [storeNodes, setNodes])

  useEffect(() => {
    setEdges(storeEdges)
  }, [storeEdges, setEdges])

  // Find currently running node from logs
  useEffect(() => {
    if (isRunning && logs.length > 0) {
      const lastLog = logs[logs.length - 1]
      const match = lastLog.match(/\[(\w+)\]/)
      if (match) {
        setActiveNode(match[1])
      }
    } else if (!isRunning) {
      setActiveNode(null)
    }
  }, [logs, isRunning])

  // Animate edges when running - highlight edges connected to active node
  useEffect(() => {
    if (isRunning && activeNode) {
      setEdges((eds) =>
        eds.map((edge) => {
          const isConnected = edge.source === activeNode || edge.target === activeNode
          return { 
            ...edge, 
            animated: isConnected,
            style: isConnected ? { stroke: '#22d3ee', strokeWidth: 3 } : { stroke: '#64748b', strokeWidth: 2 },
            className: isConnected ? 'edge-animated' : ''
          }
        })
      )
    } else {
      setEdges((eds) =>
        eds.map((edge) => ({ 
          ...edge, 
          animated: false,
          style: { stroke: '#64748b', strokeWidth: 2 }
        }))
      )
    }
  }, [isRunning, activeNode, setEdges])

  const onNodeClick = useCallback((_: React.MouseEvent, node: any) => {
    console.log('Node clicked:', node.id)
  }, [])

  return (
    <div className="w-full h-full bg-slate-900 rounded-2xl overflow-hidden border border-slate-700 relative">
      {/* Running indicator */}
      {isRunning && (
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-1.5 bg-cyan-500/20 rounded-full border border-cyan-500/30">
          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
          <span className="text-sm text-cyan-400 font-medium">执行中</span>
        </div>
      )}
      
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.5}
        maxZoom={1.5}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="#3b4252"
        />
        <Controls
          className="!bg-slate-800 !border-slate-700 !rounded-lg !shadow-xl"
          showInteractive={false}
        />
      </ReactFlow>
    </div>
  )
}