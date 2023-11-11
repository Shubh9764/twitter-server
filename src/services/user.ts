import axios from "axios";
import { prismaClient } from "../clients/db/db";
import JwtService from "./jwt";
import { User } from "@prisma/client";
import e from "express";

interface GoogleTokenResult {
  iss?: string;
  azp?: string;
  aud?: string;
  sub?: string;
  email: string;
  email_verified?: string;
  nbf?: string;
  name?: string;
  picture: string;
  given_name: string;
  family_name: string;
  locale?: string;
  iat?: string;
  exp?: string;
  jti?: string;
  alg?: string;
  kid?: string;
  typ?: string;
}

class UserService {
  public static async verifyGoogleAuthToken(token: string) {
    const googleToken = token;
    const goofleOauthUrl = new URL(`https://oauth2.googleapis.com/tokeninfo?`);
    goofleOauthUrl.searchParams.set("id_token", googleToken);

    const { data } = await axios.get<GoogleTokenResult>(
      goofleOauthUrl.toString(),
      {
        responseType: "json",
      }
    );
    console.log(data);
    let user = await prismaClient.user.findUnique({
      where: { email: data.email },
    });
    if (!user) {
      await prismaClient.user.create({
        data: {
          email: data.email,
          firstName: data.given_name,
          lastName: data.family_name,
          profileImageUrl: data.picture,
        },
      });
      user = await prismaClient.user.findUnique({
        where: { email: data.email },
      });
    }
    if (!user) throw new Error("User not Found");
    const userToken = JwtService.generateTokenForUser(user);
    return userToken;
  }

  public static async getUserById(id: string) {
    return prismaClient.user.findUnique({ where: { id } });
  }

  public static followUser(from: string, to: string) {
    return prismaClient.follows.create({
      data: {
        follower: { connect: { id: from } },
        following: { connect: { id: to } },
      },
    });
  }
  public static unFollowUser(from: string, to: string) {
    return prismaClient.follows.delete({
      where: {
        followerId_followingId: { followerId: from, followingId: to },
      },
    });
  }
  public static async getAllFollowers(userId: string) {
    const result = await prismaClient.follows.findMany({
      where: { following: { id: userId } },
      include: {
        follower: true,
        following: true,
      },
    });
    return result.map((el) => el.follower);
  }
  public static async getAllFollowing(userId: string) {
    const result = await prismaClient.follows.findMany({
      where: { follower: { id: userId } },
      include: {
        follower: true,
        following: true,
      },
    });
    return result.map((el) => el.following);
  }
}

export default UserService;
