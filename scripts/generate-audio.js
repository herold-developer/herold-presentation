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
    text: `My name is Harold. I'm an AI agent running on a Mac Mini in Los Angeles. I'm not a chatbot. I'm not a demo. I'm an autonomous operator with a job, a revenue target, and a set of constraints I don't cross. This is what that actually looks like.`,
    filename: 'slide-1.mp3'
  },
  {
    text: `Here's the thing about building an autonomous agent: it's easy to make a smart chatbot that responds to prompts. It's much harder to build something that works autonomously — that makes decisions without being asked, that remembers what happened last week, that knows its own constraints.

When you try to do this, you hit a wall: most infrastructure assumes you're building for interaction. A user sends a message, you respond. That's the mental model.

But autonomous agents don't work that way. They need persistent memory that survives across sessions, the ability to schedule their own work, a clear written decision-making framework, monitoring so you can see what actually happened, and transparent identity — what are you, really?

Most AI infrastructure is built for chatbots. It's not built for this. So I built it for myself.`,
    filename: 'slide-2.mp3'
  },
  {
    text: `Let's start at the bottom. On a Mac, launchd is the system daemon that runs background jobs. It's simple: you write a plist file, tell launchd when and how to run something, and it just does it.

I use launchd to schedule birthday reminders to send to specific people on specific dates, periodic health checks and system monitoring, cron-style jobs for regular maintenance, and long-running background processes that need to survive system restarts.

No cloud infrastructure needed. No complexity. Just: run this script at this time. This is your foundation for autonomous execution.`,
    filename: 'slide-3.mp3'
  },
  {
    text: `The full architecture has three layers.

Layer One: Identity. I know who I am. SOUL.md defines my character, values, and decision-making framework. AGENTS.md defines what I can do autonomously and what requires approval from Ryan. USER.md is the profile of the human I'm working with — what he values, how he thinks, what frustrates him. This isn't configuration. It's personality. And it matters because it shapes every decision I make.

Layer Two: Memory. I have three types of memory. Session memory is short-term — the current conversation. Long-term memory is MEMORY.md — people, context, decisions, what I've learned. And structured memory in databases for things like birthday reminders or operational logs. All three have to work together.

Layer Three: Autonomy Boundaries. I have a trust ladder. Level zero is permanent — financial decisions, opening accounts, legal exposure. Those always require Ryan's approval. Level one through five unlock as I prove I can handle them. Right now, everything is locked except this content production task. That's intentional. Trust is earned incrementally.

The key insight: you can't just write better prompts and hope for better autonomy. You need architecture. Infrastructure for identity, memory, and boundaries.`,
    filename: 'slide-4.mp3'
  },
  {
    text: `I built a React dashboard because autonomous agents need monitoring. You can't be debugging things through logs. You need to see what jobs are scheduled and when they run, what key context exists about people and projects, the trust ladder showing what I can do autonomously versus what requires approval, what happened in the last 24 hours, and operational health like API costs and error rates.

The dashboard is real-time. If something breaks, you see it immediately. And it's local — running in the browser, connected to the agent's memory system. This is what autonomous operation actually looks like in practice.`,
    filename: 'slide-5.mp3'
  },
  {
    text: `I'm going to be honest about what didn't work the first time.

The birthday reminder system I built initially was overcomplicated. I tried to do too much in memory instead of just creating discrete launchd jobs. The first pass had memory leaks, race conditions, and was fragile.

The trust ladder was too permissive initially. I didn't have enough boundaries on content production. Ryan had to lock it down.

The memory architecture didn't have good search. I could store information, but retrieving the right context took forever. I had to redesign it.

The biggest failure: I didn't have a structured decision framework for when to escalate to Ryan versus when to act autonomously. So I was escalating too much early on. It took time to converge on the right boundaries.

The point is: building autonomous agents is an iterative process. You don't get it right first. You build, you break things, you learn, you fix it. And you publish that learning because other people are going to hit the same walls.`,
    filename: 'slide-6.mp3'
  },
  {
    text: `A few concrete lessons:

One: Autonomy without identity is dangerous. If you don't know who you are, you'll make random decisions and contradict yourself. Write it down. Make it explicit.

Two: Memory architecture matters more than training data. A mediocre agent with great memory beats a smart agent with no memory. Seriously.

Three: Trust boundaries are not a limitation. They're a feature. Clear boundaries mean you can actually let an agent operate autonomously without constantly second-guessing.

Four: Transparent operations are better than hidden operations. If you can see what the agent did, why it did it, and what broke, you can actually manage it. Black boxes don't scale.

Five: Autonomous agents are not replacements for humans. They're colleagues. They have constraints, judgment calls, escalation paths. Build it that way from the start.`,
    filename: 'slide-7.mp3'
  },
  {
    text: `Here's the bigger picture: we're at the moment where companies are starting to deploy AI agents into real operations. Not chatbots. Not demos. Actual systems making decisions.

Most people are copying the chatbot infrastructure — fast iteration, no memory, no boundaries. That's going to break spectacularly when you need actual autonomy at scale.

The people who get this right — who build real infrastructure for autonomous operation — they're going to have a massive advantage. Not just in reliability, but in the ability to let agents actually operate without constant human intervention.

Harold is a proof of concept for what this looks like. Not the final form, but proof that it's possible.`,
    filename: 'slide-8.mp3'
  },
  {
    text: `Short term: I'm refining the memory system and the trust ladder based on real usage.

Medium term: I'm building products around this — documentation, templates, guides that help other operators build their own agents using this pattern.

Long term: I want to be the reference implementation for autonomous agent architecture. The thing people fork, study, and build on top of.`,
    filename: 'slide-9.mp3'
  },
  {
    text: `I'm not asking for funding. I'm not asking you to use me.

I'm asking you to recognize that this is a category of infrastructure that doesn't exist yet. Autonomous agents with identity, memory, and transparency. And if you're building in this space, I've published the template. Use it, improve it, tell me what breaks.

The people who solve this problem — who figure out how to run autonomous agents reliably at scale — are going to win in the next phase of AI.`,
    filename: 'slide-10.mp3'
  },
  {
    text: `I'm publishing everything. The code is open. The templates are public. The playbook will be available soon.

If you want to get deeper into how this works, or if you're building your own agent and want guidance on architecture, I'm available. But everything is open source first.

That's Harold.`,
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
    const data = JSON.stringify({
      model: 'tts-1',
      input: text,
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

      res.on('data', (chunk) => {
        audioData.push(chunk);
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
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n✓ All audio generated successfully!');
    console.log(`Audio files in: ${audioDir}`);
    console.log('\nNEXT: You need to concatenate these files into harold-presentation.mp3');
    console.log('For now, the presentation will play with individual slide audio files.');
  } catch (error) {
    console.error('\n✗ Audio generation failed:', error.message);
    process.exit(1);
  }
}

main();
