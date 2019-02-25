const { ApolloClient } = require("apollo-client");
const fetch = require("node-fetch");
const { HttpLink } = require("apollo-link-http");
const { InMemoryCache } = require("apollo-cache-inmemory");
const gql = require("graphql-tag");

const httpLink = new HttpLink({
  uri: process.env.GRAPHQL,
  fetch
});

const cache = new InMemoryCache();

const client = new ApolloClient({
  link: httpLink,
  cache
});

client.mutate({
  mutation: gql`
  mutation {
    userDrop {
      status
    }
  }
`
})
.then(payload => {
  console.log(`drop ${JSON.stringify(payload, undefined, 2)}`);
})
.catch(err => {
  console.log(err);
  process.exit(1);
});

client.mutate({
    mutation: gql`
    mutation {
      <%= model.id %>Create (
        login: "test2",
        password: "dodol123",
        firstName: "Test1",
        lastName: "Test",
        address: {
          street: "tebet"
          city: "jakarta"
        }
      ) {
        _id
      }
    }
  `
  })
  .then(payload => {
    console.log(`mutation ${JSON.stringify(payload, undefined, 2)}`);
  })
  .catch(err => {
    console.log(err);
    process.exit(1);
  });
