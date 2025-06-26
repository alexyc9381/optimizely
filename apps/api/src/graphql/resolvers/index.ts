import { mutationResolvers } from './mutation';
import { queryResolvers } from './query';
import { subscriptionResolvers } from './subscription';
import { typeResolvers } from './types';

export const resolvers = {
  Query: queryResolvers,
  Mutation: mutationResolvers,
  Subscription: subscriptionResolvers,
  ...typeResolvers,
};
