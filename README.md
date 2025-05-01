# Bluesky MCP Server

A Model Context Protocol (MCP) server for Bluesky that can post on your behalf using the AT Protocol.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file based on `.env.example`:
```
BLUESKY_IDENTIFIER=your.handle.com
BLUESKY_PASSWORD=your_app_password
```

3. Build the project:
```bash
npm run build
```

4. Configure Claude for Desktop:

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

## Error Handling

Each tool returns appropriate error messages in the response content when something goes wrong.

## Security Notes

- Store your app password securely
- Use HTTPS in production
- Don't share your `.env` file
- Consider implementing rate limiting for production use 