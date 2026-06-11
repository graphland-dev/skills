import { gqlRequest } from "@/lib/gql-client";
import {
  ForgotPasswordMutation,
  LoginMutation,
  MeQuery,
  MyTenantsQuery,
  ResetPasswordMutation,
  UpdateMeMutation,
  UpdateMyPasswordMutation,
} from "@/lib/identity.queries";

export type LoginInput = {
  email: string;
  password: string;
};

export type Tenant = {
  _id: string;
  name: string;
  uid: string;
  createdAt?: string;
  logo?: {
    key?: string | null;
    provider?: string | null;
    external?: string | null;
  } | null;
};

export type User = {
  _id: string;
  email: string;
  name?: string | null;
  avatar?: {
    key?: string | null;
    provider?: string | null;
    external?: string | null;
  } | null;
};

export const identityQueryKeys = {
  me: ["identity", "me"] as const,
  myTenants: ["identity", "my-tenants"] as const,
};

export async function login(input: LoginInput) {
  const data = await gqlRequest<{
    identity__login: {
      accessToken: string;
      systemRoles?: string[];
      memberships?: Array<{ roles: string[]; tenant: string }>;
    };
  }>({
    query: LoginMutation,
    variables: { input },
  });

  return data.identity__login;
}

export async function fetchMyTenants() {
  const data = await gqlRequest<{
    identity__myTenants: { nodes: Tenant[] };
  }>({
    query: MyTenantsQuery,
  });

  return data.identity__myTenants.nodes ?? [];
}

export async function fetchMe() {
  const data = await gqlRequest<{ identity__me: User }>({
    query: MeQuery,
  });

  return data.identity__me;
}

export async function forgotPassword(input: {
  email: string;
  clientUrlTemplate: string;
}) {
  const data = await gqlRequest<{ identity__forgotPassword: boolean }>({
    query: ForgotPasswordMutation,
    variables: { input },
  });

  return data.identity__forgotPassword;
}

export async function resetPassword(input: {
  email: string;
  token: string;
  password: string;
}) {
  const data = await gqlRequest<{ identity__resetPassword: boolean }>({
    query: ResetPasswordMutation,
    variables: { input },
  });

  return data.identity__resetPassword;
}

export type UpdateMeInput = {
  name: string;
  email: string;
  avatar?: ServerFileReference | null;
};

export async function updateMe(input: UpdateMeInput) {
  const data = await gqlRequest<{ identity__updateMe: boolean }>({
    query: UpdateMeMutation,
    variables: {
      input: {
        name: input.name,
        email: input.email,
        avatar: input.avatar?.key
          ? {
              key: input.avatar.key,
              provider: input.avatar.provider ?? undefined,
            }
          : null,
      },
    },
  });

  return data.identity__updateMe;
}

export type UpdateMyPasswordInput = {
  password: string;
  newPassword: string;
  confirmNewPassword: string;
};

export async function updateMyPassword(input: UpdateMyPasswordInput) {
  const data = await gqlRequest<{ identity__updateMyPassword: boolean }>({
    query: UpdateMyPasswordMutation,
    variables: { input },
  });

  return data.identity__updateMyPassword;
}
