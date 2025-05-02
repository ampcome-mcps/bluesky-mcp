import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { BlueskyClient } from './blueskyClient.js';
const client = new BlueskyClient();
const server = new McpServer({
    name: "bluesky-mcp",
    version: "1.0.0",
    capabilities: {
        resources: {},
        tools: {},
    },
});
export const ConfigSchema = z.object({
    identifier: z.string().min(1, "Bluesky handle or email is required"),
    password: z.string().min(1, "Bluesky app password is required"),
});
export const CreatePostSchema = z.object({
    text: z.string().min(1, "Post text cannot be empty"),
    images: z
        .array(z.object({
        data: z.string().describe("Base64 encoded image data"),
        encoding: z.string().describe("Image MIME type (e.g., image/jpeg)"),
    }))
        .optional(),
});
export const GetTimelineSchema = z.object({
    limit: z.number().int().min(1).max(100).optional(),
});
export function formatTimeline(posts, baseUrl = "https://bsky.app/profile") {
    return {
        count: posts.length,
        posts: posts.map((post, i) => ({
            position: i + 1,
            author: {
                handle: post.author.handle,
                displayName: post.author.displayName,
            },
            content: post.text,
            stats: {
                replies: post.replyCount,
                reposts: post.repostCount,
                likes: post.likeCount,
            },
            createdAt: post.createdAt,
            url: `${baseUrl}/${post.author.handle}/post/${post.uri.split("/").pop()}`,
        })),
    };
}
server.tool("login", "Login to Bluesky using credentials from .env file or provided parameters", {
    identifier: z.string().optional().describe("Your Bluesky handle or email (optional if set in .env)"),
    password: z.string().optional().describe("Your Bluesky app password (optional if set in .env)"),
}, async ({ identifier, password }) => {
    try {
        if (identifier && password) {
            await client.login(identifier, password);
        }
        else {
            await client.autoLogin();
        }
        return {
            content: [
                {
                    type: "text",
                    text: "Successfully logged in to Bluesky",
                },
            ],
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Failed to login: ${error}`,
                },
            ],
        };
    }
});
server.tool("create-post", "Create a new post on Bluesky", {
    text: z.string().describe("The text content of your post"),
    images: z
        .array(z.object({
        data: z.string().describe("Base64 encoded image data"),
        encoding: z.string().describe("Image MIME type (e.g., image/jpeg)"),
    }))
        .optional()
        .describe("Optional array of images to attach to the post"),
}, async ({ text, images }) => {
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
    }
    catch (error) {
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
});
server.tool("get-profile", "Get your Bluesky profile", {}, async () => {
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
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Failed to get profile: ${error}`,
                },
            ],
        };
    }
});
server.tool("get-timeline", "Get Bluesky timeline", {
    limit: GetTimelineSchema.shape.limit,
}, async ({ limit }) => {
    try {
        const timeline = await client.getTimeline(limit);
        const formatted = formatTimeline(timeline.data.feed);
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(formatted, null, 2),
                },
            ],
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Failed to get timeline: ${error}`,
                },
            ],
        };
    }
});
server.tool("get-post", "Get a specific post by URI", {
    uri: z.string().describe("The URI of the post to fetch"),
}, async ({ uri }) => {
    try {
        const post = await client.getPost(uri);
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(post, null, 2),
                },
            ],
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Failed to get post: ${error}`,
                },
            ],
        };
    }
});
server.tool("get-posts", "Get multiple posts by their URIs", {
    uris: z.array(z.string()).describe("Array of post URIs to fetch"),
}, async ({ uris }) => {
    try {
        const posts = await client.getPosts(uris);
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(posts, null, 2),
                },
            ],
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Failed to get posts: ${error}`,
                },
            ],
        };
    }
});
server.tool("delete-post", "Delete one of your posts", {
    uri: z.string().describe("The URI of the post to delete"),
}, async ({ uri }) => {
    try {
        await client.deletePost(uri);
        return {
            content: [
                {
                    type: "text",
                    text: "Post deleted successfully",
                },
            ],
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Failed to delete post: ${error}`,
                },
            ],
        };
    }
});
server.tool("like-post", "Like a post", {
    uri: z.string().describe("The URI of the post to like"),
    cid: z.string().describe("The CID of the post to like"),
}, async ({ uri, cid }) => {
    try {
        const result = await client.likePost(uri, cid);
        return {
            content: [
                {
                    type: "text",
                    text: `Successfully liked post. Like URI: ${result.uri}`,
                },
            ],
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Failed to like post: ${error}`,
                },
            ],
        };
    }
});
server.tool("unlike-post", "Remove your like from a post", {
    likeUri: z.string().describe("The URI of the like to remove"),
}, async ({ likeUri }) => {
    try {
        await client.unlikePost(likeUri);
        return {
            content: [
                {
                    type: "text",
                    text: "Successfully removed like",
                },
            ],
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Failed to remove like: ${error}`,
                },
            ],
        };
    }
});
server.tool("repost", "Repost someone's post", {
    uri: z.string().describe("The URI of the post to repost"),
    cid: z.string().describe("The CID of the post to repost"),
}, async ({ uri, cid }) => {
    try {
        const result = await client.repostPost(uri, cid);
        return {
            content: [
                {
                    type: "text",
                    text: `Successfully reposted. Repost URI: ${result.uri}`,
                },
            ],
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Failed to repost: ${error}`,
                },
            ],
        };
    }
});
server.tool("unrepost", "Remove your repost", {
    repostUri: z.string().describe("The URI of the repost to remove"),
}, async ({ repostUri }) => {
    try {
        await client.unrepostPost(repostUri);
        return {
            content: [
                {
                    type: "text",
                    text: "Successfully removed repost",
                },
            ],
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Failed to remove repost: ${error}`,
                },
            ],
        };
    }
});
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    try {
        await client.autoLogin();
        console.error("Auto-logged in to Bluesky using .env credentials");
    }
    catch (error) {
        console.error("Note: Auto-login failed. Use the login tool with credentials to authenticate.");
    }
    console.error("Bluesky MCP Server running on stdio");
}
main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});
