import { mutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { contentStatus } from "./lib/validators";
import { rankByFuzzyMatches } from "./lib/search";
import * as CoursesModel from "./model/courses";
import type { Doc } from "./_generated/dataModel";
import {
  isBrokenStorageBackedUrl,
  removeOwnerFilesAndCleanup,
  syncOwnerFilesAndCleanup,
} from "./lib/fileService";
import {
  isMultiCategoryEnabled,
  listCourseAdditionalCategoryIds,
  mergeCoursesByCategoryAssignments,
  syncCourseCategoryAssignments,
} from "./lib/multiCategory";

const videoType = v.union(
  v.literal("none"),
  v.literal("youtube"),
  v.literal("drive"),
  v.literal("external")
);

const courseLevel = v.union(
  v.literal("Beginner"),
  v.literal("Intermediate"),
  v.literal("Advanced")
);

const pricingType = v.union(
  v.literal("free"),
  v.literal("paid"),
  v.literal("contact")
);

const renderType = v.union(
  v.literal("content"),
  v.literal("markdown"),
  v.literal("html")
);

const courseDoc = v.object({
  _creationTime: v.number(),
  _id: v.id("courses"),
  categoryId: v.id("courseCategories"),
  chapterCount: v.number(),
  comparePriceAmount: v.optional(v.number()),
  content: v.string(),
  durationSeconds: v.optional(v.number()),
  durationText: v.optional(v.string()),
  excerpt: v.optional(v.string()),
  featured: v.optional(v.boolean()),
  htmlRender: v.optional(v.string()),
  instructorName: v.optional(v.string()),
  introVideoType: v.optional(videoType),
  introVideoUrl: v.optional(v.string()),
  isPriceVisible: v.optional(v.boolean()),
  lessonCount: v.number(),
  level: v.optional(courseLevel),
  markdownRender: v.optional(v.string()),
  metaDescription: v.optional(v.string()),
  metaTitle: v.optional(v.string()),
  order: v.number(),
  priceAmount: v.optional(v.number()),
  priceNote: v.optional(v.string()),
  pricingType,
  publishedAt: v.optional(v.number()),
  renderType: v.optional(renderType),
  slug: v.string(),
  status: contentStatus,
  thumbnail: v.optional(v.string()),
  thumbnailStorageId: v.optional(v.union(v.id("_storage"), v.null())),
  title: v.string(),
  views: v.number(),
});

const chapterDoc = v.object({
  _creationTime: v.number(),
  _id: v.id("courseChapters"),
  active: v.boolean(),
  courseId: v.id("courses"),
  createdAt: v.number(),
  order: v.number(),
  summary: v.optional(v.string()),
  title: v.string(),
  updatedAt: v.number(),
});

const lessonDoc = v.object({
  _creationTime: v.number(),
  _id: v.id("courseLessons"),
  active: v.boolean(),
  chapterId: v.id("courseChapters"),
  courseId: v.id("courses"),
  createdAt: v.number(),
  description: v.optional(v.string()),
  durationSeconds: v.optional(v.number()),
  exerciseLink: v.optional(v.string()),
  isPreview: v.boolean(),
  order: v.number(),
  title: v.string(),
  updatedAt: v.number(),
  videoType,
  videoUrl: v.optional(v.string()),
});

const paginatedCourses = v.object({
  continueCursor: v.string(),
  isDone: v.boolean(),
  page: v.array(courseDoc),
  pageStatus: v.optional(v.union(v.literal("SplitRecommended"), v.literal("SplitRequired"), v.null())),
  splitCursor: v.optional(v.union(v.string(), v.null())),
});

export const list = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => ctx.db.query("courses").paginate(args.paginationOpts),
  returns: paginatedCourses,
});

export const listAll = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => CoursesModel.listWithLimit(ctx, { limit: args.limit }),
  returns: v.array(courseDoc),
});

