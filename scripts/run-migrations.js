const { Client } = require('pg')

if (!process.env.AETHERMIND_DB) {
  console.error('AETHERMIND_DB not set, run: source ~/.zshrc')
  process.exit(1)
}

const args = process.argv.slice(2)

async function main() {
  const client = new Client({ connectionString: process.env.AETHERMIND_DB, ssl: { rejectUnauthorized: false } })
  await client.connect()

  if (!args.length || args[0] === '--verify') {
    const r = await client.query(`
      SELECT
        (SELECT count(*) FROM am_questions) as questions,
        (SELECT count(*) FROM am_scores) as leaderboard_rows,
        (SELECT count(*) FROM am_questions WHERE image_url IS NOT NULL AND image_url != '') as with_images,
        (SELECT count(*) FROM am_questions WHERE explanation LIKE '%' || chr(8212) || '%') as emdash_violations,
        (SELECT count(*) FROM am_questions WHERE question IN (
          SELECT question FROM am_questions GROUP BY question HAVING count(*) > 1
        )) as duplicates
    `)
    console.log('DB Health Check:')
    console.table(r.rows)
  } else {
    const sql = args.join(' ')
    const result = await client.query(sql)
    if (result.rows?.length) {
      console.table(result.rows)
    } else {
      console.log(`Done: ${result.rowCount} rows affected`)
    }
  }

  await client.end()
}

main().catch(err => { console.error('Error:', err.message); process.exit(1) })
