const { ApolloServer, gql } = require("apollo-server");
const { graphqlMongodbProjection } = require("graphql-mongodb-projection");

const typeDefs = gql`
  <%_ models.forEach(function(model) { _%>
  type <%= model.ID %> {
    <%_ model.fields.forEach(function(field) { _%>
    <%= field.id %>: <%= field.type %>
    <%_ }) _%>
  }

  type <%= model.ID %>PartialList {
    items: [<%= model.ID %>]!
    total: Int
  }
  <%_ }) _%>

  type Query {
    <%_ models.forEach(function(model) { _%>
    <%= model.id %>(<% 
      model.primary.forEach(function(field, index) { %><%= index > 0 ? ", " : "" %><%= field.id %>: <%= field.type %>!<% })
    %>): [<%= model.ID %>]
    <%= model.id %>List(<% 
      model.keyFields.forEach(function(field, index) { %><%= index > 0 ? ", " : "" %><%= field.id %>: <%= field.type %><% })
    %>): [<%= model.ID %>PartialList]
    <%_ }) _%>
  }

  type Mutation {
    <%_ models.forEach(function(model) { _%>
    <%= model.id %>Create(<% 
      model.fields.filter(function (f) {
        return !f.validations["auto-generate"]
      }).forEach(function(field, index) { %><%= index > 0 ? ", " : "" %><%= field.id %>: <%= field.type %><%= field.validations.mandatory ? "!" : "" %><% })
    %>): <%= model.ID %>
    <%_ }) _%>
  }
`;

const resolvers = {
  Query: {
    books: (parent, args, context, info) => {
      console.log("QUERY", { parent, args, projection: graphqlMongodbProjection(info) });
      return books
    }
  },
  Mutation: {
    addBook: (parent, book, context, info) => {
      books.push(book);
      return book;
    }
  }
};

const server = new ApolloServer({ typeDefs, resolvers });

server.listen().then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`);
});
