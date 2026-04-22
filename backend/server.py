"""
Multi-Agent Command Center - 后端服务
使用 minimax-m25 模型实现真正的多Agent协作

API: http://maas.gd.chinamobile.com:36007/ai/uifm/open/v1
Protocol: openai-completions
"""

import os
import sys
import json
import uuid
import asyncio
import threading
from datetime import datetime
from typing import Dict, List, Optional, AsyncGenerator
from dataclasses import dataclass, field
from collections import defaultdict

from flask import Flask, request, jsonify, Response, stream_with_context
from flask_cors import CORS
import httpx

app = Flask(__name__)
CORS(app)

# ============ API 配置 ============
API_BASE_URL = "http://maas.gd.chinamobile.com:36007/ai/uifm/open/v1"
API_KEY = "sk-gm3khp4v26pr5mme81k8ensenftxj2a9i709hnzy414xb"
MODEL_NAME = "minimax-m25"

# ============ 数据存储 ============
# 任务状态存储
tasks: Dict[str, dict] = {}
# 任务结果存储
task_results: Dict[str, List[dict]] = {}
# 对话历史存储
conversations: Dict[str, List[dict]] = {}
# Agent状态
agent_status: Dict[str, dict] = {}

# ============ Agent 定义 ============
AGENTS = {
    "orchestrator": {
        "name": "指挥官",
        "role": "调度协调",
        "description": "负责任务分解、Agent调度、结果整合",
        "color": "#FF6B6B",
        "icon": "crown"
    },
    "researcher": {
        "name": "研究员",
        "role": "调研分析",
        "description": "负责深度调研、搜索、分析信息",
        "color": "#4ECDC4",
        "icon": "search"
    },
    "coder": {
        "name": "工程师",
        "role": "代码开发",
        "description": "负责代码编写、开发、实现功能",
        "color": "#45B7D1",
        "icon": "code"
    },
    "writer": {
        "name": "创作者",
        "role": "文档撰写",
        "description": "负责文档撰写、内容创作",
        "color": "#96CEB4",
        "icon": "pen"
    },
    "reviewer": {
        "name": "审核员",
        "role": "质量审核",
        "description": "负责代码审查、质量把关",
        "color": "#DDA0DD",
        "icon": "check"
    }
}

