import { PrismaClient, User } from "@prisma/client";
import { prismaClient } from "../../clients/db/db";
import { GraphqlContext } from "../interfaces";
import UserService from "../../services/user";
import TweetService from "../../services/tweet";
import { redisClient } from "../../clients/redis";

const queries = {
  verifyGoogleToken: async (parent: any, { token }: { token: string }) => {
    const resultToken = await UserService.verifyGoogleAuthToken(token);
    return resultToken;
  },
  getCurrentUser: async (parent: any, args: any, ctx: GraphqlContext) => {
    const id = ctx.user?.id;

    if (!id) {
      return null;
    }
    const currentUser = await UserService.getUserById(id);
    return currentUser;
  },
  getUserById: async (
    parent: any,
    { id }: { id: string },
    ctx: GraphqlContext
  ) => {
    return UserService.getUserById(id);
  },
};

const mutations = {
  followUser: async (
    parent: any,
    { to }: { to: string },
    ctx: GraphqlContext
  ) => {
    if (!ctx.user || !ctx.user.id) throw new Error("Unauthenticated");

    await UserService.followUser(ctx.user.id, to);
    await redisClient.del(`RECOMMENDED_USERS:${ctx.user.id}`);
    return true;
  },
  unFollowUser: async (
    parent: any,
    { to }: { to: string },
    ctx: GraphqlContext
  ) => {
    if (!ctx.user || !ctx.user.id) throw new Error("Unauthenticated");

    await UserService.unFollowUser(ctx.user.id, to);
    await redisClient.del(`RECOMMENDED_USERS:${ctx.user.id}`);
    return true;
  },
};

const extraResolver = {
  User: {
    tweets: (parent: User) => TweetService.getAllTweetsByAuthorId(parent.id),
    followers: (parent: User) => UserService.getAllFollowers(parent.id),
    following: (parent: User) => UserService.getAllFollowing(parent.id),
    recommendedUsers: async (parent: User, _: any, ctx: GraphqlContext) => {
      if (!ctx.user) return [];
      const cachedValue = await redisClient.get(
        `RECOMMENDED_USERS:${ctx.user.id}`
      );
      if (cachedValue) return JSON.parse(cachedValue);
      const myFollowing = await prismaClient.follows.findMany({
        where: {
          follower: { id: parent.id },
        },
        include: {
          following: {
            include: { followers: { include: { following: true } } },
          },
        },
      });
      const users: User[] = [];
      for (const followings of myFollowing) {
        for (const followingOfFollowedUser of followings.following.followers) {
          if (
            followingOfFollowedUser.following.id !== ctx.user.id &&
            myFollowing.findIndex(
              (e) => e.followingId === followingOfFollowedUser.following.id
            ) < 0
          ) {
            users.push(followingOfFollowedUser.following);
          }
        }
      }
      await redisClient.set(
        `RECOMMENDED_USERS:${ctx.user.id}`,
        JSON.stringify(users)
      );
      return users;
    },
  },
};

export const resolvers = { queries, mutations, extraResolver };
