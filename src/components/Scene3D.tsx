import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Stars, Float, Text, Sphere, Box, Torus, MeshDistortMaterial } from '@react-three/drei'
import * as THREE from 'three'
import { useStore } from '../store/useStore'

// Agent 3D 节点
function AgentNode3D({ position, color, name, status, isRunning }: {
  position: [number, number, number]
  color: string
  name: string
  status: string
  isRunning: boolean
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  
  useFrame((state) => {
    if (meshRef.current) {
      // 运行时旋转和脉动
      if (isRunning && status === 'running') {
        meshRef.current.rotation.y += 0.02
        meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.1
      }
    }
  })
  
  const glowColor = status === 'running' ? '#00ffff' : status === 'success' ? '#00ff00' : status === 'error' ? '#ff0000' : color
  
  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <group position={position}>
        {/* 主体 - 机器人形状 */}
        <Box ref={meshRef} args={[0.8, 1.2, 0.8]} position={[0, 0, 0]}>
          <meshStandardMaterial color={color} emissive={glowColor} emissiveIntensity={status === 'running' ? 0.5 : 0.1} />
        </Box>
        
        {/* 头部 */}
        <Sphere args={[0.4, 16, 16]} position={[0, 0.9, 0]}>
          <meshStandardMaterial color={color} emissive={glowColor} emissiveIntensity={status === 'running' ? 0.8 : 0.2} />
        </Sphere>
        
        {/* 眼睛 */}
        <Sphere args={[0.08, 8, 8]} position={[-0.15, 0.95, 0.35]}>
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1} />
        </Sphere>
        <Sphere args={[0.08, 8, 8]} position={[0.15, 0.95, 0.35]}>
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1} />
        </Sphere>
        
        {/* 发光环 */}
        {status === 'running' && (
          <Torus args={[0.6, 0.05, 8, 32]} position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={2} transparent opacity={0.8} />
          </Torus>
        )}
        
        {/* 名称标签 */}
        <Text
          position={[0, 1.5, 0]}
          fontSize={0.3}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          {name}
        </Text>
        
        {/* 状态指示 */}
        <Text
          position={[0, -0.8, 0]}
          fontSize={0.2}
          color={status === 'running' ? '#00ffff' : status === 'success' ? '#00ff00' : '#888888'}
          anchorX="center"
          anchorY="middle"
        >
          {status === 'running' ? '⚡ 执行中' : status === 'success' ? '✅ 完成' : '○ 待命'}
        </Text>
      </group>
    </Float>
  )
}

// 连接线 - 发光效果
function ConnectionLine({ start, end, active }: {
  start: [number, number, number]
  end: [number, number, number]
  active: boolean
}) {
  const points = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(...start),
      new THREE.Vector3(start[0], start[1] + 1, start[2]),
      new THREE.Vector3(end[0], end[1] + 1, end[2]),
      new THREE.Vector3(...end),
    ])
    return curve.getPoints(20)
  }, [start, end])
  
  const lineGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry().setFromPoints(points)
    return geometry
  }, [points])
  
  return (
    <primitive object={new THREE.Line(
      lineGeometry,
      new THREE.LineBasicMaterial({
        color: active ? 0x00ffff : 0x444444,
        transparent: true,
        opacity: active ? 0.8 : 0.3,
      })
    )} />
  )
}

// 粒子效果 - 任务执行时
function TaskParticles({ isRunning }: { isRunning: boolean }) {
  const particlesRef = useRef<THREE.Points>(null)
  
  const positions = useMemo(() => {
    const arr = new Float32Array(100 * 3)
    for (let i = 0; i < 100; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 10
      arr[i * 3 + 1] = (Math.random() - 0.5) * 10
      arr[i * 3 + 2] = (Math.random() - 0.5) * 10
    }
    return arr
  }, [])
  
  useFrame(() => {
    if (particlesRef.current && isRunning) {
      particlesRef.current.rotation.y += 0.001
      particlesRef.current.rotation.x += 0.0005
    }
  })
  
  if (!isRunning) return null
  
  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial size={0.05} color="#00ffff" transparent opacity={0.6} />
    </points>
  )
}

// 主场景
function SceneContent() {
  const { nodes, isRunning } = useStore()
  
  // Agent 位置映射
  const agentPositions: Record<string, [number, number, number]> = {
    orchestrator: [0, 2, 0],
    researcher: [-3, 0, 0],
    coder: [0, 0, 0],
    writer: [3, 0, 0],
    reviewer: [1.5, -2, 0],
  }
  
  const agentColors: Record<string, string> = {
    orchestrator: '#8b5cf6',
    researcher: '#3b82f6',
    coder: '#06b6d4',
    writer: '#10b981',
    reviewer: '#f59e0b',
  }
  
  return (
    <>
      {/* 星空背景 */}
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      
      {/* 环境光 */}
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#ffffff" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#00ffff" />
      
      {/* 中心任务球 */}
      <Sphere args={[0.5, 32, 32]} position={[0, 4, 0]}>
        <MeshDistortMaterial
          color="#8b5cf6"
          emissive="#8b5cf6"
          emissiveIntensity={isRunning ? 0.8 : 0.2}
          distort={isRunning ? 0.4 : 0.1}
          speed={2}
        />
      </Sphere>
      
      {/* 任务标签 */}
      <Text
        position={[0, 5, 0]}
        fontSize={0.4}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        🎯 TASK
      </Text>
      
      {/* Agent 3D 节点 */}
      {nodes.map((node) => {
        const pos = agentPositions[node.id] || [0, 0, 0]
        const color = agentColors[node.id] || '#888888'
        const status = node.data.status as string
        
        return (
          <AgentNode3D
            key={node.id}
            position={pos}
            color={color}
            name={node.data.name as string}
            status={status}
            isRunning={isRunning}
          />
        )
      })}
      
      {/* 连接线 */}
      <ConnectionLine start={[0, 4, 0]} end={[0, 2, 0]} active={isRunning} />
      <ConnectionLine start={[0, 2, 0]} end={[-3, 0, 0]} active={isRunning} />
      <ConnectionLine start={[0, 2, 0]} end={[0, 0, 0]} active={isRunning} />
      <ConnectionLine start={[0, 2, 0]} end={[3, 0, 0]} active={isRunning} />
      <ConnectionLine start={[0, 0, 0]} end={[1.5, -2, 0]} active={isRunning} />
      
      {/* 粒子效果 */}
      <TaskParticles isRunning={isRunning} />
      
      {/* 地面网格 */}
      <gridHelper args={[20, 20, '#444444', '#222222']} position={[0, -3, 0]} />
    </>
  )
}

export default function Scene3D() {
  return (
    <div className="absolute inset-0 z-0">
      <Canvas camera={{ position: [0, 2, 8], fov: 60 }}>
        <SceneContent />
      </Canvas>
    </div>
  )
}