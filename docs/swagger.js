import swaggerJsdoc from 'swagger-jsdoc';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'eBook NodeJs API Documentation',
            version: '1.0.0',
        },
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                }
            }
        },
        security: [
            { bearerAuth: [] }
        ]
    },
    // Path to the API docs
    apis: [
        './docs/paths/*.yaml', 
        './docs/schemas/*.yaml'
    ],
};

export const swaggerSpec = swaggerJsdoc(options);