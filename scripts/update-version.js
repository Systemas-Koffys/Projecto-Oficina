import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

try {
  // Get the total number of commits in the current branch
  const commitCount = parseInt(execSync('git rev-list --count HEAD').toString().trim(), 10)
  
  // Baselines and configurations
  const major = 3
  const commitsPerMinor = 50 // Bumps the minor version every 50 commits
  const baseMinor = 23       // Baseline minor version (so at 100 commits minor is 25, at 150 it is 26, etc.)
  
  // Calculate minor and patch version
  const minor = baseMinor + Math.floor(commitCount / commitsPerMinor)
  const patch = commitCount % commitsPerMinor
  
  const newVersion = `${major}.${minor}.${patch}`
  
  // Update package.json on disk
  const packageJsonPath = path.join(__dirname, '../package.json')
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
  
  if (packageJson.version !== newVersion) {
    packageJson.version = newVersion
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n', 'utf8')
    console.log(`✅ Version updated dynamically in package.json to: v${newVersion} (Commits: ${commitCount})`)
  } else {
    console.log(`ℹ️ Version is up to date: v${newVersion} (Commits: ${commitCount})`)
  }
} catch (error) {
  console.error('⚠️ Could not update version from Git:', error.message)
}
