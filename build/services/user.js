"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const db_1 = require("../clients/db/db");
const jwt_1 = __importDefault(require("./jwt"));
class UserService {
    static verifyGoogleAuthToken(token) {
        return __awaiter(this, void 0, void 0, function* () {
            const googleToken = token;
            const goofleOauthUrl = new URL(`https://oauth2.googleapis.com/tokeninfo?`);
            goofleOauthUrl.searchParams.set("id_token", googleToken);
            const { data } = yield axios_1.default.get(goofleOauthUrl.toString(), {
                responseType: "json",
            });
            console.log(data);
            let user = yield db_1.prismaClient.user.findUnique({
                where: { email: data.email },
            });
            if (!user) {
                yield db_1.prismaClient.user.create({
                    data: {
                        email: data.email,
                        firstName: data.given_name,
                        lastName: data.family_name,
                        profileImageUrl: data.picture,
                    },
                });
                user = yield db_1.prismaClient.user.findUnique({
                    where: { email: data.email },
                });
            }
            if (!user)
                throw new Error("User not Found");
            const userToken = jwt_1.default.generateTokenForUser(user);
            return userToken;
        });
    }
    static getUserById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return db_1.prismaClient.user.findUnique({ where: { id } });
        });
    }
    static followUser(from, to) {
        return db_1.prismaClient.follows.create({
            data: {
                follower: { connect: { id: from } },
                following: { connect: { id: to } },
            },
        });
    }
    static unFollowUser(from, to) {
        return db_1.prismaClient.follows.delete({
            where: {
                followerId_followingId: { followerId: from, followingId: to },
            },
        });
    }
    static getAllFollowers(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield db_1.prismaClient.follows.findMany({
                where: { following: { id: userId } },
                include: {
                    follower: true,
                    following: true,
                },
            });
            return result.map((el) => el.follower);
        });
    }
    static getAllFollowing(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield db_1.prismaClient.follows.findMany({
                where: { follower: { id: userId } },
                include: {
                    follower: true,
                    following: true,
                },
            });
            return result.map((el) => el.following);
        });
    }
}
exports.default = UserService;
