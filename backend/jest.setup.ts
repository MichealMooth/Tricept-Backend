import { config as loadEnv } from 'dotenv'
import fs from 'fs'
import path from 'path'

// Load test env: prefer .env.test, fallback to env.test.local (checked-in for CI)
const root = process.cwd()
const primary = path.resolve(root, '.env.test')
const fallback = path.resolve(root, 'env.test.local')
const file = fs.existsSync(primary) ? primary : fallback
loadEnv({ path: file })

// Ensure NODE_ENV is test
process.env.NODE_ENV = 'test'
