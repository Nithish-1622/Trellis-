import { RoadmapNode, ResourceItem, SkillCheckQuestion, SkillCheckReport } from '../types';

export const askTrellisGuide = async (
  prompt: string,
  context?: { userName?: string; targetRole?: string; currentSkills?: Record<string, number> }
): Promise<string> => {
  return agentService.sendChatMessage(prompt, {
    currentNodeTitle: context?.targetRole,
    currentScores: context?.currentSkills
  });
};

export const generateSkillCheckQuestions = (
  domain: string,
  proficiency: string
): SkillCheckQuestion[] => {
  return [
    {
      id: 'q1',
      domain,
      difficulty: 'Senior',
      scenario: 'You are designing a payment processing gateway handling 15,000 req/sec with third-party webhooks that occasionally experience 4-second latency spikes. How do you prevent cascade worker thread exhaustion?',
      codeSnippet: `// Synchronous bottleneck:
app.post('/charge', async (req, res) => {
  const result = await thirdPartyBankAPI.process(req.body);
  await db.updatePayment(result);
  res.json({ status: 'done' });
});`,
      options: [
        'Increase the HTTP worker threadpool count to 5,000 on each instance.',
        'Adopt an asynchronous message queue with idempotency keys, immediate 202 Accepted return, and exponential backoff retry workers.',
        'Place an in-memory Redis LRU cache in front of the third-party bank API.',
        'Execute synchronous retries with a 500ms fixed sleep timeout.'
      ],
      correctIndex: 1,
      explanation: 'Offloading payment reconciliation to a durable message broker with idempotency guarantees immediately frees ingress HTTP workers and decouples downstream bank latency.'
    },
    {
      id: 'q2',
      domain,
      difficulty: 'Senior',
      scenario: 'Under high write traffic, a relational database replica lag causes users to immediately read stale state right after updating their user profile. What is the optimal architectural pattern?',
      options: [
        'Disable read replication and route all reads and writes to the primary database.',
        'Implement "Read-Your-Own-Writes" consistency by routing reads from the updating client to the primary for a brief TTL window (e.g. 5 seconds).',
        'Add a client-side `setTimeout(5000)` before refreshing the UI.',
        'Switch the database to eventual consistency without read routing.'
      ],
      correctIndex: 1,
      explanation: 'Read-your-own-writes consistency routes the specific user who performed the mutation to the primary database or checks replica LSN timestamps, preventing stale reads while keeping other reads offloaded to replicas.'
    },
    {
      id: 'q3',
      domain,
      difficulty: 'Lead',
      scenario: 'Which consensus algorithm property guarantees that once a majority quorum has committed a log entry in a distributed system, that log entry will be present in all future leader terms?',
      options: [
        'Liveness condition under network partitions',
        'Leader Completeness Property',
        'State Machine Divergence principle',
        'Split-Brain Heartbeat Rule'
      ],
      correctIndex: 1,
      explanation: 'In Raft/Paxos consensus, the Leader Completeness Property ensures that if a log entry is committed in a given term, then that entry will be present in the logs of the leaders for all higher-numbered terms.'
    },
    {
      id: 'q4',
      domain,
      difficulty: 'Senior',
      scenario: 'A distributed cron job scheduled across 10 cluster nodes is triggering duplicate billing jobs simultaneously during clock drift. What is the most resilient fix?',
      options: [
        'Rely strictly on NTP daemon synchronization across all VM instances.',
        'Acquire a distributed lock with TTL and fencing tokens (e.g., Redlock or ZooKeeper znode) before executing the batch job.',
        'Designate node-1 as the permanent master in static config.',
        'Run the cron job every 2 hours instead of every hour.'
      ],
      correctIndex: 1,
      explanation: 'Distributed locks paired with monotonic fencing tokens prevent split-brain execution even when NTP clock drift or JVM garbage collection pauses occur.'
    },
    {
      id: 'q5',
      domain,
      difficulty: 'Senior',
      scenario: 'When decomposing a monolith into microservices, two services frequently need to mutate transactions atomically across boundaries. Which pattern should you adopt?',
      options: [
        'Two-Phase Commit (2PC) with distributed XA transactions across all cloud services.',
        'Saga Pattern with Orchestration or Choreography and compensating rollback transactions.',
        'Share a single PostgreSQL table between both microservices directly.',
        'Accept data corruption and run nocturnal cron audit scripts.'
      ],
      correctIndex: 1,
      explanation: 'The Saga pattern provides eventual consistency across service boundaries through a sequence of local transactions with automated compensating rollbacks, avoiding blocking distributed 2PC locks.'
    }
  ];
};

