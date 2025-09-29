export default async function (fastify) {
  // Route to display all items with pagination
  fastify.get("/:tag?", async (request, reply) => {
    const { page = 1, limit = 10 } = request.query; // Defaults: page 1, 10 items per page
    const { tag } = request.params;
    // Placeholder items (normally fetched from the database)
    const allItems = [
      { 
        id: "1",
        sku: "1001",
        name: "Placeholder Item 1",
        price: 10.99,
        tags: ["Tag1", "Tag2"]
      },
      {
        id: "2",
        sku: "1002",
        name: "Placeholder Item 2",
        price: 15.49,
        tags: ["Tag3"]
      },
      {
        id: "3",
        sku: "1003",
        name: "Placeholder Item 3",
        price: 20.0,
        tags: ["Tag1"]
      },
      {
        id: "4",
        sku: "1004",
        name: "Placeholder Item 4",
        price: 8.75,
        tags: ["Tag2", "Tag3"]
      }
    ];
    
    // Placeholder tags (normally fetched from the database)
    const tags = ["Tag1", "Tag2", "Tag3"];

    // Implement pagination
    const startIndex = (page - 1) * limit;
    const paginatedItems = allItems.slice(startIndex, startIndex + limit);

    // Render the shop view with paginated items and tags
    return reply.view("shop.ejs", {
      title: "Shop",
      currentPath: "/shop",
      items: paginatedItems,
      tags,
      currentPage: parseInt(page, 10),
      totalPages: Math.ceil(allItems.length / limit),
      currentTag: tag || null
    });
  });
}
