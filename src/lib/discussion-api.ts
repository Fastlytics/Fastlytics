import { request } from './api-client';
import type { NewsArticle } from './news-api';

// --- Types ---

export interface CommentProfile {
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
}

export interface Comment {
  id: string;
  parent_id: string | null;
  body: string;
  score: number;
  created_at: string;
  updated_at: string;
  deleted: boolean;
  user_id: string;
  profiles: CommentProfile;
}

export interface DiscussionData {
  article: NewsArticle & { vote_score: number; comment_count: number };
  comments: Comment[];
  userArticleVote: number; // 1, -1, or 0
  userCommentVotes: Record<string, number>;
}

// --- API Functions ---

export async function fetchDiscussion(articleId: string): Promise<DiscussionData> {
  return request<DiscussionData>(`/api/news/${articleId}/discussion`);
}

export async function voteArticle(articleId: string, vote: 1 | -1): Promise<void> {
  await request(`/api/news/${articleId}/vote`, {
    method: 'POST',
    body: JSON.stringify({ vote }),
  });
}

export async function removeArticleVote(articleId: string): Promise<void> {
  await request(`/api/news/${articleId}/vote`, { method: 'DELETE' });
}

export async function postComment(
  articleId: string,
  body: string,
  parentId?: string
): Promise<Comment> {
  return request<Comment>(`/api/news/${articleId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ body, parent_id: parentId }),
  });
}

export async function deleteComment(articleId: string, commentId: string): Promise<void> {
  await request(`/api/news/${articleId}/comments/${commentId}`, { method: 'DELETE' });
}

export async function voteComment(
  articleId: string,
  commentId: string,
  vote: 1 | -1
): Promise<void> {
  await request(`/api/news/${articleId}/comments/${commentId}/vote`, {
    method: 'POST',
    body: JSON.stringify({ vote }),
  });
}

export async function removeCommentVote(articleId: string, commentId: string): Promise<void> {
  await request(`/api/news/${articleId}/comments/${commentId}/vote`, { method: 'DELETE' });
}