export const listAdminWithOffset = query({
  args: {
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    search: v.optional(v.string()),
    status: v.optional(contentStatus),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 10, 100);
    const offset = args.offset ?? 0;
    const fetchLimit = Math.min(offset + limit + 20, 500);
    let courses: Doc<"courses">[] = [];

    if (args.search?.trim()) {
      const searchLower = args.search.toLowerCase().trim();
      const searchQuery = ctx.db
        .query("courses")
        .withSearchIndex("search_title", (q) => {
          const builder = q.search("title", searchLower);
          return args.status ? builder.eq("status", args.status) : builder;
        });
      courses = await searchQuery.take(fetchLimit);
    } else if (args.status) {
      courses = await ctx.db
        .query("courses")
        .withIndex("by_status_publishedAt", (q) => q.eq("status", args.status!))
        .order("desc")
        .take(fetchLimit);
    } else {
      courses = await ctx.db
        .query("courses")
        .order("desc")
        .take(fetchLimit);
    }

    if (args.search?.trim() && courses.length > 0) {
      const searchLower = args.search.toLowerCase().trim();
      courses = courses.filter((course) => course.title.toLowerCase().includes(searchLower));
    }

    return courses.slice(offset, offset + limit);
  },
  returns: v.array(courseDoc),
});

export const countAdmin = query({
  args: {
    search: v.optional(v.string()),
    status: v.optional(contentStatus),
  },
  handler: async (ctx, args) => {
    const limit = 5000;
    let courses: Doc<"courses">[] = [];

    if (args.search?.trim()) {
      const searchLower = args.search.toLowerCase().trim();
      const searchQuery = ctx.db
        .query("courses")
        .withSearchIndex("search_title", (q) => {
          const builder = q.search("title", searchLower);
          return args.status ? builder.eq("status", args.status) : builder;
        });
      courses = await searchQuery.take(limit + 1);
    } else if (args.status) {
      courses = await ctx.db
        .query("courses")
        .withIndex("by_status_publishedAt", (q) => q.eq("status", args.status!))
        .take(limit + 1);
    } else {
      courses = await ctx.db.query("courses").take(limit + 1);
    }

    return { count: Math.min(courses.length, limit), hasMore: courses.length > limit };
  },
  returns: v.object({ count: v.number(), hasMore: v.boolean() }),
});

export const listAdminIds = query({
  args: {
    limit: v.optional(v.number()),
    search: v.optional(v.string()),
    status: v.optional(contentStatus),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 5000, 5000);
    let courses: Doc<"courses">[] = [];

    if (args.search?.trim()) {
      const searchLower = args.search.toLowerCase().trim();
      const searchQuery = ctx.db
        .query("courses")
        .withSearchIndex("search_title", (q) => {
          const builder = q.search("title", searchLower);
          return args.status ? builder.eq("status", args.status) : builder;
        });
      courses = await searchQuery.take(limit + 1);
    } else if (args.status) {
      courses = await ctx.db
        .query("courses")
        .withIndex("by_status_publishedAt", (q) => q.eq("status", args.status!))
        .take(limit + 1);
    } else {
      courses = await ctx.db.query("courses").take(limit + 1);
    }

    const hasMore = courses.length > limit;
    return { ids: courses.slice(0, limit).map((course) => course._id), hasMore };
  },
  returns: v.object({ ids: v.array(v.id("courses")), hasMore: v.boolean() }),
});

export const count = query({
  args: { status: v.optional(contentStatus) },
  handler: async (ctx, args) => CoursesModel.countWithLimit(ctx, { status: args.status }),
  returns: v.object({
    count: v.number(),
    hasMore: v.boolean(),
  }),
});

export const getById = query({
  args: { id: v.id("courses") },
  handler: async (ctx, args) => ctx.db.get(args.id),
  returns: v.union(courseDoc, v.null()),
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => ctx.db
    .query("courses")
    .withIndex("by_slug", (q) => q.eq("slug", args.slug))
    .unique(),
  returns: v.union(courseDoc, v.null()),
});

export const getAdditionalCategoryIds = query({
  args: { id: v.id("courses") },
  handler: async (ctx, args) => {
    const course = await ctx.db.get(args.id);
    if (!course) {
      return [];
    }
    return listCourseAdditionalCategoryIds(ctx, args.id, course.categoryId);
  },
  returns: v.array(v.id("courseCategories")),
});

