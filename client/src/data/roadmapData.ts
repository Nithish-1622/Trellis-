import { RoadmapNode, ResourceItem } from '../types';

export const INITIAL_ROADMAP_NODES: RoadmapNode[] = [
  {
    id: 'node-1',
    title: 'Distributed System Foundations & Ingress Gateways',
    shortDescription: 'Core gateway routing, TLS termination, protocol buffers, and reverse proxy topology.',
    type: 'course',
    status: 'done',
    progress: 100,
    domain: 'programming',
    estHours: 4,
    weekIndex: 1,
    branchId: 'core',
    prerequisites: [],
    badgeLabel: 'Foundational Root',
    whyThis: 'Identified as baseline root prerequisite for resilient microservices orchestration.',
    whyThisDetail: {
      scoreGap: '+22% Ingress Proficiency Needed',
      rationale: 'Calibrated based on your self-reported skill rating in Programming & Systems.',
      targetImpact: 'Unlocks advanced gateway rate-limiting and service meshes.',
      keySkill: 'Envoy, Nginx, gRPC Ingress Multiplexing',
      predictedSpeedup: 'Saves 6 hours in downstream debugging'
    },
    feedback: 'up',
    learningModule: {
      overview: 'Ingress gateways manage external client traffic into private cluster subnets with TLS offloading and protocol translation.',
      keyConcepts: [
        {
          title: 'Layer 7 vs Layer 4 Reverse Proxying',
          explanation: 'L7 routing examines HTTP headers and paths for intelligent upstream dispatch; L4 operates at raw TCP/UDP stream level for maximum throughput.',
          codeSnippet: `// Envoy L7 Route Configuration Snippet
route_config:
  name: dynamic_ingress_routes
  virtual_hosts:
  - name: api_service
    domains: ["api.trellis.grow"]
    routes:
    - match: { prefix: "/v1/grow" }
      route: { cluster: "trellis_growth_backend" }`
        }
      ],
      interactiveDemo: {
        type: 'rate-limiter',
        title: 'Token Bucket Ingress Sandbox',
        description: 'Simulate high-concurrency burst traffic against a distributed rate limiter.'
      },
      quiz: [
        {
          question: 'What is the primary benefit of TLS Termination at the Ingress Gateway?',
          options: [
            'Offloads CPU-intensive cryptographic handshakes from internal microservices',
            'Prevents all SQL injection vulnerabilities',
            'Eliminates the need for API authentication tokens',
            'Enforces client-side caching headers'
          ],
          correctIndex: 0,
          explanation: 'TLS termination centralizes certificate lifecycle management and frees internal pods from repetitive SSL computation.'
        }
      ],
      resources: [
        {
          title: 'Envoy Proxy Architecture Deep Dive',
          type: 'diagram',
          estMinutes: 20
        }
      ]
    }
  },
  {
    id: 'node-2',
    title: 'Idempotency, Retries & Dead Letter Queues',
    shortDescription: 'Ensure fault-tolerant mutations across network partitions using idempotency tokens and exponential backoff.',
    type: 'project',
    status: 'in-progress',
    progress: 65,
    domain: 'dataMath',
    estHours: 6,
    weekIndex: 1,
    branchId: 'core',
    prerequisites: ['node-1'],
    badgeLabel: 'Active Sprout',
    whyThis: 'Essential pattern for zero-loss billing and financial transactions under network failures.',
    whyThisDetail: {
      scoreGap: '+35% Reliability Engineering',
      rationale: 'Critical gap between current (62%) and target (85%) Data & Math resilience.',
      targetImpact: 'Guarantees exactly-once execution semantics for downstream listeners.',
      keySkill: 'Distributed Idempotency Keys, Redis Distributed Locks',
      predictedSpeedup: 'Prevents catastrophic double-charge race conditions'
    },
    feedback: null,
    learningModule: {
      overview: 'Idempotent APIs ensure that identical client retries produce the exact same outcome without duplicate side-effects.',
      keyConcepts: [
        {
          title: 'Idempotency Key Lifecycle & Deduplication',
          explanation: 'Generate a UUIDv4 on client request dispatch, store the key in Redis with a 24-hour TTL, and atomic status locks.',
          codeSnippet: `async function processPayment(idempotencyKey, payload) {
  const locked = await redis.set(\`lock:\${idempotencyKey}\`, 'PENDING', 'NX', 'EX', 30);
  if (!locked) {
    return await pollCachedResult(idempotencyKey);
  }
  const result = await bankGateway.charge(payload);
  await redis.set(\`result:\${idempotencyKey}\`, JSON.stringify(result), 'EX', 86400);
  return result;
}`
        }
      ],
      interactiveDemo: {
        type: 'event-broker',
        title: 'Idempotent Transaction Simulator',
        description: 'Simulate duplicated network packet storms and observe how deduplication caches filter duplicate writes.'
      },
      quiz: [
        {
          question: 'What is the danger of setting too short of a TTL on an idempotency deduplication key?',
          options: [
            'Clients retrying after the TTL expires could trigger a duplicate transaction side-effect',
            'Database indexes become permanently corrupted',
            'Memory usage in Redis increases exponentially',
            'The client is immediately disconnected'
          ],
          correctIndex: 0,
          explanation: 'If the TTL is shorter than the client retry timeout window, a subsequent retry will be treated as a brand new unique request.'
        }
      ],
      resources: [
        {
          title: 'Stripe Architecture: Designing Robust Idempotency',
          type: 'article',
          estMinutes: 25
        }
      ]
    }
  },
  {
    id: 'node-3',
    title: 'Adaptive Circuit Breakers & Fallback Topology',
    shortDescription: 'Prevent cascading service failure cascades with dynamic rolling window trip breakers.',
    type: 'checkpoint',
    status: 'available',
    progress: 0,
    domain: 'systems',
    estHours: 3,
    weekIndex: 1,
    branchId: 'core',
    isForkPoint: true,
    forkOptions: [
      { id: 'branch-event', name: 'Event-Driven Sagas (Kafka)', tag: 'Asynchronous Stream' },
      { id: 'branch-mesh', name: 'Istio Service Mesh & Zero-Trust', tag: 'Synchronous Mesh' }
    ],
    selectedFork: 'branch-event',
    prerequisites: ['node-2'],
    badgeLabel: 'Ready to Bloom',
    whyThis: 'Recommended by AI to cement resilience before branching into specialized architectures.',
    whyThisDetail: {
      scoreGap: '+28% Failure Domain Isolation',
      rationale: 'Ensures your system fails gracefully rather than taking down the entire cluster.',
      targetImpact: 'Maintains 99.99% availability during downstream third-party outages.',
      keySkill: 'Circuit Breaker State Machines, Sliding Error Rates',
      predictedSpeedup: 'Prevents thread starvation cascades'
    },
    feedback: null,
    learningModule: {
      overview: 'Circuit breakers monitor failure rates and flip from CLOSED to OPEN state when thresholds are breached, routing to static fallbacks.',
      keyConcepts: [
        {
          title: 'Closed, Open, Half-Open State Machine',
          explanation: 'In OPEN state, calls fail fast immediately without hitting the degraded downstream service. After a cooldown, HALF-OPEN allows test probes.',
          codeSnippet: `// Circuit Breaker State Transition
if (failureRate > 0.50 && totalRequests > 20) {
  state = 'OPEN';
  tripTimestamp = Date.now();
} else if (state === 'OPEN' && Date.now() - tripTimestamp > 10000) {
  state = 'HALF_OPEN';
}`
        }
      ],
      interactiveDemo: {
        type: 'circuit-breaker',
        title: 'Live Circuit Breaker Trip Simulator',
        description: 'Inject latency spikes and error codes to trigger state transitions in real time.'
      },
      quiz: [
        {
          question: 'What is the role of the HALF-OPEN state in a circuit breaker?',
          options: [
            'To permit a limited number of trial requests to determine if the downstream service has recovered',
            'To double the request timeout duration',
            'To permanently disconnect all clients',
            'To alert on-call engineers via PagerDuty only'
          ],
          correctIndex: 0,
          explanation: 'HALF-OPEN probes the downstream system gently. If trial requests succeed, the breaker resets to CLOSED; if they fail, it trips back to OPEN.'
        }
      ],
      resources: [
        {
          title: 'Netflix Hystrix & Resilience4j Architecture Patterns',
          type: 'kata',
          estMinutes: 30
        }
      ]
    }
  },
  {
    id: 'node-4a',
    title: 'Event-Driven Sagas & Choreography Topology',
    shortDescription: 'Branch A: Distributed compensating transactions, outbox patterns, and event streams.',
    type: 'project',
    status: 'locked',
    progress: 0,
    domain: 'dataMath',
    estHours: 8,
    weekIndex: 2,
    branchId: 'branch-event',
    prerequisites: ['node-3'],
    badgeLabel: 'Dormant Bud',
    whyThis: 'Branch option chosen for high-throughput eventual consistency decoupled workflows.',
    whyThisDetail: {
      scoreGap: '+40% Event Sourcing Mastery',
      rationale: 'Matches your selected specialization in Distributed Event Streams.',
      targetImpact: 'Enables limitless asynchronous scalability without database write locks.',
      keySkill: 'Transactional Outbox, Kafka Partitioning, Debezium CDC',
      predictedSpeedup: 'Scales to 100k+ events/second'
    },
    feedback: null,
    learningModule: {
      overview: 'The Saga pattern executes distributed multi-service operations as a sequence of local transactions with automated rollback compensation.',
      keyConcepts: [
        {
          title: 'Transactional Outbox Pattern',
          explanation: 'Write domain entity changes and event messages into the same local database transaction, avoiding distributed 2PC.',
          codeSnippet: `BEGIN TRANSACTION;
  INSERT INTO orders (id, user_id, amount) VALUES ('ord_99', 'usr_1', 149.00);
  INSERT INTO outbox_events (aggregate_id, event_type, payload) 
    VALUES ('ord_99', 'ORDER_CREATED', '{"amount": 149.00}');
COMMIT;`
        }
      ],
      interactiveDemo: {
        type: 'event-broker',
        title: 'Kafka Consumer Group Rebalance Simulator',
        description: 'Simulate worker node crashes and observe partition rebalancing across consumers.'
      },
      quiz: [
        {
          question: 'Why does the Transactional Outbox pattern prevent message loss?',
          options: [
            'Because the outbox event and database state change are committed atomically in the same local transaction',
            'Because it bypasses the database and writes directly to disk',
            'Because it forces synchronous HTTP calls',
            'Because it eliminates the need for Kafka'
          ],
          correctIndex: 0,
          explanation: 'By using the local database ACID transaction boundary, both the business data and the event are guaranteed to be persisted together.'
        }
      ],
      resources: [
        {
          title: 'Building Resilient Event Streams with Apache Kafka',
          type: 'video',
          estMinutes: 45
        }
      ]
    }
  },
  {
    id: 'node-4b',
    title: 'Service Mesh, mTLS & Zero-Trust Governance',
    shortDescription: 'Branch B: Istio sidecar proxies, mutual TLS encryption, and fine-grained authorization.',
    type: 'course',
    status: 'locked',
    progress: 0,
    domain: 'systems',
    estHours: 6,
    weekIndex: 2,
    branchId: 'branch-mesh',
    prerequisites: ['node-3'],
    badgeLabel: 'Dormant Bud',
    whyThis: 'Alternative Branch: Ideal for enterprise zero-trust synchronous microservices mesh.',
    whyThisDetail: {
      scoreGap: '+32% Security & Mesh Orchestration',
      rationale: 'Focuses on cryptographic inter-service identity (SPIFFE/SPIRE) and dynamic traffic shifting.',
      targetImpact: 'Ensures encrypted communication across all cluster pods.',
      keySkill: 'Istio VirtualService, mTLS, Envoy Sidecars',
      predictedSpeedup: 'Eliminates perimeter vulnerability vectors'
    },
    feedback: null,
    learningModule: {
      overview: 'Service meshes decouple traffic management, telemetry, and security from application source code.',
      keyConcepts: [
        {
          title: 'Mutual TLS (mTLS) Handshake in Istio',
          explanation: 'Sidecar proxies exchange X.509 certificates to verify pod identities and encrypt communication transparently.',
          codeSnippet: `apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: default
  namespace: prod-services
spec:
  mtls:
    mode: STRICT`
        }
      ],
      interactiveDemo: {
        type: 'service-mesh',
        title: 'Service Mesh Canary Routing Sandbox',
        description: 'Shift traffic progressively (90/10 -> 50/50 -> 100/0) between v1 and v2 deployments.'
      },
      quiz: [
        {
          question: 'What does `mode: STRICT` enforce in an Istio PeerAuthentication policy?',
          options: [
            'All connections within the namespace MUST use mutual TLS encryption',
            'Only HTTP/1.1 traffic is allowed',
            'No external internet access is permitted',
            'Passwords must be rotated daily'
          ],
          correctIndex: 0,
          explanation: 'STRICT mode rejects plain-text TCP connections and requires valid client certificates on every incoming request.'
        }
      ],
      resources: [
        {
          title: 'Zero-Trust Architecture on Kubernetes with Istio',
          type: 'cheatsheet',
          estMinutes: 20
        }
      ]
    }
  },
  {
    id: 'node-5',
    title: 'Multi-Region High Availability & Active-Active Data Sharding',
    shortDescription: 'Global database sharding, Geo-DNS latency routing, conflict resolution, and disaster recovery.',
    type: 'checkpoint',
    status: 'locked',
    progress: 0,
    domain: 'research',
    estHours: 10,
    weekIndex: 3,
    branchId: 'core',
    prerequisites: ['node-4a', 'node-4b'],
    badgeLabel: 'Canopy Crown',
    whyThis: 'The apex mastery checkpoint for Principal & Staff Software Architects.',
    whyThisDetail: {
      scoreGap: '+45% Global Distributed Systems',
      rationale: 'Final milestone required to reach 99.999% SLA architectural competence.',
      targetImpact: 'Survives catastrophic single-cloud region datacenter failure.',
      keySkill: 'Spanner / CockroachDB Global Consensus, Anycast BGP',
      predictedSpeedup: 'Sub-50ms latency across 3 continents'
    },
    feedback: null,
    learningModule: {
      overview: 'Active-Active multi-region systems route users to the nearest geographical datacenter with automatic failover and distributed consensus.',
      keyConcepts: [
        {
          title: 'CRDTs & Last-Write-Wins Conflict Resolution',
          explanation: 'Conflict-Free Replicated Data Types merge divergent regional edits mathematically without locking.',
          codeSnippet: `// Monotonic PN-Counter CRDT
class PNCounter {
  constructor(nodeId) {
    this.nodeId = nodeId;
    this.P = {};
    this.N = {};
  }
  value() {
    const pSum = Object.values(this.P).reduce((a, b) => a + b, 0);
    const nSum = Object.values(this.N).reduce((a, b) => a + b, 0);
    return pSum - nSum;
  }
}`
        }
      ],
      interactiveDemo: {
        type: 'caching',
        title: 'Global Latency Shard Simulator',
        description: 'Simulate cross-continental link latency and partition recovery.'
      },
      quiz: [
        {
          question: 'What is the primary trade-off of deploying Active-Active multi-region databases?',
          options: [
            'Cross-region write latency and complex data conflict reconciliation',
            'Users can only read data during daytime',
            'Increased CSS rendering times',
            'Inability to use HTTPS'
          ],
          correctIndex: 0,
          explanation: 'Synchronous cross-region writes are physically bounded by the speed of light in fiber optics (e.g. ~70ms transatlantic), requiring smart asynchronous conflict resolution or strict regional partitioning.'
        }
      ],
      resources: [
        {
          title: 'Google Spanner: TrueTime & Distributed Transactions',
          type: 'article',
          estMinutes: 40
        }
      ]
    }
  }
];

