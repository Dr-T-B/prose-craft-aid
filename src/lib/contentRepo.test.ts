import { beforeEach, describe, expect, it, vi } from "vitest";

type QueryResult = {
  data: unknown[] | null;
  error: { message?: string } | null;
};

const mockSupabase = vi.hoisted(() => {
  const responses: Record<string, QueryResult> = {};

  const makeQuery = (table: string) => {
    const query = {
      eq: vi.fn(() => query),
      order: vi.fn(() => query),
      then: (resolve: (value: QueryResult) => void, reject: (reason: unknown) => void) =>
        Promise.resolve(responses[table] ?? { data: [], error: null }).then(resolve, reject),
    };
    return query;
  };

  return {
    responses,
    from: vi.fn((table: string) => ({
      select: vi.fn(() => makeQuery(table)),
    })),
  };
});

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: mockSupabase.from,
  },
}));

describe("content repository fallback", () => {
  beforeEach(() => {
    mockSupabase.from.mockClear();
    for (const key of Object.keys(mockSupabase.responses)) {
      delete mockSupabase.responses[key];
    }
  });

  it("keeps remote glossary rows when core seed-backed tables are empty", async () => {
    mockSupabase.responses.glossary_terms = {
      data: [
        {
          id: "g1",
          term: "zeugma",
          definition: "A word applied to two others in different senses.",
          category: "method",
          is_active: true,
          sort_order: 1,
        },
      ],
      error: null,
    };

    const { loadContent, localContentBundle } = await import("./contentRepo");
    const bundle = await loadContent();

    expect(bundle.source).toBe("remote");
    expect(bundle.routes).toEqual(localContentBundle.routes);
    expect(bundle.glossary_terms).toEqual(mockSupabase.responses.glossary_terms.data);
  });

  it("falls back only the dataset whose query fails", async () => {
    mockSupabase.responses.routes = {
      data: [
        {
          id: "remote-route",
          name: "Remote route",
          core_question: "How does the comparison work?",
        },
      ],
      error: null,
    };
    mockSupabase.responses.questions = {
      data: null,
      error: { message: "permission denied" },
    };

    const { loadContent, localContentBundle } = await import("./contentRepo");
    const bundle = await loadContent();

    expect(bundle.routes).toEqual(mockSupabase.responses.routes.data);
    expect(bundle.questions).toEqual(localContentBundle.questions);
  });
});
