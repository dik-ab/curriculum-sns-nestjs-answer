import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { JwtPayload } from './jwt-payload';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    const token = this.extractToken(request);
    if (!token) {
      throw new UnauthorizedException('認証トークンがありません');
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      const userId = Number(payload.sub);
      if (!Number.isInteger(userId)) {
        throw new UnauthorizedException('認証トークンが無効です');
      }
      payload.sub = userId;
      (request as Request & { user: JwtPayload }).user = payload;
    } catch {
      throw new UnauthorizedException('認証トークンが無効です');
    }

    return true;
  }

  private extractToken(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    if (type === 'Bearer') return token;
    return parseCookie(request.headers.cookie).sns_session;
  }
}

function parseCookie(header: string | undefined): Record<string, string> {
  if (!header) return {};
  return Object.fromEntries(
    header.split(';').map((part) => {
      const [key, ...value] = part.trim().split('=');
      return [key, decodeURIComponent(value.join('='))];
    }),
  );
}