export const listByCategory = query({
  args: {
    categoryId: v.id("courseCategories"),
    paginationOpts: paginationOptsValidator,
    status: v.optional(contentStatus),
  },
  handler: async (ctx, args) => {
    if (args.status) {
      return ctx.db
        .query("courses")
        .withIndex("by_category_status", (q) =>
          q.eq("categoryId", args.categoryId).eq("status", args.status!)
        )
        .paginate(args.paginationOpts);
    }
    return ctx.db
      .query("courses")
      .withIndex("by_category_status", (q) => q.eq("categoryId", args.categoryId))
      .paginate(args.paginationOpts);
  },
  returns: paginatedCourses,
});

export const listPublished = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => ctx.db
    .query("courses")
    .withIndex("by_status_publishedAt", (q) => q.eq("status", "Published"))
    .order("desc")
    .paginate(args.paginationOpts),
  returns: paginatedCourses,
});

export const listFeatured = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 6, 20);
    return ctx.db
      .query("courses")
      .withIndex("by_status_featured", (q) => q.eq("status", "Published").eq("featured", true))
      .order("desc")
      .take(limit);
  },
  returns: v.array(courseDoc),
});

export const listRecent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 5, 20);
    return ctx.db
      .query("courses")
      .withIndex("by_status_publishedAt", (q) => q.eq("status", "Published"))
      .order("desc")
      .take(limit);
  },
  returns: v.array(courseDoc),
});

export const listPublishedPaginated = query({
  args: {
    categoryId: v.optional(v.id("courseCategories")),
    paginationOpts: paginationOptsValidator,
    sortBy: v.optional(v.union(
      v.literal("newest"),
      v.literal("oldest"),
      v.literal("popular"),
    )),
  },
  handler: async (ctx, args) => {
    const sortBy = args.sortBy ?? "newest";

    if (args.categoryId) {
      const result = await ctx.db
        .query("courses")
        .withIndex("by_category_status", (q) =>
          q.eq("categoryId", args.categoryId!).eq("status", "Published")
        )
        .order(sortBy === "oldest" ? "asc" : "desc")
        .paginate(args.paginationOpts);
      const page = await isMultiCategoryEnabled(ctx, "courses")
        ? await mergeCoursesByCategoryAssignments(ctx, args.categoryId, result.page, args.paginationOpts.numItems)
        : result.page;
      return { ...result, page: page.filter((course) => course.status === "Published") };
    }

    if (sortBy === "popular") {
      return ctx.db
        .query("courses")
        .withIndex("by_status_views", (q) => q.eq("status", "Published"))
        .order("desc")
        .paginate(args.paginationOpts);
    }

    return ctx.db
      .query("courses")
      .withIndex("by_status_publishedAt", (q) => q.eq("status", "Published"))
      .order(sortBy === "oldest" ? "asc" : "desc")
      .paginate(args.paginationOpts);
  },
  returns: paginatedCourses,
});

