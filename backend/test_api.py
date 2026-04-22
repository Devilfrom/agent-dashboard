# -*- coding: utf-8 -*-
"""测试后端API"""
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

import requests
import json

BASE_URL = "http://localhost:3001"

def test_health():
    """测试健康检查"""
    print("1. Testing Health Check...")
    response = requests.get(f"{BASE_URL}/health")
    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.json()}")
    return response.status_code == 200

def test_agents():
    """测试列出Agent"""
    print("\n2. Testing List Agents...")
    response = requests.get(f"{BASE_URL}/api/agents")
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        agents = response.json().get('agents', [])
        for agent in agents:
            print(f"   - {agent['name']} ({agent['role']})")
    return response.status_code == 200

def test_chat():
    """测试Chat API"""
    print("\n3. Testing Chat API...")
    data = {"message": "你好，请用一句话介绍自己"}
    response = requests.post(f"{BASE_URL}/api/chat", json=data)
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        result = response.json()
        print(f"   Message: {result.get('message', '')[:200]}...")
    else:
        print(f"   Error: {response.text}")
    return response.status_code == 200

def test_start_task():
    """测试启动任务"""
    print("\n4. Testing Start Task...")
    data = {"task": "帮我写一个Python的快速排序算法"}
    response = requests.post(f"{BASE_URL}/api/task/start", json=data, timeout=10)
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        result = response.json()
        print(f"   Task ID: {result.get('taskId')}")
        print(f"   Agents: {result.get('agents')}")
        return result.get('taskId')
    else:
        print(f"   Error: {response.text}")
    return None

def test_task_status(task_id):
    """测试获取任务状态"""
    print(f"\n5. Testing Get Task Status ({task_id})...")
    response = requests.get(f"{BASE_URL}/api/task/{task_id}/status")
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        result = response.json()
        print(f"   Status: {result.get('status')}")
        print(f"   Progress: {result.get('progress')}%")
        print(f"   Results: {len(result.get('results', []))}")
    return response.status_code == 200

if __name__ == "__main__":
    print("=" * 60)
    print("Multi-Agent Backend API Test")
    print("=" * 60)
    
    # 测试健康检查
    if not test_health():
        print("\n❌ Health check failed, exiting...")
        sys.exit(1)
    
    # 测试列出Agent
    test_agents()
    
    # 测试Chat
    test_chat()
    
    # 测试启动任务
    task_id = test_start_task()
    if task_id:
        # 等待任务完成
        print("\n   Waiting for task to complete...")
        import time
        for i in range(30):
            time.sleep(2)
            response = requests.get(f"{BASE_URL}/api/task/{task_id}/status")
            if response.status_code == 200:
                result = response.json()
                print(f"   Progress: {result.get('progress')}% - Status: {result.get('status')}")
                if result.get('status') in ['completed', 'error']:
                    # 获取完整结果
                    response = requests.get(f"{BASE_URL}/api/task/{task_id}/results")
                    if response.status_code == 200:
                        results = response.json().get('results', [])
                        print(f"\n   Total Results: {len(results)}")
                        for r in results:
                            print(f"\n   === {r['role']} ===")
                            print(f"   {r['content'][:300]}...")
                    break
        else:
            print("   Task timed out")
    
    print("\n" + "=" * 60)
    print("Test Complete!")
    print("=" * 60)
