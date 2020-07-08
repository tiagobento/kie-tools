/*
 * Copyright 2020 Red Hat, Inc. and/or its affiliates.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const core = require("@actions/core");
const github = require("@actions/github");
const fetch = require("node-fetch");

const githubApiDomain = `https://api.github.com`;
const gitHubGraphQlEndpoint = `${githubApiDomain}/graphql`;

async function run() {
  const workflowFile = core.getInput("workflow_file");
  const githubToken = core.getInput("github_token");

  const authHeaders = {
    headers: {
      Authorization: "token " + githubToken,
      Accept: "application/vnd.github.v3+json"
    }
  };

  const owner = github.context.repo.owner;
  const repo = github.context.repo.repo;
  const baseBranch = github.context.ref.split("/").pop();

  const openMergeablePrs = fetchOpenMergeablePrs(owner, repo, baseBranch, authHeaders);
  console.info(`Found ${openMergeablePrs.length} open mergeable PRs targeting ${baseBranch}`);

  return Promise.all(
    openMergeablePrs.map(pr => {
      console.info(`Fetching workflow runs for ${workflowFile} on #${pr.number}: ${pr.title}`);
      return fetchWorkflowRuns(owner, repo, workflowFile, pr.headRefName, authHeaders).then(runs => {
        runs
          .filter(run => run.head_sha === pr.headRefOid)
          .map(runOnPrsLastCommit => {
            console.info(
              `Re-running ${workflowFile} on #${pr.number}: ${pr.title}; SHA=${runOnPrsLastCommit.head_sha}`
            );
            triggerWorkflowRerun(runOnPrsLastCommit.rerun_url, authHeaders);
          });
      });
    })
  );
}

function fetchWorkflowRuns(owner, repo, workflowFile, headRefName, authHeaders) {
  const workflowEvent = "pull_request";
  return fetch(
    `${githubApiDomain}/repos/${owner}/${repo}/actions/workflows/${workflowFile}/runs?event=${workflowEvent}&branch=${headRefName}`,
    authHeaders
  ).then(c => c.json());
}

async function fetchOpenMergeablePrs(owner, repo, baseBranch, authHeaders) {
  const openPrs = await fetch(`${gitHubGraphQlEndpoint}`, {
    ...authHeaders,
    method: "POST",
    body: JSON.stringify({
      query: `
        query {
          repository(owner: "${owner}", name: "${repo}") {
            pullRequests(last: 100, states: [OPEN], baseRefName: "${baseBranch}") {
              nodes {
                mergeable
                headRefName
                headRefOid
              }
            }
          }
        }
	  `
    })
  })
    .then(c => c.json())
    .then(p => {
      console.info(JSON.stringify(p, undefined, 2));
      return p.data.repository.pullRequests.nodes
    });

  return openPrs.filter(pr => pr.mergeable === "MERGEABLE");
}

async function triggerWorkflowRerun(rerunUrl, authHeaders) {
  return fetch(rerunUrl, { ...authHeaders, method: "POST" });
}

run()
  .then(() => console.info("Finished."))
  .catch(e => core.setFailed(e.message));
