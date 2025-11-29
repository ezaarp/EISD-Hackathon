import { UserRole } from '@prisma/client';
import prisma from './prisma';

interface CreateAuditLogParams {
  actorId: string;
  actorRole: UserRole;
  action: string;
  entity: string;
  entityId: string;
  beforeJson?: Record<string, any> | null;
  afterJson?: Record<string, any> | null;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(params: CreateAuditLogParams) {
  return prisma.auditLog.create({
    data: {
      actorId: params.actorId,
      actorRole: params.actorRole,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId,
      beforeJson: params.beforeJson ? JSON.stringify(params.beforeJson) : null,
      afterJson: params.afterJson ? JSON.stringify(params.afterJson) : null,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    },
  });
}

/**
 * Get audit logs for a specific entity
 */
export async function getAuditLogs(
  entity: string,
  entityId: string,
  options?: {
    limit?: number;
    offset?: number;
  }
) {
  return prisma.auditLog.findMany({
    where: {
      entity,
      entityId,
    },
    include: {
      actor: {
        select: {
          id: true,
          username: true,
          name: true,
          role: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: options?.limit,
    skip: options?.offset,
  });
}

/**
 * Get audit logs by actor
 */
export async function getAuditLogsByActor(
  actorId: string,
  options?: {
    limit?: number;
    offset?: number;
  }
) {
  return prisma.auditLog.findMany({
    where: {
      actorId,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: options?.limit,
    skip: options?.offset,
  });
}

/**
 * Get recent audit logs
 */
export async function getRecentAuditLogs(options?: { limit?: number }) {
  return prisma.auditLog.findMany({
    include: {
      actor: {
        select: {
          id: true,
          username: true,
          name: true,
          role: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: options?.limit || 50,
  });
}
