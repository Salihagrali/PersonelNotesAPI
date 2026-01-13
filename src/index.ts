import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import './config/dynamodb.ts'

const app = new Hono()

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

console.log("DynamoDB Client is ready.");

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
