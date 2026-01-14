import { drizzle } from 'drizzle-orm/libsql'
// import * as schema from './schema'
import { app } from 'electron'

const dbPath = app.getPath('userData')

const db = drizzle({
  connection: {
    url: `file:${dbPath}/database.sqlite`
  }
  // schema: schema
})

export default db
