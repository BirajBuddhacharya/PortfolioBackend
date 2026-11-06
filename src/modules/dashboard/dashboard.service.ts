import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BlogStatus, ProjectStatus } from 'generated/prisma/enums';

const CHART_DAYS = 14;

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

  /**
   * Real activity only. There is no pageview tracker in this product, so the
   * old seeded "visitors"/"top pages" widget was removed rather than dressed
   * up as analytics. The chart now counts content actually created per day.
   */
  async getSnapshot() {
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    start.setUTCDate(start.getUTCDate() - (CHART_DAYS - 1));

    const [
      recentPosts,
      recentProjects,
      recentContacts,
      recentGallery,
      totalPosts,
      totalProjects,
      totalMessages,
      totalGallery,
      latestPosts,
      latestProjects,
      latestContacts,
    ] = await Promise.all([
      this.prisma.blogPost.findMany({
        where: { deletedAt: null, createdAt: { gte: start } },
        select: { createdAt: true },
      }),
      this.prisma.project.findMany({
        where: { deletedAt: null, createdAt: { gte: start } },
        select: { createdAt: true },
      }),
      this.prisma.contact.findMany({
        where: { deletedAt: null, createdAt: { gte: start } },
        select: { createdAt: true },
      }),
      this.prisma.gallery.findMany({
        where: { createdAt: { gte: start } },
        select: { createdAt: true },
      }),
      this.prisma.blogPost.count({ where: { deletedAt: null } }),
      this.prisma.project.count({ where: { deletedAt: null } }),
      this.prisma.contact.count({ where: { deletedAt: null } }),
      this.prisma.gallery.count(),
      this.prisma.blogPost.findMany({
        where: { deletedAt: null },
        orderBy: { updatedAt: 'desc' },
        take: 3,
        select: { title: true, status: true, updatedAt: true },
      }),
      this.prisma.project.findMany({
        where: { deletedAt: null },
        orderBy: { updatedAt: 'desc' },
        take: 3,
        select: { title: true, updatedAt: true },
      }),
      this.prisma.contact.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: { name: true, createdAt: true },
      }),
    ]);

    const buckets = new Map<string, number>();
    for (const row of [
      ...recentPosts,
      ...recentProjects,
      ...recentContacts,
      ...recentGallery,
    ]) {
      const key = this.dayKey(row.createdAt);
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }

    const chartBars = Array.from({ length: CHART_DAYS }, (_, index) => {
      const date = new Date(start);
      date.setUTCDate(start.getUTCDate() + index);
      return buckets.get(this.dayKey(date)) ?? 0;
    });

    const contentCounts = [
      { label: 'Blog posts', count: totalPosts },
      { label: 'Projects', count: totalProjects },
      { label: 'Messages', count: totalMessages },
      { label: 'Gallery', count: totalGallery },
    ];
    const contentTotal = contentCounts.reduce(
      (sum, item) => sum + item.count,
      0,
    );

    const activity = [
      ...latestPosts.map((post) => ({
        at: post.updatedAt,
        text: `Blog post "${post.title}" ${
          post.status === BlogStatus.ACTIVE ? 'published' : 'updated'
        }`,
      })),
      ...latestProjects.map((project) => ({
        at: project.updatedAt,
        text: `Project "${project.title}" updated`,
      })),
      ...latestContacts.map((contact) => ({
        at: contact.createdAt,
        text: `New contact message from ${contact.name}`,
      })),
    ]
      .sort((a, b) => b.at.getTime() - a.at.getTime())
      .slice(0, 5)
      .map(({ at, text }) => ({ text, time: this.relativeTime(at) }));

    return {
      chartBars,
      contentCounts: contentCounts.map((item) => ({
        ...item,
        pct:
          contentTotal === 0
            ? 0
            : Math.round((item.count / contentTotal) * 100),
      })),
      activity,
    };
  }

  private dayKey(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  private relativeTime(date: Date): string {
    const minutes = Math.max(
      0,
      Math.floor((Date.now() - date.getTime()) / 60000),
    );
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }
}
