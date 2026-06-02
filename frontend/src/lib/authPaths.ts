const PUBLIC_AUTH_PATHS = [
  '/login',
  '/register',
  '/google/callback',
  '/forgot-password',
  '/reset-password',
  '/verify-otp',
];

export const isPublicAuthPath = (pathname: string): boolean => {
  return PUBLIC_AUTH_PATHS.some((path) => pathname.startsWith(path));
};
