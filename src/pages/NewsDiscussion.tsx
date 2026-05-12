import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { m } from 'motion/react';
import {
  ArrowUp01Icon,
  ArrowDown01Icon,
  Message01Icon,
  LinkSquare01Icon,
  ArrowLeft01Icon,
  Delete01Icon,
  News01Icon,
} from 'hugeicons-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  useDiscussion,
  useArticleVote,
  usePostComment,
  useDeleteComment,
  useCommentVote,
} from '@/hooks/useDiscussion';
import { CARD_CONTAINER } from '@/lib/card-styles';
import { SEO } from '@/components/layout/SEO';
import type { Comment } from '@/lib/discussion-api';

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays === 1) return 'yesterday';
  return `${diffDays}d ago`;
}

// --- Vote Button ---
function VoteButtons({
  score,
  userVote,
  onVote,
  size = 'md',
}: {
  score: number;
  userVote: number;
  onVote: (vote: 1 | -1 | 0) => void;
  size?: 'sm' | 'md';
}) {
  const iconSize = size === 'sm' ? 14 : 16;

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => onVote(userVote === 1 ? 0 : 1)}
        className={`rounded p-1 transition-colors ${
          userVote === 1
            ? 'bg-emerald-400/10 text-emerald-400'
            : 'text-white/40 hover:bg-white/[0.06] hover:text-emerald-400'
        }`}
        aria-label="Upvote"
      >
        <ArrowUp01Icon size={iconSize} strokeWidth={2} />
      </button>
      <span
        className={`min-w-[20px] text-center text-[12px] font-medium tabular-nums ${
          score > 0 ? 'text-emerald-400' : score < 0 ? 'text-red-400' : 'text-white/50'
        }`}
      >
        {score}
      </span>
      <button
        type="button"
        onClick={() => onVote(userVote === -1 ? 0 : -1)}
        className={`rounded p-1 transition-colors ${
          userVote === -1
            ? 'bg-red-400/10 text-red-400'
            : 'text-white/40 hover:bg-white/[0.06] hover:text-red-400'
        }`}
        aria-label="Downvote"
      >
        <ArrowDown01Icon size={iconSize} strokeWidth={2} />
      </button>
    </div>
  );
}

