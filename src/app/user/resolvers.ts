import { PrismaClient } from '@prisma/client'
import axios from 'axios'
import { prismaClient } from '../clients/db/db'
import JwtService from '../services/jwt'
import { GraphqlContext } from '../interfaces'
interface GoogleTokenResult{
    iss?: string
  azp?: string
  aud?: string
  sub?: string
  email: string
  email_verified?: string
  nbf?: string
  name?: string
  picture: string
  given_name: string
  family_name: string
  locale?: string
  iat?: string
  exp?: string
  jti?: string
  alg?: string
  kid?: string
  typ?: string
}
const queries = {
    verifyGoogleToken : async (parent:any,{token}:{token:string}) => {
        const googleToken = token
        const goofleOauthUrl = new URL(`https://oauth2.googleapis.com/tokeninfo?`)
        goofleOauthUrl.searchParams.set('id_token',googleToken)

        const  {data} = await axios.get<GoogleTokenResult>(goofleOauthUrl.toString(),{
            responseType: 'json'
        })
        console.log(data)
        let user = await prismaClient.user.findUnique({
            where: {email:data.email}
        })
        if(!user){
            await prismaClient.user.create({
                data :{
                    email: data.email,
                    firstName: data.given_name,
                    lastName: data.family_name,
                    profileImageUrl: data.picture
                }
            })
            user = await prismaClient.user.findUnique({where:{email:data.email}})
        }
        if(!user) throw new Error("User not Found")
        const userToken = JwtService.generateTokenForUser(user)
        return userToken
    },
    getCurrentUser: async (parent:any,args:any,ctx:GraphqlContext) => {
        const id = ctx.user?.id  
        
        if(!id){
            return null;
        }
        const currentUser = await prismaClient.user.findUnique({where:{id}})
        return currentUser
    }
}

const mutations = {}


export const resolvers = {queries}