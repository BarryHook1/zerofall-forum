import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";

import { prisma } from "@/lib/db/prisma";
import { getAuthSecret } from "@/lib/auth/env";
import {
  applyAuthSnapshotToToken,
  applyTokenToSession,
  mapUserRecordToAuthSnapshot,
} from "@/lib/auth/user-snapshot";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password ?? "";

        if (!email || !password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          return null;
        }

        const validPassword = await compare(password, user.passwordHash);
        if (!validPassword) {
          return null;
        }

        return {
          ...mapUserRecordToAuthSnapshot(user),
          name: user.username,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        return applyAuthSnapshotToToken(token, {
          id: user.id,
          email: user.email!,
          username: user.username,
          forumUid: user.forumUid,
          accountRole: user.accountRole,
          entryStatus: user.entryStatus,
          membershipStatus: user.membershipStatus,
          rank: user.rank,
          badgeStatus: user.badgeStatus,
          activationDeadline: user.activationDeadline ?? null,
          subscriptionExpiresAt: user.subscriptionExpiresAt ?? null,
          discordId: user.discordId ?? null,
        });
      }

      if (token.id) {
        const currentUser = await prisma.user.findUnique({
          where: { id: token.id },
          select: {
            id: true,
            email: true,
            username: true,
            forumUid: true,
            accountRole: true,
            entryStatus: true,
            membershipStatus: true,
            rank: true,
            badgeStatus: true,
            activationDeadline: true,
            subscriptionExpiresAt: true,
            discordId: true,
          },
        });

        if (currentUser) {
          return applyAuthSnapshotToToken(
            token,
            mapUserRecordToAuthSnapshot(currentUser),
          );
        }
      }

      return token;
    },
    async session({ session, token }) {
      return applyTokenToSession(session, token);
    },
  },
  secret: getAuthSecret(),
};
