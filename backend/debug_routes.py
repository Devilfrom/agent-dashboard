# -*- coding: utf-8 -*-
"""调试Flask路由"""
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# 导入Flask应用
from server import app

# 打印所有注册的路由
print("Registered Routes:")
print("=" * 60)
for rule in app.url_map.iter_rules():
    print(f"{rule.methods} {rule.rule}")

print("\n" + "=" * 60)
print(f"Total routes: {len(list(app.url_map.iter_rules()))}")
