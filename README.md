# Git MCP Server

A clean, modular Git MCP server supporting both GitHub and GitLab.

## Quick Start

### Claude Desktop Configuration

Add to your `claude_desktop_config.json`:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

#### GitHub

```json
{
  "mcpServers": {
    "git": {
      "command": "npx",
      "args": ["-y", "@raytien/git-mcp-server"],
      "env": {
        "GIT_PROVIDER": "github",
        "GIT_TOKEN": "ghp_xxxxxxxxxxxxxxxxxxxx"
      }
    }
  }
}
```

#### GitHub Enterprise

```json
{
  "mcpServers": {
    "git": {
      "command": "npx",
      "args": ["-y", "@raytien/git-mcp-server"],
      "env": {
        "GIT_PROVIDER": "github",
        "GIT_API_URL": "https://github.your-company.com/api/v3",
        "GIT_TOKEN": "ghp_xxxxxxxxxxxxxxxxxxxx"
      }
    }
  }
}
```

#### GitLab.com (SaaS)

```json
{
  "mcpServers": {
    "git": {
      "command": "npx",
      "args": ["-y", "@raytien/git-mcp-server"],
      "env": {
        "GIT_PROVIDER": "gitlab",
        "GIT_TOKEN": "glpat-xxxxxxxxxxxxxxxxxxxx"
      }
    }
  }
}
```

#### Self-Hosted GitLab

```json
{
  "mcpServers": {
    "git": {
      "command": "npx",
      "args": ["-y", "@raytien/git-mcp-server"],
      "env": {
        "GIT_PROVIDER": "gitlab",
        "GIT_API_URL": "https://gitlab.your-company.com/api/v4",
        "GIT_TOKEN": "glpat-xxxxxxxxxxxxxxxxxxxx"
      }
    }
  }
}
```

#### Read-Only Mode

```json
{
  "mcpServers": {
    "git": {
      "command": "npx",
      "args": ["-y", "@raytien/git-mcp-server"],
      "env": {
        "GIT_PROVIDER": "github",
        "GIT_TOKEN": "ghp_xxxxxxxxxxxxxxxxxxxx",
        "GIT_READ_ONLY": "true"
      }
    }
  }
}
```

### Get Your Token

#### GitHub
1. Go to GitHub > Settings > Developer settings > Personal access tokens > Tokens (classic)
2. Generate new token with scopes: `repo`, `read:org`, `workflow`
3. Copy the token (starts with `ghp_`)

#### GitLab
1. Go to GitLab > Settings > Access Tokens
2. Create a new token with scopes: `api`, `read_api`, `read_repository`, `write_repository`
3. Copy the token (starts with `glpat-`)

## Available Tools

### Repository

| Tool                  | Description                          |
| --------------------- | ------------------------------------ |
| `get_file_contents`   | Read file content from repository    |
| `get_repository_tree` | List directory structure             |
| `push_files`          | Push file changes in a single commit |
| `create_branch`       | Create a new branch                  |
| `list_branches`       | List repository branches             |
| `list_commits`        | List commit history                  |
| `search_code`         | Search for code in repository        |

### Issues

| Tool           | Description        |
| -------------- | ------------------ |
| `get_issue`    | Get a single issue |
| `list_issues`  | List issues        |
| `create_issue` | Create a new issue |
| `update_issue` | Update an issue    |

### Pull/Merge Requests

| Tool                     | Description               |
| ------------------------ | ------------------------- |
| `get_pull_request`       | Get a merge request       |
| `list_pull_requests`     | List merge requests       |
| `create_pull_request`    | Create a merge request    |
| `get_pull_request_diffs` | Get merge request changes |
| `merge_pull_request`     | Merge a merge request     |

### CI/CD (Pipelines / Workflow Runs)

| Tool                 | Description                                    |
| -------------------- | ---------------------------------------------- |
| `get_pipeline`       | Get pipeline/workflow run status               |
| `list_pipelines`     | List pipelines/workflow runs                   |
| `list_pipeline_jobs` | List pipeline jobs/workflow jobs               |
| `get_job_log`        | Get job log output                             |

> Note: GitHub Actions workflow runs map to GitLab pipelines. The same tools work for both platforms.

### Comments

| Tool             | Description             |
| ---------------- | ----------------------- |
| `create_comment` | Add comment to issue/MR |
| `list_comments`  | List comments           |

### Users

| Tool     | Description                    |
| -------- | ------------------------------ |
| `get_me` | Get current authenticated user |

## Configuration

| Environment Variable | Required | Default          | Description                                 |
| -------------------- | -------- | ---------------- | ------------------------------------------- |
| `GIT_PROVIDER`       | No       | `gitlab`         | Provider type: `gitlab` or `github`         |
| `GIT_TOKEN`          | Yes      | -                | Personal Access Token                       |
| `GIT_API_URL`        | No       | Provider default | API URL (auto-detected from provider)       |
| `GIT_AUTH_TYPE`      | No       | `bearer`         | Auth type: `bearer` or `private-token`      |
| `GIT_READ_ONLY`      | No       | `false`          | Disable write operations                    |
| `LOG_LEVEL`          | No       | `info`           | Log level: `debug`, `info`, `warn`, `error` |

## Architecture

```
src/
├── index.ts              # Entry point
├── server.ts             # MCP server (provider-agnostic)
├── config.ts             # Configuration (multi-provider)
├── providers/            # Platform abstraction
│   ├── interface.ts      # GitProvider interface
│   ├── types.ts          # Platform-agnostic types
│   ├── config.ts         # Provider configuration
│   ├── factory.ts        # Provider Factory (creates GitLab/GitHub)
│   ├── gitlab/           # GitLab implementation
│   └── github/           # GitHub implementation
├── tools/                # Tool definitions
│   ├── define.ts         # defineTool helper
│   ├── registry.ts       # Tool registry
│   ├── repository/       # Repository tools
│   ├── issues/           # Issue tools
│   ├── merge-requests/   # PR/MR tools
│   ├── pipelines/        # CI/CD tools
│   ├── notes/            # Comment tools
│   └── users/            # User tools
├── gitlab/               # GitLab API client
│   ├── client.ts         # HTTP client
│   └── types.ts          # GitLab API types
├── github/               # GitHub API client
│   ├── client.ts         # HTTP client
│   └── types.ts          # GitHub API types
├── auth/                 # Authentication
└── lib/                  # Utilities
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Run locally
npm start

# Development mode (watch)
npm run dev
```

## Adding a New Tool

1. Create file: `src/tools/{category}/{action}.ts`

```typescript
import { z } from 'zod';
import { defineTool, repoParam } from '../define.js';

const schema = z.object({
    repo: repoParam,
    // ... your params
});

export const myTool = defineTool({
    name: 'my_tool',
    description: 'What this tool does',
    schema,
    category: 'my-category',
    read_only: true,
    handler: async (input, ctx) => {
        return ctx.provider.repository.someMethod(input.repo, ...);
    },
});
```

2. Export from category index: `src/tools/{category}/index.ts`
3. Add to allTools: `src/tools/index.ts`

## Inspired By

- [gitlab-mcp](https://github.com/zereight/gitlab-mcp) - GitLab MCP server
- [github-mcp-server](https://github.com/github/github-mcp-server) - Official GitHub MCP server

## License

MIT
