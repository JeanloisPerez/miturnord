import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
} from '@nestjs/common';

@Injectable()
export class MultiTenantGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user) {
            throw new ForbiddenException('User not authenticated');
        }

        if (user.type === 'SAAS_ADMIN' || (user.roles && user.roles.includes('SAAS_ADMIN'))) {
            return true;
        }

        const institutionId =
            request.params.institution_id ||
            request.query.institution_id ||
            request.body.institution_id;

        if (!institutionId) {
            throw new ForbiddenException('Institution context required');
        }

        if (!user.institutions || user.institutions.length === 0) {
            throw new ForbiddenException('No institution memberships found');
        }

        const membership = user.institutions.find(
            (inst) => inst.institution_id === institutionId,
        );

        if (!membership) {
            throw new ForbiddenException(
                'You do not belong to this institution',
            );
        }

        // Guardamos la membresía en el request
        request.institution = membership;

        return true;
    }
}