import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BlogStatus, ProjectStatus } from 'generated/prisma/enums';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getOverview() {
    const [
      totalPosts,
      publishedPosts,
      totalProjects,
      liveProjects,
      totalMessages,
      unreadMessages,
    ] = await Promise.all([
      this.prisma.blogPost.count({ where: { deletedAt: null } }),
      this.prisma.blogPost.count({
        where: { deletedAt: null, status: BlogStatus.ACTIVE },
      }),
      this.prisma.project.count({ where: { deletedAt: null } }),
      this.prisma.project.count({
        where: { deletedAt: null, status: ProjectStatus.ACTIVE },
      }),
      this.prisma.contact.count({ where: { deletedAt: null } }),
      this.prisma.contact.count({
        where: { deletedAt: null, status: 'UNREAD' },
      }),
    ]);
    return {
      totalPosts,
      publishedPosts,
      totalProjects,
      liveProjects,
      totalMessages,
      unreadMessages,
    };
  }

  async getSnapshot() {
    const row = await this.prisma.dashboardSnapshot.findUnique({
      where: { id: 1 },
    });
    return row ?? { chartBars: [], topPages: [], activity: [] };
  }
}
