import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
  /**
   * Extends the built-in session.user type.
   * All fields are non-nullable — fallbacks are applied in the JWT callback.
   */
  interface Session {
    user: {
      id: string
      name: string
      email: string
      image: string
      role: string
      profileCompleted: boolean
    }
  }

  /**
   * Extends the built-in User returned from authorize().
   */
  interface User {
    id?: string
    role: string
    profileCompleted: boolean
  }
}

declare module 'next-auth/jwt' {
  /**
   * Extends the built-in JWT payload.
   */
  interface JWT {
    id: string
    role: string
    profileCompleted: boolean
  }
}
