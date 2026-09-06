import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { AuthService } from '../services/auth.service';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
});

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  const authService = new AuthService(fastify.prisma);

  fastify.post('/auth/register', async (request, reply) => {
    const parse = registerSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid input parameters', details: parse.error.format() },
      });
    }

    const existing = await authService.findByEmail(parse.data.email);
    if (existing) {
      return reply.status(409).send({
        success: false,
        error: { code: 'USER_EXISTS', message: 'A user with this email already exists.' },
      });
    }

    const user = await authService.createUser(parse.data);
    const token = fastify.jwt.sign({ id: user.id, email: user.email, role: user.role });

    return {
      success: true,
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    };
  });

  fastify.post('/auth/login', async (request, reply) => {
    const parse = loginSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid email or password format' },
      });
    }

    const user = await authService.validateCredentials(parse.data.email, parse.data.password);
    if (!user) {
      return reply.status(401).send({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' },
      });
    }

    const token = fastify.jwt.sign({ id: user.id, email: user.email, role: user.role });

    return {
      success: true,
      token,
      user,
    };
  });

  fastify.get('/auth/me', { preHandler: [fastify.authenticate] }, async (request) => {
    const user = request.user;
    return {
      success: true,
      user,
    };
  });
};
