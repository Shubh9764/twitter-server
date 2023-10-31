import { User } from "@prisma/client";
import { JWTUser } from "../interfaces";
import JWT from "jsonwebtoken";
const JWT_SECRET = "$uper@1234";
class JwtService {
  public static async generateTokenForUser(user: User) {
    const payload: JWTUser = {
      id: user?.id,
      email: user?.email,
    };
    const token = JWT.sign(payload, JWT_SECRET);
    return token;
  }
  public static decodeToken(token: string) {
    try {
      return JWT.verify(token, JWT_SECRET) as JWTUser;
    } catch (error) {
      return null;
    }
  }
}

export default JwtService;
