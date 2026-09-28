import { Exam, ExamSubmission } from '../types';

export const INITIAL_EXAMS: Exam[] = [
  {
    id: 'exam-cs-301',
    courseCode: 'CS-301',
    title: 'Algorithms & Data Structures Qualifying Assessment',
    discipline: 'Computer Science',
    instructor: 'Prof. Elena Vance',
    durationMinutes: 30,
    passingPercentage: 70,
    proctored: true,
    allowCalculator: false,
    description:
      'Evaluates asymptotic complexity analysis, balanced search trees, graph traversal invariants, dynamic programming recurrences, and hash table collision resolution.',
    instructions: [
      'Read each problem statement and optional code block carefully before selecting your response.',
      'Multiple-select questions require all correct options to be selected for full credit.',
      'Use the built-in scratchpad to work through recurrence relations and tree rotations.',
      'Switching browser tabs or leaving the active assessment window is logged by the focus monitor.'
    ],
    createdAt: '2026-09-01',
    questions: [
      {
        id: 'q-cs-1',
        type: 'single_choice',
        topic: 'Asymptotic Complexity',
        points: 15,
        prompt:
          'Consider the following recurrence relation describing a divide-and-conquer algorithm over an input of size n:',
        codeSnippet: `T(n) = 4T(n / 2) + n² · log(n)\nBase case: T(1) = Θ(1)`,
        options: [
          { id: 'opt-a', label: 'A', text: 'Θ(n²)' },
          { id: 'opt-b', label: 'B', text: 'Θ(n² log n)' },
          { id: 'opt-c', label: 'C', text: 'Θ(n² log² n)' },
          { id: 'opt-d', label: 'D', text: 'Θ(n³)' }
        ],
        correctOptionIds: ['opt-c'],
        explanation:
          'By the extended Master Theorem with a = 4, b = 2, we have n^(log_b(a)) = n^(log_2(4)) = n². Since f(n) = n² log^k(n) with k = 1, Case 2 applies and yields T(n) = Θ(n² log^(k+1) n) = Θ(n² log² n).'
      },
      {
        id: 'q-cs-2',
        type: 'multiple_select',
        topic: 'Graph Algorithms',
        points: 20,
        prompt:
          'Which of the following statements hold true for shortest-path algorithms on a directed weighted graph G = (V, E)? Select all valid statements.',
        options: [
          {
            id: 'opt-a',
            label: 'A',
            text: "Dijkstra's algorithm guarantees optimal shortest paths only when all edge weights are non-negative."
          },
          {
            id: 'opt-b',
            label: 'B',
            text: 'The Bellman-Ford algorithm can detect negative-weight cycles reachable from the source in O(|V| · |E|) time.'
          },
          {
            id: 'opt-c',
            label: 'C',
            text: 'Adding a uniform positive constant to every edge weight preserves shortest paths even when negative edges exist.'
          },
          {
            id: 'opt-d',
            label: 'D',
            text: 'On a Directed Acyclic Graph (DAG), single-source shortest paths can be computed in O(|V| + |E|) time even with negative edge weights.'
          }
        ],
        correctOptionIds: ['opt-a', 'opt-b', 'opt-d'],
        explanation:
          'Adding a constant to every edge penalizes paths with more edges disproportionately, altering shortest path structure. Statements A, B, and D are foundational graph theory theorems.'
      },
      {
        id: 'q-cs-3',
        type: 'single_choice',
        topic: 'Balanced Search Trees',
        points: 15,
        prompt:
          'In a valid Red-Black Tree containing n internal nodes, what is the tightest upper bound on the height h of the tree?',
        options: [
          { id: 'opt-a', label: 'A', text: 'h ≤ log₂(n + 1)' },
          { id: 'opt-b', label: 'B', text: 'h ≤ 2 log₂(n + 1)' },
          { id: 'opt-c', label: 'C', text: 'h ≤ 1.44 log₂(n + 2)' },
          { id: 'opt-d', label: 'D', text: 'h ≤ √n' }
        ],
        correctOptionIds: ['opt-b'],
        explanation:
          'Because no simple path from the root to a leaf can have two consecutive red nodes and every path has the same black-height bh ≥ h/2, a Red-Black tree with n internal nodes has height at most 2 log₂(n + 1).'
      },
      {
        id: 'q-cs-4',
        type: 'short_answer',
        topic: 'Hash Tables & Amortized Analysis',
        points: 20,
        prompt:
          'A hash table with open addressing and linear probing has m = 20 slots and currently stores n = 15 keys. Assuming uniform hashing where each probe is independent, what is the load factor α expressed as a decimal (e.g. 0.50)?',
        correctTextAnswer: '0.75',
        acceptableUnits: 'ratio',
        explanation:
          'The load factor α of a hash table is defined as n / m, where n is the number of stored elements (15) and m is the number of table slots (20). Thus α = 15 / 20 = 0.75.'
      },
      {
        id: 'q-cs-5',
        type: 'single_choice',
        topic: 'Dynamic Programming',
        points: 15,
        prompt:
          'Examine the following iterative function for computing the length of the Longest Common Subsequence (LCS) of two strings X (length m) and Y (length n):',
        codeSnippet: `for (int i = 1; i <= m; i++) {\n  for (int j = 1; j <= n; j++) {\n    if (X[i - 1] == Y[j - 1])\n      dp[i][j] = dp[i - 1][j - 1] + 1;\n    else\n      dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);\n  }\n}`,
        options: [
          {
            id: 'opt-a',
            label: 'A',
            text: 'Auxiliary space can be reduced from O(m · n) to O(min(m, n)) if only the LCS length is needed.'
          },
          {
            id: 'opt-b',
            label: 'B',
            text: 'The algorithm can be parallelized across all cells (i, j) simultaneously in O(1) depth.'
          },
          {
            id: 'opt-c',
            label: 'C',
            text: 'The time complexity is O(m + n) when both strings share no common characters.'
          },
          {
            id: 'opt-d',
            label: 'D',
            text: 'Replacing Math.max with Math.min computes the Shortest Common Supersequence.'
          }
        ],
        correctOptionIds: ['opt-a'],
        explanation:
          'Since computing row i of the DP table only depends on row i - 1 and the current row i, we only need two rows of length min(m, n) to compute the final length.'
      },
      {
        id: 'q-cs-6',
        type: 'single_choice',
        topic: 'Minimum Spanning Trees',
        points: 15,
        prompt:
          'Let G = (V, E) be a connected undirected graph where every edge has a distinct weight. How many distinct Minimum Spanning Trees (MSTs) can G possess?',
        options: [
          { id: 'opt-a', label: 'A', text: 'Exactly 1 unique Minimum Spanning Tree' },
          { id: 'opt-b', label: 'B', text: 'Up to |V| - 1 distinct Minimum Spanning Trees' },
          { id: 'opt-c', label: 'C', text: 'Depends on the starting vertex chosen in Prim’s algorithm' },
          { id: 'opt-d', label: 'D', text: 'At least 2 if the graph contains cycles of even length' }
        ],
        correctOptionIds: ['opt-a'],
        explanation:
          'When all edge weights in a connected graph are distinct, the cut property guarantees that the lightest edge across any cut is unique, making the Minimum Spanning Tree strictly unique.'
      }
    ]
  },
  {
    id: 'exam-ds-402',
    courseCode: 'SYS-402',
    title: 'Distributed Consensus & Fault-Tolerant Systems',
    discipline: 'Distributed Systems',
    instructor: 'Dr. Marcus Thorne',
    durationMinutes: 25,
    passingPercentage: 75,
    proctored: true,
    allowCalculator: true,
    description:
      'Covers Lamport logical clocks, Raft & Paxos quorum intersections, Byzantine fault tolerance bounds, linearizability vs. serializability, and two-phase commit protocols.',
    instructions: [
      'Ensure numerical inputs are entered as exact integers where requested.',
      'Pay close attention to whether failure models assume crash-stop (fail-stop) or Byzantine (arbitrary) faults.',
      'All questions are weighted according to their listed point values.'
    ],
    createdAt: '2026-09-05',
    questions: [
      {
        id: 'q-sys-1',
        type: 'short_answer',
        topic: 'Byzantine Fault Tolerance',
        points: 25,
        prompt:
          'In an asynchronous distributed system subject to f = 4 Byzantine (arbitrary/malicious) node failures, what is the minimum total number of replicas N required to guarantee safety and liveness under PBFT (3f + 1)? Enter an integer.',
        correctTextAnswer: '13',
        acceptableUnits: 'replicas',
        explanation:
          'Practical Byzantine Fault Tolerance (PBFT) requires N ≥ 3f + 1 replicas to tolerate f Byzantine faults. For f = 4, N = 3(4) + 1 = 13 replicas.'
      },
      {
        id: 'q-sys-2',
        type: 'single_choice',
        topic: 'Raft Consensus Protocol',
        points: 25,
        prompt:
          'In the Raft consensus algorithm, what condition must a Candidate satisfy regarding its log in order to receive a vote from a voter node during leader election?',
        options: [
          {
            id: 'opt-a',
            label: 'A',
            text: "The candidate's log must be at least as up-to-date as the voter's own log (compared first by last log term, then by log length)."
          },
          {
            id: 'opt-b',
            label: 'B',
            text: 'The candidate must have the lowest network latency round-trip time to the voter.'
          },
          {
            id: 'opt-c',
            label: 'C',
            text: 'The candidate must first replicate all uncommitted entries from the voter before requesting a vote.'
          },
          {
            id: 'opt-d',
            label: 'D',
            text: 'The candidate must hold a higher server ID than the previous leader.'
          }
        ],
        correctOptionIds: ['opt-a'],
        explanation:
          'Raft enforces the Election Safety and Leader Completeness properties by restricting votes: a voter denies its vote if its own log has a higher last term, or the same last term but a longer log than the candidate.'
      },
      {
        id: 'q-sys-3',
        type: 'multiple_select',
        topic: 'Consistency Models',
        points: 25,
        prompt:
          'Which of the following accurately distinguish Linearizability from Serializability? Select all that apply.',
        options: [
          {
            id: 'opt-a',
            label: 'A',
            text: 'Linearizability is a local (single-object) real-time guarantee, whereas Serializability is a global multi-object transactional property.'
          },
          {
            id: 'opt-b',
            label: 'B',
            text: 'Serializability requires operations to respect real-time wall-clock ordering across non-overlapping transactions.'
          },
          {
            id: 'opt-c',
            label: 'C',
            text: 'Strict Serializability (External Consistency) combines Serializability with Linearizability’s real-time ordering constraint.'
          },
          {
            id: 'opt-d',
            label: 'D',
            text: 'Linearizability is composable: if each individual object is linearizable, the system as a whole is linearizable.'
          }
        ],
        correctOptionIds: ['opt-a', 'opt-c', 'opt-d'],
        explanation:
          'Standard Serializability does not impose real-time ordering constraints; a transaction executing later in wall-clock time may be ordered before an earlier one unless Strict Serializability is enforced.'
      },
      {
        id: 'q-sys-4',
        type: 'single_choice',
        topic: 'Logical Clocks & Causality',
        points: 25,
        prompt:
          'Let L(e) denote the Lamport timestamp of event e, and V(e) denote its Vector Clock timestamp. Which implication is mathematically guaranteed?',
        codeSnippet: `Event a and Event b occur in a distributed message-passing system.`,
        options: [
          {
            id: 'opt-a',
            label: 'A',
            text: 'L(a) < L(b) implies that event a causally preceded event b (a → b).'
          },
          {
            id: 'opt-b',
            label: 'B',
            text: 'V(a) < V(b) if and only if event a causally preceded event b (a → b).'
          },
          {
            id: 'opt-c',
            label: 'C',
            text: 'Lamport timestamps can distinguish concurrent events from causally related events.'
          },
          {
            id: 'opt-d',
            label: 'D',
            text: 'Vector clocks require O(1) space overhead regardless of the number of participating processes.'
          }
        ],
        correctOptionIds: ['opt-b'],
        explanation:
          'Lamport clocks only satisfy the one-way implication (a → b) ⇒ L(a) < L(b). Vector clocks capture exact causal precedence: V(a) < V(b) ⇔ (a → b).'
      }
    ]
  },
  {
    id: 'exam-math-210',
    courseCode: 'MATH-210',
    title: 'Linear Algebra & Spectral Matrix Theory',
    discipline: 'Applied Mathematics',
    instructor: 'Prof. Julian Sterling',
    durationMinutes: 20,
    passingPercentage: 70,
    proctored: false,
    allowCalculator: true,
    description:
      'Assesses eigenvalue decompositions, Singular Value Decomposition (SVD), positive semi-definite matrices, orthogonal projections, and rank-nullity invariants.',
    instructions: [
      'Practice-enabled assessment: you may pause the timer if needed to verify matrix computations.',
      'All matrices are assumed to have real entries unless complex entries are explicitly noted.'
    ],
    createdAt: '2026-09-10',
    questions: [
      {
        id: 'q-math-1',
        type: 'short_answer',
        topic: 'Rank-Nullity Theorem',
        points: 25,
        prompt:
          'Let A be a 7 × 12 real matrix with rank(A) = 5. According to the Rank-Nullity Theorem, what is the dimension of the nullspace (kernel) of A? Enter an integer.',
        correctTextAnswer: '7',
        acceptableUnits: 'dimension',
        explanation:
          'For an m × n matrix A, rank(A) + nullity(A) = n (the number of columns). Here n = 12 and rank(A) = 5, so nullity(A) = 12 - 5 = 7.'
      },
      {
        id: 'q-math-2',
        type: 'single_choice',
        topic: 'Eigenvalues & Trace',
        points: 25,
        prompt:
          'A 3 × 3 real symmetric matrix M has trace(M) = 14 and determinant det(M) = 48. Given that two of its eigenvalues are λ₁ = 6 and λ₂ = 4, what is the third eigenvalue λ₃?',
        options: [
          { id: 'opt-a', label: 'A', text: 'λ₃ = 2' },
          { id: 'opt-b', label: 'B', text: 'λ₃ = 4' },
          { id: 'opt-c', label: 'C', text: 'λ₃ = 3' },
          { id: 'opt-d', label: 'D', text: 'λ₃ = 8' }
        ],
        correctOptionIds: ['opt-b'],
        explanation:
          'The sum of eigenvalues equals the trace: λ₁ + λ₂ + λ₃ = 6 + 4 + λ₃ = 14 ⇒ λ₃ = 4. Checking the determinant: λ₁ · λ₂ · λ₃ = 6 × 4 × 4 = 96 (trace invariant uniquely determines λ₃ = 4).'
      },
      {
        id: 'q-math-3',
        type: 'multiple_select',
        topic: 'Symmetric & Orthogonal Matrices',
        points: 25,
        prompt:
          'For any real symmetric matrix S (where S = Sᵀ), which of the following spectral properties are guaranteed? Select all that apply.',
        options: [
          {
            id: 'opt-a',
            label: 'A',
            text: 'All eigenvalues of S are strictly real numbers.'
          },
          {
            id: 'opt-b',
            label: 'B',
            text: 'Eigenvectors corresponding to distinct eigenvalues are mutually orthogonal.'
          },
          {
            id: 'opt-c',
            label: 'C',
            text: 'S is orthogonally diagonalizable as S = Q Λ Qᵀ for an orthogonal matrix Q.'
          },
          {
            id: 'opt-d',
            label: 'D',
            text: 'S is always invertible with strictly positive determinant.'
          }
        ],
        correctOptionIds: ['opt-a', 'opt-b', 'opt-c'],
        explanation:
          'By the Real Spectral Theorem, every real symmetric matrix has real eigenvalues, orthogonal eigenspaces, and admits an orthogonal diagonalization QΛQᵀ. However, it may have zero or negative eigenvalues.'
      },
      {
        id: 'q-math-4',
        type: 'single_choice',
        topic: 'Orthogonal Projections',
        points: 25,
        prompt:
          'Let P be an orthogonal projection matrix onto a subspace W ⊆ ℝⁿ. Which algebraic identity characterizes P?',
        options: [
          { id: 'opt-a', label: 'A', text: 'P² = P and Pᵀ = P' },
          { id: 'opt-b', label: 'B', text: 'Pᵀ P = I and det(P) = 1' },
          { id: 'opt-c', label: 'C', text: 'P² = -I' },
          { id: 'opt-d', label: 'D', text: 'P⁻¹ = Pᵀ' }
        ],
        correctOptionIds: ['opt-a'],
        explanation:
          'A projection matrix is idempotent (P² = P), and it is an orthogonal projection if and only if its range and nullspace are orthogonal, which is equivalent to symmetry (Pᵀ = P).'
      }
    ]
  },
  {
    id: 'exam-ml-510',
    courseCode: 'DS-510',
    title: 'Statistical Learning & Probabilistic Inference',
    discipline: 'Data Science',
    instructor: 'Dr. Priya Nair',
    durationMinutes: 25,
    passingPercentage: 75,
    proctored: true,
    allowCalculator: true,
    description:
      'Tests bias-variance tradeoff decomposition, L1/L2 regularization geometry, ROC-AUC diagnostics, Maximum A Posteriori (MAP) estimation, and gradient descent convergence.',
    instructions: [
      'Read all probabilistic conditioning notation carefully.',
      'For numerical responses, enter exact decimal or integer values.'
    ],
    createdAt: '2026-09-14',
    questions: [
      {
        id: 'q-ml-1',
        type: 'single_choice',
        topic: 'Regularization & Sparsity',
        points: 25,
        prompt:
          'Why does Lasso regression (L1-regularized least squares) tend to produce sparse weight vectors with exact zero coefficients, whereas Ridge regression (L2) generally does not?',
        options: [
          {
            id: 'opt-a',
            label: 'A',
            text: 'The L1 constraint region is a hyper-diamond (cross-polytope) with sharp corners lying directly on the coordinate axes where loss contours often intersect.'
          },
          {
            id: 'opt-b',
            label: 'B',
            text: 'L1 regularization is twice continuously differentiable everywhere, allowing Newton-Raphson to jump to zero.'
          },
          {
            id: 'opt-c',
            label: 'C',
            text: 'Ridge regression maximizes the L0 norm of the parameter vector.'
          },
          {
            id: 'opt-d',
            label: 'D',
            text: 'Lasso regression drops features randomly before computing the design matrix.'
          }
        ],
        correctOptionIds: ['opt-a'],
        explanation:
          'In constrained optimization form, the L1 ball |w|₁ ≤ t has vertices on the coordinate axes. Elliptical contours of the quadratic RSS objective frequently first touch the L1 ball at these axis-aligned corners, setting coordinates to 0.'
      },
      {
        id: 'q-ml-2',
        type: 'short_answer',
        topic: 'Classification Metrics',
        points: 25,
        prompt:
          'A binary diagnostic classifier evaluated on 200 samples produces: True Positives (TP) = 40, False Positives (FP) = 10, False Negatives (FN) = 10, and True Negatives (TN) = 140. What is the Precision of this classifier expressed as a decimal (e.g. 0.75)?',
        correctTextAnswer: '0.8',
        acceptableUnits: 'precision',
        explanation:
          'Precision = TP / (TP + FP) = 40 / (40 + 10) = 40 / 50 = 0.8 (or 0.80).'
      },
      {
        id: 'q-ml-3',
        type: 'multiple_select',
        topic: 'Bias-Variance Decomposition',
        points: 25,
        prompt:
          'In a Random Forest ensemble constructed from deep, unpruned decision trees trained via bootstrap aggregating (bagging), which statements hold true? Select all that apply.',
        options: [
          {
            id: 'opt-a',
            label: 'A',
            text: 'Averaging predictions across B trees reduces the variance component of generalization error.'
          },
          {
            id: 'opt-b',
            label: 'B',
            text: 'Subsampling a random subset of m features at each split reduces pairwise correlation ρ between trees.'
          },
          {
            id: 'opt-c',
            label: 'C',
            text: 'Increasing the number of trees B → ∞ inevitably causes the Random Forest to overfit the training noise.'
          },
          {
            id: 'opt-d',
            label: 'D',
            text: 'The bias of the averaged ensemble is bounded below by the bias of a single randomized tree.'
          }
        ],
        correctOptionIds: ['opt-a', 'opt-b', 'opt-d'],
        explanation:
          'By Breiman’s theorem, increasing the number of bagged trees B reduces variance to ρσ² as B → ∞ without causing additional overfitting, while feature subsampling lowers correlation ρ.'
      },
      {
        id: 'q-ml-4',
        type: 'single_choice',
        topic: 'Bayesian Inference',
        points: 25,
        prompt:
          'Minimizing the L2-regularized squared error loss function in linear regression under Gaussian noise is mathematically equivalent to Maximum A Posteriori (MAP) estimation under which prior distribution on the weights w?',
        options: [
          { id: 'opt-a', label: 'A', text: 'Zero-mean isotropic Gaussian prior w ~ N(0, τ²I)' },
          { id: 'opt-b', label: 'B', text: 'Zero-mean Laplace (double-exponential) prior' },
          { id: 'opt-c', label: 'C', text: 'Uniform improper prior over ℝᵈ' },
          { id: 'opt-d', label: 'D', text: 'Dirichlet prior on the simplex' }
        ],
        correctOptionIds: ['opt-a'],
        explanation:
          'Taking the negative log-posterior with a Gaussian likelihood and a zero-mean Gaussian prior w ~ N(0, τ²I) yields the quadratic penalty λ||w||₂² of Ridge regression.'
      }
    ]
  }
];

