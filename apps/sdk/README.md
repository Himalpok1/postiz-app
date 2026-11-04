# Castrapid NodeJS SDK

This is the NodeJS SDK for [Castrapid](https://castrapid.com).

You can start by installing the package:

```bash
npm install @castrapid/node
```

## Usage
```typescript
import Castrapid from '@castrapid/node';
const castrapid = new Castrapid('your api key', 'your self-hosted instance (optional)');
```

The available methods are:
- `post(posts: CreatePostDto)` - Schedule a post to Castrapid
- `postList(filters: GetPostsDto)` - Get a list of posts
- `upload(file: Buffer, extension: string)` - Upload a file to Castrapid
- `integrations()` - Get a list of connected channels
- `deletePost(id: string)` - Delete a post by ID
