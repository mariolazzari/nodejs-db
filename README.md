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
