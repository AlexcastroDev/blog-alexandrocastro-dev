import { token, owner, repo, apiUrl } from "../../config/constants";
import type { Post } from "../../types/posts";
import getSummary from "../../utils/get-summary";

export default async function getPosts(): Promise<Post[]> {
  const issues = [];
  let cursor = null;

  const query = `
    query($owner: String!, $repo: String!, $cursor: String) {
      repository(owner: $owner, name: $repo) {
        issues(first: 100, states: CLOSED, after: $cursor) {
          pageInfo {
            endCursor
            hasNextPage
          }
          edges {
            node {
              number
              title
              bodyHTML
            }
          }
        }
      }
    }
  `;

  const options = {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      variables: { owner, repo, cursor },
    }),
  };

  try {
    const response = await fetch(apiUrl, options);
    const data = await response.json();

    if (response.ok) {
      const { pageInfo, edges } = data.data.repository.issues;
      const formattedEdges = edges.map((edge: any) => {
        const { title, bodyHTML, number } = edge.node;

        const paragraph = getSummary(bodyHTML) || "";
        const url =
          (title || "").toLowerCase().replaceAll(" ", "-") + "-" + number;
        return { title, paragraph, url };
      });
      issues.push(...formattedEdges);
      cursor = pageInfo.hasNextPage ? pageInfo.endCursor : null;
    }
    return issues;
  } catch (error) {
    return [];
  }
}
