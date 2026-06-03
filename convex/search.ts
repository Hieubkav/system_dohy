import { query } from './_generated/server';
import { v } from 'convex/values';
import { rankByFuzzyMatches } from './lib/search';

const suggestionItem = v.object({
  id: v.string(),
  title: v.string(),
  thumbnail: v.optional(v.string()),
  type: v.union(v.literal('post'), v.literal('product'), v.literal('service'), v.literal('course')),
  url: v.string(),
});

const suggestionGroup = v.object({
  items: v.array(suggestionItem),
  total: v.number(),
});

const searchResult = v.object({
  posts: suggestionGroup,
  products: suggestionGroup,
  services: suggestionGroup,
  courses: suggestionGroup,
});


export const autocomplete = query({
  args: {
    query: v.string(),
    searchPosts: v.boolean(),
    searchProducts: v.boolean(),
    searchServices: v.boolean(),
    searchCourses: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const rawQuery = args.query.trim();
    if (!rawQuery) {
      return {
        posts: { items: [], total: 0 },
        products: { items: [], total: 0 },
        services: { items: [], total: 0 },
        courses: { items: [], total: 0 },
      };
    }

    const limit = Math.min(args.limit ?? 5, 10);
    const searchLower = rawQuery.toLowerCase();

    const buildSuggestions = <T extends { _id: string }>(
      items: T[],
      type: 'post' | 'product' | 'service' | 'course',
      getTitle: (item: T) => string,
      getThumbnail: (item: T) => string | undefined,
      getUrl: (item: T) => string,
    ) => items.map(item => ({
      id: item._id,
      title: getTitle(item),
      thumbnail: getThumbnail(item),
      type,
      url: getUrl(item),
    }));

    const collectMatches = <T extends { _id: string }>(
      initial: T[],
      fallback: T[],
      getSearchTexts: (item: T) => string[],
    ) => {
      const merged: T[] = [];
      const seen = new Set<string>();

      for (const item of [...initial, ...fallback]) {
        if (seen.has(item._id)) {
          continue;
        }
        seen.add(item._id);
        merged.push(item);
      }

      const ranked = rankByFuzzyMatches(merged, rawQuery, getSearchTexts, 42);
      return {
        items: ranked.slice(0, limit).map((entry) => entry.item),
        total: ranked.length,
      };
    };

    const [posts, products, services, courses] = await Promise.all([
      args.searchPosts
        ? (async () => {
          const primary = await ctx.db
            .query('posts')
            .withSearchIndex('search_title', q => q.search('title', searchLower).eq('status', 'Published'))
            .take(Math.min(limit * 8, 60));
          const fallback = await ctx.db
            .query('posts')
            .withIndex('by_status_publishedAt', q => q.eq('status', 'Published'))
            .order('desc')
            .take(200);
          return collectMatches(primary, fallback, (item) => [item.title ?? '', item.excerpt ?? '']);
        })()
        : Promise.resolve({ items: [], total: 0 }),
      args.searchProducts
        ? (async () => {
          const primary = await ctx.db
            .query('products')
            .withSearchIndex('search_name', q => q.search('name', searchLower).eq('status', 'Active'))
            .take(Math.min(limit * 8, 60));
          const fallback = await ctx.db
            .query('products')
            .withIndex('by_status_order', q => q.eq('status', 'Active'))
            .order('desc')
            .take(200);
          return collectMatches(primary, fallback, (item) => [item.name ?? '', item.sku ?? '']);
        })()
        : Promise.resolve({ items: [], total: 0 }),
      args.searchServices
        ? (async () => {
          const primary = await ctx.db
            .query('services')
            .withSearchIndex('search_title', q => q.search('title', searchLower).eq('status', 'Published'))
            .take(Math.min(limit * 8, 60));
          const fallback = await ctx.db
            .query('services')
            .withIndex('by_status_publishedAt', q => q.eq('status', 'Published'))
            .order('desc')
            .take(200);
          return collectMatches(primary, fallback, (item) => [item.title ?? '', item.excerpt ?? '']);
        })()
        : Promise.resolve({ items: [], total: 0 }),
      args.searchCourses
        ? (async () => {
          const primary = await ctx.db
            .query('courses')
            .withSearchIndex('search_title', q => q.search('title', searchLower).eq('status', 'Published'))
            .take(Math.min(limit * 8, 60));
          const fallback = await ctx.db
            .query('courses')
            .withIndex('by_status_publishedAt', q => q.eq('status', 'Published'))
            .order('desc')
            .take(200);
          return collectMatches(primary, fallback, (item) => [item.title ?? '', item.excerpt ?? '', item.instructorName ?? '']);
        })()
        : Promise.resolve({ items: [], total: 0 }),
    ]);

    const routeModeSetting = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", "ia_route_mode"))
      .unique();
    const routeMode = routeModeSetting?.value === "namespace" ? "namespace" : "unified";

    const postCategories = await Promise.all(posts.items.map((item) => ctx.db.get(item.categoryId)));
    const productCategories = await Promise.all(products.items.map((item) => ctx.db.get(item.categoryId)));
    const serviceCategories = await Promise.all(services.items.map((item) => ctx.db.get(item.categoryId)));
    const courseCategories = await Promise.all(courses.items.map((item) => ctx.db.get(item.categoryId)));

    const postCategoryMap = new Map(postCategories.filter(Boolean).map((cat) => [cat!._id, cat!]));
    const productCategoryMap = new Map(productCategories.filter(Boolean).map((cat) => [cat!._id, cat!]));
    const serviceCategoryMap = new Map(serviceCategories.filter(Boolean).map((cat) => [cat!._id, cat!]));
    const courseCategoryMap = new Map(courseCategories.filter(Boolean).map((cat) => [cat!._id, cat!]));

    const buildDetailUrl = (params: {
      moduleKey: "posts" | "products" | "services" | "courses";
      slug: string;
      categorySlug?: string;
    }) => {
      if (routeMode === "unified" && params.categorySlug) {
        return `/${params.categorySlug}/${params.slug}`;
      }
      return `/${params.moduleKey}/${params.slug}`;
    };

    return {
      posts: {
        items: buildSuggestions(
          posts.items,
          'post',
          (item) => item.title,
          (item) => item.thumbnail ?? undefined,
          (item) => buildDetailUrl({
            moduleKey: "posts",
            slug: item.slug,
            categorySlug: postCategoryMap.get(item.categoryId)?.slug,
          }),
        ),
        total: posts.total,
      },
      products: {
        items: buildSuggestions(
          products.items,
          'product',
          (item) => item.name,
          (item) => item.image ?? item.images?.[0],
          (item) => buildDetailUrl({
            moduleKey: "products",
            slug: item.slug,
            categorySlug: productCategoryMap.get(item.categoryId)?.slug,
          }),
        ),
        total: products.total,
      },
      services: {
        items: buildSuggestions(
          services.items,
          'service',
          (item) => item.title,
          (item) => item.thumbnail ?? undefined,
          (item) => buildDetailUrl({
            moduleKey: "services",
            slug: item.slug,
            categorySlug: serviceCategoryMap.get(item.categoryId)?.slug,
          }),
        ),
        total: services.total,
      },
      courses: {
        items: buildSuggestions(
          courses.items,
          'course',
          (item) => item.title,
          (item) => item.thumbnail ?? undefined,
          (item) => buildDetailUrl({
            moduleKey: "courses",
            slug: item.slug,
            categorySlug: courseCategoryMap.get(item.categoryId)?.slug,
          }),
        ),
        total: courses.total,
      },
    };
  },
  returns: searchResult,
});
