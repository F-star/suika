import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async login(username: string, password: string) {
    const user = await this.usersService.findOneByUsername(username);

    /**
     * TODO:
     * 1. add salt and compare
     * 2. user not found
     * 3. password is incorrect
     */

    if (user?.password !== password) {
      throw new UnauthorizedException({
        message: 'username or password is incorrect',
      });
    }

    // const TWO_DAY_MS = 2 * 24 * 60 * 60 * 1000
    // const expire = new Date().getTime() + TWO_DAY_MS

    const accessToken = await this.jwtService.signAsync({
      id: user.id,
      name: user.username,
    });
    return { accessToken };
  }

  async register(username: string, password: string) {
    const user = await this.usersService.register(username, password);
    const accessToken = await this.jwtService.signAsync({
      id: user.id,
      name: user.username,
    });
    return { accessToken };
  }
}
