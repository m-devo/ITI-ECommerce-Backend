import swaggerJsdoc from 'swagger-jsdoc';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'eBook NodeJs API Documentation',
            version: '1.0.0',
        },
    },
    // Path to the API docs
    apis: [
        './src/docs/paths/*.yaml', 
        './src/docs/schemas/*.yaml'
    ],
};

export const swaggerSpec = swaggerJsdoc(options);