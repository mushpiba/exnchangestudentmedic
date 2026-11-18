// One interface for the school community and buddy features.
// Preview mode (no backend configured) keeps everything in this tab; live mode uses Supabase.

export const BOARDS = ["free", "qna", "review", "info"] as const;
export type Board = (typeof BOARDS)[number];
export type Feed = Board | "hot" | "all";

export type PostSummary = {
  id: string;
  board: Board;
  title: string;
  excerpt: string;
  createdAt: string;
  likes: number;
  comments: number;
  locale: string;
  sample?: boolean;
};

export type Comment = {
  id: string;
  body: string;
  createdAt: string;
  /** "author" = the post's writer; a number = anonymous order within this post. */
  who: "author" | number;
  name?: string;
  mine: boolean;
};

export type Post = PostSummary & {
  body: string;
  liked: boolean;
  mine: boolean;
  authorName?: string;
  facility?: string;
  langs?: string[];
  rating?: number;
  thread: Comment[];
};

export type NewPost = {
  board: Board;
  title: string;
  body: string;
  locale: string;
  anonymous: boolean;
  facility?: string;
  langs?: string[];
  rating?: number;
};

export interface CommunityApi {
  mode: "preview" | "live";
  list(feed: Feed): Promise<PostSummary[]>;
  get(id: string): Promise<Post | null>;
  create(post: NewPost): Promise<string>;
  comment(postId: string, body: string, anonymous: boolean): Promise<void>;
  like(postId: string): Promise<void>;
  report(postId: string, commentId?: string): Promise<void>;
  remove(postId: string): Promise<void>;
  removeComment(commentId: string): Promise<void>;
}

export const HELP = ["move", "reception", "payment", "pharmacy"] as const;
export type Help = (typeof HELP)[number];
export type BuddyStatus = "requested" | "assigned" | "accepted" | "done" | "cancelled";
export type BuddyAction = "assign" | "accept" | "decline" | "cancel" | "finish";

export type BuddyRequest = {
  id: string;
  startsAt: string;
  place: string;
  help: Help[];
  locale: string;
  status: BuddyStatus;
  mine: boolean;
  assignedToMe: boolean;
  buddyName?: string;
};

export interface BuddyApi {
  mode: "preview" | "live";
  list(): Promise<BuddyRequest[]>;
  request(input: { startsAt: string; place: string; help: Help[]; locale: string }): Promise<void>;
  act(id: string, action: BuddyAction, assignee?: string): Promise<void>;
  buddies(): Promise<{ id: string; name: string }[]>;
}

export type Role = "student" | "buddy" | "operator";
export type Member = { id: string; campus: string; role: Role; name: string };
export type AuthState = { status: "preview" } | { status: "signedOut" } | { status: "noMember" } | { status: "member"; member: Member };

export interface CampusAuth {
  current(): AuthState;
  subscribe(listener: (state: AuthState) => void): () => void;
  sendCode(email: string): Promise<void>;
  verify(email: string, code: string): Promise<void>;
  signOut(): Promise<void>;
}

export const LIVE = !!(import.meta.env.VITE_CAMPUS_URL && import.meta.env.VITE_CAMPUS_PUBLIC_KEY);

type Backend = { community: CommunityApi; buddy: BuddyApi; auth: CampusAuth };
let backend: Promise<Backend> | null = null;

function load(): Promise<Backend> {
  backend ??= LIVE ? import("./live").then((m) => m.createLive()) : import("./preview").then((m) => m.createPreview());
  return backend;
}

export const community = () => load().then((b) => b.community);
export const buddy = () => load().then((b) => b.buddy);
export const campusAuth = () => load().then((b) => b.auth);

/** Time since a timestamp, in whole units, for "{n}분 전". */
export function age(iso: string, now = Date.now()) {
  const minutes = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60000));
  if (minutes < 1) return { key: "community.justNow" as const, n: 0 };
  if (minutes < 60) return { key: "community.minutesAgo" as const, n: minutes };
  if (minutes < 60 * 24) return { key: "community.hoursAgo" as const, n: Math.round(minutes / 60) };
  return { key: "community.daysAgo" as const, n: Math.round(minutes / 1440) };
}

/** Phone numbers and e-mail addresses look like personal data in a public post. */
export const looksPersonal = (text: string) =>
  /[\w.+-]+@[\w-]+\.[\w.]+/.test(text) || /(\+?\d[\d\s-]{8,}\d)/.test(text);

export const HOT_LIKES = 10;
