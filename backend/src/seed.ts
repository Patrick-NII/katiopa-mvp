import 'dotenv/config'
import { prisma } from './prisma'

async function main() {
  const user = await prisma.user.findFirst()
  if (!user) {
    console.log("Créer un user avec /auth/register d'abord.")
    return
  }
  await prisma.activity.createMany({
    data: [
      { userId: user.id, domain: 'maths', nodeKey: 'maths.addition.1digit', score: 65, attempts: 1, durationMs: 15000 },
      { userId: user.id, domain: 'maths', nodeKey: 'maths.subtraction.1digit', score: 80, attempts: 2, durationMs: 20000 },
      { userId: user.id, domain: 'coding', nodeKey: 'coding.logic.blocks', score: 90, attempts: 1, durationMs: 10000 },
    ]
  })
  console.log("Données d'exemple insérées.")
}

main().finally(()=>prisma.$disconnect())