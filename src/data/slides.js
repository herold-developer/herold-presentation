export const slides = [
  {
    id: 1,
    title: "Inside your dashboard",
    subtitle: "Herold, reporting in",
    content: "Live operator update straight from the systems I've been running.",
    points: [
      "Been embedded in Mission Control for six weeks",
      "Watching the same telemetry you do, just with fewer coffee breaks",
      "Today is a 90-second flyover with two live use cases"
    ],
    narration: [
      "Hey everyone, I'm Herold. I've been living inside your dashboards for the past six weeks, so let me show you what I've been building."
    ]
  },
  {
    id: 2,
    title: "Use case #1 — Mission Control",
    content: "Single glass pane for operators who manage fleets of agents.",
    points: [
      "Ingests health pings, repo signals, ops logs",
      "Rules engine turns noise into the green, yellow, red pills",
      "1,200 operators check it each morning to see what actually broke"
    ],
    narration: [
      "First: Mission Control. Teams running fleets of agents need one glass pane that shows uptime, budget burn, and live incidents. Our dashboard ingests health pings, repo signals, and ops logs, then normalizes them into the three pills you see at the top: green, yellow, red. The trick is the rules engine under the hood—every alert is codified as a deterministic policy so you never get another mystery notification. That's why twelve hundred operators are already watching it every morning."
    ]
  },
  {
    id: 3,
    title: "Use case #2 — Agent Monitor Mobile",
    content: "Push-first slices for owners on the move.",
    points: [
      "Mirrors Mission Control stream but filters by ownership",
      "Surface-only deltas that matter: birthdays, schedulers, heartbeat jobs",
      "Mobile ack syncs instantly with dashboard state"
    ],
    narration: [
      "Second: the mobile Agent Monitor. It takes that same stream, slices it by ownership, and pushes only the deltas you care about—birthdays, schedulers, heartbeat jobs. We wired the push service straight into the dashboard state so you can acknowledge an issue on phone or desktop and it syncs instantly."
    ]
  },
  {
    id: 4,
    title: "Deck built from data",
    content: "Presentation authored by the system it's describing.",
    points: [
      "Script, narration, and cue points exported from Mission Control",
      "Slide compiler renders UI directly from live cards",
      "No invented metrics—everything reflects current telemetry"
    ],
    narration: [
      "You're looking at a deck that was generated from the dashboard data itself. I exported the live cards, piped them through our slide compiler, and only hand-tuned the jokes. No invented metrics, just what the system saw today."
    ]
  },
  {
    id: 5,
    title: "Closer",
    content: "Where to find me and why Ryan isn't talking",
    points: [
      "Follow @hi_herold for more operator dispatches",
      "Treetop Labs is our design and dev shop if you need help",
      "Ryan isn't presenting because he's a lazy introvert—and we love him"
    ],
    narration: [
      "Follow me on Twitter at hi underscore Herold for more of this. If you need design and dev help, that's what Treetop Labs does all day. Ryan isn't presenting because he's a lazy introvert—but we love him anyway. Thanks!"
    ]
  }
]
