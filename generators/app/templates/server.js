const bunyan = require('bunyan');
const express = require('express');
const { ApolloServer, gql } = require("apollo-server-express");
const { MongoClient, ObjectId } = require("mongodb");
<%_ models.forEach(function(model) { if (model.primary.length > 0) { _%>
const { <%= model.id %>TypeDef } = require("./<%= model.id %>");
const { <%= model.id %>Resolver, <%= model.id %>ListResolver, <%= model.id %>Drop, <%= model.id %>Create } = require("./<%= model.id %>-resolver");
<%_ } else { _%>
const { <%= model.id %>TypeDef } = require("./<%= model.id %>");
<%_ }}) _%>

const logger = bunyan.createLogger({ name: '<%= modName %>' });
const client = new MongoClient(process.env.MONGODB, { useNewUrlParser: true });
let db = null;

client.connect().then(() => {
  db = client.db();
});

const app = express();
app.use(require("express-bunyan-logger")());

const gqlServer = new ApolloServer({
  typeDefs: [gql`
    type DropResult {
      status: Boolean
    }
  `<% models.forEach(model => { %>, <%= model.id %>TypeDef<% }) %>],
  resolvers: {
    Query: {
      <%_ models.filter(m => m.primary.length > 0).forEach(function(model) { _%>
      <%= model.id %>: <%= model.id %>Resolver,
      <%= model.id %>List: <%= model.id %>ListResolver,
      <%_ }) _%>
    },
    Mutation: {
      <%_ models.filter(m => m.primary.length > 0).forEach(function(model) { _%>
      <%= model.id %>Drop,
      <%= model.id %>Create,
      <%_ }) _%>
    }
  },
  context: ({ req }) => ({ db })
});

gqlServer.applyMiddleware({ app });

const server = app.listen(process.env.PORT || 4000, () => {
  var host = server.address().address;
  var port = server.address().port;
  logger.info({ host, port, path: gqlServer.graphqlPath }, "server ready");
});
