import 'dotenv/config'
import { defineConfig } from 'drizzle-kit'
import { app } from 'electron'

const dbPath = app.getPath('userData')

export default defineConfig({
  out: './src/main/database/migrations',
  schema: './src/main/database/schema',
  dialect: 'sqlite',
  dbCredentials: {
    url: `file:${dbPath}/database.sqlite`
  },
  strict: false
})
