const { parseEdge } = require("../utils/validators");
const { userId, emailId, collegeRollNumber } = require("../config");

function processHierarchyRequest(body) {
  if (!body || !Array.isArray(body.data)) {
    throw new Error("Request body must contain a data array");
  }

  const { acceptedEdges, invalidEntries, duplicateEdges } = classifyInputEdges(body.data);
  const rootFirstSeenAt = buildRootOrderMap(acceptedEdges);
  const graph = buildGraph(acceptedEdges);

  const cycleGroups = findCycleGroups(graph.adjacency, graph.allNodes);
  const nodesInsideCycle = flattenCycleGroups(cycleGroups);
  const roots = findRoots(graph.parentNodes, graph.childNodes);

  const hierarchies = [];
  const treeDepths = [];

  for (const root of roots) {
    if (nodesInsideCycle.has(root)) {
      continue;
    }

    const treeResult = buildTreeAndDepth(root, graph.adjacency);
    if (treeResult.hasCycle) {
      hierarchies.push({ root, tree: {}, has_cycle: true });
      continue;
    }

    hierarchies.push({
      root,
      tree: { [root]: treeResult.tree },
      depth: treeResult.depth
    });

    treeDepths.push({ root, depth: treeResult.depth });
  }

  for (const cycle of cycleGroups) {
    const cycleRoot = [...cycle].sort()[0];
    hierarchies.push({ root: cycleRoot, tree: {}, has_cycle: true });
  }

  sortHierarchiesByInputOrder(hierarchies, rootFirstSeenAt);

  const summary = buildSummary(treeDepths, cycleGroups.length);

  return {
    user_id: userId,
    email_id: emailId,
    college_roll_number: collegeRollNumber,
    hierarchies,
    invalid_entries: invalidEntries,
    duplicate_edges: duplicateEdges,
    summary
  };
}

function classifyInputEdges(entries) {
  const invalidEntries = [];
  const duplicateEdges = [];
  const acceptedEdges = [];

  const acceptedEdgeSet = new Set();
  const duplicateReported = new Set();

  for (const entry of entries) {
    const parsed = parseEdge(entry);
    if (!parsed.isValid) {
      invalidEntries.push(typeof entry === "string" ? entry.trim() : entry);
      continue;
    }

    if (acceptedEdgeSet.has(parsed.normalized)) {
      if (!duplicateReported.has(parsed.normalized)) {
        duplicateEdges.push(parsed.normalized);
        duplicateReported.add(parsed.normalized);
      }
      continue;
    }

    acceptedEdgeSet.add(parsed.normalized);
    acceptedEdges.push({
      parent: parsed.parent,
      child: parsed.child,
      edge: parsed.normalized
    });
  }

  return {
    acceptedEdges,
    invalidEntries,
    duplicateEdges
  };
}

function buildRootOrderMap(validEdges) {
  const rootOrderMap = new Map();
  let order = 0;

  for (const { parent } of validEdges) {
    if (!rootOrderMap.has(parent)) {
      rootOrderMap.set(parent, order);
      order += 1;
    }
  }

  return rootOrderMap;
}

function buildGraph(validEdges) {
  const adjacency = new Map();
  const childToParent = new Map();
  const parentNodes = new Set();
  const childNodes = new Set();
  const allNodes = new Set();

  for (const { parent, child } of validEdges) {
    parentNodes.add(parent);
    childNodes.add(child);
    allNodes.add(parent);
    allNodes.add(child);

    // Keep only first parent when multiple parents are provided for one child.
    if (childToParent.has(child)) {
      continue;
    }

    childToParent.set(child, parent);

    if (!adjacency.has(parent)) {
      adjacency.set(parent, []);
    }
    adjacency.get(parent).push(child);

    if (!adjacency.has(child)) {
      adjacency.set(child, []);
    }
  }

  for (const children of adjacency.values()) {
    children.sort();
  }

  return {
    adjacency,
    parentNodes,
    childNodes,
    allNodes
  };
}

function findRoots(parentNodes, childNodes) {
  return [...parentNodes].filter((node) => !childNodes.has(node)).sort();
}

function flattenCycleGroups(cycleGroups) {
  const nodes = new Set();

  for (const group of cycleGroups) {
    for (const node of group) {
      nodes.add(node);
    }
  }

  return nodes;
}

function sortHierarchiesByInputOrder(hierarchies, rootOrderMap) {
  hierarchies.sort((left, right) => {
    const leftOrder = rootOrderMap.has(left.root) ? rootOrderMap.get(left.root) : Number.MAX_SAFE_INTEGER;
    const rightOrder = rootOrderMap.has(right.root) ? rootOrderMap.get(right.root) : Number.MAX_SAFE_INTEGER;

    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder;
    }

    return left.root.localeCompare(right.root);
  });
}

function buildTreeAndDepth(root, adjacency) {
  const visiting = new Set();

  function dfs(node) {
    if (visiting.has(node)) {
      return { hasCycle: true, tree: {}, depth: 0 };
    }

    visiting.add(node);

    const children = adjacency.get(node) || [];
    const tree = {};
    let maxChildDepth = 0;

    for (const child of children) {
      const childResult = dfs(child);
      if (childResult.hasCycle) {
        visiting.delete(node);
        return { hasCycle: true, tree: {}, depth: 0 };
      }

      tree[child] = childResult.tree;
      if (childResult.depth > maxChildDepth) {
        maxChildDepth = childResult.depth;
      }
    }

    visiting.delete(node);

    return {
      hasCycle: false,
      tree,
      depth: 1 + maxChildDepth
    };
  }

  return dfs(root);
}

function findCycleGroups(adjacency, allNodes) {
  const visited = new Set();
  const inStack = new Set();
  const path = [];
  const cycleGroups = [];
  const seenGroups = new Set();

  function dfs(node) {
    visited.add(node);
    inStack.add(node);
    path.push(node);

    const children = adjacency.get(node) || [];
    for (const child of children) {
      if (!visited.has(child)) {
        dfs(child);
      } else if (inStack.has(child)) {
        const startIndex = path.lastIndexOf(child);
        if (startIndex !== -1) {
          const cycleNodes = path.slice(startIndex).sort();
          const key = cycleNodes.join(",");
          if (!seenGroups.has(key)) {
            cycleGroups.push(cycleNodes);
            seenGroups.add(key);
          }
        }
      }
    }

    path.pop();
    inStack.delete(node);
  }

  for (const node of [...allNodes].sort()) {
    if (!visited.has(node)) {
      dfs(node);
    }
  }

  return cycleGroups;
}

function buildSummary(treeMetrics, totalCycles) {
  let largestTreeRoot = "";
  let largestDepth = -1;

  for (const metric of treeMetrics) {
    if (metric.depth > largestDepth) {
      largestDepth = metric.depth;
      largestTreeRoot = metric.root;
    } else if (metric.depth === largestDepth && metric.root < largestTreeRoot) {
      largestTreeRoot = metric.root;
    }
  }

  return {
    total_trees: treeMetrics.length,
    total_cycles: totalCycles,
    largest_tree_root: largestTreeRoot
  };
}

module.exports = {
  processHierarchyRequest
};
