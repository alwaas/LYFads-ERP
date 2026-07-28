import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { PrismaService } from "../../database";

import { CreateProjectDto } from "./dto/create-project.dto";
import { UpdateProjectDto } from "./dto/update-project.dto";

import { PaginationDto } from "../../common/dto/pagination.dto";

import { ActivityLogsService } from "../activity-logs/activity-logs.service";

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogsService: ActivityLogsService,
  ) {}

  async create(dto: CreateProjectDto) {
    const existingProject =
      await this.prisma.project.findUnique({
        where: {
          projectCode: dto.projectCode,
        },
      });

    if (existingProject) {
      throw new ConflictException(
        "Project code already exists.",
      );
    }

    const project =
      await this.prisma.project.create({
        data: {
          projectCode: dto.projectCode,
          name: dto.name,
          description: dto.description,
          status: dto.status,
          priority: dto.priority,
          startDate: dto.startDate
            ? new Date(dto.startDate)
            : null,
          endDate: dto.endDate
            ? new Date(dto.endDate)
            : null,
          budget: dto.budget,
          clientId: dto.clientId,
          managerId: dto.managerId,
        },
        include: {
          client: true,
          manager: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
      });

    await this.activityLogsService.log({
      action: "CREATE",
      module: "PROJECT",
      description: `Project ${project.projectCode} created successfully.`,
      userId: project.managerId ?? undefined,
    });

    return project;
  }

  async findAll(
    pagination: PaginationDto,
  ) {
    const { skip, limit } = pagination;

    const [data, total] =
      await this.prisma.$transaction([
        this.prisma.project.findMany({
          skip,
          take: limit,
          include: {
            client: true,
            manager: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        }),

        this.prisma.project.count(),
      ]);

    return {
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(
        total / pagination.limit,
      ),
      data,
    };
  }

  async findOne(id: string) {
    const project =
      await this.prisma.project.findUnique({
        where: {
          id,
        },
        include: {
          client: true,
          manager: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
      });

    if (!project) {
      throw new NotFoundException(
        "Project not found.",
      );
    }

    return project;
  }

  async update(
    id: string,
    dto: UpdateProjectDto,
  ) {
    await this.findOne(id);

    const project =
      await this.prisma.project.update({
        where: {
          id,
        },
        data: {
          projectCode: dto.projectCode,
          name: dto.name,
          description: dto.description,
          status: dto.status,
          priority: dto.priority,
          startDate: dto.startDate
            ? new Date(dto.startDate)
            : undefined,
          endDate: dto.endDate
            ? new Date(dto.endDate)
            : undefined,
          budget: dto.budget,
          clientId: dto.clientId,
          managerId: dto.managerId,
        },
      });

    await this.activityLogsService.log({
      action: "UPDATE",
      module: "PROJECT",
      description: `Project ${project.projectCode} updated successfully.`,
      userId: project.managerId ?? undefined,
    });

    return project;
  }

  async remove(id: string) {
    const project =
      await this.findOne(id);

    await this.prisma.project.delete({
      where: {
        id,
      },
    });

    await this.activityLogsService.log({
      action: "DELETE",
      module: "PROJECT",
      description: `Project ${project.projectCode} deleted successfully.`,
      userId: project.managerId ?? undefined,
    });

    return {
      success: true,
      message:
        "Project deleted successfully.",
    };
  }
}
