import { Injectable, ConflictException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthResponseDto } from './dto/auth-response.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  /**
   * Register a new user
   */
  async register(createUserDto: CreateUserDto): Promise<AuthResponseDto> {
    // Check if user already exists
    const existingUser = await this.userModel.findOne({ 
      $or: [
        { email: createUserDto.email },
        { username: createUserDto.username }
      ]
    });

    if (existingUser) {
      throw new ConflictException('User with this email or username already exists');
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // Create new user
    const user = await this.userModel.create({
      ...createUserDto,
      password: hashedPassword,
    });

    // Generate JWT token
    return this.generateAuthResponse(user);
  }

  /**
   * Login user
   */
  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    // Find user by email
    const user = await this.userModel.findOne({ email: loginDto.email });
    
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if account is active
    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT token
    return this.generateAuthResponse(user);
  }

  /**
   * Get all users (admin only)
   */
  async findAll(): Promise<any[]> {
    return this.userModel.find().select('-password').exec();
  }

  /**
   * Find user by ID
   */
  async findOne(id: string): Promise<any> {
    const user = await this.userModel.findById(id).select('-password').exec();
    
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    return user;
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  /**
   * Update user
   */
  async update(id: string, updateUserDto: UpdateUserDto): Promise<any> {
    // If password is being updated, hash it
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    const user = await this.userModel
      .findByIdAndUpdate(id, updateUserDto, { new: true })
      .select('-password')
      .exec();
    
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    return user;
  }

  /**
   * Delete user
   */
  async remove(id: string): Promise<void> {
    const result = await this.userModel.findByIdAndDelete(id).exec();
    
    if (!result) {
      throw new NotFoundException('User not found');
    }
  }

  /**
 * Validate user by ID (used by JWT strategy)
 */
async validateUserById(id: string): Promise<any> {
  try {
    const user = await this.userModel.findById(id).select('-password').exec();
    
    if (!user || !user.isActive) {
      return null;
    }
    
    return {
      id: user._id.toString(),
      email: user.email,
      roles: user.roles,
      username: user.username,
    };
  } catch (error) {
    return null;
  }
}

  /**
   * Generate JWT token and format response
   */
  private generateAuthResponse(user: UserDocument): AuthResponseDto {
    const payload = { 
      sub: user._id, 
      email: user.email, 
      roles: user.roles 
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        roles: user.roles,
      },
    };
  }
}