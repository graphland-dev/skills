import { BaseDatabaseRepository } from '@/common/database/base-database.repository';
import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { User } from '@/entities/identity/user.entity';
import { UserDomain } from '@/entities/identity/user-domain.enum';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  AddUserToTenantInput,
  CreateUserByAdminInput,
  UpdateMyPasswordInput,
} from './dto/create-user.input';
import * as bcrypt from 'bcryptjs';
import { UpdateUserFromAdmin } from './dto/update-user.input';
import { CommonFindDocumentDto } from '@/common/dto/CommonFindDocumentDto';
import { UserReference } from '@/common/common-models/user-reference.model';
import {
  AppException,
  AppExceptionCode,
} from '@/common/exceptions/app-exception';

@Injectable()
export class UserService extends BaseDatabaseRepository<User> {
  private logger = new Logger();
  constructor(
    @InjectModel(User.name)
    public readonly userModel: Model<User>,
  ) {
    super(userModel);
  }

  updateUserPassword = async (userId: string, input: UpdateMyPasswordInput) => {
    const user = await this.userModel.findById(userId);
    const matched = bcrypt.compareSync(input.password, user.password);

    if (!matched) {
      throw new NotFoundException('Invalid old password');
    }

    // check new password is same as old password
    const matchedNewPassword = bcrypt.compareSync(
      input.newPassword,
      user.password,
    );

    if (matchedNewPassword) {
      throw new NotFoundException('New password must be different');
    }

    await this.userModel.updateOne(
      { _id: userId },
      { password: bcrypt.hashSync(input.newPassword, 10) },
    );
  };

  /**
   * Create user account from admin
   * @param input - input from admin
   */
  createUserAccountFromAdmin = async (input: CreateUserByAdminInput) => {
    // const password = getRandomCharacters(6);
    const userExists = await this.userModel.findOne({ email: input.email });

    if (userExists) {
      throw new AppException(
        AppExceptionCode.ALREADY_EXISTS,
        'User already exists',
      );
    }

    const userRole = {};
    switch (input.userDomain) {
      case UserDomain.SYSTEM_ADMIN:
        if (input.tenant) {
          throw new AppException(
            AppExceptionCode.FORBIDDEN,
            'System admin cannot be added to a tenant',
          );
        }
        if (!input.roles.some((role) => /^(system:)/.test(role)))
          throw new AppException(
            AppExceptionCode.FORBIDDEN,
            'Roles must be one of "system:*"',
          );

        userRole['systemRoles'] = input.roles;
        break;
      case UserDomain.MERCHANT:
      case UserDomain.CUSTOMER:
        if (!input.tenant) {
          throw new AppException(
            AppExceptionCode.FORBIDDEN,
            `${input.userDomain} user must be added to a tenant`,
          );
        }
        if (!input.roles.some((role) => /^(merchant:|customer:)/.test(role)))
          throw new AppException(
            AppExceptionCode.FORBIDDEN,
            'Roles must be one of "merchant:*" or "customer:*"',
          );
        userRole['memberships'] = [
          {
            tenant: input?.tenant || undefined,
            roles: input?.roles || [],
            userDomain: input?.userDomain || undefined,
          },
        ];
        break;
    }

    // Create user
    const createdUser = await this.userModel.create({
      ...input,
      password: bcrypt.hashSync('pa$$word'),
      tenants: [input.tenant],
      ...userRole,
    });
    // TODO: Send welcome email with password
    console.log({
      createdUser,
      // password,
    });
    return createdUser;
  };

  async updateUserFromAdmin(
    input: UpdateUserFromAdmin,
    where: CommonFindDocumentDto,
    commiterUser: UserReference,
  ) {
    const _user = await this.findOne(where);

    if (!_user)
      throw new AppException(AppExceptionCode.NOT_FOUND, 'User not found');

    const userRole = {};

    if (input.roles && !input.userDomain) {
      throw new ForbiddenException(
        'You must specify user domain to update roles',
      );
    }

    if (!input.roles && input.userDomain) {
      throw new ForbiddenException(
        'You must specify roles to update user domain',
      );
    }

    switch (input.userDomain) {
      case UserDomain.SYSTEM_ADMIN:
        if (input.tenant) {
          throw new ForbiddenException(
            'System admin cannot be added to a tenant',
          );
        }
        userRole['systemRoles'] = input.roles;
        break;
      case UserDomain.MERCHANT:
      case UserDomain.CUSTOMER:
        if (!input.tenant) {
          throw new ForbiddenException(
            `${input.userDomain} user must belong to a tenant`,
          );
        }
        const existsInTenant = _user.memberships.some(
          (membership) => membership.tenant === input?.tenant,
        );

        if (!existsInTenant) {
          throw new ForbiddenException(
            `Email ${_user.email} is not a member of "${input.tenant}"`,
          );
        }

        userRole['memberships'] = _user.memberships.filter(
          (membership) => membership.tenant !== input?.tenant,
        );

        userRole['memberships'].push({
          tenant: input?.tenant || undefined,
          roles: input?.roles || [],
          userDomain: input?.userDomain || undefined,
        });

        break;
    }
    const _commits = _user?.commits || [];
    _commits.push({
      commitedBy: commiterUser,
      committedAt: new Date(),
      action: 'update',
    });

    await this.userModel.updateOne(
      { _id: _user._id },
      {
        $set: {
          commits: _commits,
          ...input,
          ...userRole,
        },
      },
    );
  }

  async addUserToTenant(
    input: AddUserToTenantInput,
    tenant: string,
    user: UserReference,
  ) {
    // check if roles array is starts witrh 'merchant' or 'customer'
    // if not throw error
    if (!input.roles.some((role) => /^(merchant:|customer:)/.test(role))) {
      throw new ForbiddenException(
        'Roles must be one of "merchant:*" or "customer:*"',
      );
    }

    // Check if user exists
    const userExists = await this.userModel.findOne({ email: input.email });

    if (!userExists) {
      await this.createUserAccountFromAdmin({
        email: input.email,
        roles: input?.roles || [],
        name: input.email?.split('@')[0],
        userDomain: input.userDomain ?? UserDomain.MERCHANT,
        tenant,
      });
    }
    if (userExists) {
      const existsInTenant = userExists.memberships.some(
        (membership) => membership.tenant === tenant,
      );

      if (!existsInTenant) {
        // TODO: Send Mail -> You have been added to the tenant
        await this.userModel.updateOne(
          { _id: userExists._id },
          {
            $push: {
              memberships: {
                tenant,
                roles: input.roles,
              },
              commits: {
                commitedBy: user,
                committedAt: new Date(),
                action: 'add-to-tenant',
              },
            },
            $addToSet: {
              tenants: tenant,
            },
          },
        );
      } else {
        throw new Error(`Email ${input.email} already a member of ${tenant}`);
      }
    }

    return true;
  }
}
