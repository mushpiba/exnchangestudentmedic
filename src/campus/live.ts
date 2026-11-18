// Live backend: Supabase Auth (e-mail OTP for pre-registered members) + the RPCs in supabase/pilot.sql.
import { createClient } from "@supabase/supabase-js";
import type { AuthState, BuddyApi, BuddyRequest, CampusAuth, CommunityApi, Member, Post, PostSummary, Role } from "./api";

export function createLive() {
  const db = createClient(import.meta.env.VITE_CAMPUS_URL, import.meta.env.VITE_CAMPUS_PUBLIC_KEY, {
    // Survives a refresh, ends with the tab.
    auth: { storage: sessionStorage, persistSession: true, detectSessionInUrl: false },
  });

  async function call<T>(fn: string, args?: Record<string, unknown>): Promise<T> {
    const { data, error } = await db.rpc(fn, args);
    if (error) throw new Error(error.message);
    return data as T;
  }

  let state: AuthState = { status: "signedOut" };
  const listeners = new Set<(s: AuthState) => void>();
  const publish = (next: AuthState) => {
    state = next;
    listeners.forEach((l) => l(next));
  };

  async function refresh(userId: string | undefined) {
    if (!userId) return publish({ status: "signedOut" });
    try {
      const rows = await call<{ campus: string; role: Role; display_name: string }[]>("my_membership");
      const row = rows[0];
      publish(
        row
          ? { status: "member", member: { id: userId, campus: row.campus, role: row.role, name: row.display_name } as Member }
          : { status: "noMember" },
      );
    } catch {
      publish({ status: "noMember" });
    }
  }
  db.auth.onAuthStateChange((_event, session) => {
    // Supabase recommends not awaiting other calls inside this callback.
    setTimeout(() => refresh(session?.user.id), 0);
  });

  const auth: CampusAuth = {
    current: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    async sendCode(email) {
      const { error } = await db.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
      if (error) throw new Error(error.message);
    },
    async verify(email, code) {
      const { error } = await db.auth.verifyOtp({ email, token: code.trim(), type: "email" });
      if (error) throw new Error(error.message);
    },
    async signOut() {
      await db.auth.signOut();
    },
  };

  type Row = { id: string; board: PostSummary["board"]; title: string; excerpt: string; created_at: string; likes: number; comments: number; locale: string };

  const community: CommunityApi = {
    mode: "live",
    async list(feed, query) {
      const rows = await call<Row[]>("list_posts", { p_feed: feed, p_query: query?.trim() || null });
      return rows.map((r) => ({ ...r, createdAt: r.created_at }));
    },
    async get(id) {
      const post = await call<(Omit<Post, "excerpt" | "comments"> & { thread: Post["thread"] }) | null>("get_post", { p_id: id });
      return post ? { ...post, excerpt: post.body.slice(0, 90), comments: post.thread.length } : null;
    },
    create: (p) =>
      call<string>("create_post", {
        p_board: p.board,
        p_title: p.title,
        p_body: p.body,
        p_locale: p.locale,
        p_anonymous: p.anonymous,
        p_facility: p.facility ?? null,
        p_langs: p.langs ?? [],
        p_rating: p.rating ?? null,
      }),
    comment: (postId, body, anonymous) => call("add_comment", { p_post: postId, p_body: body, p_anonymous: anonymous }),
    like: (postId) => call("toggle_like", { p_post: postId }),
    report: (postId, commentId) => call("report_content", { p_post: postId, p_comment: commentId ?? null }),
    remove: (postId) => call("delete_post", { p_id: postId }),
    removeComment: (commentId) => call("delete_comment", { p_id: commentId }),
  };

  const buddy: BuddyApi = {
    mode: "live",
    list: () => call<BuddyRequest[]>("list_buddy_requests"),
    request: (r) =>
      call("request_buddy", { p_starts_at: r.startsAt, p_place: r.place, p_help: r.help, p_locale: r.locale }),
    act: (id, action, assignee) => call("change_buddy", { request_id: id, action, assignee: assignee ?? null }),
    buddies: () => call<{ id: string; name: string }[]>("available_buddies"),
  };

  return { community, buddy, auth };
}