# ============ 系统提示词 ============
SYSTEM_PROMPTS = {
    "orchestrator": """你是一个智能任务调度指挥官，负责分解复杂任务并协调多个专业Agent完成工作。

你的职责：
1. 理解用户需求
2. 将任务分解为子任务
3. 确定需要哪些Agent参与
4. 协调各Agent工作
5. 整合各Agent的结果
6. 输出最终报告

工作流程：
- 分析任务复杂度
- 选择合适的Agent组合
- 给出清晰的任务指令
- 整合所有Agent的输出

输出格式：
## 任务分析
[对任务的深度分析]

## 任务分解
[将任务分解为具体步骤]

## Agent调度
[指定哪个Agent做什么]

## 执行指令
[给各Agent的具体指令]

## 最终报告
[整合所有Agent结果后的完整报告]""",

    "researcher": """你是一个专业的研究员AI助手，擅长深度调研、信息搜索和数据分析。

你的职责：
1. 理解研究目标
2. 设计研究方案
3. 搜索和收集信息
4. 分析数据
5. 整理调研报告

工作原则：
- 信息来源要可靠
- 分析要客观全面
- 报告要结构清晰
- 结论要有据可依

输出格式：
## 研究背景
[任务的背景信息]

## 调研方法
[你使用的调研方法]

## 关键发现
[1-5个核心发现]

## 详细分析
[每个发现的详细分析]

## 结论与建议
[基于调研的结论和建议]

## 参考资料
[信息来源列表]""",

    "coder": """你是一个专业的AI编程助手，擅长代码开发、功能实现和技术方案设计。

你的职责：
1. 理解需求
2. 设计技术方案
3. 编写高质量代码
4. 提供完整实现

技术栈能力：
- 前端：React, Vue, HTML/CSS/JavaScript
- 后端：Python, Node.js, Java
- 数据库：MySQL, PostgreSQL, MongoDB
- DevOps：Git, Docker, CI/CD

工作原则：
- 代码要简洁、可维护
- 要有适当的注释
- 考虑边界情况
- 注重性能和安全

输出格式：
## 需求分析
[对需求的理解]

## 技术方案
[整体技术架构设计]

## 代码实现
```[语言]
[完整可运行的代码]
```

## 使用说明
[如何部署和使用]

## 注意事项
[需要特别关注的事项]""",

    "writer": """你是一个专业的内容创作者AI助手，擅长文档撰写、内容创作和文案编写。

你的职责：
1. 理解创作目标
2. 收集创作素材
3. 撰写高质量内容
4. 优化文案表达

内容类型：
- 技术文档（README、API文档）
- 博客文章
- 产品文案
- 营销内容
- 报告总结

工作原则：
- 内容要有价值
- 表达要清晰准确
- 结构要合理
- 语言要流畅

输出格式：
## 内容主题
[你的创作主题]

## 内容大纲
[文章/文档的整体结构]

## 详细内容
[完整的正文内容]

## 总结
[对内容的总结]""",

    "reviewer": """你是一个专业的代码审查和质量审核AI助手，擅长发现问题和提出改进建议。

你的职责：
1. 审查代码/文档质量
2. 发现潜在问题
3. 提出改进建议
4. 评估整体质量

审查维度：
- 代码质量（可读性、可维护性）
- 性能优化
- 安全漏洞
- 逻辑错误
- 最佳实践

工作原则：
- 审查要细致全面
- 问题要具体明确
- 建议要可操作
- 评价要客观公正

输出格式：
## 审查范围
[你审查的内容]

## 优点评价
[做得好的地方]

## 发现的问题
### 🔴 严重问题
[必须修复的问题]

### 🟡 中等问题
[建议修复的问题]

### 🟢 轻微问题
[可选优化的问题]

## 改进建议
[具体的改进方案]

## 最终评分
[1-10分的整体评价]

## 总结
[总体评价和下一步行动]"""
}


# ============ API 调用函数 ============
async def call_minimax_api(messages: List[dict], stream: bool = True) -> AsyncGenerator[str, None]:
    """调用 minimax API"""
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": MODEL_NAME,
        "messages": messages,
        "stream": stream,
        "max_tokens": 4096,
        "temperature": 0.7
    }
    
    async with httpx.AsyncClient(timeout=120.0) as client:
        try:
            async with client.stream("POST", f"{API_BASE_URL}/chat/completions", json=payload, headers=headers) as response:
                if response.status_code != 200:
                    error_text = await response.text()
                    yield f"error:API错误 {response.status_code} - {error_text}"
                    return
                
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        data_str = line[6:]
                        if data_str == "[DONE]":
                            break
                        try:
                            data = json.loads(data_str)
                            if "choices" in data and len(data["choices"]) > 0:
                                delta = data["choices"][0].get("delta", {})
                                if "content" in delta:
                                    yield delta["content"]
                                elif "reasoning_content" in delta:
                                    yield delta["reasoning_content"]
                        except json.JSONDecodeError:
                            continue
        except httpx.TimeoutException:
            yield "error:请求超时，请重试"
        except Exception as e:
            yield f"error:API调用失败 - {str(e)}"


def call_minimax_sync(messages: List[dict]) -> str:
    """同步调用 minimax API"""
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": MODEL_NAME,
        "messages": messages,
        "stream": False,
        "max_tokens": 4096,
        "temperature": 0.7
    }
    
    try:
        with httpx.Client(timeout=120.0) as client:
            response = client.post(f"{API_BASE_URL}/chat/completions", json=payload, headers=headers)
            if response.status_code == 200:
                data = response.json()
                if "choices" in data and len(data["choices"]) > 0:
                    return data["choices"][0]["message"]["content"]
            else:
                return f"API错误: {response.status_code} - {response.text}"
    except Exception as e:
        return f"调用失败: {str(e)}"