export const listPublishedWithOffset = query({
  args: {
    categoryId: v.optional(v.id("courseCategories")),
    level: v.optional(courseLevel),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    search: v.optional(v.string()),
    sortBy: v.optional(v.union(
      v.literal("newest"),
      v.literal("oldest"),
      v.literal("popular"),
      v.literal("title"),
      v.literal("price_asc"),
      v.literal("price_desc")
    )),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 12, 50);
    const offset = args.offset ?? 0;
    const sortBy = args.sortBy ?? "newest";
    const fetchLimit = offset + limit + 10;
    let courses: Doc<"courses">[] = [];

    if (args.search?.trim()) {
      const searchLower = args.search.toLowerCase().trim();
      const searchQuery = ctx.db
        .query("courses")
        .withSearchIndex("search_title", (q) => {
          const builder = q.search("title", searchLower).eq("status", "Published");
          return args.categoryId ? builder.eq("categoryId", args.categoryId) : builder;
        });
      courses = await searchQuery.take(fetchLimit);
      if (args.level) {
        courses = courses.filter((course) => course.level === args.level);
      }
    } else if (args.categoryId) {
      courses = await ctx.db
        .query("courses")
        .withIndex("by_category_status", (q) =>
          q.eq("categoryId", args.categoryId!).eq("status", "Published")
        )
        .take(fetchLimit);
      if (await isMultiCategoryEnabled(ctx, "courses")) {
        courses = await mergeCoursesByCategoryAssignments(ctx, args.categoryId, courses, fetchLimit);
        courses = courses.filter((course) => course.status === "Published");
      }
      if (args.level) {
        courses = courses.filter((course) => course.level === args.level);
      }
    } else if (args.level) {
      courses = await ctx.db
        .query("courses")
        .withIndex("by_status_level", (q) => q.eq("status", "Published").eq("level", args.level))
        .take(fetchLimit);
    } else if (sortBy === "popular") {
      courses = await ctx.db
        .query("courses")
        .withIndex("by_status_views", (q) => q.eq("status", "Published"))
        .order("desc")
        .take(fetchLimit);
    } else {
      courses = await ctx.db
        .query("courses")
        .withIndex("by_status_publishedAt", (q) => q.eq("status", "Published"))
        .order(sortBy === "oldest" ? "asc" : "desc")
        .take(fetchLimit);
    }

    if (args.search?.trim() && courses.length > 0) {
      const ranked = rankByFuzzyMatches(
        courses,
        args.search,
        (course) => [course.title ?? "", course.excerpt ?? ""],
        42,
      );
      courses = ranked.map((entry) => entry.item);
    }

    if (!args.search?.trim()) {
      switch (sortBy) {
        case "oldest":
          courses.sort((a, b) => (a.publishedAt ?? 0) - (b.publishedAt ?? 0));
          break;
        case "popular":
          courses.sort((a, b) => b.views - a.views);
          break;
        case "title":
          courses.sort((a, b) => a.title.localeCompare(b.title, "vi"));
          break;
        case "price_asc":
          courses.sort((a, b) => (a.priceAmount ?? 0) - (b.priceAmount ?? 0));
          break;
        case "price_desc":
          courses.sort((a, b) => (b.priceAmount ?? 0) - (a.priceAmount ?? 0));
          break;
        default:
          courses.sort((a, b) => (b.publishedAt ?? 0) - (a.publishedAt ?? 0));
      }
    }

    return courses.slice(offset, offset + limit);
  },
  returns: v.array(courseDoc),
});

export const searchPublished = query({
  args: {
    categoryId: v.optional(v.id("courseCategories")),
    limit: v.optional(v.number()),
    search: v.optional(v.string()),
    sortBy: v.optional(v.union(
      v.literal("newest"),
      v.literal("oldest"),
      v.literal("popular"),
      v.literal("title"),
      v.literal("price_asc"),
      v.literal("price_desc")
    )),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 20, 100);
    const sortBy = args.sortBy ?? "newest";
    let courses: Doc<"courses">[] = [];

    if (args.categoryId) {
      courses = await ctx.db
        .query("courses")
        .withIndex("by_category_status", (q) =>
          q.eq("categoryId", args.categoryId!).eq("status", "Published")
        )
        .take(limit * 2);
      if (await isMultiCategoryEnabled(ctx, "courses")) {
        courses = await mergeCoursesByCategoryAssignments(ctx, args.categoryId, courses, limit * 2);
        courses = courses.filter((course) => course.status === "Published");
      }
    } else if (sortBy === "popular") {
      courses = await ctx.db
        .query("courses")
        .withIndex("by_status_views", (q) => q.eq("status", "Published"))
        .order("desc")
        .take(limit * 2);
    } else {
      courses = await ctx.db
        .query("courses")
        .withIndex("by_status_publishedAt", (q) => q.eq("status", "Published"))
        .order(sortBy === "oldest" ? "asc" : "desc")
        .take(limit * 2);
    }

    if (args.search?.trim()) {
      const searchLower = args.search.toLowerCase().trim();
      courses = courses.filter((course) =>
        course.title.toLowerCase().includes(searchLower) ||
        (course.excerpt?.toLowerCase().includes(searchLower))
      );
    }

    if (args.categoryId || !["newest", "oldest", "popular"].includes(sortBy)) {
      switch (sortBy) {
        case "oldest":
          courses.sort((a, b) => (a.publishedAt ?? 0) - (b.publishedAt ?? 0));
          break;
        case "popular":
          courses.sort((a, b) => b.views - a.views);
          break;
        case "title":
          courses.sort((a, b) => a.title.localeCompare(b.title, "vi"));
          break;
        case "price_asc":
          courses.sort((a, b) => (a.priceAmount ?? 0) - (b.priceAmount ?? 0));
          break;
        case "price_desc":
          courses.sort((a, b) => (b.priceAmount ?? 0) - (a.priceAmount ?? 0));
          break;
        default:
          courses.sort((a, b) => (b.publishedAt ?? 0) - (a.publishedAt ?? 0));
      }
    }

    return courses.slice(0, limit);
  },
  returns: v.array(courseDoc),
});

