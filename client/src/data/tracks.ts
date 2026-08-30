import { LearningTrack, DiagnosticQuestion, ResourceItem, SkillScores } from '../types';

export const DEFAULT_SKILL_SCORES: SkillScores = {
  logic: 65,
  data: 48,
  systems: 58,
  ux: 42,
  agile: 60
};

export const TARGET_SKILL_SCORES: SkillScores = {
  logic: 85,
  data: 88,
  systems: 92,
  ux: 60,
  agile: 75
};

export const INITIAL_TRACKS: LearningTrack[] = [
  {
    id: 'systems-architecture',
    name: 'Systems Architecture',
    tagline: 'Your personalized growth trellis based on recent assessments.',
    description: 'Master distributed microservices, asynchronous message topologies, high-availability data layers, and production resilient infrastructures.',
    targetScores: {
      logic: 85,
      data: 88,
      systems: 92,
      ux: 60,
      agile: 75
    },
    currentScores: {
      logic: 65,
      data: 48,
      systems: 58,
      ux: 42,
      agile: 60
    },
    nodes: [
      {
        id: 'microservices-basics',
        title: 'Microservices Basics',
        description: 'Understanding bounded contexts and distributed data management.',
        status: 'mastered',
        progress: 100,
        category: 'systems',
        whyThis: 'Fundamental baseline for distributed system topologies',
        whyThisDetail: {
          scoreGap: 'Systems baseline established (+25 pts)',
          rationale: 'Domain-Driven Design (DDD) bounded contexts prevent shared-database anti-patterns in enterprise microservices.',
          targetImpact: '+18% to Systems Competency',
          keySkill: 'Service Decomposition & API Boundaries',
          predictedSpeedup: 'Prerequisite unlocked 3 downstream modules'
        },
        feedback: 'up',
        badgeLabel: 'Mastered',
        recommendationSource: 'Completed Diagnostic Baseline',
        weekIndex: 1,
        learningModule: {
          overview: 'Microservices architecture structures an application as a collection of loosely coupled, independently deployable services organized around business capabilities.',
          keyConcepts: [
            {
              title: 'Bounded Contexts (DDD)',
              explanation: 'Each microservice owns its domain model and ubiquitous language, preventing domain leakage across service boundaries.',
              codeSnippet: '// Order Context vs Customer Context\ninterface OrderId { readonly value: string }\ninterface OrderAggregate {\n  id: OrderId;\n  customerId: CustomerId;\n  items: OrderLine[];\n  totalAmount: Money;\n}'
            },
            {
              title: 'Database-per-Service Pattern',
              explanation: 'Services must not share database schemas directly; interactions must strictly occur through public APIs or asynchronous event streams.',
              codeSnippet: '// Direct DB coupling: Anti-pattern\n// API Contract: Recommended Pattern\nGET /api/v1/customers/123/credit-limit'
            },
            {
              title: 'API Gateway Pattern',
              explanation: 'A single reverse proxy entry point handles SSL termination, client routing, rate limiting, and token validation.'
            }
          ],
          interactiveDemo: {
            type: 'service-mesh',
            title: 'Bounded Context Inspector',
            description: 'Inspect domain isolation between Order, Inventory, and Payment services.'
          },
          quiz: [
            {
              question: 'Why should microservices avoid sharing a single relational database directly?',
              options: [
                'It degrades runtime performance by 50%',
                'It couples services at the data schema level, preventing independent deployments',
                'SQL databases do not support microservices',
                'It causes immediate CPU throttling'
              ],
              correctIndex: 1,
              explanation: 'Shared databases create tight schema coupling, making it impossible for teams to deploy updates independently without coordinating database migrations.'
            }
          ],
          resources: [
            { title: 'Designing Bounded Contexts with Domain-Driven Design', type: 'article', estMinutes: 12 },
            { title: 'Decomposing Monoliths into Microservices', type: 'kata', estMinutes: 25 }
          ]
        }
      },
      {
        id: 'event-driven-arch',
        title: 'Event-Driven Architecture',
        description: 'Implementing async communication patterns using message brokers.',
        status: 'current',
        progress: 60,
        category: 'data',
        whyThis: 'Recommended based on your quiz',
        whyThisDetail: {
          scoreGap: 'Data layer async knowledge gap detected in quiz (-24 pts vs target)',
          rationale: 'Moving from synchronous REST chains to event-driven choreography eliminates cascading network outages and temporal coupling.',
          targetImpact: '+22% to Data & Systems Competency',
          keySkill: 'Event Choreography, Idempotent Consumers, Dead Letter Queues',
          predictedSpeedup: 'Unlocks Service Mesh & Istio'
        },
        feedback: null,
        badgeLabel: 'Current Focus',
        recommendationSource: 'Recommended based on your quiz',
        weekIndex: 1,
        learningModule: {
          overview: 'Event-driven architectures decouple producers from consumers via event logs or message queues, enabling high throughput, resilience to downstream latency, and seamless scalability.',
          keyConcepts: [
            {
              title: 'Choreography vs Orchestration',
              explanation: 'In choreography, services publish domain events (e.g. OrderCreated) and other services react autonomously without a central controller. In orchestration, a central coordinator commands steps.',
              codeSnippet: '// Choreographed Domain Event\ninterface OrderPlacedEvent {\n  eventId: string;\n  occurredAt: string;\n  orderId: string;\n  customerId: string;\n  lineItems: { sku: string; qty: number }[];\n}'
            },
            {
              title: 'Idempotent Consumer Pattern',
              explanation: 'Because distributed brokers guarantee at-least-once delivery, consumers must de-duplicate events using transactional outboxes or idempotency keys.',
              codeSnippet: 'async function handleOrderEvent(event: OrderEvent) {\n  const seen = await redis.set(`idempotency:${event.id}`, "1", "NX", "EX", 86400);\n  if (!seen) return; // Already processed\n  await fulfillOrder(event);\n}'
            },
            {
              title: 'Event Sourcing & CQRS',
              explanation: 'Persisting every state mutation as an append-only sequence of immutable events, while building optimized read projections asynchronously.'
            }
          ],
          interactiveDemo: {
            type: 'event-broker',
            title: 'Interactive Message Queue Simulator',
            description: 'Publish messages, simulate consumer latency, acknowledge batches, and observe dead-letter queue routing.'
          },
          quiz: [
            {
              question: 'In distributed messaging with "at-least-once" delivery guarantees, what MUST the consumer implement?',
              options: [
                'Synchronous HTTP fallbacks',
                'Idempotent event handlers to safely process duplicate messages',
                'Dual-phase database locking on the message broker',
                'Real-time WebSocket handshakes'
              ],
              correctIndex: 1,
              explanation: 'Because network partitions can cause message re-deliveries, consumers must be idempotent (e.g. using unique message IDs or transactional outboxes) to prevent double processing.'
            },
            {
              question: 'What is the primary advantage of the Transactional Outbox pattern?',
              options: [
                'It avoids writing to any database altogether',
                'It guarantees atomicity between database state changes and publishing messages without 2-phase commit (2PC)',
                'It replaces message brokers with flat files',
                'It accelerates client browser rendering'
              ],
              correctIndex: 1,
              explanation: 'The Transactional Outbox pattern writes both business data and outgoing events within the same local database transaction, ensuring messages are never lost if the broker is temporarily unreachable.'
            },
            {
              question: 'When should you choose Orchestration over Choreography in an event-driven workflow?',
              options: [
                'When you have more than 3 microservices',
                'When the workflow is complex, requires strict compensations (Saga), and needs centralized visibility',
                'When using Kafka instead of RabbitMQ',
                'Only in frontend applications'
              ],
              correctIndex: 1,
              explanation: 'Orchestration provides a single point of visibility and clear compensation logic for intricate multi-step business transactions, whereas pure choreography can become difficult to track across dozens of steps.'
            }
          ],
          resources: [
            { title: 'Event-Driven Microservices: Patterns and Pitfalls', type: 'article', estMinutes: 15 },
            { title: 'Designing an Idempotent Payment Webhook Consumer', type: 'kata', estMinutes: 30 },
            { title: 'Kafka vs RabbitMQ Architectural Trade-offs', type: 'diagram', estMinutes: 10 }
          ]
        }
      },
      {
        id: 'service-mesh-istio',
        title: 'Service Mesh & Istio',
        description: 'Managing complex microservice deployments and traffic routing.',
        status: 'upcoming',
        progress: 0,
        category: 'systems',
        whyThis: 'Next architectural milestone in Systems pathway',
        whyThisDetail: {
          scoreGap: 'Systems infrastructure readiness prerequisite',
          rationale: 'Service meshes offload mutual TLS (mTLS), traffic shadowing, circuit breaking, and distributed tracing from application code to the sidecar proxy layer.',
          targetImpact: '+15% to Systems Competency',
          keySkill: 'Envoy Sidecars, Canary Deployments, mTLS Policy',
          predictedSpeedup: 'Prerequisite for Cloud Deployments'
        },
        feedback: null,
        requires: 'Event-Driven Arch',
        badgeLabel: 'Upcoming',
        recommendationSource: 'Requires: Event-Driven Arch',
        weekIndex: 2,
        learningModule: {
          overview: 'A service mesh provides a dedicated infrastructure layer for transparently handling inter-service communication, telemetry, security, and traffic control without changing application code.',
          keyConcepts: [
            {
              title: 'Data Plane vs Control Plane',
              explanation: 'The Data Plane consists of high-performance Envoy sidecar proxies alongside each pod. The Control Plane (Istiod) translates declarative policies into dynamic Envoy configurations.',
              codeSnippet: 'apiVersion: networking.istio.io/v1alpha3\nkind: VirtualService\nmetadata:\n  name: reviews-route\nspec:\n  hosts:\n  - reviews\n  http:\n  - route:\n    - destination:\n        host: reviews\n        subset: v1\n      weight: 90\n    - destination:\n        host: reviews\n        subset: v2\n      weight: 10'
            },
            {
              title: 'Zero-Trust mTLS Security',
              explanation: 'Istio automatically provisions SPIFFE x509 certificates and enforces mutual TLS authentication between all communicating workloads.'
            },
            {
              title: 'Traffic Shifting & Canary Releases',
              explanation: 'Gradually route a percentage of live traffic to new versions or mirror production traffic for dark launches.'
            }
          ],
          interactiveDemo: {
            type: 'circuit-breaker',
            title: 'Canary Traffic Splitter & Circuit Breaker',
            description: 'Simulate shifting traffic between v1 and v2 deployments while injecting latency faults.'
          },
          quiz: [
            {
              question: 'Where does an Envoy proxy execute in a standard Kubernetes Service Mesh setup?',
              options: [
                'On the user client mobile browser',
                'As a sidecar container running inside the same pod as the application container',
                'Directly inside the Linux kernel of the master node',
                'On the DNS root server'
              ],
              correctIndex: 1,
              explanation: 'Envoy runs as a sidecar container in the same pod network namespace, intercepting all inbound and outbound network calls.'
            }
          ],
          resources: [
            { title: 'Istio in Practice: mTLS and Traffic Shaping', type: 'article', estMinutes: 18 },
            { title: 'Canary Deployment with VirtualServices', type: 'kata', estMinutes: 20 }
          ]
        }
      },
      {
        id: 'distributed-caching-redis',
        title: 'Distributed Caching & Redis',
        description: 'Cache-aside patterns, invalidation strategies, and thundering herd mitigations.',
        status: 'upcoming',
        progress: 0,
        category: 'data',
        whyThis: 'Performance optimization path',
        whyThisDetail: {
          scoreGap: 'Data caching layer optimization (+16 pts)',
          rationale: 'Proper multi-tier caching reduces database load by up to 90% while keeping latency sub-millisecond.',
          targetImpact: '+14% to Data Score',
          keySkill: 'Cache Stampede Defense, Redis Cluster, TTL Jitter',
          predictedSpeedup: 'Prerequisite for High-Scale Resilience'
        },
        feedback: null,
        requires: 'Service Mesh & Istio',
        badgeLabel: 'Upcoming',
        recommendationSource: 'Path Roadmap',
        weekIndex: 2,
        learningModule: {
          overview: 'High-throughput systems rely on memory-speed distributed caches to serve frequent reads while mitigating database bottleneck hazards.',
          keyConcepts: [
            {
              title: 'Cache Stampede / Thundering Herd',
              explanation: 'When a popular cache key expires, thousands of concurrent requests hit the database simultaneously. Mitigation: probabilistic early expiration (XFetch) or mutex locks.',
              codeSnippet: '// Mutex lock for cache recalculation\nconst cached = await redis.get(key);\nif (!cached) {\n  const acquired = await redis.set(`lock:${key}`, "1", "NX", "EX", 5);\n  if (acquired) {\n    const fresh = await fetchFromDB();\n    await redis.set(key, fresh, "EX", 300);\n  }\n}'
            }
          ],
          quiz: [
            {
              question: 'What happens during a "Cache Penetration" attack or scenario?',
              options: [
                'The cache server CPU reaches 100%',
                'Requests query non-existent keys, consistently bypassing the cache and hitting the database',
                'Cache keys are duplicated across shards',
                'The network connection drops'
              ],
              correctIndex: 1,
              explanation: 'Cache penetration occurs when requests query data that does not exist in cache OR database, causing every request to hit the DB. Solution: Bloom filters or caching null objects with short TTL.'
            }
          ],
          resources: [
            { title: 'Defeating the Cache Stampede with Probabilistic Expiration', type: 'article', estMinutes: 14 }
          ]
        }
      },
      {
        id: 'observability-opentelemetry',
        title: 'Observability & OpenTelemetry',
        description: 'Unified distributed tracing, metrics correlation, and automated SLA alerts.',
        status: 'upcoming',
        progress: 0,
        category: 'logic',
        whyThis: 'Production readiness milestone',
        whyThisDetail: {
          scoreGap: 'Logic & Diagnostics alignment',
          rationale: 'Distributed traces propagate W3C trace context headers across microservice chains to pinpoint latency bottlenecks in milliseconds.',
          targetImpact: '+12% to Logic Score',
          keySkill: 'Distributed Tracing, W3C TraceContext, RED Method',
          predictedSpeedup: 'Final Path Mastery'
        },
        feedback: null,
        requires: 'Distributed Caching & Redis',
        badgeLabel: 'Upcoming',
        recommendationSource: 'Path Roadmap',
        weekIndex: 3,
        learningModule: {
          overview: 'Modern observability unites Traces, Metrics, and Logs (the 3 pillars) into an interconnected telemetry graph.',
          keyConcepts: [
            {
              title: 'W3C Trace Context Propagation',
              explanation: 'Passing traceparent and tracestate headers across HTTP and gRPC boundaries connects spans into a single global request trace.',
              codeSnippet: '// W3C Traceparent Header\ntraceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01'
            }
          ],
          quiz: [
            {
              question: 'In the RED observability method for microservices, what do R, E, and D stand for?',
              options: [
                'Rate, Errors, Duration',
                'Read, Execute, Delete',
                'Routing, Encryption, Deployment',
                'Resilience, Elasticity, Data'
              ],
              correctIndex: 0,
              explanation: 'The RED method focuses on Rate (requests per second), Errors (number of failed requests), and Duration (time taken per request).'
            }
          ],
          resources: [
            { title: 'Mastering OpenTelemetry in Production', type: 'article', estMinutes: 16 }
          ]
        }
      }
    ]
  },
  {
    id: 'cloud-devops',
    name: 'Cloud & Infrastructure',
    tagline: 'Modern container orchestration, CI/CD pipelines, and infrastructure as code.',
    description: 'Build enterprise-grade multi-region clouds with Kubernetes, Terraform, and GitOps workflows.',
    targetScores: {
      logic: 80,
      data: 70,
      systems: 95,
      ux: 40,
      agile: 85
    },
    currentScores: {
      logic: 70,
      data: 55,
      systems: 62,
      ux: 35,
      agile: 72
    },
    nodes: [
      {
        id: 'container-orchestration',
        title: 'Kubernetes Pod Topologies',
        description: 'DaemonSets, StatefulSets, and zero-downtime rolling updates.',
        status: 'mastered',
        progress: 100,
        category: 'systems',
        whyThis: 'Core container orchestration baseline',
        whyThisDetail: {
          scoreGap: 'Container foundational skills verified',
          rationale: 'Understanding scheduler affinities and anti-affinities ensures high availability across availability zones.',
          targetImpact: '+20% to Systems Score',
          keySkill: 'K8s Scheduling & Pod Disruption Budgets',
          predictedSpeedup: 'Unlocked Cloud Path'
        },
        feedback: 'up',
        badgeLabel: 'Mastered',
        recommendationSource: 'Baseline Assessment',
        weekIndex: 1,
        learningModule: {
          overview: 'Kubernetes manages containerized workloads with declarative desired-state reconciliation.',
          keyConcepts: [
            {
              title: 'Pod Disruption Budgets (PDB)',
              explanation: 'Ensures a minimum number of healthy replicas remain available during voluntary disruptions like node upgrades.'
            }
          ],
          quiz: [
            {
              question: 'Which Kubernetes controller is best suited for stateful databases requiring persistent network IDs and ordered disk provisioning?',
              options: ['Deployment', 'StatefulSet', 'Job', 'DaemonSet'],
              correctIndex: 1,
              explanation: 'StatefulSets provide persistent identifiers and stable network hostnames for distributed databases.'
            }
          ],
          resources: [{ title: 'Kubernetes Production Best Practices', type: 'article', estMinutes: 20 }]
        }
      },
      {
        id: 'gitops-argocd',
        title: 'GitOps with ArgoCD',
        description: 'Declarative continuous delivery using Git repositories as the single source of truth.',
        status: 'current',
        progress: 45,
        category: 'agile',
        whyThis: 'Identified deployment automation gap',
        whyThisDetail: {
          scoreGap: 'CI/CD pipeline declarative automation gap (-30 pts)',
          rationale: 'GitOps eliminates manual kubectl deployments, automating drift detection and rollbacks directly from pull requests.',
          targetImpact: '+25% to Agile & Systems',
          keySkill: 'ArgoCD Applications, Kustomize, Secret Management with SealedSecrets',
          predictedSpeedup: 'Accelerates DevOps certification'
        },
        feedback: null,
        badgeLabel: 'Current Focus',
        recommendationSource: 'Diagnostic Quiz Result',
        weekIndex: 1,
        learningModule: {
          overview: 'GitOps treats Git repositories as the authoritative definition of infrastructure and application deployments.',
          keyConcepts: [
            {
              title: 'Automated Drift Detection',
              explanation: 'ArgoCD continuously compares live cluster state against Git manifests and triggers automatic reconciliation.'
            }
          ],
          quiz: [
            {
              question: 'In GitOps, how are changes deployed to a production Kubernetes cluster?',
              options: [
                'Developers SSH into the cluster directly',
                'By committing and merging declarative manifests to the tracked Git branch',
                'Via manual FTP uploads',
                'By clicking run in Jenkins console'
              ],
              correctIndex: 1,
              explanation: 'GitOps agents watch the Git repository and automatically reconcile the cluster state to match the approved Git commits.'
            }
          ],
          resources: [{ title: 'GitOps Workflow Guide with ArgoCD and GitHub Actions', type: 'article', estMinutes: 15 }]
        }
      },
      {
        id: 'terraform-iac',
        title: 'Multi-Cloud Terraform & OpenTofu',
        description: 'Modular infrastructure provisioning and state locking at scale.',
        status: 'upcoming',
        progress: 0,
        category: 'systems',
        whyThis: 'Required for infrastructure scale',
        whyThisDetail: {
          scoreGap: 'Infrastructure as code pipeline',
          rationale: 'Automating VPCs, IAM roles, and managed databases prevents manual configuration drift.',
          targetImpact: '+18% to Systems',
          keySkill: 'Terraform Modules, Remote State Locking',
          predictedSpeedup: 'Next Sprint'
        },
        feedback: null,
        requires: 'GitOps with ArgoCD',
        badgeLabel: 'Upcoming',
        recommendationSource: 'Path Roadmap',
        weekIndex: 2,
        learningModule: {
          overview: 'Terraform allows teams to author, version, and share cloud resources safely.',
          keyConcepts: [
            {
              title: 'Remote State & DynamoDB Locking',
              explanation: 'Prevents concurrent terraform apply collisions across team members.'
            }
          ],
          quiz: [
            {
              question: 'Why is remote state locking essential in team Terraform workflows?',
              options: [
                'To encrypt passwords in plain text',
                'To prevent two team members from applying conflicting mutations at the same time',
                'To speed up download times',
                'To bypass AWS IAM roles'
              ],
              correctIndex: 1,
              explanation: 'State locks ensure only one execution can alter infrastructure state at a time, preventing state corruption.'
            }
          ],
          resources: [{ title: 'Terraform Up & Running: Enterprise Patterns', type: 'article', estMinutes: 15 }]
        }
      }
    ]
  }
];

