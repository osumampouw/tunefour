import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserAuthRecord, UserAuthStore } from '@tunefour/auth';
import { Repository } from 'typeorm';
import { User } from '../entities';

/**
 * TypeORM-backed implementation of the auth layer's {@link UserAuthStore}. This
 * is the bridge that keeps the pure auth package free of any database
 * dependency: the package defines the interface, the server supplies this.
 */
@Injectable()
export class TypeOrmUserAuthStore implements UserAuthStore {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}

  async findByEmail(email: string): Promise<UserAuthRecord | null> {
    const user = await this.users.findOne({ where: { email } });
    if (!user) {
      return null;
    }
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      officeId: user.officeId,
      isActive: user.isActive,
      externalId: user.externalId,
    };
  }

  async linkExternalId(userId: string, externalId: string): Promise<void> {
    await this.users.update({ id: userId }, { externalId });
  }
}
