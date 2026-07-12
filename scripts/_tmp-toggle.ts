import { prisma } from "../src/lib/prisma";
async function main() {
  const value = process.argv[2] === "on"; // on => mustChangePw true (restore)
  const r = await prisma.user.updateMany({
    where: { OR: [{ username: "irnisurayaazmi@gmail.com" }, { username: "070118140994" }] },
    data: { mustChangePw: value },
  });
  console.log(`mustChangePw=${value} for ${r.count} user(s)`);
  await prisma.$disconnect();
}
main();
