import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "ADMIN" | "BARTENDER";
    } & DefaultSession["user"];
  }

  interface User {
    role: "ADMIN" | "BARTENDER";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "ADMIN" | "BARTENDER";
  }
}
