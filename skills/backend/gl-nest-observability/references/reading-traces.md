# Reading traces and finding problems

## Contents

1. Finding a trace
2. Transaction names
3. Search queries
4. Reading the waterfall
5. Diagnosing common patterns
6. Fetching a trace from the agent
7. Logs and metrics

## 1. Finding a trace

1. Sentry → **Explore → Traces**, choose the project.
2. Open **Trace Samples** (one row per request), not Span Samples (one row per step).
3. Search, then sort by `span.duration` descending.
4. If a known request is missing, it probably wasn't sampled (default 10%). Re-run it with the debug header, then wait up to a minute.

## 2. Transaction names

| Request | Transaction name |
| --- | --- |
| REST | `POST /api/v1/orders` (method + route) |
| GraphQL | `POST /graphql (mutation Sale__createOrder)` (`useOperationNameForRootSpan`, on by default) |
| Unnamed GraphQL | `POST /graphql`: name the operation on the client |
| BullMQ job, event, cron | the processor, event, or schedule name |

## 3. Search queries

| You want | Query |
| --- | --- |
| Only real requests | `is_transaction:true` |
| One REST route | `transaction:"POST /api/v1/orders"` |
| Any GraphQL mutation | `transaction:"POST /graphql (mutation*"` |
| Screens about a resource | `transaction:*product*` |
| Slow requests | `is_transaction:true span.duration:>1s` |
| One service's methods | `span.op:function span.description:InvoiceService.*` |
| Database queries | `span.op:db` |

For slow endpoints, use **Aggregates** → group by `transaction` → `p95(span.duration)`. Compare p50 and p95 before optimizing from a single trace.

## 4. Reading the waterfall

- Bars are steps, and nested bars ran inside the one above.
- **The widest bar is where the time went.** Expand it, and keep expanding the widest child.
- **Autogrouped** rows are identical siblings collapsed together. Click to expand them.
- Bars that **start at the same moment** ran concurrently.
- **Gaps** inside a parent are untraced time: CPU work, an unpatched client, or an outside API.

## 5. Diagnosing common patterns

| What you see | What it means | Action |
| --- | --- | --- |
| Same `db` span repeated as a staircase (one after another) | **N+1**: a query per item in a loop | Collect ids, query once with `$in`, map results |
| Many identical `function` spans starting and ending together, with **one** `db` child among them | **Batched loader**: callers waiting on one shared query. Not N+1 | Nothing. To declutter, skip that method in `observability/trace-providers.ts` |
| Several `ValidationPipe` spans per resolver | One per resolver parameter, plus one per field-resolver call | Normal. Only remove unused params |
| `find` and `countDocuments` back to back | Sequential pagination queries | `Promise.all` them |
| Guard span with a `db` child on every request | Auth or permission lookup per request | Cache per user with a short TTL |
| Long `function` span, no children | CPU-bound or untraced I/O | Profile, or add `@Traced()` deeper |
| Parent span much longer than the sum of its children | Waiting on an outside API or the event loop | Check runtime metrics for event-loop delay |
| Populate under `find` (`find <OtherCollection>` nested) | Mongoose `populate` | Fine if it's one query. Project fewer fields if slow |

**Rule:** decide N+1 by **counting `db` spans**, never by counting function spans.

## 6. Fetching a trace from the agent

With the Sentry MCP:

```
get_sentry_resource { resourceType: "trace", organizationSlug: "<org>", resourceId: "<32-hex trace id>" }
```

The trace id is in the Sentry URL (`/explore/traces/trace/<id>`) or in a log's `trace_id`. The overview lists the top ~50 spans. Count `db` spans per collection and compare them with the function spans around them.

Use `search_traces`, `search_logs`, and `search_errors` for queries across many requests.

## 7. Logs and metrics

- **Logs:** Explore → Logs. Filter `context:OrderService` or by message text. Click a log's trace id to jump to its request.
- **Runtime metrics** (every 30s per instance): `node.runtime.cpu.utilization`, `mem.rss`, `mem.heap_used`, `event_loop.delay.p99`, `event_loop.utilization`, `process.uptime`.
  - Alert on p99 event-loop delay above 200 ms for 5 minutes, and on RSS rising for an hour.
  - Uptime dropping to zero means a restart or crash.
- **Not in Sentry:** host CPU, memory and disk, and MongoDB and Redis server health. Use the hosting panel or Coolify.