export const countPublished = query({
  args: {
    categoryId: v.optional(v.id("courseCategories")),
    level: v.optional(courseLevel),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.search?.trim()) {
      const searchLower = args.search.toLowerCase().trim();
      const searchQuery = ctx.db
        .query("courses")
        .withSearchIndex("search_title", (q) => {
          const builder = q.search("title", searchLower).eq("status", "Published");
          return args.categoryId ? builder.eq("categoryId", args.categoryId) : builder;
        });
      const courses = await searchQuery.take(1000);
      const ranked = rankByFuzzyMatches(
        courses,
        args.search,
        (course) => [course.title ?? "", course.excerpt ?? ""],
        42,
      );
      return args.level
        ? ranked.filter((entry) => entry.item.level === args.level).length
        : ranked.length;
    }

    if (args.categoryId) {
      const courses = await ctx.db
        .query("courses")
        .withIndex("by_category_status", (q) =>
          q.eq("categoryId", args.categoryId!).eq("status", "Published")
        )
        .take(1000);
      const mergedCourses = await isMultiCategoryEnabled(ctx, "courses")
        ? await mergeCoursesByCategoryAssignments(ctx, args.categoryId, courses, 1000)
        : courses;
      return mergedCourses.filter((course) =>
        course.status === "Published" && (!args.level || course.level === args.level)
      ).length;
    }

    if (args.level) {
      const courses = await ctx.db
        .query("courses")
        .withIndex("by_status_level", (q) => q.eq("status", "Published").eq("level", args.level))
        .take(1000);
      return courses.length;
    }

    const courses = await ctx.db
      .query("courses")
      .withIndex("by_status_publishedAt", (q) => q.eq("status", "Published"))
      .take(1000);
    return courses.length;
  },
  returns: v.number(),
});

export const create = mutation({
  args: {
    additionalCategoryIds: v.optional(v.array(v.id("courseCategories"))),
    categoryId: v.id("courseCategories"),
    comparePriceAmount: v.optional(v.number()),
    content: v.string(),
    durationSeconds: v.optional(v.number()),
    durationText: v.optional(v.string()),
    excerpt: v.optional(v.string()),
    featured: v.optional(v.boolean()),
    htmlRender: v.optional(v.string()),
    instructorName: v.optional(v.string()),
    introVideoType: v.optional(videoType),
    introVideoUrl: v.optional(v.string()),
    isPriceVisible: v.optional(v.boolean()),
    level: v.optional(courseLevel),
    markdownRender: v.optional(v.string()),
    metaDescription: v.optional(v.string()),
    metaTitle: v.optional(v.string()),
    order: v.optional(v.number()),
    priceAmount: v.optional(v.number()),
    priceNote: v.optional(v.string()),
    pricingType,
    renderType: v.optional(renderType),
    slug: v.string(),
    status: v.optional(contentStatus),
    thumbnail: v.optional(v.string()),
    thumbnailStorageId: v.optional(v.union(v.id("_storage"), v.null())),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const id = await CoursesModel.create(ctx, args);
    if (await isMultiCategoryEnabled(ctx, "courses")) {
      await syncCourseCategoryAssignments(ctx, id, args.categoryId, args.additionalCategoryIds);
    }
    if (args.thumbnailStorageId) {
      await syncOwnerFilesAndCleanup(ctx, {
        ownerField: "thumbnail",
        ownerId: id,
        ownerTable: "courses",
        purpose: "course-thumbnail",
      }, [args.thumbnailStorageId]);
    }
    return id;
  },
  returns: v.id("courses"),
});

