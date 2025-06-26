import { ApolloServer, GraphQLRequestContext } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { readFileSync } from 'fs';
import { GraphQLScalarType, Kind } from 'graphql';
import { GraphQLJSON } from 'graphql-type-json';
import { join } from 'path';
import { Context, createContext } from './context';
import { resolvers } from './resolvers';

// Custom scalar types
const DateTimeType = new GraphQLScalarType({
  name: 'DateTime',
  description: 'DateTime custom scalar type',
  serialize(value: any) {
    if (value instanceof Date) {
      return value.toISOString();
    }
    if (typeof value === 'string' || typeof value === 'number') {
      return new Date(value).toISOString();
    }
    throw new Error('Value is not a valid DateTime');
  },
  parseValue(value: any) {
    if (typeof value === 'string' || typeof value === 'number') {
      return new Date(value);
    }
    throw new Error('Value is not a valid DateTime');
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING || ast.kind === Kind.INT) {
      return new Date(ast.value);
    }
    throw new Error('Value is not a valid DateTime');
  },
});

// Scalar resolvers
const scalarResolvers = {
  DateTime: DateTimeType,
  JSON: GraphQLJSON,
};

// Load GraphQL schema
const typeDefs = readFileSync(
  join(__dirname, '../../schemas/graphql/analytics-schema.graphql'),
  'utf-8'
);

// Create executable schema
const schema = makeExecutableSchema({
  typeDefs,
  resolvers: {
    ...scalarResolvers,
    ...resolvers,
  },
});

// Create Apollo Server
export const createGraphQLServer = () => {
  const server = new ApolloServer<Context>({
    schema,
    formatError: (error) => {
      console.error('GraphQL Error:', error);

      // Don't expose internal errors in production
      if (process.env.NODE_ENV === 'production') {
        return new Error('Internal server error');
      }

      return error;
    },
    plugins: [
      {
        async requestDidStart() {
          return {
            async didResolveOperation(requestContext: GraphQLRequestContext<Context>) {
              console.log(`GraphQL Operation: ${requestContext.request.operationName}`);
            },
            async didEncounterErrors(requestContext: GraphQLRequestContext<Context>) {
              console.error('GraphQL Errors:', requestContext.errors);
            },
          };
        },
      },
    ],
    introspection: process.env.NODE_ENV !== 'production',
  });

  return server;
};

// Create middleware function for Express integration
export const createGraphQLMiddleware = (server: ApolloServer<Context>) => {
  return expressMiddleware(server, {
    context: createContext,
  });
};

// GraphQL endpoint configuration
export const GRAPHQL_PATH = '/api/v1/graphql';
