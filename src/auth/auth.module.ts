import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User, UserSchema } from './schemas/user.schema';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    // Register User schema with MongoDB
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    
    // Passport setup
    PassportModule,
    
    // JWT setup with proper typing
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        // Use getOrThrow to ensure secret exists (throws error if missing)
        const secret = configService.getOrThrow<string>('JWT_SECRET');
        const expiresIn = configService.get<string>('JWT_EXPIRATION') || '1d';
        
        return {
          secret: secret,
          signOptions: { 
            expiresIn: expiresIn as any, // Type assertion to satisfy StringValue
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
   providers: [
    AuthService, 
    JwtStrategy,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard, // Apply JWT guard globally
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard, // Apply roles guard globally
    },
  ],
  exports: [AuthService],
})
export class AuthModule {}