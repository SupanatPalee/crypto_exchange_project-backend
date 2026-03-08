import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TransfersService } from './transfers.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { User } from '../../database/entities/user.entity.js';
import { InternalTransferDto } from './dto/internal-transfer.dto.js';
import { ExternalTransferDto } from './dto/external-transfer.dto.js';

@Controller('transfers')
@UseGuards(JwtAuthGuard)
@ApiTags('Transfers')
@ApiBearerAuth('access-token')
export class TransfersController {
  constructor(private readonly transfersService: TransfersService) {}

  @Post('internal')
  @ApiOperation({ summary: 'Internal transfer to another user' })
  @ApiBody({ type: InternalTransferDto })
  @ApiResponse({ status: 201, description: 'Created' })
  @ApiResponse({ status: 400, description: 'Validation/business rule error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async internal(@CurrentUser() user: User, @Body() dto: InternalTransferDto) {
    return this.transfersService.internalTransfer(user.id, dto);
  }

  @Post('external')
  @ApiOperation({ summary: 'External withdraw to address' })
  @ApiBody({ type: ExternalTransferDto })
  @ApiResponse({ status: 201, description: 'Created' })
  @ApiResponse({ status: 400, description: 'Validation/business rule error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async external(@CurrentUser() user: User, @Body() dto: ExternalTransferDto) {
    return this.transfersService.externalWithdraw(user.id, dto);
  }
}
