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

```
