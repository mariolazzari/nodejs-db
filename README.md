# Databases for Node.js Developers

## Course setup

### Getting tools ready

```sh
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
nvm install 22
node -v
nvm current
docker --version
```

## Introduction to Database

### Some basics about database

Collection of data organized for rapid search retrieval

#### Architectural overview

- DMS: database management system
- Table/Collection
- Indexes
- Disk/memory 

### Understanding relational database

Static schema definitio of:

- Tables
- Table structure
- Relation between records
  
#### Relations

- One-to-one (1:1)
- One-tomany (1:n)
- Many-to-many (m:n)
  - Cannot be stored directly
  - Joins

#### ACID properties

- Atomicity: "all or nothing" transaction
- Consistency: transaction transforms data from a valid state to another one
- Isolation: transactions leave data in a state as they were executed in sequence
- Durability: once committed, a transaction will be stored

#### Open source retalional database

- PostgreSQL
- MySQL

#### Commercial retalional database

- Oracle
- IBM DB2
- MicroSoft SQL Server

### Understading document database (NoSQL)

#### NoSql databases

- MongoDB
- CouchDB
- Couchbase
- Redis
- DunamoDB
- Cassandra, ClickHouse
- Neo5J

#### NoSql properties

- No integrity between relation
- No ACID compilant
- Document / graph based

#### Schemaless database

- No data structure
- Arbitrary data
- Schema management by application

### Selecting database

- Highly structurated data: SQL
- Data integrity: SQL
- Unstructured data: NoSQL
- High write performance: NoSQL
- Clustered system: NoSQL

## MongoDB

### MongoDB with Docker

```sh
docker pull mongo
docker run --name mongodb -p 27017:27017 -d mongo
docker start mongodb
```

### MongoDB with Compass

```sh
brew install --cask mongodb-compass
```

### Introducing Mongoose

[Mongoose docs](https://mongoosejs.com/)

### Setting up Mongoose and MongoDB

```js
export const config = {
  mongodb: {
    uri: process.env.MONGODB_URI || "mongodb://localhost:27017/simpleshop",
    options: {
      serverSelectionTimeoutMS: 3000,
      socketTimeoutMS: 3000,
    },
  },
};
```

```js
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
```

### Building Product model

```js
import mongoose from "mongoose";

const ItemSchema = new mongoose.Schema(
  {
    sku: {
      type: String,
      required: true,
      index: {
        unique: true,
      },
    },
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps,
  }
);

export const Item = mongoose.model("Item", ItemSchema);
```

### Integrating model into application

```js
import fp from "fastify-plugin";
import mongoose from "mongoose";
import { Item } from "../../models/mongoose/Item";

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
    // Make the Item model available through fastify
    fastify.decorate("Item", Item);
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
```

### Populate MongoDB

Import button on collection

### Querying items with Mongoose

```js
export default async function (fastify) {
  // Route to display all items with pagination
  fastify.get("/:tag?", async (request, reply) => {
    const { page = 1, limit = 10 } = request.query; // Defaults: page 1, 10 items per page
    const { tag } = request.params;

    const query = tag ? { tags: tag } : {};

    // Fetch all items with pagination
    const allItems = await fastify.Item.find(query)
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
```

### Item administration

```js
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
    const { itemId, sku, name, price } = request.body;

    // create or update an item
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
```

### Item CRUD

```js
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
```

### Optimizing queries with indexes

```js
import mongoose from "mongoose";

const ItemSchema = new mongoose.Schema(
  {
    sku: {
      type: String,
      required: true,
      index: {
        unique: true,
      },
    },
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// index by ascending tags
ItemSchema.index({ tags: 1 });
// index by ascending name
ItemSchema.index({ name: 1 });
// text index for text search on name and tags
ItemSchema.index({ name: "text", tags: "text" });

export const Item = mongoose.model("Item", ItemSchema);
```

### Performing text search in MongoDB

```js
export default async function (fastify) {
  // Route to display all items with pagination
  fastify.get("/:tag?", async (request, reply) => {
    const { page = 1, limit = 10, q } = request.query; // Defaults: page 1, 10 items per page
    const { tag } = request.params;

    const query = {};
    if (tag) {
      query.tags = tag;
    }
    if (q) {
      query.$text = { $search: q };
    }

    // Fetch all items with pagination
    const allItems = await fastify.Item.find(query)
      .sort({ name: 1 })
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
```

## MySQL

### Using MySQL for users and orders

### MySQL with Docker

```sh
docker pull mysql
docker run --name mysql -e MYSQL_ROOT_PASSWORD=secret -p 3306:3306 -d mysql
```

### MySQL WorkBench

```sh
brew install --cask mysqlworkbench
```

### Introducing Sequelize

[Sequelize](https://sequelize.org/)

### MySQL connection

```sh
pnpm add sequelize mysql2
```

```js
export const config = {
  server: {
    port: process.env.PORT || 3000,
  },
  mongodb: {
    uri: process.env.MONGODB_URI || "mongodb://localhost:27017/simpleshop",
    options: {
      serverSelectionTimeoutMS: 3000,
      socketTimeoutMS: 3000,
    },
  },
  mysql: {
    uri:
      process.env.MYSQL_URI || "mysql://root:secret@localhost:3306/simpleshop",
    options: {
      logging: false,
    },
  },
  session: {
    // Secret key to encrypt client side sessions.
    // Created on the terminal with `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
    secret: "x3cIkEhWRLRLBD8Zfhd2SUw0UEGieSjOVV2a1a82YEE=",
  },
};
```

```js
import fp from "fastify-plugin";
import { Sequelize } from "sequelize";

