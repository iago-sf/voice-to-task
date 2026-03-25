declare module '#auth-utils' {
  interface User {
    name: string
    email: string
    avatar: string
  }

  interface UserSession {
    user: User
  }
}

export {}
