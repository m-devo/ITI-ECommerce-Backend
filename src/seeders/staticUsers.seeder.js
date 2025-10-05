import { User } from '../models/user.model.js';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

const staticUsers = [
    {
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'AdminPassword123!',
        role: 'admin',
    },
    {
        name: 'Author User',
        email: 'author@example.com',
        password: 'AuthorPassword123!',
        role: 'author',
    },
    {
        name: 'Regular User',
        email: 'user@example.com',
        password: 'UserPassword123!',
        role: 'user',
    },
];


export const seedStaticUsers = async () => {
    console.log('Seeding static users...');
    try {
        for (const userData of staticUsers) {
            const userExists = await User.findOne({ email: userData.email });

            if (userExists) {
                console.log(`User '${userData.email}' already exists. Skipping.`);
                continue; 
            }

            const hashedPassword = await bcrypt.hash(userData.password, SALT_ROUNDS);

            await User.create({
                ...userData,
                password: hashedPassword,
            });

            console.log(`✅ User '${userData.email}' created successfully.`);
        }
    } catch (error) {
        console.error('❌ Error seeding static users:', error.message);
    }
    console.log('Static users seeding finished.');
};