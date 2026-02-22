import { cookies } from "next/headers";
import MontessoriHome from "./components/MontessoriHome";
import PublicLanding from "./components/PublicLanding";
import { AUTH_COOKIE_NAME, isAuthenticatedCookie } from "./lib/appAuth";

export default async function Home() {
  const cookieStore = await cookies();
  const authCookieValue = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!isAuthenticatedCookie(authCookieValue)) {
    return <PublicLanding />;
  }
  return <MontessoriHome />;
}