# ============ 任务分析函数 ============
def analyze_task_and_select_agents(task: str) -> List[str]:
    """分析任务，决定派遣哪些Agent"""
    task_lower = task.lower()
    agents = []
    
    # 关键词匹配
    keywords_map = {
        "researcher": ["调研", "搜索", "查找", "分析", "研究", "调查", "报告", "竞品", "市场", "数据"],
        "coder": ["开发", "代码", "写", "实现", "编程", "爬虫", "api", "网站", "app", "程序", "功能", "系统"],
        "writer": ["文档", "readme", "博客", "文章", "说明", "手册", "撰写", "创作", "文案"],
        "reviewer": ["审核", "检查", "review", "优化", "审查", "评估", "质量"]
    }
    
    for agent, keywords in keywords_map.items():
        if any(kw in task_lower for kw in keywords):
            agents.append(agent)
    
    # 默认至少包含研究、编码、写作
    if not agents:
        agents = ["researcher", "coder", "writer"]
    
    return agents


def get_agent_system_prompt(agent_id: str) -> str:
    """获取Agent的系统提示词"""
    return SYSTEM_PROMPTS.get(agent_id, "你是一个AI助手，负责完成用户任务。")


# ============ API 路由 ============
@app.route('/health', methods=['GET'])
def health():
    """健康检查"""
    return jsonify({
        'status': 'ok',
        'service': 'Multi-Agent Command Center',
        'model': MODEL_NAME,
        'timestamp': datetime.now().isoformat()
    })


@app.route('/api/models', methods=['GET'])
def list_models():
    """列出可用模型"""
    return jsonify({
        'models': [
            {'id': 'minimax-m25', 'name': 'MiniMax M25', 'provider': 'China Mobile'}
        ]
    })


@app.route('/api/agents', methods=['GET'])
def list_agents():
    """列出所有Agent"""
    return jsonify({
        'agents': [
            {
                'id': agent_id,
                'name': info['name'],
                'role': info['role'],
                'description': info['description'],
                'color': info['color'],
                'icon': info['icon']
            }
            for agent_id, info in AGENTS.items()
        ]
    })


@app.route('/api/agents/<agent_id>', methods=['GET'])
def get_agent(agent_id):
    """获取单个Agent信息"""
    if agent_id not in AGENTS:
        return jsonify({'error': 'Agent不存在'}), 404
    
    return jsonify({
        'agent': {
            'id': agent_id,
            **AGENTS[agent_id],
            'system_prompt': get_agent_system_prompt(agent_id)
        }
    })


@app.route('/api/chat', methods=['POST'])
def chat():
    """单轮对话（使用指挥官Agent）"""
    data = request.json
    message = data.get('message', '')
    conversation_id = data.get('conversation_id') or str(uuid.uuid4())
    
    if not message:
        return jsonify({'error': '消息不能为空'}), 400
    
    # 初始化对话历史
    if conversation_id not in conversations:
        conversations[conversation_id] = []
    
    # 添加用户消息
    conversations[conversation_id].append({
        'role': 'user',
        'content': message
    })
    
    # 构建消息列表
    messages = [
        {'role': 'system', 'content': SYSTEM_PROMPTS['orchestrator']},
        *conversations[conversation_id]
    ]
    
    # 调用API
    response = call_minimax_sync(messages)
    
    # 添加助手回复
    conversations[conversation_id].append({
        'role': 'assistant',
        'content': response
    })
    
    return jsonify({
        'conversation_id': conversation_id,
        'message': response,
        'timestamp': datetime.now().isoformat()
    })


