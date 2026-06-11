import { gql } from "@/lib/gql-client";
import { z } from "zod";

// With GraphQL codegen, import these from your generated types instead.
// Must be type aliases (not interfaces): AppDataTable's rows are constrained to
// Record<string, unknown>, which interfaces don't satisfy.
export type Entity = {
  _id: string;
  name: string;
  createdAt?: string | null;
};

export type EntitiesWithPagination = {
  meta?: {
    currentPage?: number | null;
    hasNextPage?: boolean | null;
    totalCount?: number | null;
    totalPages?: number | null;
  } | null;
  nodes?: Entity[] | null;
};

export const ENTITY_LIST_QUERY = gql`
  query Namespace__entities($where: CommonPaginationDto) {
    namespace__entities(where: $where) {
      meta {
        currentPage
        hasNextPage
        totalCount
        totalPages
      }
      nodes {
        _id
        name
        createdAt
      }
    }
  }
`;

export const CREATE_ENTITY_MUTATION = gql`
  mutation Namespace__createEntity($body: CreateEntityInput!) {
    namespace__createEntity(body: $body) {
      _id
    }
  }
`;

export const UPDATE_ENTITY_MUTATION = gql`
  mutation Namespace__updateEntity(
    $where: CommonFindDocumentDto!
    $body: UpdateEntityInput!
  ) {
    namespace__updateEntity(where: $where, body: $body)
  }
`;

export const DELETE_ENTITY_MUTATION = gql`
  mutation Namespace__removeEntity($where: CommonFindDocumentDto!) {
    namespace__removeEntity(where: $where)
  }
`;

export const entityFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
});

export type EntityFormValues = z.infer<typeof entityFormSchema>;
