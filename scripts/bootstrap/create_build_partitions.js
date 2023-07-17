const fs = require("fs");
const path = require("path");

const { serializedDatavisGraph: graph } = require("../../repo/graph.json");

function main() {
  const adjList = new Map();
  const heads = new Set(graph.nodes.map((s) => s.id));
  for (const link of graph.links) {
    heads.delete(link.target); // Heads are packages that don't have any dependencies.
    adjList.set(link.source, new Set([...(adjList.get(link.source) ?? new Set()), link.target]));
  }

  const headHierarchy = new Map();
  for (const head of heads) {
    headHierarchy.set(head, getAllDependencies(adjList, head));
  }

  console.log(`[build-partitioner] Found ${heads.size} heads in ${graph.nodes.length} packages.`);
  console.log(`[build-partitioner]`);

  const PARTITION_STRINGS = ["serverless", "dashbuilder"];

  const partitionStringsLog = PARTITION_STRINGS.map((h) => `'${h}'`).join(", ");

  console.log(`[build-partitioner] Splitting packages in 2 partitions:`);
  console.log(`[build-partitioner]    1. Packages containing the ${partitionStringsLog} strings.`);
  console.log(`[build-partitioner]    2. Others`);
  console.log(`[build-partitioner]`);

  const p1heads = new Set();
  const p2heads = new Set();

  for (const [head, deps] of headHierarchy.entries()) {
    if (Array.from(deps).find((dep) => PARTITION_STRINGS.find((s) => dep.includes(s)))) {
      p1heads.add(head);
    } else {
      p2heads.add(head);
    }
  }

  const p1hierarchy = buildHeadHierarchy(headHierarchy, p1heads);
  const p2hierarchy = buildHeadHierarchy(headHierarchy, p2heads);

  console.log(`[build-partitioner] Partition 1 has ${p1heads.size} heads and ${p1hierarchy.size} packages.`);
  // console.log(p1heads);
  console.log(`[build-partitioner] Partition 2 has ${p2heads.size} heads and ${p2hierarchy.size} packages.`);
  // console.log(p2heads);

  console.log(
    `[build-partitioner] There are ${
      Array.from(p1hierarchy).filter((s) => p2hierarchy.has(s)).length
    } intersecting packages.`
  );
  console.log(`[build-partitioner]`);
  // console.log(Array.from(p1hierarchy).filter((s) => p2hierarchy.has(s)));

  const outputDir = path.resolve(process.argv[2]);
  fs.mkdirSync(outputDir, { recursive: true });

  const partition1path = path.join(outputDir, "build-partition-1-pnpm-filter.txt");
  const partition2path = path.join(outputDir, "build-partition-2-pnpm-filter.txt");

  fs.writeFileSync(partition1path, pnpmFilterFromHeads(p1heads));
  fs.writeFileSync(partition2path, pnpmFilterFromHeads(p2heads));

  console.log(`[build-partitioner] Saved pnpm filter for partition 1 to '${partition1path}'.`);
  console.log(`[build-partitioner] Saved pnpm filter for partition 2 to '${partition2path}'.`);
  console.log(`[build-partitioner] Done.`);
}

main();

function pnpmFilterFromHeads(heads) {
  return (
    Array.from(heads)
      .map((h) => `-F '${h}'...`)
      .join(" ") + "\n"
  );
}

function buildHeadHierarchy(headHierarchy, heads) {
  return new Set([
    ...heads,
    ...new Set(
      Array.from(headHierarchy.entries())
        .filter(([h, _]) => heads.has(h))
        .flatMap(([_, v]) => [...v])
    ),
  ]);
}

function getAllDependencies(adjList, head) {
  const ret = new Set();

  for (const dep of adjList.get(head) ?? new Set()) {
    ret.add(dep);
    getAllDependencies(adjList, dep).forEach((s) => ret.add(s));
  }

  return ret;
}

// clone, build partitions, fire two jobs
