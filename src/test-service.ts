import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AuthService } from './auth/auth.service';
import * as dotenv from 'dotenv';

dotenv.config();

async function test() {
  // Create a Nest application context
  const app = await NestFactory.createApplicationContext(AppModule);
  
  // Get the AuthService instance
  const authService = app.get(AuthService);
  
  console.log('🧪 Testing Auth Service...\n');

  try {
    // Test 1: Register a new user
    console.log('1️⃣ Testing Registration...');
    const newUser = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    };
    
    const registered = await authService.register(newUser);
    console.log('✅ Registration successful!');
    console.log('   Token:', registered.access_token.substring(0, 20) + '...');
    console.log('   User:', registered.user);
    console.log('');

  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('⚠️  User already exists, trying login...\n');
      
      // Test 2: Login if user exists
      console.log('2️⃣ Testing Login...');
      const loginData = {
        email: 'test@example.com',
        password: 'password123',
      };
      
      const loggedIn = await authService.login(loginData);
      console.log('✅ Login successful!');
      console.log('   Token:', loggedIn.access_token.substring(0, 20) + '...');
      console.log('   User:', loggedIn.user);
      console.log('');
    } else {
      console.log('❌ Error:', error.message);
    }
  }

  try {
    // Test 3: Find all users
    console.log('3️⃣ Testing Find All Users...');
    const users = await authService.findAll();
    console.log(`✅ Found ${users.length} users`);
    console.log('   Users:', users.map(u => ({ 
      id: u._id, 
      username: u.username, 
      email: u.email,
      roles: u.roles 
    })));
    console.log('');

    // Test 4: Find one user
    if (users.length > 0) {
      console.log('4️⃣ Testing Find One User...');
      const firstUser = users[0];
      const user = await authService.findOne(firstUser._id);
      console.log('✅ Found user:', user.username);
      console.log('');
    }

  } catch (error) {
    console.log('❌ Error in find operations:', error.message);
  }

  await app.close();
}

// Run the test
test().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});