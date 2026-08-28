import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database';
import { CreateSalaryStructureDto } from './dto/create-salary-structure.dto';
import { UpdateSalaryStructureDto } from './dto/update-salary-structure.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { SearchDto } from '../../common/dto/search.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class SalaryStructuresService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSalaryStructureDto, userTenantId: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: dto.employeeId },
      select: { tenantId: true },
    });

    if (!employee || employee.tenantId !== userTenantId) {
      throw new ForbiddenException('Access denied to this employee');
    }

    const existing = await this.prisma.salaryStructure.findFirst({
      where: {
        employeeId: dto.employeeId,
        tenantId: userTenantId,
        isActive: true,
      },
    });

    if (existing) {
      throw new ConflictException('Active salary structure already exists for this employee');
    }

    const salaryStructure = await this.prisma.salaryStructure.create({
      data: {
        employeeId: dto.employeeId,
        basicSalary: new Prisma.Decimal(dto.basicSalary),
        hra: dto.hra ? new Prisma.Decimal(dto.hra) : new Prisma.Decimal(0),
        allowances: dto.allowances ? new Prisma.Decimal(dto.allowances) : new Prisma.Decimal(0),
        bonus: dto.bonus ? new Prisma.Decimal(dto.bonus) : new Prisma.Decimal(0),
        incentives: dto.incentives ? new Prisma.Decimal(dto.incentives) : new Prisma.Decimal(0),
        deductions: dto.deductions ? new Prisma.Decimal(dto.deductions) : new Prisma.Decimal(0),
        effectiveFrom: new Date(dto.effectiveFrom),
        effectiveTo: dto.effectiveTo ? new Date(dto.effectiveTo) : undefined,
        tenantId: userTenantId,
      },
      select: {
        id: true,
        employeeId: true,
        basicSalary: true,
        hra: true,
        allowances: true,
        bonus: true,
        incentives: true,
        deductions: true,
        effectiveFrom: true,
        effectiveTo: true,
        isActive: true,
        tenantId: true,
        createdAt: true,
        updatedAt: true,
        employee: {
          select: {
            id: true,
            employeeCode: true,
            phone: true,
            designation: true,
            department: true,
            userId: true,
            tenantId: true,
            createdAt: true,
            updatedAt: true,
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return salaryStructure;
  }

  async findAll(pagination: PaginationDto, search: SearchDto, userTenantId: string) {
    const { skip, limit } = pagination;

    const where: Record<string, unknown> = { tenantId: userTenantId };

    if (search.search) {
      where.employee = {
        is: {
          user: {
            is: {
              fullName: { contains: search.search, mode: Prisma.QueryMode.insensitive },
            },
          },
        },
      };
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.salaryStructure.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          employeeId: true,
          basicSalary: true,
          hra: true,
          allowances: true,
          bonus: true,
          incentives: true,
          deductions: true,
          effectiveFrom: true,
          effectiveTo: true,
          isActive: true,
          tenantId: true,
          createdAt: true,
          updatedAt: true,
          employee: {
            select: {
              id: true,
              employeeCode: true,
              phone: true,
              designation: true,
              department: true,
              userId: true,
              tenantId: true,
              createdAt: true,
              updatedAt: true,
              user: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: { effectiveFrom: 'desc' },
      }),
      this.prisma.salaryStructure.count({ where }),
    ]);

    return {
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(total / pagination.limit),
      data,
    };
  }

  async findOne(id: string, userTenantId: string) {
    const structure = await this.prisma.salaryStructure.findUnique({
      where: { id },
      select: {
        id: true,
        employeeId: true,
        basicSalary: true,
        hra: true,
        allowances: true,
        bonus: true,
        incentives: true,
        deductions: true,
        effectiveFrom: true,
        effectiveTo: true,
        isActive: true,
        tenantId: true,
        createdAt: true,
        updatedAt: true,
        employee: {
          select: {
            id: true,
            employeeCode: true,
            phone: true,
            designation: true,
            department: true,
            userId: true,
            tenantId: true,
            createdAt: true,
            updatedAt: true,
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!structure) {
      throw new NotFoundException('Salary structure not found');
    }

    if (structure.tenantId !== userTenantId) {
      throw new ForbiddenException('Access denied to this salary structure');
    }

    return structure;
  }

  async update(id: string, dto: UpdateSalaryStructureDto, userTenantId: string) {
    const structure = await this.findOne(id, userTenantId);

    const data: Record<string, unknown> = {};

    if (dto.basicSalary !== undefined) data.basicSalary = new Prisma.Decimal(dto.basicSalary);
    if (dto.hra !== undefined) data.hra = new Prisma.Decimal(dto.hra);
    if (dto.allowances !== undefined) data.allowances = new Prisma.Decimal(dto.allowances);
    if (dto.bonus !== undefined) data.bonus = new Prisma.Decimal(dto.bonus);
    if (dto.incentives !== undefined) data.incentives = new Prisma.Decimal(dto.incentives);
    if (dto.deductions !== undefined) data.deductions = new Prisma.Decimal(dto.deductions);
    if (dto.effectiveFrom !== undefined) data.effectiveFrom = new Date(dto.effectiveFrom);
    if (dto.effectiveTo !== undefined) data.effectiveTo = new Date(dto.effectiveTo);
    if (dto.isActive !== undefined) data.isActive = dto.isActive;

    const updated = await this.prisma.salaryStructure.update({
      where: { id },
      data: data as Prisma.SalaryStructureUpdateInput,
    });

    const result = await this.prisma.salaryStructure.findUnique({
      where: { id: updated.id },
      select: {
        id: true,
        employeeId: true,
        basicSalary: true,
        hra: true,
        allowances: true,
        bonus: true,
        incentives: true,
        deductions: true,
        effectiveFrom: true,
        effectiveTo: true,
        isActive: true,
        tenantId: true,
        createdAt: true,
        updatedAt: true,
        employee: {
          select: {
            id: true,
            employeeCode: true,
            phone: true,
            designation: true,
            department: true,
            userId: true,
            tenantId: true,
            createdAt: true,
            updatedAt: true,
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return result!;

    return updated;
  }

  async remove(id: string, userTenantId: string) {
    await this.findOne(id, userTenantId);

    await this.prisma.salaryStructure.delete({
      where: { id },
    });

    return { success: true, message: 'Salary structure deleted successfully' };
  }

  async findByEmployee(employeeId: string, userTenantId: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      select: { tenantId: true },
    });

    if (!employee || employee.tenantId !== userTenantId) {
      throw new ForbiddenException('Access denied to this employee');
    }

    return this.prisma.salaryStructure.findMany({
      where: { employeeId, tenantId: userTenantId },
      select: {
        id: true,
        employeeId: true,
        basicSalary: true,
        hra: true,
        allowances: true,
        bonus: true,
        incentives: true,
        deductions: true,
        effectiveFrom: true,
        effectiveTo: true,
        isActive: true,
        tenantId: true,
        createdAt: true,
        updatedAt: true,
        employee: {
          select: {
            id: true,
            employeeCode: true,
            phone: true,
            designation: true,
            department: true,
            userId: true,
            tenantId: true,
            createdAt: true,
            updatedAt: true,
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }
}