export const DIAGNOSTIC_QUESTIONS: DiagnosticQuestion[] = [
  {
    id: 'q1',
    category: 'systems',
    question: 'You need to coordinate a multi-step financial transfer across 3 independent microservices (Debit, Credit, Audit). If Credit fails, Debit must be reversed. Which pattern is best suited?',
    options: [
      'Two-Phase Commit (2PC) over HTTP REST',
      'Saga Pattern with Orchestration & Compensating Transactions',
      'Direct shared SQL transactions with SERIALIZABLE isolation',
      'Client-side retry loop with exponential backoff'
    ],
    correctIndex: 1,
    explanation: 'The Saga pattern executes a series of local transactions with compensating rollback transactions if an intermediate step fails, avoiding the scalability bottlenecks of distributed locking in 2PC.'
  },
  {
    id: 'q2',
    category: 'data',
    question: 'In an Event-Driven architecture, a consumer receives message batches from a Kafka topic. What is the most reliable way to prevent duplicate side-effects from re-delivered messages?',
    options: [
      'Set Kafka retention period to 0 seconds',
      'Use an Idempotent Consumer with an atomic idempotency key / transactional outbox check',
      'Increase network timeout to 600 seconds',
      'Rely exclusively on TCP checksum validation'
    ],
    correctIndex: 1,
    explanation: 'Distributed brokers guarantee at-least-once delivery; an idempotent consumer checks a persistent cache or database before executing business mutations.'
  },
  {
    id: 'q3',
    category: 'logic',
    question: 'A critical endpoint is experiencing cascading failures due to an overloaded downstream database. Which stability pattern should immediately trip to return fallback responses without further stressing the DB?',
    options: [
      'Circuit Breaker Pattern',
      'Round-Robin DNS',
      'Deadlock Detection Loop',
      'Long Polling'
    ],
    correctIndex: 0,
    explanation: 'A Circuit Breaker opens when error rates exceed a threshold, failing fast immediately and giving the downstream service breathing room to recover.'
  },
  {
    id: 'q4',
    category: 'ux',
    question: 'When designing a developer portal or architecture dashboard, what is the best UX pattern for conveying progressive disclosure on complex multi-tier dependencies?',
    options: [
      'Display all 500 configuration parameters on a single infinite table',
      'Hierarchical drill-down nodes with interactive preview drawers and contextual summary badges',
      'Require CLI terminal commands for every view change',
      'Disable search and sorting to enforce linear reading'
    ],
    correctIndex: 1,
    explanation: 'Progressive disclosure presents high-level status first (e.g. Mastered, Current, Blocked) while allowing deep-dive inspection through interactive drawers without visual clutter.'
  },
  {
    id: 'q5',
    category: 'agile',
    question: 'Your team wants to deploy microservice changes multiple times per day with zero downtime. Which deployment strategy routes a small canary percentage (e.g. 5%) before full cutover?',
    options: [
      'Big Bang Deployment during midnight maintenance windows',
      'Canary Release with automated telemetry analysis and instant rollback',
      'Manual database hot-patching on live containers',
      'Single-server staging swaps'
    ],
    correctIndex: 1,
    explanation: 'Canary releases route real user traffic gradually to verify error rates and latency metrics before broad distribution.'
  }
];

