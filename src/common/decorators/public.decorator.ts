import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Marca uma rota como pública, fazendo o AuthGuard global ignorá-la. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
