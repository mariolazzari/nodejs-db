import fp from "fastify-plugin";
import mongoose from "mongoose";

async function mongoosePlugin(fastify, config) {
  let mongoStatus = "disconnected";

  // Makes the current connection status available to other plugins
  // This is used to show the connection status on the home page
  fastify.decorate("mongoStatus", () => mongoStatus);

  // Connect to MongoDB
  try {
    await mongoose.connect(config.uri, config.options);
    mongoStatus = "connected";
    fastify.log.info("Connected to MongoDB");
  } catch (error) {
    mongoStatus = "error";
    fastify.log.error("Error connecting to MongoDB:");
    throw error; // Rethrow the error to prevent the server from starting
  }

  // Graceful shutdown
  fastify.addHook("onClose", async (fastifyInstance, done) => {
    mongoStatus = "disconnected";
    // Close MongoDB connection
    await mongoose.disconnect();
    fastifyInstance.log.info("Disconnected from MongoDB");
    done();
  });
}

export default fp(mongoosePlugin, { name: "mongoose-plugin" });