export const update = mutation({
  args: {
    additionalCategoryIds: v.optional(v.array(v.id("courseCategories"))),
    categoryId: v.optional(v.id("courseCategories")),
    comparePriceAmount: v.optional(v.number()),
    content: v.optional(v.string()),
    durationSeconds: v.optional(v.number()),
    durationText: v.optional(v.string()),
    excerpt: v.optional(v.string()),
    featured: v.optional(v.boolean()),
    htmlRender: v.optional(v.string()),
    id: v.id("courses"),
    instructorName: v.optional(v.string()),
    introVideoType: v.optional(videoType),
    introVideoUrl: v.optional(v.string()),
    isPriceVisible: v.optional(v.boolean()),
    level: v.optional(courseLevel),
    markdownRender: v.optional(v.string()),
    metaDescription: v.optional(v.string()),
    metaTitle: v.optional(v.string()),
    order: v.optional(v.number()),
    priceAmount: v.optional(v.number()),
    priceNote: v.optional(v.string()),
    pricingType: v.optional(pricingType),
    renderType: v.optional(renderType),
    slug: v.optional(v.string()),
    status: v.optional(contentStatus),
    thumbnail: v.optional(v.string()),
    thumbnailStorageId: v.optional(v.union(v.id("_storage"), v.null())),
    title: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const previous = await ctx.db.get(args.id);
    const nextArgs = { ...args };
    if (
      Object.prototype.hasOwnProperty.call(args, "thumbnailStorageId")
      && args.thumbnailStorageId === null
      && !Object.prototype.hasOwnProperty.call(args, "thumbnail")
    ) {
      nextArgs.thumbnail = "";
    }
    const modelArgs = { ...nextArgs };
    delete (modelArgs as { additionalCategoryIds?: unknown }).additionalCategoryIds;
    await CoursesModel.update(ctx, modelArgs);
    if (previous && await isMultiCategoryEnabled(ctx, "courses")) {
      await syncCourseCategoryAssignments(ctx, args.id, args.categoryId ?? previous.categoryId, args.additionalCategoryIds);
    }
    const shouldCheckStorage = Object.prototype.hasOwnProperty.call(args, "thumbnailStorageId");
    if (shouldCheckStorage && previous) {
      const nextThumbnailStorageId = Object.prototype.hasOwnProperty.call(args, "thumbnailStorageId")
        ? args.thumbnailStorageId ?? null
        : previous.thumbnailStorageId ?? null;
      await syncOwnerFilesAndCleanup(ctx, {
        ownerField: "thumbnail",
        ownerId: args.id,
        ownerTable: "courses",
        purpose: "course-thumbnail",
      }, [nextThumbnailStorageId], {
        previousStorageIds: [previous.thumbnailStorageId],
      });
    }
    return null;
  },
  returns: v.null(),
});

export const bulkClearBrokenMedia = mutation({
  args: { ids: v.array(v.id("courses")) },
  handler: async (ctx, args) => {
    let checked = 0;
    let updated = 0;
    let cleared = 0;
    let skipped = 0;

    for (const id of args.ids) {
      const course = await ctx.db.get(id);
      if (!course) {
        skipped += 1;
        continue;
      }
      checked += 1;
      if (await isBrokenStorageBackedUrl(ctx, course.thumbnail, course.thumbnailStorageId)) {
        await ctx.db.patch(id, { thumbnail: "", thumbnailStorageId: null });
        await syncOwnerFilesAndCleanup(ctx, {
          ownerField: "thumbnail",
          ownerId: id,
          ownerTable: "courses",
          purpose: "course-thumbnail",
        }, [], {
          previousStorageIds: [course.thumbnailStorageId],
        });
        updated += 1;
        cleared += 1;
      }
    }

    return { checked, cleared, skipped, updated };
  },
  returns: v.object({
    checked: v.number(),
    cleared: v.number(),
    skipped: v.number(),
    updated: v.number(),
  }),
});

