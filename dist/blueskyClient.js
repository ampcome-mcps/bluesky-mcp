import { BskyAgent, RichText } from '@atproto/api';
export class BlueskyClient {
    constructor(service = 'https://bsky.social') {
        this.isAuthenticated = false;
        this.agent = new BskyAgent({ service });
    }
    async login(identifier, password) {
        try {
            await this.agent.login({ identifier, password });
            this.isAuthenticated = true;
            console.log('Successfully logged in to Bluesky');
        }
        catch (error) {
            console.error('Failed to login:', error);
            throw error;
        }
    }
    async createPost(text, images) {
        if (!this.isAuthenticated) {
            throw new Error('Not authenticated. Please login first.');
        }
        try {
            const rt = new RichText({ text });
            await rt.detectFacets(this.agent);
            const postRecord = {
                text: rt.text,
                facets: rt.facets,
                createdAt: new Date().toISOString(),
            };
            if (images && images.length > 0) {
                const uploadedImages = [];
                for (const image of images) {
                    const response = await this.agent.uploadBlob(image.data, {
                        encoding: image.encoding,
                    });
                    if (response.success) {
                        uploadedImages.push(response.data.blob);
                    }
                }
                if (uploadedImages.length > 0) {
                    postRecord.embed = {
                        $type: 'app.bsky.embed.images',
                        images: uploadedImages.map((blob) => ({
                            alt: 'Image',
                            image: blob,
                        })),
                    };
                }
            }
            const response = await this.agent.post(postRecord);
            console.log('Successfully created post:', response.uri);
            return response;
        }
        catch (error) {
            console.error('Failed to create post:', error);
            throw error;
        }
    }
    async getProfile() {
        if (!this.isAuthenticated) {
            throw new Error('Not authenticated. Please login first.');
        }
        try {
            const profile = await this.agent.getProfile({
                actor: this.agent.session?.did,
            });
            return profile;
        }
        catch (error) {
            console.error('Failed to get profile:', error);
            throw error;
        }
    }
    async getTimeline(limit = 20) {
        if (!this.isAuthenticated) {
            throw new Error('Not authenticated. Please login first.');
        }
        try {
            const timeline = await this.agent.getTimeline({ limit });
            return timeline;
        }
        catch (error) {
            console.error('Failed to get timeline:', error);
            throw error;
        }
    }
    async getPost(postUri) {
        if (!this.isAuthenticated) {
            throw new Error('Not authenticated. Please login first.');
        }
        try {
            const post = await this.agent.getPostThread({ uri: postUri });
            return post;
        }
        catch (error) {
            console.error('Failed to get post:', error);
            throw error;
        }
    }
    isLoggedIn() {
        return this.isAuthenticated;
    }
}
