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
      },
      authorize: async (credentials) => {
        try {
          await ConnectDB();

          const user = await User.findOne({ email: credentials?.email });
          if (!user) throw new Error("Invalid credentials.");

          const isValidPassword = await bcrypt.compare(
            (credentials?.password as string) ?? "",
            user.password ?? ""
          );
          if (!isValidPassword) throw new Error("Invalid credentials.");

          return {
            id: (user._id as mongoose.Types.ObjectId).toString(),
            name: user.name,
            email: user.email,
          };
        } catch (error) {
          console.error("Auth error:", error);
          throw new Error("Authentication failed.");
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
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        // Store the user ID (MongoDB ID) in the token
        token.sub = user.id;
      }
      return token;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
});

// Export the handlers for the API route
export const { GET, POST } = handlers;