// --- Comment Input ---
function CommentInput({
  onSubmit,
  placeholder = 'Share your thoughts...',
  autoFocus = false,
  onCancel,
}: {
  onSubmit: (body: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  onCancel?: () => void;
}) {
  const [body, setBody] = useState('');
  const { user } = useAuth();

  if (!user) {
    return (
      <div className={`${CARD_CONTAINER} px-4 py-3 text-center text-[12px] text-white/50`}>
        <Link to="/auth" className="text-sky-400 hover:underline">
          Sign in
        </Link>{' '}
        to join the discussion
      </div>
    );
  }

  return (
    <div className={`${CARD_CONTAINER} p-3`}>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        rows={3}
        maxLength={5000}
        className="w-full resize-none rounded-md border border-white/[0.06] bg-transparent px-3 py-2 text-[13px] text-white placeholder-white/30 outline-none focus:border-white/[0.12]"
      />
      <div className="mt-2 flex items-center justify-between">
        <span className="text-[11px] text-white/30">{body.length}/5000</span>
        <div className="flex gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-md px-3 py-1.5 text-[12px] font-medium text-white/50 transition-colors hover:text-white/80"
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (body.trim()) {
                onSubmit(body.trim());
                setBody('');
              }
            }}
            disabled={!body.trim()}
            className="rounded-md bg-white/[0.08] px-3 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-white/[0.12] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Comment
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Single Comment ---
function CommentItem({
  comment,
  articleId,
  userVote,
  allComments,
  userCommentVotes,
  depth = 0,
}: {
  comment: Comment;
  articleId: string;
  userVote: number;
  allComments: Comment[];
  userCommentVotes: Record<string, number>;
  depth?: number;
}) {
  const [replying, setReplying] = useState(false);
  const { user } = useAuth();
  const postCommentMutation = usePostComment(articleId);
  const deleteCommentMutation = useDeleteComment(articleId);
  const { vote, remove } = useCommentVote(articleId);

  const replies = allComments.filter((c) => c.parent_id === comment.id);
  const isOwn = user?.id === comment.user_id;
  const displayName = comment.profiles?.username || comment.profiles?.full_name || 'Anonymous';

  const handleVote = (v: 1 | -1 | 0) => {
    if (v === 0) remove.mutate(comment.id);
    else vote.mutate({ commentId: comment.id, vote: v });
  };

  return (
    <div className={depth > 0 ? 'ml-5 border-l border-white/[0.06] pl-4' : ''}>
      <div className="group py-3">
        {/* Header */}
        <div className="flex items-center gap-2 text-[11px]">
          <span className="font-medium text-white/70">
            {comment.deleted ? '[deleted]' : displayName}
          </span>
          <span className="text-white/20">·</span>
          <span className="text-white/30">{timeAgo(comment.created_at)}</span>
        </div>

        {/* Body */}
        <p
          className={`mt-1.5 text-[13px] leading-relaxed ${comment.deleted ? 'italic text-white/30' : 'text-white/80'}`}
        >
          {comment.body}
        </p>

        {/* Actions */}
        {!comment.deleted && (
          <div className="mt-2 flex items-center gap-3">
            <VoteButtons score={comment.score} userVote={userVote} onVote={handleVote} size="sm" />
            {user && depth < 4 && (
              <button
                type="button"
                onClick={() => setReplying(!replying)}
                className="flex items-center gap-1 text-[11px] text-white/40 transition-colors hover:text-white/70"
              >
                <Message01Icon size={12} />
                Reply
              </button>
            )}
            {isOwn && (
              <button
                type="button"
                onClick={() => deleteCommentMutation.mutate(comment.id)}
                className="flex items-center gap-1 text-[11px] text-white/30 opacity-0 transition-all group-hover:opacity-100 hover:text-red-400"
              >
                <Delete01Icon size={12} />
                Delete
              </button>
            )}
          </div>
        )}

        {/* Reply input */}
        {replying && (
          <div className="mt-3">
            <CommentInput
              placeholder={`Reply to ${displayName}...`}
              autoFocus
              onCancel={() => setReplying(false)}
              onSubmit={(body) => {
                postCommentMutation.mutate({ body, parentId: comment.id });
                setReplying(false);
              }}
            />
          </div>
        )}
      </div>

      {/* Nested replies */}
      {replies.map((reply) => (
        <CommentItem
          key={reply.id}
          comment={reply}
          articleId={articleId}
          userVote={userCommentVotes[reply.id] || 0}
          allComments={allComments}
          userCommentVotes={userCommentVotes}
          depth={depth + 1}
        />
      ))}
    </div>
  );
}

// --- Main Discussion Page ---
export default function NewsDiscussion() {
  const { articleId } = useParams<{ articleId: string }>();
  const { data, isLoading } = useDiscussion(articleId || '');
  const { vote: articleVoteMutation, remove: articleRemoveVote } = useArticleVote(articleId || '');
  const postComment = usePostComment(articleId || '');

  const handleArticleVote = (v: 1 | -1 | 0) => {
    if (v === 0) articleRemoveVote.mutate();
    else articleVoteMutation.mutate(v);
  };

  if (isLoading || !data) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-6">
        <div className={`${CARD_CONTAINER} animate-pulse p-6`}>
          <div className="h-5 w-3/4 rounded bg-white/[0.06]" />
          <div className="mt-3 h-3 w-full rounded bg-white/[0.04]" />
          <div className="mt-2 h-3 w-2/3 rounded bg-white/[0.04]" />
        </div>
      </div>
    );
  }

  const { article, comments, userArticleVote, userCommentVotes } = data;
  const topLevelComments = comments.filter((c) => !c.parent_id);

  return (
    <>
      <SEO title={`${article.rewritten_title} | Discussion`} description={article.summary} />

      <div className="mx-auto max-w-3xl space-y-4 px-4 py-6 text-white">
        {/* Back link */}
        <Link
          to="/news"
          className="inline-flex items-center gap-1.5 text-[12px] text-white/50 transition-colors hover:text-white/80"
        >
          <ArrowLeft01Icon size={14} />
          Back to News
        </Link>

        {/* Article card */}
        <m.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${CARD_CONTAINER} overflow-hidden`}
        >
          {/* Thumbnail */}
          {article.image_url ? (
            <div className="aspect-[21/9] overflow-hidden">
              <img src={article.image_url} alt="" className="h-full w-full object-cover" />
            </div>
          ) : (
            <div className="flex aspect-[21/9] items-center justify-center bg-white/[0.02]">
              <News01Icon className="size-10 text-white/10" />
            </div>
          )}

          <div className="p-5">
            {/* Title */}
            <h1 className="text-[18px] font-bold leading-snug text-white">
              {article.rewritten_title}
            </h1>

            {/* Summary */}
            <p className="mt-2 text-[13px] leading-relaxed text-white/60">{article.summary}</p>

            {/* Tags */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-[11px] text-white/30">{article.source_name}</span>
              <span className="text-white/20">·</span>
              <span className="text-[11px] text-white/30">{timeAgo(article.published_at)}</span>
              {article.drivers?.map((d) => (
                <span
                  key={d}
                  className="rounded border border-sky-400/20 px-1.5 py-0.5 text-[10px] font-medium text-sky-400/80"
                >
                  {d}
                </span>
              ))}
              {article.teams?.map((t) => (
                <span
                  key={t}
                  className="rounded border border-emerald-400/20 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400/80"
                >
                  {t}
                </span>
              ))}
            </div>

            {/* Vote + actions row */}
            <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-4">
              <div className="flex items-center gap-4">
                <VoteButtons
                  score={article.vote_score || 0}
                  userVote={userArticleVote}
                  onVote={handleArticleVote}
                />
                <div className="flex items-center gap-1.5 text-[12px] text-white/40">
                  <Message01Icon size={14} />
                  <span>{article.comment_count || comments.length} comments</span>
                </div>
              </div>

              <a
                href={article.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-md border border-white/[0.08] px-3 py-1.5 text-[11px] font-medium text-white/60 transition-colors hover:border-white/[0.15] hover:text-white/90"
              >
                <LinkSquare01Icon size={12} />
                Read full article
              </a>
            </div>
          </div>
        </m.div>

        {/* Comment input */}
        <CommentInput
          onSubmit={(body) => postComment.mutate({ body })}
          placeholder="Share your thoughts on this article..."
        />

        {/* Comments */}
        {topLevelComments.length > 0 ? (
          <div className={`${CARD_CONTAINER} divide-y divide-white/[0.04] px-4`}>
            {topLevelComments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                articleId={articleId!}
                userVote={userCommentVotes[comment.id] || 0}
                allComments={comments}
                userCommentVotes={userCommentVotes}
              />
            ))}
          </div>
        ) : (
          <div
            className={`${CARD_CONTAINER} flex flex-col items-center justify-center px-4 py-10 text-center`}
          >
            <Message01Icon className="mb-2 size-6 text-white/20" />
            <div className="text-[13px] text-white/50">No comments yet</div>
            <div className="mt-0.5 text-[11px] text-white/30">
              Be the first to share your thoughts
            </div>
          </div>
        )}
      </div>
    </>
  );
}
