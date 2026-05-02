# Track 109: Vectorized Memory & Long-Term Recall (RAG)

## Overview
This architectural upgrade transitions Skylar from relying entirely on a short-term conversational window (`history`) into possessing long-term memory awareness using a RAG (Retrieval-Augmented Generation) paradigm.

## Implementation Details
1. **Dynamic Embedding Generation**: 
   - Utilizes Google's Native Fetch API against the `gemini-1.5-flash` embedding endpoint `text-embedding-004`. 
   - Works implicitly by recycling the master `GENERATE_API_KEY` attached to the environment.
2. **Vector Space in Firestore**:
   - Skylar saves explicit and inferred constraints inside `users/{userId}/memories`.
   - Embeddings are committed directly to Firestore.
3. **In-Memory Cosine Similarity Engine**:
   - Instead of demanding the developer provision a costly Enterprise Vector Search composite index inside their GCP account immediately, the tool features a native Euclidean/Cosine similarity computing engine directly inside the Node worker. 
   - Since memory boundaries are reasonably capped for a personal vault (<1000 nodes), this executes sub-10ms logic parsing semantic proximity without risk of the `FAILED_PRECONDITION: Missing vector index` crash.
4. **Agentic Tool Logic**:
   - **`memorizeContext`**: Allows Skylar to save structural insights, constraints, user references, or timeline preferences into long-term nodes.
   - **`recallContext`**: Enables Skylar to run a cosine similarity query based strictly on the conversation string to retrieve exact insights dynamically without hallucinating.
   
## UI Usage
When users speak to Skylar, if the Genkit semantic router realizes the context involves remembering prior history (beyond the active window), it will autonomously instantiate `recallContext(query)`. If the user establishes a rule (e.g., "I don't ever want to commute more than 30 mins again"), Skylar uses `memorizeContext` to cement that baseline constraint across sessions.
