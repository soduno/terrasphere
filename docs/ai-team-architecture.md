# AI Developer Team — Architecture Plan

## Vision

Et AI-udviklerteam orkestreret via Slack, GitHub og opencode:

- **UX Agent** → skaber detaljerede GitHub Issues fra højniveau feature-beskrivelser
- **Dev Agent(s)** → implementerer issues når de flyttes til "In Progress"
- **Interaktiv** → agenten stiller spørgsmål undervejs (ikke one-shot), du svarer via Slack

---

## Workflow

```
Du: "Build menus like WordPress" i Slack
    │
    ▼
UX Agent → skaber GitHub Issue #42 med detaljeret spec
    │
Du → flytter issue til "In Progress" i GitHub Projects
    │
    ▼ (webhook)
GitHub Actions → opencode serve → SDK session
    │
Dev Agent → læser issue → implementerer
    │
Har spørgsmål? → poster i Slack
    │
Du svarer i Slack tråd → agent fortsætter
    │
    ▼
Åbner PR → poster link i Slack
    │
Du reviewer & merger
```

---

## Teknisk arkitektur

```
┌─────────────────────────────────────────────┐
│           VPS / GitHub Actions              │
│                                             │
│  ┌────────────┐    ┌──────────────────┐    │
│  │ opencode   │◄───│  Orchestrator    │    │
│  │ serve      │    │  (Node.js)       │    │
│  │ :4096      │    │                  │    │
│  └────────────┘    │  • SDK sessions  │    │
│                    │  • Slack listener │    │
│                    │  • GitHub API     │    │
│                    └───┬──────────┬────┘    │
│                        │          │         │
└────────────────────────┼──────────┼─────────┘
                         │          │
                    Slack Bot   GitHub API
                         │          │
                    💬 #dev     Issues/PRs
```

---

## Komponenter

### 1. Custom opencode agents (`.opencode/agents/`)

```bash
opencode agent create --path .opencode/agents/ux-designer.md \
  --description "Creates detailed GitHub Issues from feature requests" \
  --mode subagent

opencode agent create --path .opencode/agents/dev-backend.md \
  --description "Implements backend features from GitHub Issues" \
  --mode subagent \
  --permissions bash,read,edit,glob,grep,webfetch,task
```

Hver agent har en specifik system-prompt der definerer dens rolle, output-format, og hvordan den kommunikerer.

### 2. Orchestrator (Node.js service)

- `opencode serve` kører i baggrunden (headless HTTP server på port 4096)
- Bruger `@opencode-ai/sdk` til session management:
  - `client.session.create()` — opret ny session
  - `client.session.prompt()` — send prompt/issue
  - `client.session.messages()` — læs svar
- Slack Bolt til Slack-integration
- GitHub API (`gh` CLI) til Issues og PRs
- **State machine**: venter på svar fra dig før den sender videre til sessionen

### 3. GitHub Actions workflow

```yaml
# .github/workflows/ai-build.yml
on:
  project_card:
    types: [moved]
  issue_comment:
    types: [created]

jobs:
  build:
    if: ${{ trigger == 'in-progress' || trigger == 'comment' }}
    steps:
      - run: opencode run --agent dev-backend "$ISSUE_BODY"
```

---

## Simpel MVP (uden Slack, kun GitHub)

**Trin 1**: Opret issue → flyt til "In Progress"

**Trin 2**: GitHub Action trigger:
```bash
opencode run --auto "Implement GitHub issue #$ISSUE_NUMBER.
If you have questions, post them as comments on the issue using: gh issue comment $ISSUE_NUMBER --body '...'"
```

**Trin 3**: Du svarer i issue-kommentar

**Trin 4**: Ny GitHub Action trigger på kommentar:
```bash
opencode run --continue "User replied: $(gh issue view $ISSUE_NUMBER --json comments)"
```

**Trin 5**: Agent åbner PR → `gh pr create`

Fordel: ingen Slack Bot, ingen orchestrator — kun GitHub Actions + `opencode run`

---

## Værktøjer

| Værktøj | URL |
|---------|-----|
| opencode CLI | `opencode run --help` |
| opencode SDK | `npm install @opencode-ai/sdk` |
| GitHub Issues | `gh issue ...` |
| GitHub Projects webhooks | GitHub Actions `project_card` event |
| Slack Bolt | `npm install @slack/bolt` |

---

## Begrænsninger

- opencode kan ikke køre som daemon — `opencode serve` + SDK giver HTTP API
- Slack kan't kalde opencode direkte — mellemliggende service nødvendig
- GitHub Projects webhooks er begrænsede — brug labels som trigger i stedet (`ready-to-build`)

---

## Token-forbrug

Sammenligneligt med at chatte direkte med opencode. Sessionen kører i `opencode serve` og forbruger tokens på samme måde som en interaktiv TUI-session. Ingen signifikant overhead.