async function sequelizePlugin(fastify, config) {
  let mysqlStatus = "disconnected";

  // Connect to MySQL via Sequelize and update the status
  try {
    const sequelize = new Sequelize(config.uri, config.options);
    await sequelize.authenticate();
    fastify.log.info("MySQL connected via Sequelize");
    mysqlStatus = "connected";
    fastify.decorate("sequelize", sequelize);
  } catch (error) {
    fastify.log.error("Unable to connect to MySQL via Sequelize:", error);
    mysqlStatus = "error";
    throw error;
  }

  fastify.decorate("mysqlStatus", () => mysqlStatus);

  // Graceful shutdown
  fastify.addHook("onClose", async (fastifyInstance, done) => {
    mysqlStatus = "disconnected";
    // Close Sequelize connection
    await fastifyInstance.sequelize.close();
    fastifyInstance.log.info("MySQL connection closed");
    done();
  });
}

export default fp(sequelizePlugin, { name: "sequelize-plugin" });
```

### Designing database structure

### Sequelize user model

```js
import { DataTypes } from "sequelize";

export default sequelize => {
  const User = sequelize.define("User", {
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      validate: { isEmail: true },
    },
    password: { type: DataTypes.STRING, allowNull: false },
  });

  return User;
};

User.associate = models => {
  User.hasMany(models.Order, { foreignKey: "userId", as: "orders" });
};
```

### Sequelize order model

```js
export default (sequelize, DataTypes) => {
  const Order = sequelize.define("Order", {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: "pending",
    },
  });

  Order.associate = models => {
    Order.belongsTo(models.User, { foreignKey: "userId", as: "user" });
    Order.hasMany(models.OrderItem, { foreignKey: "orderId", as: "items" });
  };

  return Order;
};
```

```js
export default (sequelize, DataTypes) => {
  const OrderItem = sequelize.define("OrderItem", {
    sku: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
  });

  OrderItem.associate = models => {
    OrderItem.belongsTo(models.Order, { foreignKey: "orderId", as: "order" });
  };

  return OrderItem;
};
```

### Loadind and Syncing models

```js
import fp from "fastify-plugin";
import { Sequelize } from "sequelize";
import { readdir } from "fs/promises";
import path from "path";

