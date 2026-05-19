import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchDiscussion,
  voteArticle,
  removeArticleVote,
  postComment,
  deleteComment,
  voteComment,
  removeCommentVote,
  type DiscussionData,
} from '@/lib/discussion-api';

export const discussionKeys = {
  all: ['discussion'] as const,
  detail: (articleId: string) => [...discussionKeys.all, articleId] as const,
};

export function useDiscussion(articleId: string) {
  return useQuery({
    queryKey: discussionKeys.detail(articleId),
    queryFn: () => fetchDiscussion(articleId),
    enabled: !!articleId,
    staleTime: 0, // always refetch on mount — comments change frequently
  });
}

export function useArticleVote(articleId: string) {
  const queryClient = useQueryClient();
  const queryKey = discussionKeys.detail(articleId);

  const vote = useMutation({
    mutationFn: (newVote: 1 | -1) => voteArticle(articleId, newVote),
    onMutate: async (newVote) => {
      await queryClient.cancelQueries({ queryKey });
      const prev = queryClient.getQueryData<DiscussionData>(queryKey);
      if (prev) {
        const oldVote = prev.userArticleVote;
        const scoreDiff = newVote - oldVote;
        queryClient.setQueryData<DiscussionData>(queryKey, {
          ...prev,
          userArticleVote: newVote,
          article: { ...prev.article, vote_score: (prev.article.vote_score || 0) + scoreDiff },
        });
      }
      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) queryClient.setQueryData(queryKey, context.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  const remove = useMutation({
    mutationFn: () => removeArticleVote(articleId),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey });
      const prev = queryClient.getQueryData<DiscussionData>(queryKey);
      if (prev) {
        const oldVote = prev.userArticleVote;
        queryClient.setQueryData<DiscussionData>(queryKey, {
          ...prev,
          userArticleVote: 0,
          article: { ...prev.article, vote_score: (prev.article.vote_score || 0) - oldVote },
        });
      }
      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) queryClient.setQueryData(queryKey, context.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  return { vote, remove };
}

export function usePostComment(articleId: string) {
  const queryClient = useQueryClient();
  const queryKey = discussionKeys.detail(articleId);

  return useMutation({
    mutationFn: ({ body, parentId }: { body: string; parentId?: string }) =>
      postComment(articleId, body, parentId),
    onMutate: async ({ body, parentId }) => {
      await queryClient.cancelQueries({ queryKey });
      const prev = queryClient.getQueryData<DiscussionData>(queryKey);
      if (prev) {
        const optimisticComment = {
          id: `optimistic-${Date.now()}`,
          parent_id: parentId || null,
          body,
          score: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          deleted: false,
          user_id: 'current-user',
          profiles: { username: 'You', full_name: null, avatar_url: null },
        };
        queryClient.setQueryData<DiscussionData>(queryKey, {
          ...prev,
          comments: [...prev.comments, optimisticComment],
          article: { ...prev.article, comment_count: (prev.article.comment_count || 0) + 1 },
        });
      }
      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) queryClient.setQueryData(queryKey, context.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });
}

export function useDeleteComment(articleId: string) {
  const queryClient = useQueryClient();
  const queryKey = discussionKeys.detail(articleId);

  return useMutation({
    mutationFn: (commentId: string) => deleteComment(articleId, commentId),
    onMutate: async (commentId) => {
      await queryClient.cancelQueries({ queryKey });
      const prev = queryClient.getQueryData<DiscussionData>(queryKey);
      if (prev) {
        queryClient.setQueryData<DiscussionData>(queryKey, {
          ...prev,
          comments: prev.comments.map((c) =>
            c.id === commentId ? { ...c, deleted: true, body: '[deleted]' } : c
          ),
          article: {
            ...prev.article,
            comment_count: Math.max(0, (prev.article.comment_count || 0) - 1),
          },
        });
      }
      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) queryClient.setQueryData(queryKey, context.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });
}

export function useCommentVote(articleId: string) {
  const queryClient = useQueryClient();
  const queryKey = discussionKeys.detail(articleId);

  const vote = useMutation({
    mutationFn: ({ commentId, vote: newVote }: { commentId: string; vote: 1 | -1 }) =>
      voteComment(articleId, commentId, newVote),
    onMutate: async ({ commentId, vote: newVote }) => {
      await queryClient.cancelQueries({ queryKey });
      const prev = queryClient.getQueryData<DiscussionData>(queryKey);
      if (prev) {
        const oldVote = prev.userCommentVotes[commentId] || 0;
        const scoreDiff = newVote - oldVote;
        queryClient.setQueryData<DiscussionData>(queryKey, {
          ...prev,
          userCommentVotes: { ...prev.userCommentVotes, [commentId]: newVote },
          comments: prev.comments.map((c) =>
            c.id === commentId ? { ...c, score: c.score + scoreDiff } : c
          ),
        });
      }
      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) queryClient.setQueryData(queryKey, context.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  const remove = useMutation({
    mutationFn: (commentId: string) => removeCommentVote(articleId, commentId),
    onMutate: async (commentId) => {
      await queryClient.cancelQueries({ queryKey });
      const prev = queryClient.getQueryData<DiscussionData>(queryKey);
      if (prev) {
        const oldVote = prev.userCommentVotes[commentId] || 0;
        queryClient.setQueryData<DiscussionData>(queryKey, {
          ...prev,
          userCommentVotes: { ...prev.userCommentVotes, [commentId]: 0 },
          comments: prev.comments.map((c) =>
            c.id === commentId ? { ...c, score: c.score - oldVote } : c
          ),
        });
      }
      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) queryClient.setQueryData(queryKey, context.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  return { vote, remove };
}
