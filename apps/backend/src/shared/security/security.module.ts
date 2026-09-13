import { Global, Module } from '@nestjs/common';
import { AuditService } from './audit.service';
import { BruteForceGuard } from './brute-force.guard';

@Global()
@Module({
  providers: [AuditService, BruteForceGuard],
  exports:   [AuditService, BruteForceGuard],
})
export class SecurityModule {}
