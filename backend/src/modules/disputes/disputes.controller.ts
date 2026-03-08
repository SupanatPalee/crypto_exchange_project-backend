import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { DisputesService } from './disputes.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { User } from '../../database/entities/user.entity.js';
import { CreateDisputeDto } from './dto/create-dispute.dto.js';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto.js';

@Controller('disputes')
@UseGuards(JwtAuthGuard)
@ApiTags('Disputes')
@ApiBearerAuth('access-token')
export class DisputesController {
  constructor(private readonly disputesService: DisputesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a dispute for an order' })
  @ApiBody({ type: CreateDisputeDto })
  @ApiResponse({ status: 201, description: 'Created' })
  @ApiResponse({ status: 400, description: 'Validation/business rule error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async create(@CurrentUser() user: User, @Body() dto: CreateDisputeDto) {
    return this.disputesService.create(user.id, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get dispute by id' })
  @ApiParam({ name: 'id', description: 'Dispute id (UUID)' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Dispute not found' })
  async getOne(@Param('id') id: string) {
    const dispute = await this.disputesService.findOne(id);
    if (!dispute) throw new NotFoundException('Dispute not found');
    return dispute;
  }

  @Patch(':id/resolve')
  @ApiOperation({ summary: 'Resolve a dispute' })
  @ApiParam({ name: 'id', description: 'Dispute id (UUID)' })
  @ApiBody({ type: ResolveDisputeDto })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Dispute not found' })
  async resolve(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: ResolveDisputeDto,
  ) {
    return this.disputesService.resolve(id, user.id, dto);
  }
}
