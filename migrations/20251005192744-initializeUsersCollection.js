export async function up(db, client) {

    await db.createCollection('users', {
        validator: {
            $jsonSchema: {
                bsonType: "object",
                required: ["name", "email", "password", "role"],
                properties: {
                    name: {
                        bsonType: "string",
                        description: "must be a string and is required"
                    },
                    email: {
                        bsonType: "string",
                        description: "must be a string and is required",
                        pattern: "^.+@.+\..+$"
                    },
                    password: {
                        bsonType: "string",
                        description: "must be a string and is required"
                    },
                    role: {
                        enum: ["user", "admin", "author"],
                        bsonType: "string",
                        description: "must be a string and is required"
                    }
                }
            }
        }
    });

    // Create a unique index on the 'email' field.
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
}