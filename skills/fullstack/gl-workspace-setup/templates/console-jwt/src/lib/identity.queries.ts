import { gql } from "@/lib/api-client";

export const LoginMutation = gql`
  mutation Identity__login($input: LoginInput!) {
    identity__login(input: $input) {
      accessToken
      systemRoles
      memberships {
        roles
        tenant
      }
    }
  }
`;

export const MyTenantsQuery = gql`
  query Identity__myTenants {
    identity__myTenants {
      nodes {
        _id
        name
        uid
        createdAt
        logo {
          key
          provider
          external
        }
      }
    }
  }
`;

export const MeQuery = gql`
  query Identity__me {
    identity__me {
      _id
      email
      name
      avatar {
        key
        provider
        external
      }
    }
  }
`;

export const ForgotPasswordMutation = gql`
  mutation Identity__forgotPassword($input: ForgotPasswordInput!) {
    identity__forgotPassword(input: $input)
  }
`;

export const ResetPasswordMutation = gql`
  mutation Identity__resetPassword($input: ResetPasswordInput!) {
    identity__resetPassword(input: $input)
  }
`;

export const UpdateMeMutation = gql`
  mutation Identity__updateMe($input: UpdateMeInput!) {
    identity__updateMe(input: $input)
  }
`;

export const UpdateMyPasswordMutation = gql`
  mutation Identity__updateMyPassword($input: UpdateMyPasswordInput!) {
    identity__updateMyPassword(input: $input)
  }
`;