async function sequelizePlugin(fastify, config) {
  let mysqlStatus = "disconnected";

  // Connect to MySQL via Sequelize and update the status
  try {
    const sequelize = new Sequelize(config.uri, config.options);
    await sequelize.authenticate();
    fastify.log.info("MySQL connected via Sequelize");
    mysqlStatus = "connected";
    fastify.decorate("sequelize", sequelize);

    // models
    const models = {};
    const modelsPath = path.resolve("src/models/sequelize");
    const modelsFiles = await readdir(modelsPath);

    for (const file of modelsFiles) {
      if (file.endsWith(".js")) {
        const model = (await import(path.join(modelsPath, file))).default(
          sequelize,
          Sequelize.DataTypes
        );
        models[model.name] = model;
      }
    }

    Object.keys(models).forEach(modelName => {
      if (models[modelName].associate) {
        models[modelName].associate(models);
      }
    });

    await sequelize.sync({ alter: false });
    fastify.log.info("Sequelize models loaded");
    fastify.decorate("models", models);
  } catch (error) {
    fastify.log.error("Unable to connect to MySQL via Sequelize:", error);
    mysqlStatus = "error";
    throw error;
  }

  fastify.decorate("mysqlStatus", () => mysqlStatus);

  // Graceful shutdown
  fastify.addHook("onClose", async (fastifyInstance, done) => {
    mysqlStatus = "disconnected";
    // Close Sequelize connection
    await fastifyInstance.sequelize.close();
    fastifyInstance.log.info("MySQL connection closed");
    done();
  });
}

export default fp(sequelizePlugin, { name: "sequelize-plugin" });
```

### User CRUD with Sequelize

```js
export default async function (fastify) {
  // GET /admin/user - Fetch and display a list of users
  fastify.get("/", async (request, reply) => {
    try {
      // Fetch users from the database
      const users = await fastify.models.User.findAll();

      return reply.view("admin/user.ejs", {
        title: "Manage Users",
        currentPath: "/admin/user",
        users,
      });
    } catch (error) {
      request.log.error(error);
      request.session.set("messages", [
        { type: "danger", text: "Failed to fetch users." },
      ]);
      return reply.redirect("/admin/user");
    }
  });

  // POST /admin/user - Create or update a user
  fastify.post("/", async (request, reply) => {
    const { userId, email, password } = request.body;

    try {
      if (userId) {
        // Update existing user in the database
        const user = await fastify.models.User.findByPk(userId);
        if (!user) {
          throw new Error("User not found");
        }

        user.email = email;
        if (password) {
          user.password = password; // Assume password is hashed in model hook
        }
        await user.save();

        request.session.set("messages", [
          { type: "success", text: "User updated successfully." },
        ]);
      } else {
        // Create a new user in the database
        await fastify.models.User.create({ email, password });
        request.session.set("messages", [
          { type: "success", text: "User created successfully." },
        ]);
      }
      return reply.redirect("/admin/user");
    } catch (error) {
      request.log.error(error);
      request.session.set("messages", [
        { type: "danger", text: "Failed to save user." },
      ]);
      return reply.redirect("/admin/user");
    }
  });

  // GET /admin/user/:id - Fetch a specific user for editing
  fastify.get("/:id", async (request, reply) => {
    const { id } = request.params;

    try {
      // Fetch user by ID from the database
      const user = await fastify.models.User.findByPk(id);
      if (!user) {
        request.session.set("messages", [
          { type: "danger", text: "User not found." },
        ]);
        return reply.redirect("/admin/user");
      }

      return reply.view("admin/user.ejs", {
        title: "Edit User",
        currentPath: "/admin/user",
        user,
        users: [], // Pass empty users array
      });
    } catch (error) {
      request.log.error(error);
      request.session.set("messages", [
        { type: "danger", text: "Failed to fetch user." },
      ]);
      return reply.redirect("/admin/user");
    }
  });

  // GET /admin/user/delete/:id - Delete a user
  fastify.get("/delete/:id", async (request, reply) => {
    const { id } = request.params;

    try {
      // Delete user from the database
      const user = await fastify.models.User.findByPk(id);
      if (!user) {
        throw new Error("User not found");
      }
      await user.destroy();

      request.session.set("messages", [
        { type: "success", text: "User deleted successfully." },
      ]);
      return reply.redirect("/admin/user");
    } catch (error) {
      request.log.error(error);
      request.session.set("messages", [
        { type: "danger", text: "Failed to delete user." },
      ]);
      return reply.redirect("/admin/user");
    }
  });

  // GET /admin/user/impersonate/:id - Impersonate a user
  fastify.get("/impersonate/:id", async (request, reply) => {
    const { id } = request.params;
    const user = await fastify.models.User.findByPk(id);
    if (!user) {
      request.session.set("messages", [
        { type: "danger", text: "User not found." },
      ]);
      return reply.redirect("/admin/user");
    }

    request.session.set("user", { id: user.id, email: user.email });

    try {
      // Placeholder: Impersonate user by ID
      return reply.redirect("/"); // Redirect after impersonation
    } catch (error) {
      request.log.error(error);
      request.session.set("messages", [
        { type: "danger", text: "Failed to impersonate user." },
      ]);
      return reply.redirect("/admin/user");
    }
  });
}
```

### Securing credentials

```sh
pnpm add argon2
```

```js
import argon2 from "argon2";