export const incrementViews = mutation({
  args: { id: v.id("courses") },
  handler: async (ctx, args) => {
    await CoursesModel.incrementViews(ctx, args);
    return null;
  },
  returns: v.null(),
});

export const remove = mutation({
  args: { cascade: v.optional(v.boolean()), id: v.id("courses") },
  handler: async (ctx, args) => {
    const course = await ctx.db.get(args.id);
    await CoursesModel.remove(ctx, args);
    await removeOwnerFilesAndCleanup(ctx, {
      ownerId: args.id,
      ownerTable: "courses",
    }, {
      previousStorageIds: [course?.thumbnailStorageId],
    });
    return null;
  },
  returns: v.null(),
});

export const getDeleteInfo = query({
  args: { id: v.id("courses") },
  handler: async (ctx, args) => CoursesModel.getDeleteInfo(ctx, args),
  returns: v.object({
    canDelete: v.boolean(),
    dependencies: v.array(v.object({
      count: v.number(),
      hasMore: v.boolean(),
      label: v.string(),
      preview: v.array(v.object({ id: v.string(), name: v.string() })),
    })),
  }),
});

async function recalculateCourseCounts(ctx: MutationCtx, courseId: Doc<"courses">["_id"]) {
  await CoursesModel.recalculateCurriculumCounts(ctx, courseId);
}

export const listChapters = query({
  args: { courseId: v.id("courses") },
  handler: async (ctx, args) => ctx.db
    .query("courseChapters")
    .withIndex("by_course_order", (q) => q.eq("courseId", args.courseId))
    .take(500),
  returns: v.array(chapterDoc),
});

export const listLessonsByCourse = query({
  args: { courseId: v.id("courses") },
  handler: async (ctx, args) => ctx.db
    .query("courseLessons")
    .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
    .take(500),
  returns: v.array(lessonDoc),
});

export const listLessonsByChapter = query({
  args: { chapterId: v.id("courseChapters") },
  handler: async (ctx, args) => ctx.db
    .query("courseLessons")
    .withIndex("by_chapter_order", (q) => q.eq("chapterId", args.chapterId))
    .take(500),
  returns: v.array(lessonDoc),
});

export const createChapter = mutation({
  args: {
    active: v.optional(v.boolean()),
    courseId: v.id("courses"),
    order: v.optional(v.number()),
    summary: v.optional(v.string()),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const order = args.order ?? (await ctx.db
      .query("courseChapters")
      .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
      .take(1000)).length;
    const id = await ctx.db.insert("courseChapters", {
      active: args.active ?? true,
      courseId: args.courseId,
      createdAt: now,
      order,
      summary: args.summary,
      title: args.title,
      updatedAt: now,
    });
    await recalculateCourseCounts(ctx, args.courseId);
    return id;
  },
  returns: v.id("courseChapters"),
});

export const updateChapter = mutation({
  args: {
    active: v.optional(v.boolean()),
    id: v.id("courseChapters"),
    order: v.optional(v.number()),
    summary: v.optional(v.string()),
    title: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const chapter = await ctx.db.get(args.id);
    if (!chapter) {throw new Error("Chapter not found");}
    const { id, ...updates } = args;
    await ctx.db.patch(id, { ...updates, updatedAt: Date.now() });
    return null;
  },
  returns: v.null(),
});

export const removeChapter = mutation({
  args: { id: v.id("courseChapters") },
  handler: async (ctx, args) => {
    const chapter = await ctx.db.get(args.id);
    if (!chapter) {throw new Error("Chapter not found");}
    const lessons = await ctx.db
      .query("courseLessons")
      .withIndex("by_chapter_order", (q) => q.eq("chapterId", args.id))
      .take(500);
    await Promise.all(lessons.map((lesson) => ctx.db.delete(lesson._id)));
    await ctx.db.delete(args.id);
    await recalculateCourseCounts(ctx, chapter.courseId);
    return null;
  },
  returns: v.null(),
});

