import { createUser, userExists } from '@/lib/db/client'
import { hashPassword } from '@/lib/auth/password'

async function main() {
  const demoUsername = 'demo'

  if (userExists(demoUsername)) {
    console.log(`[seed-user] User '${demoUsername}' already exists. Skipping.`)
    process.exit(0)
  }

  // Generate a random password for demo (12 characters)
  const demoPassword = Math.random().toString(36).slice(2, 14).toUpperCase()
  const passwordHash = await hashPassword(demoPassword)

  const user = createUser(demoUsername, passwordHash)

  console.log(`
✅ Demo user created successfully!

Username: ${demoUsername}
Password: ${demoPassword}

To login:
  curl -X POST http://localhost:3000/api/auth/login \\
    -H "Content-Type: application/json" \\
    -d '{"username":"${demoUsername}","password":"${demoPassword}"}'

Share these credentials with your friends.
Make sure to change the password after first login (feature not yet implemented).
  `)

  process.exit(0)
}

main().catch((err) => {
  console.error('[seed-user] Error:', err)
  process.exit(1)
})
