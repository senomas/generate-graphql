const { gql } = require("apollo-server");

const <%= model.id %>TypeDef = gql`
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
    <%= field.id %>
    <%_ }) _%>
  }
  input <%= model.ID %>Filter {
    offset: Int!
    limit: Int!
    orderBy: <%= model.ID %>OrderBy!
    descending: Boolean!
  }
  type <%= model.ID %>PartialList {
    items: [<%= model.ID %>]
    total: Int
  }

  type Query {
    <%= model.id %>(<% 
      model.primary.forEach(function(field, index) { %><%= index > 0 ? ", " : "" %><%= field.id %>: <%= field.type %>!<% })
    %>): <%= model.ID %>
    <%= model.id %>List(<% 
      model.keyFields.forEach(function(field, index) { %><%= index > 0 ? ", " : "" %><%= field.id %>: <%= field.type %><% })
    %>, filter: <%= model.ID %>Filter): <%= model.ID %>PartialList
  }

  type Mutation {
    <%= model.id %>Drop: DropResult
    <%= model.id %>Create(<% 
      model.fields.filter(function (f) {
        return !f.validations["auto-generate"]
      }).forEach(function(field, index) { %><%= index > 0 ? ", " : "" %><%= field.id %>: <%= field.type %><%= field.hasScalarType ? "" : "Input" %><%= field.validations.mandatory ? "!" : "" %><% })
    %>): <%= model.ID %>
  }
  <%_ } _%>
`;

module.exports = { <%= model.id %>TypeDef }