export const createLesson = mutation({
  args: {
    active: v.optional(v.boolean()),
    chapterId: v.id("courseChapters"),
    courseId: v.id("courses"),
    description: v.optional(v.string()),
    durationSeconds: v.optional(v.number()),
    exerciseLink: v.optional(v.string()),
    isPreview: v.optional(v.boolean()),
    order: v.optional(v.number()),
    title: v.string(),
    videoType: v.optional(videoType),
    videoUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const chapter = await ctx.db.get(args.chapterId);
    if (!chapter || chapter.courseId !== args.courseId) {
      throw new Error("Chapter does not belong to course");
    }
    const now = Date.now();
    const order = args.order ?? (await ctx.db
      .query("courseLessons")
      .withIndex("by_chapter_order", (q) => q.eq("chapterId", args.chapterId))
      .take(1000)).length;
    const id = await ctx.db.insert("courseLessons", {
      active: args.active ?? true,
      chapterId: args.chapterId,
      courseId: args.courseId,
      createdAt: now,
      description: args.description,
      durationSeconds: args.durationSeconds,
      exerciseLink: args.exerciseLink,
      isPreview: args.isPreview ?? false,
      order,
      title: args.title,
      updatedAt: now,
      videoType: args.videoType ?? "none",
      videoUrl: args.videoUrl,
    });
    await recalculateCourseCounts(ctx, args.courseId);
    return id;
  },
  returns: v.id("courseLessons"),
});

export const updateLesson = mutation({
  args: {
    active: v.optional(v.boolean()),
    description: v.optional(v.string()),
    durationSeconds: v.optional(v.number()),
    exerciseLink: v.optional(v.string()),
    id: v.id("courseLessons"),
    isPreview: v.optional(v.boolean()),
    order: v.optional(v.number()),
    title: v.optional(v.string()),
    videoType: v.optional(videoType),
    videoUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const lesson = await ctx.db.get(args.id);
    if (!lesson) {throw new Error("Lesson not found");}
    const { id, ...updates } = args;
    await ctx.db.patch(id, { ...updates, updatedAt: Date.now() });
    return null;
  },
  returns: v.null(),
});

export const removeLesson = mutation({
  args: { id: v.id("courseLessons") },
  handler: async (ctx, args) => {
    const lesson = await ctx.db.get(args.id);
    if (!lesson) {throw new Error("Lesson not found");}
    await ctx.db.delete(args.id);
    await recalculateCourseCounts(ctx, lesson.courseId);
    return null;
  },
  returns: v.null(),
});

export const reorderChapters = mutation({
  args: {
    orders: v.array(
      v.object({
        id: v.id("courseChapters"),
        order: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    for (const item of args.orders) {
      await ctx.db.patch(item.id, {
        order: item.order,
        updatedAt: Date.now(),
      });
    }
    return null;
  },
  returns: v.null(),
});

export const reorderLessons = mutation({
  args: {
    orders: v.array(
      v.object({
        id: v.id("courseLessons"),
        order: v.number(),
        chapterId: v.optional(v.id("courseChapters")),
      })
    ),
  },
  handler: async (ctx, args) => {
    const courseIdsToRecalculate = new Set<string>();

    for (const item of args.orders) {
      const lesson = await ctx.db.get(item.id);
      if (!lesson) {continue;}

      const patchData: { order: number; chapterId?: typeof item.chapterId; updatedAt: number } = {
        order: item.order,
        updatedAt: Date.now(),
      };

      if (item.chapterId && item.chapterId !== lesson.chapterId) {
        patchData.chapterId = item.chapterId;
        courseIdsToRecalculate.add(lesson.courseId);
      }

      await ctx.db.patch(item.id, patchData);
    }

    for (const courseId of courseIdsToRecalculate) {
      await recalculateCourseCounts(ctx, courseId as any);
    }

    return null;
  },
  returns: v.null(),
});

