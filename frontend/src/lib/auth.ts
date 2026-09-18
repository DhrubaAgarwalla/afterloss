import { Amplify } from "aws-amplify";
import {
  confirmSignUp,
  fetchAuthSession,
  getCurrentUser,
  resendSignUpCode,
  signIn,
  signOut,
  signUp,
} from "aws-amplify/auth";
import { config } from "./config";

let configured = false;

export function configureAuth() {
  if (configured || !config.userPoolId) return;
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: config.userPoolId,
        userPoolClientId: config.userPoolClientId,
        loginWith: { email: true },
        signUpVerificationMethod: "code",
      },
    },
  });
  configured = true;
}

export async function currentEmail(): Promise<string | null> {
  try {
    await getCurrentUser();
    const s = await fetchAuthSession();
    const email = s.tokens?.idToken?.payload?.email;
    return typeof email === "string" ? email.toLowerCase() : null;
  } catch {
    return null;
  }
}

export async function idToken(): Promise<string> {
  const s = await fetchAuthSession();
  const t = s.tokens?.idToken?.toString();
  if (!t) throw new Error("not signed in");
  return t;
}

export async function doSignIn(email: string, password: string) {
  const r = await signIn({ username: email.trim().toLowerCase(), password });
  return r.nextStep.signInStep;
}

export async function doSignUp(email: string, password: string) {
  const r = await signUp({
    username: email.trim().toLowerCase(),
    password,
    options: { userAttributes: { email: email.trim().toLowerCase() } },
  });
  return r.nextStep.signUpStep;
}

export async function doConfirm(email: string, code: string) {
  await confirmSignUp({ username: email.trim().toLowerCase(), confirmationCode: code.trim() });
}

export async function doResend(email: string) {
  await resendSignUpCode({ username: email.trim().toLowerCase() });
}

export async function doSignOut() {
  await signOut();
}
