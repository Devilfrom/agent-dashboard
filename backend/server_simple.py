# -*- coding: utf-8 -*-
"""
Multi-Agent Command Center - 后端服务（简化版）
使用 minimax-m25 模型
"""
import os
import sys
import json
import uuid
import asyncio
import threading
from datetime import datetime
from typing import Dict, List, Optional

from flask import Flask, request, jsonify, Response, stream_with_context
from flask_cors import CORS
import httpx

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# ============ API 配置 ============
API_BASE_URL = "http://maas.gd.chinamobile.com:36007/ai/uifm/open/v1"
API_KEY = "sk-gm3khp4v26pr5mme81k8ensenftxj2a9i709hnzy414xb"
MODEL_NAME = "minimax-m25"

# ============ 数据存储 ============
tasks: Dict[str, dict] = {}
task_results: Dict[str, List[dict]] = {}
conversations: Dict[str, List[dict]] = {}

# ============ Agent 定义 ============
AGENTS = {
    "orchestrator": {"name": "指挥官", "role": "调度协调", "color": "#FF6B6B"},
    "researcher": {"name": "研究员", "role": "调研分析", "color": "#4ECDC4"},
    "coder": {"name": "工程师", "role": "代码开发", "color": "#45B7D1"},
    "writer": {"name": "创作者", "role": "文档撰写", "color": "#96CEB4"},
    "reviewer": {"name": "审核员", "role": "质量审核", "color": "#DDA0DD"}
}

SYSTEM_PROMPTS = {
    "orchestrator": "你是一个智能任务调度指挥官，负责分解复杂任务并协调多个专业Agent完成工作。",
    "researcher": "你是一个专业的研究员AI助手，擅长深度调研、信息搜索和数据分析。",
    "coder": "你是一个专业的AI编程助手，擅长代码开发、功能实现和技术方案设计。",
    "writer": "你是一个专业的内容创作者AI助手，擅长文档撰写、内容创作和文案编写。",
    "reviewer": "你是一个专业的代码审查和质量审核AI助手，擅长发现问题和提出改进建议。"
}

# ============ API 调用 ============
def call_api(messages: List[dict], stream: bool = False) -> str:
    """调用 minimax API"""
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": MODEL_NAME,
        "messages": messages,
        "stream": stream,
        "max_tokens": 2048,
        "temperature": 0.7
    }
    
    try:
        with httpx.Client(timeout=60.0) as client:
            response = client.post(f"{API_BASE_URL}/chat/completions", json=payload, headers=headers)
            if response.status_code == 200:
                data = response.json()
                return data["choices"][0]["message"]["content"]
            else:
                return f"API错误: {response.status_code} - {response.text[:200]}"
    except Exception as e:
        return f"调用失败: {str(e)}"


# ============ 路由 ============
@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'model': MODEL_NAME, 'timestamp': datetime.now().isoformat()})


@app.route('/api/agents', methods=['GET'])
def list_agents():
    return jsonify({'agents': [{'id': k, **v} for k, v in AGENTS.items()]})


@app.route('/api/chat', methods=['POST'])
def chat():
    print(f"[DEBUG] chat() called")
    print(f"[DEBUG] Request: {request.method} {request.path}")
    
    data = request.json or {}
    message = data.get('message', '')
    
    if not message:
        return jsonify({'error': '消息不能为空'}), 400
    
    conversation_id = data.get('conversation_id') or str(uuid.uuid4())
    
    if conversation_id not in conversations:
        conversations[conversation_id] = []
    
    conversations[conversation_id].append({'role': 'user', 'content': message})
    
    messages = [
        {'role': 'system', 'content': SYSTEM_PROMPTS['orchestrator']},
        *conversations[conversation_id]
    ]
    
    print(f"[DEBUG] Calling API...")
    response = call_api(messages)
    print(f"[DEBUG] API response length: {len(response)}")
    
    conversations[conversation_id].append({'role': 'assistant', 'content': response})
    
    return jsonify({
        'conversation_id': conversation_id,
        'message': response,
        'timestamp': datetime.now().isoformat()
    })


