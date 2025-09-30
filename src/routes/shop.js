export default async function (fastify) {
  // Route to display all items with pagination
  fastify.get("/:tag?", async (request, reply) => {
    const { page = 1, limit = 10 } = request.query; // Defaults: page 1, 10 items per page
    const { tag } = request.params;

    // Fetch all items with pagination
    const allItems = await fastify.Item.find({})
      .skip((page - 1) * limit)
      .limit(limit);

    // Fetch distinct tags for filtering
    const tags = await fastify.Item.distinct("tags");
    const totalPages = Math.ceil((await fastify.Item.countDocuments()) / limit);

    // Implement pagination
    const startIndex = (page - 1) * limit;
    const paginatedItems = allItems.slice(startIndex, startIndex + limit);

    // Render the shop view with paginated items and tags
    return reply.view("shop.ejs", {
      title: "Shop",
      currentPath: "/shop",
      items: allItems,
      tags,
      currentPage: +page,
      totalPages,
      currentTag: tag || null,
    });
  });
}
