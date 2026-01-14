import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { userRoutes } from './routes/userRoutes.js'
import { noteRoutes } from './routes/noteRoutes.js';

const app = new Hono()

app.route('/users', userRoutes);
app.route('/', noteRoutes);

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
