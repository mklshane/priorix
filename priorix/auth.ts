import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { ConnectDB } from "./lib/config/db";
import User from "./lib/models/User";
import type mongoose from "mongoose";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google,
    Credentials({
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
        rememberMe: { label: "Remember Me", type: "text" },
      },
      authorize: async (credentials) => {
        try {
          await ConnectDB();

          const user = await User.findOne({ email: credentials?.email });
          if (!user || !user.password) return null;

          const isValidPassword = await bcrypt.compare(
            (credentials?.password as string) ?? "",
            user.password
          );
          if (!isValidPassword) return null;

          return {
            id: (user._id as mongoose.Types.ObjectId).toString(),
            name: user.name,
            email: user.email,
            rememberMe: credentials?.rememberMe === "true",
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        try {
          await ConnectDB();

          const existingUser = await User.findOne({ email: profile?.email });
          if (!existingUser) {
            const newUser = await User.create({
              name: profile?.name,
              email: profile?.email,
            });
            user.id = (newUser._id as mongoose.Types.ObjectId).toString();
          } else {
            user.id = (existingUser._id as mongoose.Types.ObjectId).toString();
          }
        } catch (error) {
          console.error("Sign in error:", error);
          return false;
        }
      }
      return true;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        // Add the MongoDB ID to the session user object
        session.user.id = token.sub;
      }
      if (session.user && token.name) {
        session.user.name = token.name as string;
      }
      return session;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.sub = user.id;
        // Set token expiry based on remember me
        const rememberMe = (user as any).rememberMe;
        if (rememberMe) {
          token.exp = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60; // 30 days
        } else {
          token.exp = Math.floor(Date.now() / 1000) + 24 * 60 * 60; // 1 day
        }
      }
      if (trigger === "update" && session?.name) {
        token.name = session.name;
      }
      return token;
    },
  },
  pages: {
    signIn: "/login",
  },
  trustHost: true,
});

// Export the handlers for the API route
export const { GET, POST } = handlers;
