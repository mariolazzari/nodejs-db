export default async function (fastify) {
  // Route to display and manage items
  fastify.get("/", async (_request, reply) => {
    // fetching items from the database
    const items = await fastify.Item.find({});

    return reply.view("admin/item.ejs", {
      title: "Manage Items",
      currentPath: "/admin/item",
      items,
    });
  });

  // Route to create or edit an item
  fastify.post("/", async (request, reply) => {
    const { itemId, sku, name, price, tags } = request.body;

    const parsedTags = tags
      ? tags
          .split(",")
          .map(tag => tag.trim())
          .filter(tag => tag.length > 0)
      : [];

    try {
      // create or update an item
      if (itemId) {
        await fastify.Item.findByIdAndUpdate(itemId, {
          sku,
          name,
          price,
          tags: parsedTags,
        });
        fastify.log.info(`Updating item ${itemId}:`, { sku, name, price });
      } else {
        await fastify.Item.create({ sku, name, price, tags: parsedTags });
        fastify.log.info(`Creating new item: ${name}`);
      }

      request.session.set("messages", {
        type: "success",
        text: item ? `Item ${itemId} updated.` : "New item created.",
      });

      return reply.redirect("/admin/item");
    } catch (error) {
      fastify.log.error("Error creating/updating item:", error);

      request.session.set("messages", {
        type: "error",
        text: "An error occurred while processing your request.",
      });

      return reply.redirect("/admin/item");
    }
  });

  // Route to delete an item
  fastify.get("/delete/:id", async (request, reply) => {
    const { id } = request.params;

    try {
      // delete an item
      await fastify.Item.findByIdAndDelete(id);
      fastify.log.info(`Deleting item with id: ${id}`);
    } catch (error) {
      fastify.log.error("Error deleting item:", error);
    }

    return reply.redirect("/admin/item");
  });

  // Route to fetch a single item for editing
  fastify.get("/:id", async (request, reply) => {
    const { id } = request.params;

    // fetching a single item from the database
    const item = await fastify.Item.findById(id);

    return reply.view("admin/item.ejs", {
      title: "Edit Item",
      currentPath: "/admin/item",
      items: [], // Pass empty items array for simplicity
      item,
    });
  });
}
