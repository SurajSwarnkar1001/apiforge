import dns from 'dns';
import axios from 'axios';
import { PrismaClient, VerificationMethod } from '@prisma/client';
import { validateTargetUrl } from '../utils/ssrf';
import { logger } from '../utils/logger';

export class VerificationService {
  constructor(private prisma: PrismaClient) {}

  async verifyTargetOwnership(projectId: string, method: VerificationMethod): Promise<{
    success: boolean;
    isVerified: boolean;
    message: string;
  }> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    const domain = new URL(project.targetUrl).hostname;
    const token = project.verificationToken;

    let verified = false;
    let message = '';

    try {
      if (method === 'DNS_TXT') {
        // Query TXT records
        try {
          const records = await dns.promises.resolveTxt(domain);
          const flatRecords = records.flat();
          const challengeMatch = flatRecords.some((r) => r.includes(token));

          if (challengeMatch) {
            verified = true;
            message = `DNS TXT record challenge verified successfully for ${domain}.`;
          } else {
            message = `No matching TXT record containing challenge token '${token}' was found on ${domain}.`;
          }
        } catch (err: any) {
          message = `DNS TXT query failed: ${err.message}`;
        }
      } else if (method === 'HTTP_FILE') {
        // Safe SSRF-checked fetch of /.well-known/apiforge-verification.txt
        const fileUrl = `${project.targetUrl.replace(/\/+$/, '')}/.well-known/apiforge-verification.txt`;
        await validateTargetUrl(fileUrl);

        try {
          const res = await axios.get(fileUrl, { timeout: 8000 });
          if (typeof res.data === 'string' && res.data.includes(token)) {
            verified = true;
            message = `HTTP verification file successfully retrieved and validated at ${fileUrl}.`;
          } else {
            message = `HTTP file at ${fileUrl} did not match verification token.`;
          }
        } catch (err: any) {
          message = `Failed to fetch verification file: ${err.message}`;
        }
      } else if (method === 'SELF_DECLARATION') {
        // Self-declaration marks verified for smoke tests only
        verified = true;
        message = 'Signed authorization self-declaration accepted for smoke load test tier.';
      }

      if (verified) {
        await this.prisma.project.update({
          where: { id: projectId },
          data: {
            isVerified: true,
            verificationMethod: method,
            verificationCheckedAt: new Date(),
          },
        });

        await this.prisma.auditLog.create({
          data: {
            userId: project.userId,
            projectId: project.id,
            action: 'PROJECT_VERIFIED',
            details: { method, token, domain },
          },
        });

        logger.info(`Target domain verified: ${domain}`, { projectId, method, event: 'PROJECT_VERIFIED' });
      }

      return {
        success: verified,
        isVerified: verified,
        message,
      };
    } catch (err: any) {
      return {
        success: false,
        isVerified: false,
        message: err.message || 'Verification execution error',
      };
    }
  }
}