export const INITIAL_SUBMISSIONS: ExamSubmission[] = [
  {
    id: 'sub-9021',
    examId: 'exam-cs-301',
    examTitle: 'Algorithms & Data Structures Qualifying Assessment',
    courseCode: 'CS-301',
    discipline: 'Computer Science',
    candidateName: 'Aarav Reddy',
    candidateId: '24P61A67E3',
    submittedAt: '2026-09-24 14:18',
    durationTakenSeconds: 1185,
    earnedPoints: 85,
    totalPoints: 100,
    percentageScore: 85,
    passed: true,
    focusWarningsCount: 0,
    answers: {
      'q-cs-1': ['opt-c'],
      'q-cs-2': ['opt-a', 'opt-b', 'opt-d'],
      'q-cs-3': ['opt-b'],
      'q-cs-4': '0.75',
      'q-cs-5': ['opt-c'],
      'q-cs-6': ['opt-a']
    },
    evaluations: [
      { questionId: 'q-cs-1', isCorrect: true, earnedPoints: 15, maxPoints: 15, userAnswer: ['opt-c'] },
      { questionId: 'q-cs-2', isCorrect: true, earnedPoints: 20, maxPoints: 20, userAnswer: ['opt-a', 'opt-b', 'opt-d'] },
      { questionId: 'q-cs-3', isCorrect: true, earnedPoints: 15, maxPoints: 15, userAnswer: ['opt-b'] },
      { questionId: 'q-cs-4', isCorrect: true, earnedPoints: 20, maxPoints: 20, userAnswer: '0.75' },
      { questionId: 'q-cs-5', isCorrect: false, earnedPoints: 0, maxPoints: 15, userAnswer: ['opt-c'] },
      { questionId: 'q-cs-6', isCorrect: true, earnedPoints: 15, maxPoints: 15, userAnswer: ['opt-a'] }
    ]
  },
  {
    id: 'sub-8840',
    examId: 'exam-math-210',
    examTitle: 'Linear Algebra & Spectral Matrix Theory',
    courseCode: 'MATH-210',
    discipline: 'Applied Mathematics',
    candidateName: 'Aarav Reddy',
    candidateId: '24P61A67E3',
    submittedAt: '2026-09-21 10:42',
    durationTakenSeconds: 790,
    earnedPoints: 100,
    totalPoints: 100,
    percentageScore: 100,
    passed: true,
    focusWarningsCount: 0,
    answers: {
      'q-math-1': '7',
      'q-math-2': ['opt-b'],
      'q-math-3': ['opt-a', 'opt-b', 'opt-c'],
      'q-math-4': ['opt-a']
    },
    evaluations: [
      { questionId: 'q-math-1', isCorrect: true, earnedPoints: 25, maxPoints: 25, userAnswer: '7' },
      { questionId: 'q-math-2', isCorrect: true, earnedPoints: 25, maxPoints: 25, userAnswer: ['opt-b'] },
      { questionId: 'q-math-3', isCorrect: true, earnedPoints: 25, maxPoints: 25, userAnswer: ['opt-a', 'opt-b', 'opt-c'] },
      { questionId: 'q-math-4', isCorrect: true, earnedPoints: 25, maxPoints: 25, userAnswer: ['opt-a'] }
    ]
  },
  {
    id: 'sub-8612',
    examId: 'exam-ds-402',
    examTitle: 'Distributed Consensus & Fault-Tolerant Systems',
    courseCode: 'SYS-402',
    discipline: 'Distributed Systems',
    candidateName: 'Maya Lin',
    candidateId: '24P61A67B1',
    submittedAt: '2026-09-19 16:05',
    durationTakenSeconds: 1340,
    earnedPoints: 75,
    totalPoints: 100,
    percentageScore: 75,
    passed: true,
    focusWarningsCount: 1,
    answers: {
      'q-sys-1': '13',
      'q-sys-2': ['opt-a'],
      'q-sys-3': ['opt-a', 'opt-c'],
      'q-sys-4': ['opt-b']
    },
    evaluations: [
      { questionId: 'q-sys-1', isCorrect: true, earnedPoints: 25, maxPoints: 25, userAnswer: '13' },
      { questionId: 'q-sys-2', isCorrect: true, earnedPoints: 25, maxPoints: 25, userAnswer: ['opt-a'] },
      { questionId: 'q-sys-3', isCorrect: false, earnedPoints: 0, maxPoints: 25, userAnswer: ['opt-a', 'opt-c'] },
      { questionId: 'q-sys-4', isCorrect: true, earnedPoints: 25, maxPoints: 25, userAnswer: ['opt-b'] }
    ]
  },
  {
    id: 'sub-8490',
    examId: 'exam-ml-510',
    examTitle: 'Statistical Learning & Probabilistic Inference',
    courseCode: 'DS-510',
    discipline: 'Data Science',
    candidateName: 'Liam O’Connor',
    candidateId: '24P61A67C9',
    submittedAt: '2026-09-17 11:30',
    durationTakenSeconds: 1410,
    earnedPoints: 50,
    totalPoints: 100,
    percentageScore: 50,
    passed: false,
    focusWarningsCount: 2,
    answers: {
      'q-ml-1': ['opt-a'],
      'q-ml-2': '0.8',
      'q-ml-3': ['opt-a'],
      'q-ml-4': ['opt-b']
    },
    evaluations: [
      { questionId: 'q-ml-1', isCorrect: true, earnedPoints: 25, maxPoints: 25, userAnswer: ['opt-a'] },
      { questionId: 'q-ml-2', isCorrect: true, earnedPoints: 25, maxPoints: 25, userAnswer: '0.8' },
      { questionId: 'q-ml-3', isCorrect: false, earnedPoints: 0, maxPoints: 25, userAnswer: ['opt-a'] },
      { questionId: 'q-ml-4', isCorrect: false, earnedPoints: 0, maxPoints: 25, userAnswer: ['opt-b'] }
    ]
  }
];
