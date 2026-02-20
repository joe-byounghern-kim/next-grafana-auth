import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

declare module 'next-auth' {
  interface Session {
    user: {
      email: string
      name?: string
      role: 'Admin' | 'Editor' | 'Viewer'
    }
  }

  interface User {
    email: string
    name?: string
    role: 'Admin' | 'Editor' | 'Viewer'
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    email: string
    name?: string
    role: 'Admin' | 'Editor' | 'Viewer'
  }
}

const users = {
  'admin@example.com': {
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'Admin' as const,
    password: 'admin123',
  },
  'user@example.com': {
    email: 'user@example.com',
    name: 'Regular User',
    role: 'Viewer' as const,
    password: 'user123',
  },
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null

        const user = users[credentials.email as keyof typeof users]

        if (!user || user.password !== credentials.password) {
          return null
        }

        return {
          id: user.email,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.email = user.email
        token.name = user.name
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      session.user.email = token.email
      session.user.name = token.name
      session.user.role = token.role
      return session
    },
  },
  pages: {
    signIn: '/signin',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
}
