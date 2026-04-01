import fs from 'fs';
import path from 'path';

const SKILLS_DIR = '.firebase/agent-skills';
const MANIFEST_FILE = 'FIREBASE_SKILLS_MANIFEST.md';

const SKILLS_TO_FETCH = [
  {
    name: 'firestore-modeling',
    url: 'https://raw.githubusercontent.com/firebase/firebase-agent-skills/main/skills/firestore-modeling.md'
  },
  {
    name: 'auth-security',
    url: 'https://raw.githubusercontent.com/firebase/firebase-agent-skills/main/skills/auth-security.md'
  }
];

async function updateSkills() {
  console.log('🚀 Updating Firebase Agent Skills...');

  if (!fs.existsSync(SKILLS_DIR)) {
    fs.mkdirSync(SKILLS_DIR, { recursive: true });
  }

  for (const skill of SKILLS_TO_FETCH) {
    try {
      console.log(`📥 Fetching ${skill.name}...`);
      const response = await fetch(skill.url);
      if (!response.ok) throw new Error(`Failed to fetch ${skill.name}: ${response.statusText}`);
      const content = await response.text();
      const filePath = path.join(SKILLS_DIR, `${skill.name}.md`);
      fs.writeFileSync(filePath, content);
      console.log(`✅ Saved ${skill.name} to ${filePath}`);
    } catch (error) {
      console.error(`❌ Error updating ${skill.name}:`, error.message);
    }
  }

  // Create/Update Manifest
  const manifestContent = `# Firebase Agent Skills Manifest

This manifest serves as an index for the AI Studio agent to understand the available skills and architectural patterns for this project.

## Available Skills

${SKILLS_TO_FETCH.map(s => `- [${s.name}](.firebase/agent-skills/${s.name}.md)`).join('\n')}
- [React Clean Architecture](.firebase/agent-skills/react-clean-architecture.md) (Local)
- [AI Studio Lifecycle](.firebase/agent-skills/ai-studio-lifecycle.md) (Local)
- [Vertex AI Grounding](.firebase/agent-skills/vertex-ai-grounding.md) (Local)
- [Remote MCP on Cloud Run](.firebase/agent-skills/remote-mcp.md) (Local)

## Usage Instructions

When prompting the AI Studio agent, you can refer to these skills to ensure best practices are followed.
`;

  fs.writeFileSync(MANIFEST_FILE, manifestContent);
  console.log(`✅ Updated ${MANIFEST_FILE}`);
}

updateSkills();
