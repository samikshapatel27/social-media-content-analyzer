const { analyzeContent } = require("../server");

describe("analyzeContent function", () => {
  test("Case 1: Short post with no emoji, no hashtags, no question", () => {
    const result = analyzeContent("Hello world");
    expect(result.suggestions).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/emoji/i),
        expect.stringMatching(/hashtag/i),
        expect.stringMatching(/question/i),
        expect.stringMatching(/expand/i)
      ])
    );
    expect(result.metrics.emojiCount).toBe(0);
    expect(result.metrics.hashtagCount).toBe(0);
    expect(result.metrics.hasQuestions).toBe(false);
  });

  test("Case 2: Post with too many hashtags", () => {
    const text = "Check this out! #one #two #three #four #five #six";
    const result = analyzeContent(text);
    expect(result.suggestions).toEqual(
      expect.arrayContaining([expect.stringMatching(/reduce the number of hashtags/i)])
    );
    expect(result.metrics.hashtagCount).toBeGreaterThan(5);
  });

  test("Case 3: Post with a question", () => {
    const text = "What do you think about remote work?";
    const result = analyzeContent(text);
    expect(result.suggestions).not.toEqual(
      expect.arrayContaining([expect.stringMatching(/spark conversations/i)])
    );
    expect(result.metrics.hasQuestions).toBe(true);
  });

  test("Case 4: Very long post (>300 chars)", () => {
    const longText = "Lorem ipsum ".repeat(40); // ~440 characters
    const result = analyzeContent(longText);
    expect(result.suggestions).toEqual(
      expect.arrayContaining([expect.stringMatching(/shortening your post/i)])
    );
    expect(result.score).toBeLessThanOrEqual(100);
  });

  test("Case 5: Balanced post with question and hashtags", () => {
    const text = "Excited to share my new project! What features would you like to see? #tech #innovation";
    const result = analyzeContent(text);
    expect(result.metrics.emojiCount).toBe(0);
    expect(result.metrics.hashtagCount).toBe(2);
    expect(result.metrics.hasQuestions).toBe(true);
    expect(result.suggestions.length).toBeLessThanOrEqual(4);
    expect(result.suggestions).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/emoji/i)
      ])
    );
    expect(result.score).toBeGreaterThan(50);
  });

  test("Case 6: Empty string", () => {
    const result = analyzeContent("");
    expect(result.suggestions).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/emoji/i),
        expect.stringMatching(/hashtag/i),
        expect.stringMatching(/question/i),
        expect.stringMatching(/expand/i)
      ])
    );
    expect(result.score).toBe(30);
  });

  test("Case 7: Long plain post", () => {
    const text = "This is a plain post without emojis or hashtags ".repeat(8);
    const result = analyzeContent(text);
    expect(result.suggestions).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/emoji/i),
        expect.stringMatching(/hashtag/i),
        expect.stringMatching(/question/i)
      ])
    );
  });

  test("Case 8: Only hashtags", () => {
    const text = "#only #hashtags #here";
    const result = analyzeContent(text);
    expect(result.suggestions).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/emoji/i),
        expect.stringMatching(/question/i),
        expect.stringMatching(/expand/i)
      ])
    );
  });
});