import mongoose from 'mongoose';
import 'dotenv/config';
import { seedStaticUsers } from './staticUsers.seeder.js'; 

const runSeeders = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log('Database connected for seeding.');
    
    // Run the static users seeder
    await seedStaticUsers();
    
    console.log('Seeding completed successfully!');

  } catch (error) {
    console.error('Error running seeders:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
};

runSeeders();