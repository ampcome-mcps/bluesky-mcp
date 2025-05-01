import { AtpAgent, BlobRef, RichText } from '@atproto/api';

export class BlueskyClient {
  private agent: AtpAgent;
  private isAuthenticated: boolean = false;

  constructor(service: string = 'https://bsky.social') {
    this.agent = new AtpAgent({ service });
  }

  async login(identifier: string, password: string): Promise<void> {
    try {
      await this.agent.login({ identifier, password });
      this.isAuthenticated = true;
      console.log('Successfully logged in to Bluesky');
    } catch (error) {
      console.error('Failed to login:', error);
      throw error;
    }
  }

  async createPost(text: string, images?: { data: Buffer; encoding: string; }[]): Promise<{ uri: string; cid: string }> {
    if (!this.isAuthenticated) {
      throw new Error('Not authenticated. Please login first.');
    }

    try {
      const rt = new RichText({ text });
      await rt.detectFacets(this.agent);

      const postRecord: any = {
        $type: 'app.bsky.feed.post',
        text: rt.text,
        facets: rt.facets,
        createdAt: new Date().toISOString(),
      };

      if (images && images.length > 0) {
        const uploadedImages: BlobRef[] = [];
        for (const image of images) {
          const response = await this.agent.uploadBlob(image.data, {
            encoding: image.encoding,
          });
          uploadedImages.push(response.data.blob);
        }

        postRecord.embed = {
          $type: 'app.bsky.embed.images',
          images: uploadedImages.map((blob) => ({
            alt: 'Image',
            image: blob,
          })),
        };
      }

      const response = await this.agent.post(postRecord);
      console.log('Successfully created post:', response.uri);
      return { uri: response.uri, cid: response.cid };
    } catch (error) {
      console.error('Failed to create post:', error);
      throw error;
    }
  }

  async getProfile(): Promise<any> {
    if (!this.isAuthenticated) {
      throw new Error('Not authenticated. Please login first.');
    }

    try {
      const profile = await this.agent.getProfile({
        actor: this.agent.session?.did as string,
      });
      return profile.data;
    } catch (error) {
      console.error('Failed to get profile:', error);
      throw error;
    }
  }

  async getTimeline(limit: number = 20): Promise<any> {
    if (!this.isAuthenticated) {
      throw new Error('Not authenticated. Please login first.');
    }

    try {
      const timeline = await this.agent.getTimeline({ limit });
      return timeline.data;
    } catch (error) {
      console.error('Failed to get timeline:', error);
      throw error;
    }
  }

  async getPost(uri: string, cid: string): Promise<any> {
    if (!this.isAuthenticated) {
      throw new Error('Not authenticated. Please login first.');
    }

    try {
      const post = await this.agent.getPost({ uri, cid });
      return post.data;
    } catch (error) {
      console.error('Failed to get post:', error);
      throw error;
    }
  }

  isLoggedIn(): boolean {
    return this.isAuthenticated;
  }
} 