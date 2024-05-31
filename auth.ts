import bcrypt from 'bcrypt';

import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import { sql } from '@vercel/postgres';

import { authConfig } from './auth.config';
import { User } from './app/lib/definitions';

// NOTE: AUTHENTICATION: authConfig could have  been update in the middleware
// but, node:bcrypt is not availble there.
// FIX: why exporting auth ??? seems to work fine without doing it.
export const { auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        // NOTE: Validate user login inputs
        const credentialsCodexAssess = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);

        if (credentialsCodexAssess.success) {
          const { email, password } = credentialsCodexAssess.data;
          // NOTE: Authenticate user with email
          const user = await getUser(email);
          if (!user) return null;
          // NOTE: Authenticate input password with database user password
          const passwordMatch = await bcrypt.compare(password, user.password);

          if (passwordMatch) return user;
        }

        console.log('Invalid credentials!');
        return null;
      },
    }),
  ],
});

// NOTE: Util function to retrieve from database user data matching input email
async function getUser(email: string): Promise<User | undefined> {
  try {
    const users = await sql<User>`SELECT * FROM users WHERE email=${email}`;
    const user = users.rows[0];
    return user;
  } catch (error) {
    console.error('Failed to fetch user.', error);
    throw new Error('Failed to fetch user.');
  }
}