export default (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
      email: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
        validate: { isEmail: true },
      },
      password: { type: DataTypes.STRING, allowNull: false },
    },
    {
      hooks: {
        beforeCreate: async user => {
          if (user.password) {
            const hash = await argon2.hash(user.password);
            user.password = hash;
          }
        },
      },
    }
  );

  User.prototype.setPassword = async function (password) {
    const hash = await argon2.hash(password);
    this.password = hash;
  };

  User.prototype.validatePassword = async function (password) {
    return argon2.verify(this.password, password);
  };

  User.associate = models => {
    User.hasMany(models.Order, { foreignKey: "userId", as: "orders" });
  };

  return User;
};
```

### User login

```js
export default async function (fastify) {
  // GET /login - Render the login form
  fastify.get("/login", async (req, reply) => {
    try {
      if (req.session.get("user")) {
        // Redirect if already logged in
        return reply.redirect("/");
      }

      return reply.view("login", {
        currentPath: "/user/login",
        messages: req.session.get("messages") || [],
      });
    } catch (error) {
      req.session.set("messages", [
        { type: "danger", text: "Failed to load login page." },
      ]);
      req.log.error("Error rendering login page:", error);
      return reply.redirect("/");
    }
  });

  // POST /login - Handle login logic with validation
  fastify.post(
    "/login",
    {
      schema: {
        body: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email" },
            password: { type: "string", minLength: 6 },
          },
          additionalProperties: false, // Prevent unexpected properties
        },
      },
      attachValidation: true, // Attach validation errors
    },
    async (req, reply) => {
      try {
        if (req.validationError) {
          req.session.set("messages", [
            { type: "danger", text: "Invalid email or password format." },
          ]);
          return reply.redirect("/user/login");
        }

        const { email, password } = req.body;
        const user = await fastify.sequelize.models.User.findOne({
          where: { email },
        });
        if (!user) {
          req.session.set("messages", [
            { type: "danger", text: "Invalid email or password." },
          ]);
          return reply.redirect("/user/login");
        }

        const isPasswordValid = await user.validatePassword(password);
        if (!isPasswordValid) {
          req.session.set("messages", [
            { type: "danger", text: "Invalid email or password." },
          ]);
          return reply.redirect("/user/login");
        }

        // Successful login
        req.session.set("user", { id: user.id, email: user.email });
        req.session.set("messages", [
          { type: "success", text: "Login successful!" },
        ]);

        return reply.redirect("/user/login");
      } catch (error) {
        req.session.set("messages", [
          { type: "danger", text: "Login failed due to an error." },
        ]);
        req.log.error("Error handling login:", error);
        return reply.redirect("/user/login");
      }
    }
  );

  // GET /logout - Clear the session and redirect to the login page
  fastify.get("/logout", async (req, reply) => {
    try {
      req.session.delete(); // Clear the session
      req.session.set("messages", [
        { type: "success", text: "You have been logged out." },
      ]);
      return reply.redirect("/user/login");
    } catch (error) {
      req.session.set("messages", [
        { type: "danger", text: "Failed to log out." },
      ]);
      req.log.error("Error logging out:", error);
      return reply.redirect("/");
    }
  });
}
```

## Redis

### Session management with Redis

- In memory with periodic snapshot
- O(1)
- Ephemeral data
- Caching, sessions

#### Redis data types

- Strings
- Lists
- Sorted sets
- Hashmaps

### Redis with Docker

```sh
docker pull redis
docker run --name redis -p 6379:6379 -d redis
```

### Redis insight

```sh
brew install --cask redis-insight
```

### Redis connection

```sh
pnpm add ioredis
```

```js
import fp from "fastify-plugin";
import Redis from "ioredis";

