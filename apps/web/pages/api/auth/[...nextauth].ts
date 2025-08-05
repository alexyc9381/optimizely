import NextAuth from 'next-auth'
import type { NextAuthOptions } from 'next-auth'

export const authOptions: NextAuthOptions = {
  providers: [
    // Add your providers here
    // For now, we'll use a minimal setup
  ],
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        // @ts-ignore - extending the user type
        session.user.id = token.id as string
      }
      return session
    },
  },
}

export default NextAuth(authOptions)