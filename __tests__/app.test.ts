const app = require('../app');
const supertest = require('supertest');
const request = supertest(app);

describe('Server Endpoints', () => {

    it('should register a user', async () => {
        const response = await request.post('/api/register').send({
            username: 'testuser',
            email: 'test@example.com',
            password: 'testpassword',
        });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
    });

    it('should login a user', async () => {
        const response = await request.post('/api/auth/login').send({
            email: 'test@example.com',
            password: 'testpassword',
        });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
    });
});