async function redisPlugin(fastify, config) {
  let redisStatus = "disconnected";

  // Connect to Redis and update the status
  try {
    const redis = new Redis(config.host, config.port);
    redisStatus = "connected";
    fastify.log.info("Connected to Redis");
    fastify.decorate("redis", redis);
  } catch (ex) {
    redisStatus = "error";
    fastify.log.error("Error connecting to Redis:", ex);
    throw ex;
  }
  fastify.decorate("redisStatus", () => redisStatus);

  // Graceful shutdown
  fastify.addHook("onClose", async (fastifyInstance, done) => {
    redisStatus = "disconnected";
    // Close Redis connection
    await fastifyInstance.redis.quit();
    fastifyInstance.log.info("Redis connection closed");
    done();
  });
}

export default fp(redisPlugin, { name: "redis-plugin" });
```

### User sessio with Redis

```sh
pnpm add @fastify/cookie @fastify/session connect-redis 
```

### Redis basic operations part 1

```js
function requireLogin(req, reply) {
  if (!req.session.get("user")) {
    req.session.set("messages", [
      { type: "warning", text: "Please log in first." },
    ]);
    reply.redirect("/user/login");
    return false; // Prevent further execution
  }
  return true; // Allow execution to continue
}

function basketKey(req) {
  const user = req.session.get("user");
  if (!user) {
    return null;
  }
  return `myBasket:user:${user.id}:items`;
}

