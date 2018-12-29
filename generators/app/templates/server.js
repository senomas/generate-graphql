const { ApolloServer, gql } = require("apollo-server");
const { MongoClient, ObjectId } = require("mongodb");
<%_ models.forEach(function(model) { if (model.primary.length > 0) { _%>
const { typeDef: <%= model.ID %>Type } = require("./<%= model.id %>");
const { <%= model.id %>Resolver, <%= model.id %>ListResolver, <%= model.id %>Create } = require("./<%= model.id %>-resolver");
<%_ } else { _%>
const { typeDef: <%= model.ID %>Type } = require("./<%= model.id %>");
<%_ }}) _%>

const client = new MongoClient("mongodb://localhost:27017/test", { useNewUrlParser: true });
let db = null;

client.connect().then(() => {
  db = client.db("test");
});

const server = new ApolloServer({
  typeDefs: [<% models.forEach((model, index) => { %><%= index > 0 ? ", " : "" %><%= model.ID %>Type<% }) %>],
  resolvers: {
    Query: {
      <%_ models.filter(m => m.primary.length > 0).forEach(function(model) { _%>
      <%= model.id %>: <%= model.id %>Resolver,
      <%= model.id %>List: <%= model.id %>ListResolver,
      <%_ }) _%>
    },
    Mutation: {
      <%_ models.filter(m => m.primary.length > 0).forEach(function(model) { _%>
      <%= model.id %>Create,
      <%_ }) _%>
    }
  },
  context: ({ req }) => ({ db })
});

server.listen().then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`);
});
