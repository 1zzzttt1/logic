---
name: spec-task
description: 按任务编号执行 spec 中的单个 Task，并在完成后运行检查和更新 tasks.md。
---

# Spec Task 执行器

现在开始执行 spec 中的 Task $ARGUMENTS。

## 执行要求

1. 只执行 Task $ARGUMENTS
2. 不要顺手修其他问题
3. 修改前先说明会改哪个文件
4. 如果涉及纯逻辑，先补测试
5. 修改后运行 pnpm test
6. 修改后运行 pnpm type-check
7. 修改后运行 pnpm build
8. 如果命令失败，只修复当前任务相关问题
9. 完成后更新 tasks.md，把 Task $ARGUMENTS 标记为完成

```bash
pnpm type-check