export default async function (fastify) {
  // Route to display basket contents
  fastify.get("/", async (req, reply) => {
    try {
      if (!requireLogin(req, reply)) return; // Stop execution if user is not logged in

      fastify.log.info("Fetching basket contents.");
      // Fetch basket contents from Redis
      const key = basketKey(req);
      if (!key) {
        throw new Error("User session is invalid.");
      }
      const basketItems = await fastify.redis.hgetall(key);
      const items = Object.entries(basketItems).map(([sku, quantity]) => ({
        sku,
        quantity: +quantity,
      }));

      return reply.view("basket.ejs", {
        title: "Your Basket",
        currentPath: "/basket",
        items,
      });
    } catch (error) {
      fastify.log.error("Error fetching basket contents:", error);
      req.session.set("messages", [
        { type: "danger", text: "Failed to load basket contents." },
      ]);
      return reply.redirect("/basket");
    }
  });

  // Route to add an item to the basket
  fastify.post("/add", async (req, reply) => {
    try {
      if (!requireLogin(req, reply)) return;

      const { sku, quantity } = req.body;
      fastify.log.info(`Adding item with SKU: ${sku}, quantity: ${quantity}`);

      // Add the item to the Redis basket
      const key = basketKey(req);
      if (!key) {
        throw new Error("User session is invalid.");
      }
      await fastify.redis.hincrby(key, sku, +quantity);

      req.session.set("messages", [
        {
          type: "success",
          text: `Item with SKU: ${sku} was added to the basket.`,
        },
      ]);
      return reply.redirect(req.headers.referer || "/basket");
    } catch (error) {
      fastify.log.error("Error adding item to basket:", error);
      req.session.set("messages", [
        { type: "danger", text: "Failed to add item to the basket." },
      ]);
      return reply.redirect("/basket");
    }
  });

  // Route to remove an item from the basket
  fastify.post("/remove", async (req, reply) => {
    try {
      if (!requireLogin(req, reply)) return;

      const { sku } = req.body;
      fastify.log.info(`Removing item with SKU: ${sku}`);

      // Remove the item from the Redis basket
      const key = basketKey(req);
      if (!key) {
        throw new Error("User session is invalid.");
      }
      await fastify.redis.hdel(key, sku);

      req.session.set("messages", [
        {
          type: "success",
          text: `Item with SKU: ${sku} was removed from the basket.`,
        },
      ]);
      return reply.redirect(req.headers.referer || "/basket");
    } catch (error) {
      fastify.log.error("Error removing item from basket:", error);
      req.session.set("messages", [
        { type: "danger", text: "Failed to remove item from the basket." },
      ]);
      return reply.redirect("/basket");
    }
  });

  // Route to buy all items in the basket
  fastify.post("/buy", async (req, reply) => {
    try {
      if (!requireLogin(req, reply)) return;

      fastify.log.info("Processing basket purchase...");
      // Retrieve basket items from Redis and process purchase
      const key = basketKey(req);
      if (!key) {
        throw new Error("User session is invalid.");
      }
      const basketItems = await fastify.redis.hgetall(key);
      if (Object.keys(basketItems).length === 0) {
        req.session.set("messages", [
          { type: "info", text: "Your basket is empty." },
        ]);
        return reply.redirect("/basket");
      }

      // Clear the basket after successful purchase
      await fastify.redis.del(key);

      req.session.set("messages", [
        {
          type: "success",
          text: "Thank you for your purchase! Your basket has been processed.",
        },
      ]);
      return reply.redirect("/");
    } catch (error) {
      fastify.log.error("Error processing basket purchase:", error);
      req.session.set("messages", [
        { type: "danger", text: "Failed to process your purchase." },
      ]);
      return reply.redirect("/basket");
    }
  });

  // Route to clear the basket
  fastify.post("/clear", async (req, reply) => {
    try {
      if (!requireLogin(req, reply)) return;

      fastify.log.info("Clearing all items from the basket.");
      // Clear all basket items from Redis
      const key = basketKey(req);
      if (!key) {
        throw new Error("User session is invalid.");
      }
      await fastify.redis.del(key);

      req.session.set("messages", [
        { type: "success", text: "Your basket has been cleared." },
      ]);
      return reply.redirect(req.headers.referer || "/basket");
    } catch (error) {
      fastify.log.error("Error clearing basket:", error);
      req.session.set("messages", [
        { type: "danger", text: "Failed to clear the basket." },
      ]);
      return reply.redirect("/basket");
    }
  });
}
```

### Redis basic operations part 2

```js
import fp from "fastify-plugin";

async function defaultsPlugin(fastify) {
  fastify.addHook("preHandler", async (req, reply) => {
    const user = req.session.get("user");
    if (!user) {
      return null;
    }
    const key = `myBasket:user:${user.id}:items`;
    const basketItems = await fastify.redis.hgetall(key);
    const basketCount = Object.values(basketItems).reduce(
      (sum, qty) => sum + parseInt(qty, 10),
      0
    );

    reply.locals = {
      ...(reply.locals || {}),
      basketCount,
    };
  });
}

export default fp(defaultsPlugin);
```

## Creating and Managing orders

### Fetching items from basket

```js
function requireLogin(req, reply) {
  if (!req.session.get("user")) {
    req.session.set("messages", [
      { type: "warning", text: "Please log in first." },
    ]);
    reply.redirect("/user/login");
    return false; // Prevent further execution
  }
  return true; // Allow execution to continue
}

function basketKey(req) {
  const user = req.session.get("user");
  if (!user) {
    return null;
  }
  return `myBasket:user:${user.id}:items`;
}