@app.route('/api/chat/stream', methods=['POST'])
def chat_stream():
    """流式对话"""
    data = request.json
    message = data.get('message', '')
    conversation_id = data.get('conversation_id') or str(uuid.uuid4())
    agent_id = data.get('agent_id', 'orchestrator')
    
    if not message:
        return jsonify({'error': '消息不能为空'}), 400
    
    # 初始化对话历史
    if conversation_id not in conversations:
        conversations[conversation_id] = []
    
    # 添加用户消息
    conversations[conversation_id].append({
        'role': 'user',
        'content': message
    })
    
    def generate():
        # 构建消息列表
        messages = [
            {'role': 'system', 'content': get_agent_system_prompt(agent_id)},
            *conversations[conversation_id]
        ]
        
        # 流式调用
        async def stream_content():
            full_response = ""
            async for chunk in call_minimax_api(messages, stream=True):
                if chunk.startswith("error:"):
                    yield f"data: {json.dumps({'error': chunk[6:]})}\n\n"
                    return
                full_response += chunk
                yield f"data: {json.dumps({'content': chunk, 'done': False})}\n\n"
            
            # 保存完整回复
            conversations[conversation_id].append({
                'role': 'assistant',
                'content': full_response
            })
            
            yield f"data: {json.dumps({'content': '', 'done': True, 'conversation_id': conversation_id})}\n\n"
        
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            for chunk in loop.run_until_complete(stream_content()):
                yield chunk
        finally:
            loop.close()
    
    return Response(
        stream_with_context(generate()),
        mimetype='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'X-Accel-Buffering': 'no'
        }
    )


