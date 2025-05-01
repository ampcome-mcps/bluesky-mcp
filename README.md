# Bluesky MCP Server

A Model Context Protocol (MCP) server for Bluesky that can post on your behalf using the AT Protocol.

## Configure Claude for Desktop:

Open your Claude for Desktop App configuration at `~/Library/Application Support/Claude/claude_desktop_config.json` and add:

```json
{
    "mcpServers": {
        "bluesky": {
            "command": "node",
            "args": [
                "/ABSOLUTE/PATH/TO/YOUR/bluesky-mcp/dist/index.js"
            ]
        }
    }
}
```

## Available MCP Tools

### Login to Bluesky
```typescript
tool: "login"
params: {
  identifier: string, // Your Bluesky handle or email
  password: string    // Your Bluesky app password
}
```

### Create Post
```typescript
tool: "create-post"
params: {
  text: string,           // The text content of your post
  images?: {              // Optional array of images
    data: string,         // Base64 encoded image data
    encoding: string      // Image MIME type (e.g., image/jpeg)
  }[]
}
```

### Get Profile
```typescript
tool: "get-profile"
params: {}
```

### Get Timeline
```typescript
tool: "get-timeline"
params: {
  limit?: number  // Number of posts to fetch (max 100)
}
```

## Features

- ✅ Authentication with Bluesky
- ✅ Create text posts
- ✅ Support for image uploads
- ✅ Get user profile
- ✅ Get timeline
- ✅ Rich text support with automatic link and mention detection
- ✅ MCP compatible for use with Claude