export default async function (fastify) {
  // Route to display basket contents
  fastify.get("/", async (req, reply) => {
    try {
      if (!requireLogin(req, reply)) return; // Stop execution if user is not logged in

      fastify.log.info("Fetching basket contents.");
      // Fetch basket contents from Redis
      const key = basketKey(req);
      if (!key) {
        throw new Error("User session is invalid.");
      }
      const basketItems = await fastify.redis.hgetall(key);
      const items = await Promise.all(
        Object.entries(basketItems).map(async ([sku, quantity]) => {
          const items = await fastify.Item.findOne({ sku });

          return {
            sku,
            name: items ? items.name : "Unknown Item",
            price: items ? items.price : "N/A",
            quantity: +quantity,
          };
        })
      );

      return reply.view("basket.ejs", {
        title: "Your Basket",
        currentPath: "/basket",
        items,
      });
    } catch (error) {
      fastify.log.error("Error fetching basket contents:", error);
      req.session.set("messages", [
        { type: "danger", text: "Failed to load basket contents." },
      ]);
      return reply.redirect("/basket");
    }
  });

  // Route to add an item to the basket
  fastify.post("/add", async (req, reply) => {
    try {
      if (!requireLogin(req, reply)) return;

      const { sku, quantity } = req.body;
      fastify.log.info(`Adding item with SKU: ${sku}, quantity: ${quantity}`);

      // Add the item to the Redis basket
      const key = basketKey(req);
      if (!key) {
        throw new Error("User session is invalid.");
      }
      await fastify.redis.hincrby(key, sku, +quantity);

      req.session.set("messages", [
        {
          type: "success",
          text: `Item with SKU: ${sku} was added to the basket.`,
        },
      ]);
      return reply.redirect(req.headers.referer || "/basket");
    } catch (error) {
      fastify.log.error("Error adding item to basket:", error);
      req.session.set("messages", [
        { type: "danger", text: "Failed to add item to the basket." },
      ]);
      return reply.redirect("/basket");
    }
  });

  // Route to remove an item from the basket
  fastify.post("/remove", async (req, reply) => {
    try {
      if (!requireLogin(req, reply)) return;

      const { sku } = req.body;
      fastify.log.info(`Removing item with SKU: ${sku}`);

      // Remove the item from the Redis basket
      const key = basketKey(req);
      if (!key) {
        throw new Error("User session is invalid.");
      }
      await fastify.redis.hdel(key, sku);

      req.session.set("messages", [
        {
          type: "success",
          text: `Item with SKU: ${sku} was removed from the basket.`,
        },
      ]);
      return reply.redirect(req.headers.referer || "/basket");
    } catch (error) {
      fastify.log.error("Error removing item from basket:", error);
      req.session.set("messages", [
        { type: "danger", text: "Failed to remove item from the basket." },
      ]);
      return reply.redirect("/basket");
    }
  });

  // Route to buy all items in the basket
  fastify.post("/buy", async (req, reply) => {
    try {
      if (!requireLogin(req, reply)) return;

      fastify.log.info("Processing basket purchase...");
      // Retrieve basket items from Redis and process purchase
      const key = basketKey(req);
      if (!key) {
        throw new Error("User session is invalid.");
      }
      const basketItems = await fastify.redis.hgetall(key);
      if (Object.keys(basketItems).length === 0) {
        req.session.set("messages", [
          { type: "info", text: "Your basket is empty." },
        ]);
        return reply.redirect("/basket");
      }

      // Clear the basket after successful purchase
      await fastify.redis.del(key);

      req.session.set("messages", [
        {
          type: "success",
          text: "Thank you for your purchase! Your basket has been processed.",
        },
      ]);
      return reply.redirect("/");
    } catch (error) {
      fastify.log.error("Error processing basket purchase:", error);
      req.session.set("messages", [
        { type: "danger", text: "Failed to process your purchase." },
      ]);
      return reply.redirect("/basket");
    }
  });

  // Route to clear the basket
  fastify.post("/clear", async (req, reply) => {
    try {
      if (!requireLogin(req, reply)) return;

      fastify.log.info("Clearing all items from the basket.");
      // Clear all basket items from Redis
      const key = basketKey(req);
      if (!key) {
        throw new Error("User session is invalid.");
      }
      await fastify.redis.del(key);

      req.session.set("messages", [
        { type: "success", text: "Your basket has been cleared." },
      ]);
      return reply.redirect(req.headers.referer || "/basket");
    } catch (error) {
      fastify.log.error("Error clearing basket:", error);
      req.session.set("messages", [
        { type: "danger", text: "Failed to clear the basket." },
      ]);
      return reply.redirect("/basket");
    }
  });
}
```

### Creating order and transaction

```js

```
