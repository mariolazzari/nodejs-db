export default async function (fastify) {
  // Route to display and manage items
  fastify.get("/", async (request, reply) => {
    // Placeholder for fetching items from the database
    const items = [
      // Example data, replace with database query
      { id: "1", sku: "1001", name: "Example Item 1", price: 10.99 },
      { id: "2", sku: "1002", name: "Example Item 2", price: 15.49 }
    ];

    return reply.view("admin/item.ejs", {
      title: "Manage Items",
      currentPath: "/admin/item",
      items
    });
  });

  // Route to create or edit an item
  fastify.post("/", async (request, reply) => {
    const { itemId, sku, name, price } = request.body;

    // Placeholder logic to create or update an item
    if (itemId) {
      fastify.log.info(`Updating item ${itemId}:`, { sku, name, price });
    } else {
      fastify.log.info(`Creating new item:`, { sku, name, price });
    }

    return reply.redirect("/admin/item");
  });

  // Route to delete an item
  fastify.get("/delete/:id", async (request, reply) => {
    const { id } = request.params;

    // Placeholder logic to delete an item
    fastify.log.info(`Deleting item with id: ${id}`);

    return reply.redirect("/admin/item");
  });

  // Route to fetch a single item for editing
  fastify.get("/:id", async (request, reply) => {
    const { id } = request.params;

    // Placeholder for fetching a single item from the database
    const item = { id, sku: "1001", name: "Example Item 1", price: 10.99 };

    return reply.view("admin/item.ejs", {
      title: "Edit Item",
      currentPath: "/admin/item",
      items: [], // Pass empty items array for simplicity
      item
    });
  });
}