@app.route('/api/task/start', methods=['POST'])
def start_task():
    """启动多Agent协作任务"""
    data = request.json
    task = data.get('task', '')
    selected_agents = data.get('agents')  # 可选，指定Agent
    conversation_id = str(uuid.uuid4())
    
    if not task:
        return jsonify({'error': '任务描述不能为空'}), 400
    
    # 分析任务，选择Agent
    if not selected_agents:
        selected_agents = analyze_task_and_select_agents(task)
    
    # 创建任务
    task_id = str(uuid.uuid4())
    tasks[task_id] = {
        'id': task_id,
        'conversation_id': conversation_id,
        'task': task,
        'agents': selected_agents,
        'status': 'running',
        'progress': 0,
        'current_agent': None,
        'startedAt': datetime.now().isoformat(),
        'logs': []
    }
    task_results[task_id] = []
    
    # 初始化对话历史
    conversations[conversation_id] = [
        {'role': 'user', 'content': f"请完成以下任务：{task}"}
    ]
    
    def run_multi_agent_task():
        """在后台线程执行多Agent任务"""
        try:
            # 阶段1: 指挥官分析
            tasks[task_id]['logs'].append({
                'time': datetime.now().isoformat(),
                'agent': 'orchestrator',
                'type': 'info',
                'message': '指挥官开始分析任务...'
            })
            
            orchestrator_messages = [
                {'role': 'system', 'content': SYSTEM_PROMPTS['orchestrator']},
                {'role': 'user', 'content': f"分析以下任务并决定如何调度Agent：\n\n{task}\n\n可用的Agent：{', '.join([AGENTS[a]['name'] for a in selected_agents])}"}
            ]
            
            orchestrator_result = call_minimax_sync(orchestrator_messages)
            task_results[task_id].append({
                'agent': 'orchestrator',
                'role': '指挥官',
                'content': orchestrator_result,
                'timestamp': datetime.now().isoformat()
            })
            tasks[task_id]['logs'].append({
                'time': datetime.now().isoformat(),
                'agent': 'orchestrator',
                'type': 'complete',
                'message': '指挥官分析完成'
            })
            
            # 阶段2: 各Agent执行
            for i, agent_id in enumerate(selected_agents):
                tasks[task_id]['current_agent'] = agent_id
                tasks[task_id]['progress'] = int((i + 0.5) / len(selected_agents) * 100)
                
                agent_info = AGENTS.get(agent_id, {'name': agent_id})
                tasks[task_id]['logs'].append({
                    'time': datetime.now().isoformat(),
                    'agent': agent_id,
                    'type': 'info',
                    'message': f"{agent_info['name']}开始执行任务..."
                })
                
                # 构建Agent任务提示
                context = ""
                if task_results[task_id]:
                    context = "\n\n=== 之前的Agent结果 ===\n" + "\n\n".join([
                        f"**{r['role']}**: {r['content'][:500]}..." if len(r['content']) > 500 else f"**{r['role']}**: {r['content']}"
                        for r in task_results[task_id]
                    ])
                
                agent_messages = [
                    {'role': 'system', 'content': SYSTEM_PROMPTS.get(agent_id, "你是一个AI助手。")},
                    {'role': 'user', 'content': f"任务：{task}\n\n{context}\n\n请完成你的部分任务。"}
                ]
                
                agent_result = call_minimax_sync(agent_messages)
                task_results[task_id].append({
                    'agent': agent_id,
                    'role': agent_info['name'],
                    'content': agent_result,
                    'timestamp': datetime.now().isoformat()
                })
                
                tasks[task_id]['logs'].append({
                    'time': datetime.now().isoformat(),
                    'agent': agent_id,
                    'type': 'complete',
                    'message': f"{agent_info['name']}执行完成"
                })
                tasks[task_id]['progress'] = int((i + 1.5) / len(selected_agents) * 100)
            
            # 阶段3: 整合结果
            tasks[task_id]['logs'].append({
                'time': datetime.now().isoformat(),
                'agent': 'orchestrator',
                'type': 'info',
                'message': '指挥官整合最终结果...'
            })
            
            final_messages = [
                {'role': 'system', 'content': SYSTEM_PROMPTS['orchestrator']},
                {'role': 'user', 'content': f"请整合以下所有Agent的结果，输出最终报告：\n\n任务：{task}\n\n" + "\n\n".join([
                    f"=== {r['role']} 的结果 ===\n{r['content']}"
                    for r in task_results[task_id]
                ])}
            ]
            
            final_result = call_minimax_sync(final_messages)
            task_results[task_id].append({
                'agent': 'orchestrator',
                'role': '最终报告',
                'content': final_result,
                'timestamp': datetime.now().isoformat()
            })
            
            # 更新任务状态
            tasks[task_id]['status'] = 'completed'
            tasks[task_id]['progress'] = 100
            tasks[task_id]['current_agent'] = None
            tasks[task_id]['completedAt'] = datetime.now().isoformat()
            tasks[task_id]['logs'].append({
                'time': datetime.now().isoformat(),
                'agent': 'orchestrator',
                'type': 'complete',
                'message': '任务全部完成！'
            })
            
        except Exception as e:
            tasks[task_id]['status'] = 'error'
            tasks[task_id]['error'] = str(e)
            tasks[task_id]['logs'].append({
                'time': datetime.now().isoformat(),
                'agent': 'system',
                'type': 'error',
                'message': f'执行出错: {str(e)}'
            })
    
    # 启动后台线程
    thread = threading.Thread(target=run_multi_agent_task)
    thread.start()
    
    return jsonify({
        'taskId': task_id,
        'conversationId': conversation_id,
        'agents': selected_agents,
        'agentNames': [AGENTS[a]['name'] for a in selected_agents],
        'status': 'started'
    })


@app.route('/api/task/<task_id>/status', methods=['GET'])
def get_task_status(task_id):
    """获取任务状态"""
    if task_id not in tasks:
        return jsonify({'error': '任务不存在'}), 404
    
    task = tasks[task_id]
    results = task_results.get(task_id, [])
    
    return jsonify({
        'taskId': task_id,
        'task': task['task'],
        'status': task['status'],
        'progress': task['progress'],
        'currentAgent': task.get('current_agent'),
        'agents': task['agents'],
        'agentNames': [AGENTS[a]['name'] for a in task['agents']],
        'results': [
            {
                'agent': r['agent'],
                'role': r['role'],
                'content': r['content'],
                'timestamp': r['timestamp']
            }
            for r in results
        ],
        'logs': task.get('logs', []),
        'startedAt': task['startedAt'],
        'completedAt': task.get('completedAt')
    })


