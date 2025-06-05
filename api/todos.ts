import type { VercelRequest, VercelResponse } from '@vercel/node';

// In-memory storage for todos (replace with a database in production)
let todos: { id: number; text: string; completed: boolean }[] = [];

export default function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  switch (request.method) {
    case 'GET':
      return response.status(200).json(todos);

    case 'POST':
      const newTodo = {
        id: Date.now(),
        text: request.body.text,
        completed: false
      };
      todos.push(newTodo);
      return response.status(201).json(newTodo);

    case 'PUT':
      const { id } = request.query;
      const todoIndex = todos.findIndex(todo => todo.id === Number(id));
      if (todoIndex === -1) {
        return response.status(404).json({ error: 'Todo not found' });
      }
      todos[todoIndex] = { ...todos[todoIndex], ...request.body };
      return response.status(200).json(todos[todoIndex]);

    case 'DELETE':
      const deleteId = Number(request.query.id);
      todos = todos.filter(todo => todo.id !== deleteId);
      return response.status(204).end();

    default:
      return response.status(405).json({ error: 'Method not allowed' });
  }
} 