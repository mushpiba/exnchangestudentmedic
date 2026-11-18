// Preview backend: sample posts plus whatever the reviewer writes, kept in this tab only.
import { HOT_LIKES, type AuthState, type BuddyApi, type BuddyRequest, type CampusAuth, type CommunityApi, type Post } from "./api";

const hoursAgo = (h: number) => new Date(Date.now() - h * 3600_000).toISOString();

function seed(): Post[] {
  const base = { liked: false, mine: false, sample: true };
  const posts: Omit<Post, "excerpt" | "comments">[] = [
    {
      ...base,
      id: "s1",
      board: "review",
      locale: "uz",
      title: "Darvoza oldidagi ichki kasalliklar klinikasi — ingliz tilida tushuntirishdi",
      body: "Kartani ko‘rsatdim, qabulxonada tez tushunishdi. Shifokor sekin ingliz tilida gapirdi. Navbat 20 daqiqa edi. (Namuna post)",
      createdAt: hoursAgo(5),
      likes: 14,
      facility: "학교 앞 내과 (예시)",
      langs: ["en-US", "ko-KR"],
      rating: 4,
      thread: [
        { id: "c1", body: "Rahmat! Dorixona ham yaqinmi?", createdAt: hoursAgo(4), who: 1, mine: false },
        { id: "c2", body: "Ha, binoning birinchi qavatida.", createdAt: hoursAgo(3), who: "author", mine: false },
      ],
    },
    {
      ...base,
      id: "s2",
      board: "qna",
      locale: "en-US",
      title: "My health insurance card hasn't arrived yet — do I pay the full price?",
      body: "I registered two weeks ago. Can the clinic check my insurance with my residence card? (Sample post)",
      createdAt: hoursAgo(20),
      likes: 9,
      thread: [
        {
          id: "c3",
          body: "접수할 때 외국인등록증을 보여 주면 자격을 조회해 주는 곳이 많아요. 먼저 전화로 물어보세요. (예시 답변)",
          createdAt: hoursAgo(18),
          who: 1,
          mine: false,
        },
      ],
    },
    {
      ...base,
      id: "s3",
      board: "info",
      locale: "ko-KR",
      title: "휴일에 문 여는 약국·응급실 찾는 법",
      body: "휴일지킨약국 사이트에서 지역을 고르면 오늘 여는 약국이 나와요. 응급실은 응급의료포털에서 찾을 수 있어요. 앱의 '병원·약국' 탭에도 링크가 있어요. (예시 글)",
      createdAt: hoursAgo(50),
      likes: 23,
      thread: [],
    },
    {
      ...base,
      id: "s4",
      board: "free",
      locale: "zh-CN",
      title: "第一次在韩国看牙医，有点紧张",
      body: "有人去过学校附近的牙科吗？需要预约吗？（示例帖子）",
      createdAt: hoursAgo(30),
      likes: 4,
      thread: [{ id: "c4", body: "我去过，最好先打电话预约。", createdAt: hoursAgo(28), who: 1, mine: false }],
    },
    {
      ...base,
      id: "s5",
      board: "review",
      locale: "vi-VN",
      title: "Nhà thuốc gần cổng sau — dược sĩ rất kiên nhẫn",
      body: "Mình cho xem ảnh hộp thuốc trong app, dược sĩ giải thích bằng tiếng Hàn chậm. (Bài mẫu)",
      createdAt: hoursAgo(70),
      likes: 11,
      facility: "후문 약국 (예시)",
      langs: ["ko-KR"],
      rating: 5,
      thread: [],
    },
    {
      ...base,
      id: "s6",
      board: "qna",
      locale: "ru-RU",
      title: "Где можно сдать анализ на туберкулёз для визы?",
      body: "Университет попросил справку. Куда идти и что взять с собой? (Пример)",
      createdAt: hoursAgo(90),
      likes: 6,
      thread: [],
    },
  ];
  return posts.map((p) => ({ ...p, excerpt: p.body.slice(0, 90), comments: p.thread.length }));
}

let posts = seed();
let requests: BuddyRequest[] = [];
let counter = 0;
const id = (prefix: string) => prefix + ++counter;
const summary = ({ thread: _t, body: _b, ...rest }: Post) => ({ ...rest, comments: _t.length });

export function createPreview() {
  const community: CommunityApi = {
    mode: "preview",
    async list(feed) {
      const list =
        feed === "all" ? posts : feed === "hot" ? posts.filter((p) => p.likes >= HOT_LIKES) : posts.filter((p) => p.board === feed);
      return [...list]
        .sort((a, b) => (feed === "hot" ? b.likes - a.likes : b.createdAt.localeCompare(a.createdAt)))
        .map(summary);
    },
    async get(postId) {
      const post = posts.find((p) => p.id === postId);
      return post ? { ...post, comments: post.thread.length } : null;
    },
    async create(input) {
      const post: Post = {
        id: id("p"),
        board: input.board,
        title: input.title,
        body: input.body,
        excerpt: input.body.slice(0, 90),
        locale: input.locale,
        createdAt: new Date().toISOString(),
        likes: 0,
        comments: 0,
        liked: false,
        mine: true,
        facility: input.facility,
        langs: input.langs,
        rating: input.rating,
        thread: [],
      };
      posts = [post, ...posts];
      return post.id;
    },
    async comment(postId, body) {
      posts = posts.map((p) => {
        if (p.id !== postId) return p;
        const mineBefore = p.thread.find((c) => c.mine && typeof c.who === "number");
        const nextNumber = Math.max(0, ...p.thread.map((c) => (typeof c.who === "number" ? c.who : 0))) + 1;
        const who = p.mine ? "author" : (mineBefore?.who ?? nextNumber);
        return {
          ...p,
          thread: [...p.thread, { id: id("c"), body, createdAt: new Date().toISOString(), who, mine: true }],
        };
      });
    },
    async like(postId) {
      posts = posts.map((p) => (p.id === postId ? { ...p, liked: !p.liked, likes: p.likes + (p.liked ? -1 : 1) } : p));
    },
    async report() {},
    async remove(postId) {
      posts = posts.filter((p) => !(p.id === postId && p.mine));
    },
    async removeComment(commentId) {
      posts = posts.map((p) => ({ ...p, thread: p.thread.filter((c) => !(c.id === commentId && c.mine)) }));
    },
  };

  const buddy: BuddyApi = {
    mode: "preview",
    async list() {
      return [...requests].sort((a, b) => b.startsAt.localeCompare(a.startsAt));
    },
    async request(input) {
      requests = [...requests, { id: id("b"), ...input, status: "requested", mine: true, assignedToMe: false }];
    },
    async act(requestId, action) {
      if (action !== "cancel") return;
      requests = requests.map((r) => (r.id === requestId && r.mine ? { ...r, status: "cancelled" } : r));
    },
    async buddies() {
      return [];
    },
  };

  const state: AuthState = { status: "preview" };
  const auth: CampusAuth = {
    current: () => state,
    subscribe: () => () => {},
    sendCode: async () => {},
    verify: async () => {},
    signOut: async () => {},
  };
  return { community, buddy, auth };
}