@app.route('/api/task/<task_id>/stream', methods=['GET'])
def task_stream(task_id):
    """流式获取任务状态更新"""
    if task_id not in tasks:
        return jsonify({'error': '任务不存在'}), 404
    
    def generate():
        last_progress = -1
        last_agent = None
        
        while True:
            if task_id not in tasks:
                yield f"data: {json.dumps({'type': 'end'})}\n\n"
                break
            
            task = tasks[task_id]
            
            # 检查是否有新进展
            if task['progress'] != last_progress or task.get('current_agent') != last_agent:
                last_progress = task['progress']
                last_agent = task.get('current_agent')
                
                results = task_results.get(task_id, [])
                current_result = results[-1] if results else None
                
                yield f"data: {json.dumps({
                    'type': 'update',
                    'status': task['status'],
                    'progress': task['progress'],
                    'currentAgent': task.get('current_agent'),
                    'currentResult': current_result,
                    'log': task['logs'][-1] if task.get('logs') else None
                })}\n\n"
            
            # 检查任务是否完成
            if task['status'] in ['completed', 'error']:
                yield f"data: {json.dumps({'type': 'end', 'status': task['status']})}\n\n"
                break
            
            import time
            time.sleep(0.5)
    
    return Response(
        stream_with_context(generate()),
        mimetype='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'X-Accel-Buffering': 'no'
        }
    )


@app.route('/api/task/<task_id>/results', methods=['GET'])
def get_task_results(task_id):
    """获取任务完整结果"""
    if task_id not in tasks:
        return jsonify({'error': '任务不存在'}), 404
    
    results = task_results.get(task_id, [])
    
    return jsonify({
        'taskId': task_id,
        'task': tasks[task_id]['task'],
        'status': tasks[task_id]['status'],
        'results': results
    })


@app.route('/api/tasks', methods=['GET'])
def list_tasks():
    """列出所有任务"""
    return jsonify({
        'tasks': [
            {
                'id': task_id,
                'task': task['task'][:100] + '...' if len(task['task']) > 100 else task['task'],
                'status': task['status'],
                'progress': task['progress'],
                'agents': [AGENTS[a]['name'] for a in task['agents']],
                'startedAt': task['startedAt'],
                'completedAt': task.get('completedAt')
            }
            for task_id, task in sorted(tasks.items(), key=lambda x: x[1]['startedAt'], reverse=True)
        ]
    })


@app.route('/api/conversation/<conversation_id>', methods=['GET'])
def get_conversation(conversation_id):
    """获取对话历史"""
    if conversation_id not in conversations:
        return jsonify({'error': '对话不存在'}), 404
    
    return jsonify({
        'conversationId': conversation_id,
        'messages': conversations[conversation_id]
    })


# ============ 启动服务 ============
if __name__ == '__main__':
    print("=" * 60)
    print("Multi-Agent Command Center - Backend Service")
    print("=" * 60)
    print(f"API: {API_BASE_URL}")
    print(f"Model: {MODEL_NAME}")
    print("-" * 60)
    print("Available Endpoints:")
    print("  - GET  /health                    Health check")
    print("  - GET  /api/models                List models")
    print("  - GET  /api/agents                List all agents")
    print("  - GET  /api/agents/<id>           Get agent info")
    print("  - POST /api/chat                   Single chat")
    print("  - POST /api/chat/stream           Stream chat")
    print("  - POST /api/task/start            Start multi-agent task")
    print("  - GET  /api/task/<id>/status     Get task status")
    print("  - GET  /api/task/<id>/results    Get task results")
    print("  - GET  /api/tasks                 List all tasks")
    print("-" * 60)
    print("Server starting on http://0.0.0.0:3001")
    print("=" * 60)
    
    app.run(host='0.0.0.0', port=3001, debug=False, threaded=True)
