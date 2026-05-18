# Track 176: GCP-Native Neo4j Aura Integration Audit

## Status
- [x] Phase 1: Memory (Archeology) - Done.
- [x] Phase 2: Audit (Critique) - Done.
- [x] Phase 3: Setup (Technical Specs) - **PROPOSED**
- [ ] Phase 4: Build (Execution) - **PENDING APPROVAL**
- [ ] Phase 5: Verify (QA) - **PENDING APPROVAL**

## Goal
Integrate Neo4j Aura via GCP Marketplace using Private Service Connect (PSC) for "Zero-Exposure" security. Priority: Transform the **Ignition Phase** into a relational compatibility engine.

## Audit Persona Critique (Deep Dive)
*   **The Security Auditor (PSC Guard)**: "By using Private Service Connect, the Neo4j endpoint will only be resolvable from within our VPC. This eliminates the 'Public Internet' attack vector entirely. We must ensure the Cloud Run VPC Connector is provisioned in the same subnet."
*   **The Architect (Agent Heartbeat)**: "Skylar needs a background 'Graph Weaving' loop. As the user completes Ignition assessments, we trigger a Cloud Task that runs a Cypher merge. This ensures the graph is always 'warm' when the user opens their dashboard."
*   **The UX Designer (The Living Graph)**: "The dashboard shouldn't be a menu; it should be a **Workspace**. Skylar's primary UI is now a 'Spatial Canvas' where her nudges appear as temporary nodes that the user can 'Pin' or 'Discard'."

## Technical Specs (Phase 3)
### 1. Networking (Full Zero-Exposure)
- **Service**: Serverless VPC Access Connector (`sparkwavv-vpc-conn`).
- **Endpoint**: Aura PSC Service Attachment mapped to a local VPC IP.
- **Protocol**: `bolt+s://[INTERNAL_IP]:7687`.

### 2. Ignition Upgrade (Priority 1)
- **Schema**: 
  - `(u:User {id: $uid})-[:PRIORITIZES {weight: 0.9}]->(v:Value {name: "Autonomy"})`
  - `(v:Value)-[:SUPPORTS {score: 0.8}]->(r:Role {title: "Architect"})`
- **Logic**: Use Neo4j GDS (Graph Data Science) or basic path-weighting to show the "Shortest Path to Fulfillment".

### 3. Dashboard UI/UX: "The Command Canvas"
- **Primary View**: An interactive D3-powered SVG canvas in the main dashboard bento box.
- **Skylar Presence**: A floating 'Agent Status' bubble that transitions into a detailed 'Thought Stream' when clicked.
- **Interaction**: "Graph-First" commands. User can drag a 'Value' node to a 'Role' node to trigger a "Skylar Analysis" of the pairing.

## Approval Logic
- [ ] User confirms VPC/PSC provisioning steps are clear.
- [ ] User approves "Command Canvas" UI approach for the dashboard.
- [ ] User approves mapping `NEO4J_URI` and `NEO4J_PASSWORD` in Secret Manager.

## Clarifying Questions
1. **Dashboard Collision**: Does the "Command Canvas" (Graph) replace the existing metrics cards on the dashboard, or should it sit alongside them?
2. **Value Scaling**: In the Ignition phase, how many 'Core Values' do we typically expect a user to have? (Scaling 3-5 vs. 20+ changes the graph density design).
