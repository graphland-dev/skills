export interface IRouteContext {
  session: {
    user: {
      name: string;
      email: string;
      image?: string | null;
    };
  } | null;
  currentOrganization: {
    id: string;
    name: string;
    uid: string;
    logo?: string | null;
  } | null;
  currentMemberRole: string | null;
}
