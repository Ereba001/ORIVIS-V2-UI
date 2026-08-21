---
name: context-management
description: Use for monitoring context token usage, saving work checkpoints, and managing long session continuity. Trigger on phrases like "context", "checkpoint", "token", "session", "save progress", "compaction", or when you sense message count is high.
---

# Context Management

## Purpose
Prevent loss of work due to context token limits during long development sessions on ORIVIS V2.

## How It Works
- A local MCP server (`context-watch`) tracks session state
- Built-in opencode compaction auto-compresses old context
- This skill reminds you to proactively manage context before it becomes critical

## Signs You're Approaching Context Limits
- This file was loaded as a skill (means you're in a long session)
- Response times feel slower
- Earlier parts of the conversation are being summarized
- You've been working for 30+ message exchanges

## Context Management Protocol

### Every 15-20 messages (or at phase completion):
1. Call `session_status` on the context-watch MCP server to check message count
2. If count > 30: Run `save_checkpoint` with current phase and summary
3. Request opencode compaction if available

### When Starting a New Work Phase:
1. Call `set_phase` with the new phase name
2. Review the last checkpoint via `get_checkpoints` to pick up where you left off

### If Context Drops Mid-Task:
1. Call `get_checkpoints` to see last saved state
2. Read the last checkpoint summary
3. Call `set_phase` to restore your phase context
4. Continue from the next steps listed in the checkpoint

### At End of Session:
1. Call `save_checkpoint` with final summary
2. Note that checkpoints persist in `.context-session.json`
