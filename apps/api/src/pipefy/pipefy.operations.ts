import { gql } from 'graphql-request';

export const createCardOperation = gql`
  mutation ($input: CreateCardInput!) {
    createCard(input: $input) {
      card {
        id
      }
    }
  }
`;

export const updateCardFieldOperation = gql`
  mutation ($input: UpdateCardFieldInput!) {
    updateCardField(input: $input) {
      card {
        id
      }
      success
    }
  }
`;
