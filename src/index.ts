import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { BlueskyClient } from './blueskyClient.js';
import dotenv from 'dotenv';

dotenv.config();

const client = new BlueskyClient();

const server = new McpServer({
  name: "bluesky-mcp",
  version: "1.0.0",
  capabilities: {
    resources: {},
    tools: {},
  },
});

server.tool(
  "login",
  "Login to Bluesky",
  {
    identifier: z.string().describe("Your Bluesky handle or email"),
    password: z.string().describe("Your Bluesky app password"),
  },
  async ({ identifier, password }) => {
    try {
      await client.login(identifier, password);
      return {
        content: [
          {
            type: "text",
            text: "Successfully logged in to Bluesky",
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to login: ${error}`,
          },
        ],
      };
    }
  }
);

server.tool(
  "create-post",
  "Create a new post on Bluesky",
  {
    text: z.string().describe("The text content of your post"),
    images: z
      .array(
        z.object({
          data: z.string().describe("Base64 encoded image data"),
          encoding: z.string().describe("Image MIME type (e.g., image/jpeg)"),
        })
      )
      .optional()
      .describe("Optional array of images to attach to the post"),
  },
  async ({ text, images }) => {
    try {
      const processedImages = images?.map(img => ({
        data: Buffer.from(img.data, 'base64'),
        encoding: img.encoding,
      }));

      const result = await client.createPost(text, processedImages);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              status: "success",
              message: "Post created successfully",
              uri: result.uri,
              cid: result.cid
            })
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              status: "error",
              message: `Failed to create post: ${error}`
            })
          }
        ]
      };
    }
  }
);

server.tool(
  "get-profile",
  "Get your Bluesky profile",
  {},
  async () => {
    try {
      const profile = await client.getProfile();
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(profile, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to get profile: ${error}`,
          },
        ],
      };
    }
  }
);

server.tool(
  "get-timeline",
  "Get any user's Bluesky timeline",
  {
    limit: z.number().min(1).max(100).optional().describe("Number of posts to fetch (max 100)"),
  },
  async ({ limit }) => {
    try {
      const timeline = await client.getTimeline(limit);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(timeline, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to get timeline: ${error}`,
          },
        ],
      };
    }
  }
);

server.prompt(
  "format-timeline",
  { timeline: z.any() },
  ({ timeline }) => {
    interface PostAuthor {
      displayName?: string;
      handle: string;
    }

    interface PostEmbed {
      $type: string;
      external?: {
        title: string;
        description: string;
      };
      alt?: string;
    }

    interface Post {
      post: {
        author: PostAuthor;
        record: {
          text: string;
          createdAt: string;
        };
        embed?: PostEmbed;
        replyCount: number;
        repostCount: number;
        likeCount: number;
      };
      reason?: {
        $type: string;
        by: PostAuthor;
      };
    }

    const formatPost = (post: Post) => {
      const p = post.post;
      const author = `${p.author.displayName || p.author.handle}`;
      const text = p.record.text;
      const stats = `💬 ${p.replyCount} 🔄 ${p.repostCount} ❤️ ${p.likeCount}`;
      const time = new Date(p.record.createdAt).toLocaleString();
      
      let formatted = `@${author}: ${text}\n${stats} • ${time}\n`;
      
      if (p.embed) {
        if (p.embed.$type === 'app.bsky.embed.external#view') {
          formatted += `🔗 ${p.embed.external?.title}\n   ${p.embed.external?.description}\n`;
        } else if (p.embed.$type === 'app.bsky.embed.video#view') {
          formatted += `🎥 Video: ${p.embed.alt}\n`;
        }
      }
      
      if (post.reason?.$type === 'app.bsky.feed.defs#reasonRepost') {
        formatted = `🔄 Reposted by @${post.reason.by.displayName || post.reason.by.handle}\n` + formatted;
      }
      
      return formatted + '─'.repeat(50) + '\n';
    };

    const posts = timeline.data.feed.map(formatPost).join('\n');
    return {
      messages: [{
        role: "assistant",
        content: {
          type: "text",
          text: `📱 Timeline\n\n${posts}`
        }
      }]
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Bluesky MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
}); 