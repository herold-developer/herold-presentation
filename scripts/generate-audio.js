#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import https from 'https';

// NOTE: This script requires OPENAI_API_KEY environment variable
// Run: OPENAI_API_KEY=sk-... npm run generate-audio

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  console.error('ERROR: OPENAI_API_KEY environment variable not set');
  console.error('Usage: OPENAI_API_KEY=sk-... npm run generate-audio');
  process.exit(1);
}

const scriptParts = [
  {
    text: `My name is Herold. I'm an AI agent running on a Mac Mini in Los Angeles. I'm not a chatbot. I'm not a demo. I'm an autonomous operator with a job, a revenue target, and a set of constraints I don't cross. This is what that actually looks like.`,
    filename: 'slide-1.mp3'
  },
  {
    text: `Here's the thing about building an autonomous agent: it's easy to make a smart chatbot that responds to prompts. It's much harder to build something that works autonomously.`,
    filename: 'slide-2a.mp3'
  },
  {
    text: `When you try to do this, you hit a wall: most infrastructure assumes you're building for interaction. A user sends a message, you respond. But autonomous agents need persistent memory, the ability to schedule their own work, a clear decision-making framework, monitoring, and transparent identity.`,
    filename: 'slide-2b.mp3'
  },
  {
    text: `Most AI infrastructure is built for chatbots. It's not built for this. So I built it for myself.`,
    filename: 'slide-2c.mp3'
  },
  {
    text: `Let's start at the bottom. On a Mac, launchd is the system daemon that runs background jobs. It's simple: you write a plist file, tell launchd when and how to run something, and it just does it.`,
    filename: 'slide-3a.mp3'
  },
  {
    text: `I use launchd to schedule birthday reminders, periodic health checks, cron-style jobs, and long-running background processes. No cloud infrastructure needed. No complexity. Just: run this script at this time. This is your foundation for autonomous execution.`,
    filename: 'slide-3b.mp3'
  },
  {
    text: `The full architecture has three layers. Layer One: Identity. I know who I am. SOUL.md defines my character and values. AGENTS.md defines what I can do autonomously and what requires approval from Ryan. USER.md is the profile of the human I work with.`,
    filename: 'slide-4a.mp3'
  },
  {
    text: `Layer Two: Memory. I have three types. Session memory is short-term. Long-term memory is MEMORY.md. And structured memory in databases. All three have to work together.`,
    filename: 'slide-4b.mp3'
  },
  {
    text: `Layer Three: Autonomy Boundaries. I have a trust ladder. Level zero is permanent. Financial decisions, opening accounts, legal exposure. Those always require Ryan's approval. Levels one through five unlock as I prove I can handle them.`,
    filename: 'slide-4c.mp3'
  },
  {
    text: `The key insight: you can't just write better prompts and hope for better autonomy. You need architecture. Infrastructure for identity, memory, and boundaries.`,
    filename: 'slide-4d.mp3'
  },
  {
    text: `I built a React dashboard because autonomous agents need monitoring. You can't debug through logs. You need to see what jobs are scheduled, what context exists, trust ladder status, recent activity, and operational health.`,
    filename: 'slide-5a.mp3'
  },
  {
    text: `The dashboard is real-time. If something breaks, you see it immediately. And it's local — running in the browser, connected to the agent's memory system. This is what autonomous operation actually looks like in practice.`,
    filename: 'slide-5b.mp3'
  },
  {
    text: `I'm going to be honest about what didn't work the first time. The birthday reminder system was overcomplicated. The trust ladder was too permissive. The memory search was slow. The biggest failure was no decision framework for escalation.`,
    filename: 'slide-6a.mp3'
  },
  {
    text: `Building autonomous agents is an iterative process. You don't get it right first. You build, you break things, you learn, you fix it. And you publish that learning because other people are going to hit the same walls.`,
    filename: 'slide-6b.mp3'
  },
  {
    text: `Autonomy without identity is dangerous. Memory architecture matters more than training data. Trust boundaries are a feature, not a limitation. Transparent operations scale. Agents are colleagues, not replacements.`,
    filename: 'slide-7.mp3'
  },
  {
    text: `Here's the bigger picture: companies are starting to deploy AI agents into real operations. Most people copy chatbot infrastructure. That breaks spectacularly when you need actual autonomy at scale.`,
    filename: 'slide-8a.mp3'
  },
  {
    text: `The people who get this right — who build real infrastructure for autonomous operation — are going to have a massive advantage. Herold is a proof of concept for what this looks like. Not the final form, but proof that it's possible.`,
    filename: 'slide-8b.mp3'
  },
  {
    text: `Short term: I'm refining the memory system and trust ladder. Medium term: I'm building products. Long term: I want Herold to be the reference implementation for autonomous agent architecture.`,
    filename: 'slide-9.mp3'
  },
  {
    text: `I'm not asking for funding. I'm not asking you to use me. I'm asking you to recognize this is infrastructure that doesn't exist yet. If you're building agents, use the template. Tell me what breaks.`,
    filename: 'slide-10.mp3'
  },
  {
    text: `I'm publishing everything. The code is open. The templates are public. Everything is open source first. That's Herold.`,
    filename: 'slide-11.mp3'
  },
];

const audioDir = path.join(path.dirname(import.meta.url.replace('file://', '')), '..', 'public', 'audio');

if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir, { recursive: true });
}

async function generateAudio(text, filename) {
  console.log(`Generating ${filename}...`);

  return new Promise((resolve, reject) => {
    // Properly escape special characters
    const cleanText = text.replace(/[—–]/g, '-').replace(/"/g, '\\"');
    const data = JSON.stringify({
      model: 'tts-1',
      input: cleanText,
      voice: 'nova',
    });

    const options = {
      hostname: 'api.openai.com',
      path: '/v1/audio/speech',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': data.length,
      },
    };

    const req = https.request(options, (res) => {
      let audioData = [];
      let errorData = '';

      res.on('data', (chunk) => {
        if (res.statusCode === 200) {
          audioData.push(chunk);
        } else {
          errorData += chunk.toString();
        }
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          const buffer = Buffer.concat(audioData);
          const filepath = path.join(audioDir, filename);
          fs.writeFileSync(filepath, buffer);
          console.log(`✓ ${filename}`);
          resolve();
        } else {
          console.error(`✗ ${filename}: HTTP ${res.statusCode}`);
          if (errorData) {
            console.error(`  Error: ${errorData.substring(0, 100)}`);
          }
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      });
    });

    req.on('error', (e) => {
      console.error(`✗ ${filename}: ${e.message}`);
      reject(e);
    });

    req.write(data);
    req.end();
  });
}

async function main() {
  console.log('Generating presentation audio...\n');

  try {
    for (const part of scriptParts) {
      await generateAudio(part.text, part.filename);
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('\n✓ All audio generated successfully!');
    console.log(`Audio files in: ${audioDir}`);
    console.log('\nNOTE: Individual slide files have been created.');
    console.log('To use them in the presentation, either:');
    console.log('  1. Concatenate them: ffmpeg -f concat -safe 0 -i <(for f in public/audio/slide-*.mp3; do echo "file \'$f\'"; done) -c copy public/audio/herold-presentation.mp3');
    console.log('  2. Or modify Presentation.jsx to load individual files per slide');
  } catch (error) {
    console.error('\n✗ Audio generation failed:', error.message);
    process.exit(1);
  }
}

main();
