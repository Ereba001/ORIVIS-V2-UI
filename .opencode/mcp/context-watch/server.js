const fs = require('fs');
const path = require('path');

const SESSION_FILE = path.join(__dirname, '..', '..', '..', '.context-session.json');

function ensureSession() {
  if (!fs.existsSync(SESSION_FILE)) {
    fs.writeFileSync(SESSION_FILE, JSON.stringify({
      startedAt: new Date().toISOString(),
      messageCount: 0,
      currentPhase: null,
      lastCheckpoint: null,
      checkpoints: [],
      warnings: []
    }, null, 2));
  }
}

function readSession() {
  ensureSession();
  return JSON.parse(fs.readFileSync(SESSION_FILE, 'utf8'));
}

function writeSession(data) {
  fs.writeFileSync(SESSION_FILE, JSON.stringify(data, null, 2));
}

function send(id, result) {
  process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, result }) + '\n');
}

function sendError(id, code, message) {
  process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, error: { code, message } }) + '\n');
}

let buffer = '';
let msgId = 0;

process.stdin.on('data', (chunk) => {
  buffer += chunk.toString();

  const lines = buffer.split('\n');
  buffer = lines.pop() || '';

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    let msg;
    try {
      msg = JSON.parse(trimmed);
    } catch {
      continue;
    }

    const id = msg.id;

    try {
      switch (msg.method) {
        case 'initialize':
          send(id, {
            protocolVersion: '2024-11-05',
            capabilities: { tools: {} },
            serverInfo: { name: 'context-watch', version: '1.0.0' }
          });
          break;

        case 'notifications/initialized':
          break;

        case 'tools/list':
          send(id, {
            tools: [
              {
                name: 'session_status',
                description: 'Check current session status: message count, running time, current phase, and warnings about context usage.',
                inputSchema: { type: 'object', properties: {} }
              },
              {
                name: 'save_checkpoint',
                description: 'Save a progress checkpoint. Run before context potentially drops.',
                inputSchema: {
                  type: 'object',
                  properties: {
                    phase: { type: 'string', description: 'Current work phase name' },
                    summary: { type: 'string', description: 'What was accomplished' },
                    filesChanged: { type: 'array', items: { type: 'string' } },
                    nextSteps: { type: 'array', items: { type: 'string' } }
                  },
                  required: ['phase', 'summary']
                }
              },
              {
                name: 'set_phase',
                description: 'Update the current work phase name.',
                inputSchema: {
                  type: 'object',
                  properties: { phase: { type: 'string' } },
                  required: ['phase']
                }
              },
              {
                name: 'get_checkpoints',
                description: 'List all saved checkpoints from this session.',
                inputSchema: { type: 'object', properties: {} }
              }
            ]
          });
          break;

        case 'tools/call': {
          const args = msg.params.arguments || {};
          switch (msg.params.name) {
            case 'session_status': {
              const s = readSession();
              s.messageCount++;
              writeSession(s);
              const mins = Math.floor((Date.now() - new Date(s.startedAt).getTime()) / 60000);
              let tip = 'Session healthy.';
              if (s.messageCount > 50) tip = 'HIGH MESSAGE COUNT. Save a checkpoint and request compaction.';
              else if (s.messageCount > 30) tip = 'Message count growing. Consider saving a checkpoint.';
              send(id, {
                content: [{
                  type: 'text',
                  text: JSON.stringify({
                    status: 'ok',
                    runningMinutes: mins,
                    messageCount: s.messageCount,
                    currentPhase: s.currentPhase,
                    lastCheckpoint: s.lastCheckpoint,
                    checkpointCount: s.checkpoints.length,
                    warnings: s.warnings,
                    tip
                  }, null, 2)
                }]
              });
              break;
            }
            case 'save_checkpoint': {
              const s = readSession();
              const cp = {
                id: s.checkpoints.length + 1,
                timestamp: new Date().toISOString(),
                phase: args.phase || s.currentPhase,
                summary: args.summary || 'No summary',
                filesChanged: args.filesChanged || [],
                nextSteps: args.nextSteps || []
              };
              s.checkpoints.push(cp);
              s.lastCheckpoint = cp.timestamp;
              s.currentPhase = args.phase || s.currentPhase;
              writeSession(s);
              send(id, {
                content: [{ type: 'text', text: JSON.stringify({ status: 'saved', checkpoint: cp, total: s.checkpoints.length }, null, 2) }]
              });
              break;
            }
            case 'set_phase': {
              const s = readSession();
              s.currentPhase = args.phase || 'unknown';
              writeSession(s);
              send(id, {
                content: [{ type: 'text', text: JSON.stringify({ status: 'ok', currentPhase: s.currentPhase }) }]
              });
              break;
            }
            case 'get_checkpoints': {
              const s = readSession();
              send(id, {
                content: [{ type: 'text', text: JSON.stringify({ checkpoints: s.checkpoints, lastCheckpoint: s.lastCheckpoint }, null, 2) }]
              });
              break;
            }
            default:
              sendError(id, -32601, `Unknown tool: ${msg.params.name}`);
          }
          break;
        }
        default:
          sendError(id, -32601, `Unknown method: ${msg.method}`);
      }
    } catch (err) {
      sendError(id, -32603, err.message);
    }
  }
});

process.stdin.on('end', () => process.exit(0));