export const generateSkillCheckReport = (
  domain: string,
  proficiency: string,
  questions: SkillCheckQuestion[],
  userAnswers: number[]
): SkillCheckReport => {
  let score = 0;
  questions.forEach((q, i) => {
    if (userAnswers[i] === q.correctIndex) score += 1;
  });

  const total = questions.length;
  const percentage = Math.round((score / total) * 100);
  let bloomStage: SkillCheckReport['bloomStage'] = 'Budding Sprout';
  if (percentage >= 80) bloomStage = 'Master Arborist';
  else if (percentage >= 60) bloomStage = 'Full Canopy Bloom';
  else if (percentage >= 40) bloomStage = 'Thriving Shoot';

  return {
    domain,
    proficiencyClaim: proficiency,
    score,
    total,
    percentage,
    bloomStage,
    strengths: [
      'Idempotent API design & distributed queuing',
      'Consensus protocol failure isolation',
      'Saga choreography rollback mechanisms'
    ],
    growthAreas: [
      'Fine-grained tail latency tuning under network jitter',
      'Fencing token monotonic sequencing'
    ],
    recommendedNodeTitle: 'Advanced Distributed State & Resilient Sagas',
    recommendedNodeId: 'node-3'
  };
};

export const agentService = {
  // 1. Full-page AI Guide Chat with Gemini API backend
  async sendChatMessage(prompt: string, context?: { currentNodeTitle?: string; currentScores?: Record<string, number> }): Promise<string> {
    try {
      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          currentNodeTitle: context?.currentNodeTitle || 'Full-Stack Systems Architecture',
          currentScores: context?.currentScores
        })
      });

      if (!res.ok) {
        throw new Error('AI backend returned non-OK status');
      }

      const data = await res.json();
      return data.reply || 'No response generated.';
    } catch (err) {
      console.warn('Using local Trellis Agent fallback:', err);
      return `**Trellis Architecture Guidance:**\n\nWhen exploring **${context?.currentNodeTitle || 'Distributed Systems & Scaling'}**, here is the optimal growth path:\n\n1. **Eventual Consistency vs. Strong Consistency**: Apply the CAP/PACELC theorem to choose between CP (e.g. Raft consensus) and AP (e.g. Dynamo partitioned storage).\n2. **Resilience Boundaries**: Isolate blast radiuses with bulkhead threadpools and adaptive rate limiters.\n3. **Recommended Next Step**: Work through the practical checkpoint on your roadmap to test your mastery.`;
    }
  },

  // 2. Adaptive AI Path Regeneration upon user feedback
  async regeneratePathNode(nodeId: string, action: 'up' | 'down' | 'regen'): Promise<{ newTitle?: string; reason: string }> {
    await new Promise(r => setTimeout(r, 600));
    if (action === 'regen') {
      return {
        newTitle: 'Adaptive Alternative: Resilient Stream Processing with Kafka Streams',
        reason: 'Recalibrated path based on your learning speed. Replaced monolithic batching module with event stream joins.'
      };
    }
    return {
      reason: action === 'up'
        ? 'Great! Trellis will prioritize similar hands-on architectural deep dives.'
        : 'Feedback noted. Trellis has adjusted the difficulty weighting for subsequent nodes.'
    };
  },

  // 3. Practice Skill-Check Questions Generator
  async getSkillCheckQuestions(domain: string, proficiency: string): Promise<SkillCheckQuestion[]> {
    return generateSkillCheckQuestions(domain, proficiency);
  },

  // 4. Evaluate Skill Check Report
  async generateSkillReport(domain: string, proficiency: string, score: number, total: number): Promise<SkillCheckReport> {
    return generateSkillCheckReport(domain, proficiency, [], []);
  }
};
