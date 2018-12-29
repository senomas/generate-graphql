const { ApolloServer, gql } = require("apollo-server");
const { MongoClient, ObjectId } = require("mongodb");

const typeDefs = gql`
  <%_ models.forEach(function(model, mi) { _%>
  type <%= model.ID %> {
    <%_ model.fields.forEach(function(field) { _%>
    <%= field.id %>: <%= field.type %>
    <%_ }) _%>
  }
  input <%= model.ID %>Input {
    <%_ model.fields.forEach(function(field) { _%>
    <%= field.id %>: <%= field.type %><%= field.hasScalarType ? "" : "Input" %>
    <%_ }) _%>
  }
  <%_ if (model.primary.length > 0) { _%>
  enum <%= model.ID %>OrderBy {
    <%_ model.allKeyFields.forEach(function(field) { _%>
    <%= field.id %>_ASC
    <%= field.id %>_DESC
    <%_ }) _%>
  }
  input <%= model.ID %>Filter {
    skip: Int!
    limit: Int!
    orderBy: <%= model.ID %>OrderBy
  }
  type <%= model.ID %>PartialList {
    items: [<%= model.ID %>]
    total: Int
  }
  <%_ }}) _%>

  type Query {
    <%_ models.filter(m => m.primary.length > 0).forEach(function(model, mi) { _%>
    <%_ mi > 0 ? "\n" : "" _%>
    <%= model.id %>(<% 
      model.primary.forEach(function(field, index) { %><%= index > 0 ? ", " : "" %><%= field.id %>: <%= field.type %>!<% })
    %>): <%= model.ID %>
    <%= model.id %>List(<% 
      model.keyFields.forEach(function(field, index) { %><%= index > 0 ? ", " : "" %><%= field.id %>: <%= field.type %><% })
    %>, filter: <%= model.ID %>Filter): <%= model.ID %>PartialList
    <%_ }) _%>
  }

  type Mutation {
    <%_ models.filter(m => m.primary.length > 0).forEach(function(model) { _%>
    <%= model.id %>Create(<% 
      model.fields.filter(function (f) {
        return !f.validations["auto-generate"]
      }).forEach(function(field, index) { %><%= index > 0 ? ", " : "" %><%= field.id %>: <%= field.type %><%= field.hasScalarType ? "" : "Input" %><%= field.validations.mandatory ? "!" : "" %><% })
    %>): <%= model.ID %>
    <%_ }) _%>
  }
`;

<%_ models.filter(m => m.primary.length > 0).forEach(function(model) { _%>
function <%= model.id %>Encode(obj) {
  if (Array.isArray(obj)) {
    obj.forEach(v => {
      <%_ model.fields.forEach(function(field) { if (field.type === "ID") { _%>
      if (v.<%= field.id %>) {
        v.<%= field.id %> = v.<%= field.id %>.toHexString();
      }
    })
    <%_ }}) _%>
  } else if (obj) {
    <%_ model.fields.forEach(function(field) { if (field.type === "ID") { _%>
    if (obj.<%= field.id %>) {
      obj.<%= field.id %> = obj.<%= field.id %>.toHexString();
    }
    <%_ }}) _%>
  }
  return obj; 
}

function <%= model.id %>Decode(obj) {
  if (obj) {
    <%_ model.fields.forEach(function(field) { if (field.type === "ID") { _%>
    if (obj.<%= field.id %>) {
      obj.<%= field.id %> = ObjectId(obj.<%= field.id %>);
    }
  }
  return obj; 
  <%_ } }) _%>
}
<%_ }) _%>

function doGetProjection(selectionSet) {
  const projection = {};
  selectionSet.selections.forEach(v => {
    if (v.kind === "Field") {
      projection[v.name.value] = true;
    }
  });
  return projection;
}

function getProjection(info) {
  return doGetProjection(info.fieldNodes[0].selectionSet);
}

function getSubProjection(info) {
  return doGetProjection(info.fieldNodes[0].selectionSet.selections[0].selectionSet);
}

const resolvers = {
  Query: {
    <%_ models.filter(m => m.primary.length > 0).forEach(function(model) { _%>
    <%= model.id %>: async (parent, args, context, info) => {
      args = <%= model.id %>Decode(args);
      const projection = getSubProjection(info);
      return <%= model.id %>Encode(await context.db.collection("<%= model.id %>").findOne(args, { projection }));
    },
    <%= model.id %>List: async (parent, args, context, info) => {
      const options = {};
      if (args.filter) {
        const filter = args.filter;
        options.skip = filter.skip;
        options.limit = filter.limit;
        switch (filter.orderBy) {
          <%_ model.allKeyFields.forEach(function(field) { _%>
          case "<%= field.id %>_ASC":
            options.sort = { <%= field.id %>: 1 };
            break;
          case "<%= field.id %>_DESC":
            options.sort = { <%= field.id %>: -1 };
            break;
          <%_ }) _%>
          default:
            throw new Error(`Invalid orderBy '${filter.orderBy}'`)
        }
        delete args.filter;
      }
      args = <%= model.id %>Decode(args);
      options.projection = getSubProjection(info);
      const total = await context.db.collection("<%= model.id %>").countDocuments(args);
      const items = <%= model.id %>Encode(await context.db.collection("<%= model.id %>").find(args, options).toArray());
      return { total, items }
    },
    <%_ }) _%>
  },
  Mutation: {
    <%_ models.filter(m => m.primary.length > 0).forEach(function(model) { _%>
    <%= model.id %>Create: async (parent, args, context, info) => {
      args = <%= model.id %>Decode(args);
      const res = await context.db.collection("<%= model.id %>").insertOne(args);
      if (res.insertedCount === 1) {
        args._id = res.insertedId;
        return <%= model.id %>Encode(args);
      }
      throw res;
    }
    <%_ }) _%>
  }
};

const client = new MongoClient("mongodb://localhost:27017/test", { useNewUrlParser: true });
let db = null;

client.connect().then(() => {
  db = client.db("test");
});

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => ({ db })
});

server.listen().then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`);
});