@app.route('/api/task/start', methods=['POST'])
def start_task():
    data = request.json or {}
    task = data.get('task', '')
    
    if not task:
        return jsonify({'error': '任务不能为空'}), 400
    
    task_id = str(uuid.uuid4())
    
    # 简单分析任务选择Agent
    agents = []
    task_lower = task.lower()
    if any(kw in task_lower for kw in ['调研', '搜索', '分析', '研究']):
        agents.append('researcher')
    if any(kw in task_lower for kw in ['开发', '代码', '写', '实现', '程序']):
        agents.append('coder')
    if any(kw in task_lower for kw in ['文档', '文章', '说明']):
        agents.append('writer')
    if not agents:
        agents = ['researcher', 'coder']
    
    tasks[task_id] = {
        'id': task_id,
        'task': task,
        'agents': agents,
        'status': 'running',
        'progress': 0,
        'startedAt': datetime.now().isoformat(),
        'logs': []
    }
    task_results[task_id] = []
    
    def run_task():
        for i, agent_id in enumerate(agents):
            tasks[task_id]['current_agent'] = agent_id
            tasks[task_id]['progress'] = int((i + 1) / len(agents) * 100)
            tasks[task_id]['logs'].append({
                'time': datetime.now().isoformat(),
                'agent': agent_id,
                'message': f"{AGENTS[agent_id]['name']}开始执行..."
            })
            
            messages = [
                {'role': 'system', 'content': SYSTEM_PROMPTS.get(agent_id, '')},
                {'role': 'user', 'content': f"任务：{task}\n\n请完成你的工作。"}
            ]
            
            result = call_api(messages)
            task_results[task_id].append({
                'agent': agent_id,
                'role': AGENTS[agent_id]['name'],
                'content': result,
                'timestamp': datetime.now().isoformat()
            })
            
            tasks[task_id]['logs'].append({
                'time': datetime.now().isoformat(),
                'agent': agent_id,
                'message': f"{AGENTS[agent_id]['name']}完成"
            })
        
        tasks[task_id]['status'] = 'completed'
        tasks[task_id]['progress'] = 100
        tasks[task_id]['completedAt'] = datetime.now().isoformat()
    
    thread = threading.Thread(target=run_task)
    thread.start()
    
    return jsonify({
        'taskId': task_id,
        'agents': agents,
        'agentNames': [AGENTS[a]['name'] for a in agents],
        'status': 'started'
    })


@app.route('/api/task/<task_id>/status', methods=['GET'])
def get_task_status(task_id):
    if task_id not in tasks:
        return jsonify({'error': '任务不存在'}), 404
    
    return jsonify({
        'taskId': task_id,
        'status': tasks[task_id]['status'],
        'progress': tasks[task_id]['progress'],
        'currentAgent': tasks[task_id].get('current_agent'),
        'logs': tasks[task_id].get('logs', []),
        'results': task_results.get(task_id, []),
        'startedAt': tasks[task_id]['startedAt'],
        'completedAt': tasks[task_id].get('completedAt')
    })


@app.route('/api/task/<task_id>/results', methods=['GET'])
def get_task_results(task_id):
    if task_id not in tasks:
        return jsonify({'error': '任务不存在'}), 404
    
    return jsonify({
        'taskId': task_id,
        'task': tasks[task_id]['task'],
        'status': tasks[task_id]['status'],
        'results': task_results.get(task_id, [])
    })


@app.route('/api/tasks', methods=['GET'])
def list_tasks():
    return jsonify({
        'tasks': [
            {
                'id': tid,
                'task': t['task'][:50] + '...' if len(t['task']) > 50 else t['task'],
                'status': t['status'],
                'progress': t['progress'],
                'agents': [AGENTS[a]['name'] for a in t['agents']],
                'startedAt': t['startedAt']
            }
            for tid, t in sorted(tasks.items(), key=lambda x: x[1]['startedAt'], reverse=True)
        ]
    })


if __name__ == '__main__':
    print("=" * 60)
    print("Multi-Agent Command Center - Backend")
    print(f"API: {API_BASE_URL}")
    print(f"Model: {MODEL_NAME}")
    print("=" * 60)
    app.run(host='0.0.0.0', port=3001, debug=False, threaded=True)
