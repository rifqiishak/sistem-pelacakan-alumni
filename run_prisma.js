const { execSync } = require('child_process');
try {
  const out = execSync('npx prisma db push', { encoding: 'utf8', env: {...process.env, DATABASE_URL: "file:./dev.db"} });
  console.log("SUCCESS:\\n", out);
} catch (e) {
  console.error("ERROR STDOUT:\\n", e.stdout);
  console.error("ERROR STDERR:\\n", e.stderr);
}
