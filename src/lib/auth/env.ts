export function getAuthSecret() {
  return process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET;
}

export function getAuthUrl() {
  return process.env.NEXTAUTH_URL ?? process.env.AUTH_URL;
}