export const INITIAL_RESOURCE_ITEMS: ResourceItem[] = [
  {
    id: 'res-1',
    title: 'Distributed Systems & Microservices Architecture Masterclass',
    provider: 'Trellis Academy',
    type: 'Course',
    category: 'Architecture',
    level: 'Intermediate',
    duration: '4.5 hrs',
    matchScore: 98,
    description: 'Comprehensive deep dive into event-driven design, CQRS, saga orchestration, and high-concurrency gateway patterns.',
    whyThis: 'Directly addresses your current 62% Data & Math score gap and accelerates Node #2 mastery.',
    tags: ['Microservices', 'Kafka', 'Consensus', 'Sagas'],
    feedback: null,
    bookmarked: true,
    completed: false,
    relatedNodeId: 'node-2'
  },
  {
    id: 'res-2',
    title: 'Building Resilient Ingress with Envoy & gRPC',
    provider: 'Cloud Native Foundation',
    type: 'Project',
    category: 'Ingress & Gateways',
    level: 'Intermediate',
    duration: '3.0 hrs',
    matchScore: 94,
    description: 'Hands-on sandbox configuring rate limits, zero-downtime certificate renewal, and dynamic route clusters.',
    whyThis: 'Reinforces Node #1 foundations with real-world Envoy YAML configuration exercises.',
    tags: ['Envoy', 'gRPC', 'TLS', 'Networking'],
    feedback: 'up',
    bookmarked: false,
    completed: true,
    relatedNodeId: 'node-1'
  },
  {
    id: 'res-3',
    title: 'Zero-Trust Istio Service Mesh Blueprint',
    provider: 'DevOps Guild',
    type: 'Video',
    category: 'Security & Mesh',
    level: 'Advanced',
    duration: '1.2 hrs',
    matchScore: 89,
    description: 'Visual teardown of SPIFFE/SPIRE pod cryptography, mTLS enforcement, and canary traffic shifting.',
    whyThis: 'Prepares you for the upcoming Branch B specialization in your lattice path.',
    tags: ['Istio', 'mTLS', 'Zero-Trust', 'Security'],
    feedback: null,
    bookmarked: true,
    completed: false,
    relatedNodeId: 'node-4b'
  },
  {
    id: 'res-4',
    title: 'High-Throughput Kafka Stream Processing & Debezium CDC',
    provider: 'Event Horizon Labs',
    type: 'Course',
    category: 'Data Engineering',
    level: 'Advanced',
    duration: '5.0 hrs',
    matchScore: 92,
    description: 'Master outbox pattern, exactly-once delivery semantics, and change data capture with Debezium.',
    whyThis: 'Recommended by Trellis AI to accompany Branch A Event-Driven Sagas.',
    tags: ['Kafka', 'Debezium', 'CDC', 'Streaming'],
    feedback: null,
    bookmarked: false,
    completed: false,
    relatedNodeId: 'node-4a'
  },
  {
    id: 'res-5',
    title: 'Multi-Region Distributed Database Trade-Offs',
    provider: 'Systems Architects Guild',
    type: 'Video',
    category: 'Distributed Databases',
    level: 'Advanced',
    duration: '55 mins',
    matchScore: 87,
    description: 'Detailed analysis of CAP/PACELC theorems, Spanner TrueTime GPS synchronization, and CRDT convergence.',
    whyThis: 'Essential conceptual background for the apex Multi-Region checkpoint node.',
    tags: ['Spanner', 'CRDT', 'CAP Theorem', 'Global Scale'],
    feedback: null,
    bookmarked: false,
    completed: false,
    relatedNodeId: 'node-5'
  }
];
