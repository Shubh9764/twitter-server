import { Tweet } from "@prisma/client";
import { prismaClient } from "../../clients/db/db";
import { GraphqlContext } from "../interfaces";

interface CreateTweetPayload {
  content: string;
  imageURL?: string;
}
const mutations = {
  createTweet: async (
    parent: any,
    { payload }: { payload: CreateTweetPayload },
    ctx: GraphqlContext
  ) => {
    if (!ctx.user) throw new Error("user not authenticated");
    const tweet = await prismaClient.tweet.create({
      data: {
        content: payload.content,
        imageUrl: payload.imageURL,
        author: { connect: { id: ctx.user.id } },
      },
    });
    return tweet;
  },
};

const queries = {
  getAllTweets: () => 
   prismaClient.tweet.findMany({orderBy:{createdAt:'desc'}})
}

const extraResolver = {
  Tweet: {
    author: (parent:Tweet) => 
      prismaClient.user.findUnique({where:{id:parent.authorId}})
    
  }
}

export const resolvers = {queries, mutations,extraResolver };
