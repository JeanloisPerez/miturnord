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
            throw new ForbiddenException('Usuario no autenticado');
        }

        if (user.type === 'SAAS_ADMIN' || (user.roles && user.roles.includes('SAAS_ADMIN'))) {
            return true;
        }

        const institutionId =
            request.params.institution_id ||
            request.query.institution_id ||
            request.body.institution_id;

        if (!institutionId) {
            throw new ForbiddenException('Contexto de institución requerido');
        }

        if (!user.institutions || user.institutions.length === 0) {
            throw new ForbiddenException('No se encontraron membresías de institución');
        }

        const membership = user.institutions.find(
            (inst) => inst.institution_id === institutionId,
        );

        if (!membership) {
            throw new ForbiddenException(
                'No perteneces a esta institución',
            );
        }

        // Guardamos la membresía en el request
        request.institution = membership;

        return true;
    }
}