export const RESOURCE_CATALOG: ResourceItem[] = [
  {
    id: 'res-1',
    title: 'Designing Event-Driven Microservices: The Complete Guide',
    category: 'Systems Architecture',
    type: 'Deep Dive Guide',
    duration: '18 min read',
    level: 'Intermediate',
    summary: 'A definitive architectural guide on choreography vs orchestration, outbox patterns, and event schemas with Avro and Protobuf.',
    tags: ['Kafka', 'EDA', 'Microservices', 'Outbox'],
    read: true,
    bookmarked: true,
    relatedNodeId: 'event-driven-arch'
  },
  {
    id: 'res-2',
    title: 'Architecture Kata: High-Throughput Ticket Booking System',
    category: 'System Design',
    type: 'Architecture Kata',
    duration: '45 min exercise',
    level: 'Advanced',
    summary: 'Hands-on architectural design challenge handling 100,000 requests/sec seat reservation with distributed Redis locks and optimistic concurrency.',
    tags: ['Redis', 'Distributed Locks', 'Concurrency', 'High Scale'],
    read: false,
    bookmarked: true,
    relatedNodeId: 'distributed-caching-redis'
  },
  {
    id: 'res-3',
    title: 'Service Mesh & Istio VirtualServices Interactive Diagram',
    category: 'Cloud & Infrastructure',
    type: 'Interactive Diagram',
    duration: '12 min explore',
    level: 'Intermediate',
    summary: 'Visual interactive blueprint showing sidecar proxy traffic routing, fault injection, and zero-trust mTLS certificate handshakes.',
    tags: ['Istio', 'Envoy', 'Kubernetes', 'mTLS'],
    read: false,
    bookmarked: false,
    relatedNodeId: 'service-mesh-istio'
  },
  {
    id: 'res-4',
    title: 'OpenTelemetry in Production: Tracing Distributed Latency',
    category: 'Observability',
    type: 'Deep Dive Guide',
    duration: '22 min read',
    level: 'Advanced',
    summary: 'Learn how to correlate distributed traces across async message queues and microservices using W3C Trace Context headers.',
    tags: ['OpenTelemetry', 'Distributed Tracing', 'Jaeger', 'Prometheus'],
    read: false,
    bookmarked: false,
    relatedNodeId: 'observability-opentelemetry'
  },
  {
    id: 'res-5',
    title: 'Microservices Anti-Patterns Cheat Sheet',
    category: 'Best Practices',
    type: 'Cheat Sheet',
    duration: '5 min reference',
    level: 'Beginner',
    summary: 'Quick reference guide highlighting the top 7 distributed systems anti-patterns: Distributed Monolith, Shared DB, Chatty APIs, and Mega-Services.',
    tags: ['DDD', 'Anti-Patterns', 'Architecture', 'Refactoring'],
    read: true,
    bookmarked: true,
    relatedNodeId: 'microservices-basics'
  }
];

export const TRACKS_DATA = INITIAL_TRACKS;
